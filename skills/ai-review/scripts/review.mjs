#!/usr/bin/env node
// @ts-check
/**
 * ai-review — one second-opinion code review from one model, via OpenRouter.
 *
 * Usage:
 *   review.mjs [--staged | --branch [base] | --pr N | --input-file F | file...]
 *              [--model SLUG] [--context "..."] [--plan PATH] [--no-context]
 *              [--dry-run] [--yes] [--budget USD] [--timeout SECS]
 *
 * The review text is streamed to STDOUT as it arrives. Progress, cost and
 * errors go to STDERR. Run it with output to a file (never through a pipe):
 *   review.mjs --branch > "$out" 2>&1; echo "exit=$?" >> "$out"
 *
 * Exit codes (same numbers as ai-council-review):
 *   0  review written (a truncated review still exits 0 and warns on stderr)
 *   1  usage/input error (bad args, nothing to review, unknown model slug)
 *   2  the reviewer failed: HTTP error, timeout, broken stream, empty answer
 *   3  budget gate blocked the request (nothing was sent)
 *   4  API key missing or rejected (HTTP 401/403)
 *
 * Env: AI_COUNCIL_OPENROUTER_API_KEY (preferred) or OPENROUTER_API_KEY;
 *      AI_REVIEW_MODEL, AI_REVIEW_TIMEOUT_MS, AI_REVIEW_BUDGET_USD,
 *      AI_REVIEW_HEARTBEAT_MS, OPENROUTER_BASE_URL, REVIEW_BASE_BRANCH,
 *      XDG_STATE_HOME, XDG_CONFIG_HOME.
 *
 * The key is read from the environment only (never a flag) and every
 * message passes through redact().
 *
 * scripts/lib/ is a byte-for-byte copy of ai-council-review/scripts/lib
 * (see README.md, "Shared library"). Edit it there, never here.
 */

import { parseArgs } from "node:util";
import { readFileSync, existsSync } from "node:fs";
import { homedir } from "node:os";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import process from "node:process";

import { UsageError } from "./lib/config.mjs";
import { getModelsCatalog, validateSlugs, chatCompletionStream, redact, CompletionError } from "./lib/openrouter.mjs";
import { estimateCost, budgetGate, createRetryAllowance, worstCaseRequestUsd } from "./lib/budget.mjs";
import { gatherInput, fitPayload } from "./lib/input.mjs";
import { assembleUserPayload } from "./lib/prompts.mjs";

const EXIT = { OK: 0, USAGE: 1, FAILED: 2, BUDGET: 3, AUTH: 4 };

const SKILL_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const API_KEY_VARS = ["AI_COUNCIL_OPENROUTER_API_KEY", "OPENROUTER_API_KEY"];

/** @param {string} line */
const say = (line) => process.stderr.write(`review: ${line}\n`);
const USD = (/** @type {number} */ n) => `$${n.toFixed(n < 0.1 ? 4 : 2)}`;

/**
 * @param {NodeJS.ProcessEnv} env
 * @returns {{key: string|undefined, source: string|undefined}}
 */
function resolveApiKey(env) {
  const source = API_KEY_VARS.find((name) => env[name]);
  return { key: source ? env[source] : undefined, source };
}

/** @param {string} text @param {NodeJS.ProcessEnv} env */
function redactKeys(text, env) {
  return API_KEY_VARS.reduce((acc, name) => redact(acc, env[name]), text);
}

/** @param {string} file @returns {Record<string, any>} */
function readJsonIfExists(file) {
  if (!existsSync(file)) return {};
  try {
    return JSON.parse(readFileSync(file, "utf8"));
  } catch (err) {
    throw new UsageError(`Invalid JSON in ${file}: ${/** @type {Error} */ (err).message}`);
  }
}

/**
 * Precedence: flags > AI_REVIEW_* env > ~/.config/ai-review/config.json >
 * references/models.json.
 * @param {Record<string, any>} flags
 * @param {NodeJS.ProcessEnv} env
 */
function resolveSettings(flags, env) {
  const defaults = readJsonIfExists(join(SKILL_ROOT, "references", "models.json"));
  const userFile = join(env.XDG_CONFIG_HOME || join(homedir(), ".config"), "ai-review", "config.json");
  const user = readJsonIfExists(userFile);
  const num = (/** @type {unknown} */ v, /** @type {string} */ what) => {
    const n = Number(v);
    if (!Number.isFinite(n) || n < 0) throw new UsageError(`Invalid ${what}: ${String(v)}`);
    return n;
  };
  const pick = (/** @type {string} */ key, /** @type {unknown} */ flag, /** @type {string} */ envName) =>
    flag ?? env[envName] ?? user[key] ?? defaults[key];
  const timeoutSecs = flags.timeout;
  return {
    model: String(pick("model", flags.model, "AI_REVIEW_MODEL")),
    timeoutMs: timeoutSecs !== undefined ? num(timeoutSecs, "timeout") * 1000 : num(pick("timeoutMs", undefined, "AI_REVIEW_TIMEOUT_MS"), "timeout"),
    budgetUsd: num(pick("budgetUsd", flags.budget, "AI_REVIEW_BUDGET_USD"), "budget"),
    confirmThresholdUsd: num(user.confirmThresholdUsd ?? defaults.confirmThresholdUsd, "confirm threshold"),
    reasoningEffort: /** @type {string|undefined} */ (pick("reasoningEffort", undefined, "AI_REVIEW_REASONING_EFFORT")),
    providerSort: /** @type {string|undefined} */ (user.providerSort ?? defaults.providerSort),
    maxOutputTokens: num(user.maxOutputTokens ?? defaults.maxOutputTokens ?? 24000, "maxOutputTokens"),
    expectedOutputTokens: {
      nonReasoningDefault: num(user.expectedOutputTokens?.nonReasoningDefault ?? defaults.expectedOutputTokens?.nonReasoningDefault ?? 3000, "nonReasoningDefault"),
      reasoningDefault: num(user.expectedOutputTokens?.reasoningDefault ?? defaults.expectedOutputTokens?.reasoningDefault ?? 9000, "reasoningDefault"),
      /** @type {Record<string, number>} */
      models: Object.fromEntries(
        Object.entries({ ...defaults.expectedOutputTokens?.models, ...user.expectedOutputTokens?.models }).map(([slug, n]) => [slug, num(n, `expectedOutputTokens for ${slug}`)]),
      ),
    },
    baseUrl: String(env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1"),
  };
}

const HELP = `Usage: review.mjs [--staged | --branch [base] | --pr N | --input-file F | file...] [options]

Reviews a diff or files with one OpenRouter model; the review streams to stdout,
progress and errors go to stderr. Run with output to a file, never through a pipe.

Options:
  --model SLUG     model (default: see references/models.json)
  --context TEXT   extra context for the reviewer
  --plan PATH      plan file to include as context
  --no-context     send only the code, no plan/instructions/file tree
  --dry-run        print the cost estimate; send nothing (needs no key)
  --yes            confirm an estimate above the threshold (only after the human agreed)
  --budget USD     hard cap on the worst-case cost
  --timeout SECS   per-request time limit

Exit codes: 0 ok, 1 usage/input, 2 reviewer failed or timed out, 3 budget gate, 4 key missing or rejected.
Key: AI_COUNCIL_OPENROUTER_API_KEY or OPENROUTER_API_KEY, in the environment of this process.`;

async function main() {
  const env = process.env;
  const argv = process.argv.slice(2).flatMap((token, i, all) => {
    if (token !== "--branch") return [token];
    const next = all[i + 1];
    return next === undefined || next.startsWith("-") ? ["--branch="] : [token];
  });

  /** @type {ReturnType<typeof parseArgs>} */
  let parsed;
  try {
    parsed = parseArgs({
      args: argv,
      allowPositionals: true,
      options: {
        staged: { type: "boolean" },
        branch: { type: "string" },
        pr: { type: "string" },
        "input-file": { type: "string" },
        model: { type: "string" },
        context: { type: "string" },
        plan: { type: "string" },
        "no-context": { type: "boolean" },
        "dry-run": { type: "boolean" },
        yes: { type: "boolean" },
        budget: { type: "string" },
        timeout: { type: "string" },
        provider: { type: "string" },
        help: { type: "boolean", short: "h" },
      },
    });
  } catch (err) {
    throw new UsageError(`${/** @type {Error} */ (err).message}\n\n${HELP}`);
  }
  const flags = /** @type {Record<string, any>} */ (parsed.values);
  const positionals = parsed.positionals;
  if (flags.help) {
    console.log(HELP);
    return EXIT.OK;
  }

  // Gemini and Codex were removed in 1.0.0. Say so once, then carry on.
  if (env.REVIEW_PROVIDER || flags.provider) {
    say("REVIEW_PROVIDER / --provider is ignored. ai-review 1.0 reviews through OpenRouter only; the Gemini and Codex CLIs are no longer used.");
  }

  // Preflight: the key, before any git, catalog or payload work.
  const { key: apiKey, source: apiKeySource } = resolveApiKey(env);
  if (!apiKey && !flags["dry-run"]) {
    process.stderr.write(
      "review: no API key. Set AI_COUNCIL_OPENROUTER_API_KEY (or OPENROUTER_API_KEY) in the environment of the process that runs this command, " +
        "not only in your login shell. Get a key at https://openrouter.ai/keys. Nothing was sent.\n",
    );
    return EXIT.AUTH;
  }

  const cfg = resolveSettings(flags, env);
  const cwd = process.cwd();
  const input = gatherInput({ flags, positionals, cwd, env });
  const payloadRaw = assembleUserPayload(input.code, input.context);

  const stateDir = join(env.XDG_STATE_HOME || join(homedir(), ".local", "state"), "ai-review");
  /** @type {Awaited<ReturnType<typeof getModelsCatalog>>} */
  let catalog;
  try {
    // The price must be current on every run: never use the cached catalog.
    catalog = await getModelsCatalog({ baseUrl: cfg.baseUrl, stateDir, noCache: true });
  } catch (err) {
    say(redactKeys(`could not load the OpenRouter model catalog: ${/** @type {Error} */ (err).message}`, env));
    return EXIT.FAILED;
  }
  const { unknown } = validateSlugs([cfg.model], catalog);
  if (unknown.length > 0) {
    const u = unknown[0];
    throw new UsageError(
      `Unknown model slug: ${u.slug}` + (u.suggestions.length ? `\n  Did you mean: ${u.suggestions.join(", ")}` : "") +
        "\nSet another model with --model or AI_REVIEW_MODEL.",
    );
  }
  const info = catalog.get(cfg.model);

  const window = info?.contextLength ?? 0;
  const fitted = fitPayload(payloadRaw, window > 0 ? Math.floor(window * 0.8) : Infinity);
  if (!fitted.fits) {
    throw new UsageError(`The payload still exceeds the ${cfg.model} context window (${window} tokens) after trimming. Review a smaller range or fewer files.`);
  }
  const payload = fitted.payload;

  // Expected output length: the model's own measured mean, else a class default.
  const table = cfg.expectedOutputTokens;
  const [assumedOutput, assumedSource] =
    table.models[cfg.model] !== undefined
      ? [table.models[cfg.model], "model entry"]
      : info?.supportedParameters.includes("reasoning")
        ? [table.reasoningDefault, "reasoning default"]
        : [table.nonReasoningDefault, "non-reasoning default"];

  const estimate = estimateCost({
    payload,
    models: [cfg.model],
    catalog,
    outputTokensPerModel: assumedOutput,
    maxOutputTokens: cfg.maxOutputTokens,
  });

  if (flags["dry-run"]) {
    console.log(`Reviewing: ${input.description}`);
    console.log(`Model: ${cfg.model}  (timeout ${Math.round(cfg.timeoutMs / 1000)}s)`);
    console.log(`Assumed output: ${assumedOutput} tokens (${assumedSource})`);
    if (fitted.dropped.length) console.log(`Dropped generated files: ${fitted.dropped.join(", ")}`);
    if (fitted.truncated.length) console.log(`Truncated sections: ${fitted.truncated.length}`);
    console.log(
      `Estimated cost: ${USD(estimate.totalUsd)}, worst case ${USD(estimate.worstCaseUsd)} ` +
        `(hard cap ${USD(cfg.budgetUsd)}, confirmation threshold ${USD(cfg.confirmThresholdUsd)})`,
    );
    return EXIT.OK;
  }

  if (!estimate.perModel[0].priced && !flags.yes) {
    say(`no catalog pricing for ${cfg.model}, so the cost cannot be gated. Nothing was sent. Ask your human partner, then re-run with --yes.`);
    return EXIT.BUDGET;
  }
  const gate = budgetGate({
    estimateUsd: estimate.totalUsd,
    worstCaseUsd: estimate.worstCaseUsd,
    budgetUsd: cfg.budgetUsd,
    confirmThresholdUsd: cfg.confirmThresholdUsd,
    yes: Boolean(flags.yes),
  });
  if (gate.outcome !== "proceed") {
    say(gate.message);
    return EXIT.BUDGET;
  }

  const system = readFileSync(join(SKILL_ROOT, "references", "prompts", "solo-review.md"), "utf8").trim();
  const messages = [
    { role: "system", content: system },
    { role: "user", content: payload },
  ];

  const retryAllowance = createRetryAllowance(cfg.budgetUsd, estimate.worstCaseUsd);
  say(
    `${input.description} -> ${cfg.model}; estimate ${USD(estimate.totalUsd)} (assuming ${assumedOutput} output tokens), worst case ${USD(estimate.worstCaseUsd)}; ` +
      `timeout ${Math.round(cfg.timeoutMs / 1000)}s per request; key from ${apiKeySource}`,
  );

  const started = Date.now();
  const elapsed = () => Math.round((Date.now() - started) / 1000);
  let firstTextAt = 0;
  let lastChar = "\n";
  const heartbeatMs = Number(env.AI_REVIEW_HEARTBEAT_MS ?? 30000);
  const heartbeat = setInterval(() => {
    if (firstTextAt === 0) say(`still waiting for the first text (${elapsed()}s)`);
  }, heartbeatMs);
  heartbeat.unref();

  try {
    const res = await chatCompletionStream({
      baseUrl: cfg.baseUrl,
      apiKey: /** @type {string} */ (apiKey),
      redactAlso: API_KEY_VARS.map((name) => env[name]),
      model: cfg.model,
      messages,
      temperature: info?.supportedParameters.includes("temperature") ? 0.2 : undefined,
      timeoutMs: cfg.timeoutMs,
      maxTokens: cfg.maxOutputTokens,
      reasoningEffort: info?.supportedParameters.includes("reasoning") ? cfg.reasoningEffort : undefined,
      providerSort: cfg.providerSort,
      appTitle: "ai-review",
      mayRetryEmpty: () =>
        retryAllowance.reserve(
          worstCaseRequestUsd({ model: cfg.model, inputTokens: estimate.inputTokens, catalog, maxOutputTokens: cfg.maxOutputTokens }),
        ),
      onText: (delta) => {
        if (firstTextAt === 0) {
          firstTextAt = Date.now();
          say(`first text after ${Math.round((firstTextAt - started) / 100) / 10}s`);
        }
        process.stdout.write(delta);
        lastChar = delta.slice(-1);
      },
    });
    if (lastChar !== "\n") process.stdout.write("\n");
    const cost = Number(res.usage.cost ?? 0);
    say(`done in ${elapsed()}s; cost ${USD(cost)} (estimated ${USD(estimate.totalUsd)}); finish_reason=${res.finishReason}`);
    if (res.finishReason === "length") {
      say("WARNING: the review was cut off at the output limit (max_tokens). Treat it as incomplete.");
    }
    return EXIT.OK;
  } catch (err) {
    if (lastChar !== "\n") process.stdout.write("\n");
    if (err instanceof CompletionError) {
      const msg = redactKeys(err.message, env);
      if (/HTTP 40[13]\b/.test(msg)) {
        say(`${apiKeySource} was rejected (${msg.slice(0, 120)}). Ask your human partner to check the key.`);
        return EXIT.AUTH;
      }
      say(`the reviewer failed after ${elapsed()}s: ${msg}`);
      if (err.partial) say(`${err.partial.length} characters of the review arrived before the failure; they are above and incomplete.`);
      return EXIT.FAILED;
    }
    throw err;
  } finally {
    clearInterval(heartbeat);
  }
}

main().then(
  (code) => {
    process.exitCode = code;
  },
  (err) => {
    if (err instanceof UsageError) {
      process.stderr.write(`review: ${redactKeys(err.message, process.env)}\n`);
    } else {
      process.stderr.write(`review: unexpected error: ${redactKeys(err?.stack ?? String(err), process.env)}\n`);
    }
    process.exitCode = EXIT.USAGE;
  },
);
