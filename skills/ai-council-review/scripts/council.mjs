#!/usr/bin/env node
// @ts-check
/**
 * ai-council-review — dispatch a review to a council of frontier models via
 * the OpenRouter API.
 *
 * Usage:
 *   council.mjs review [--pr N | --staged | --branch [base] | --input-file F | file...]
 *                      [--rubric code|plan|doc] [--preset NAME | --models a,b,c]
 *                      [--dry-run] [--yes] [--budget USD] [--timeout SECS]
 *                      [--out DIR] [--context "..."] [--plan PATH]
 *                      [--no-context] [--no-cache] [--personas]
 *   council.mjs models [--preset NAME | --models a,b,c] [--verify slug,...]
 *
 * Exit codes:
 *   0  success (quorum met; possibly degraded — see manifest.json)
 *   1  usage/input error (bad args, nothing to review, unknown slug/preset)
 *   2  quorum failed (fewer than `quorum` members returned a review)
 *   3  budget gate blocked the dispatch (nothing was sent)
 *   4  OPENROUTER_API_KEY missing or rejected
 *
 * Env: OPENROUTER_API_KEY (required to dispatch; never logged),
 *      OPENROUTER_BASE_URL, COUNCIL_TIMEOUT_MS, AI_COUNCIL_MODELS,
 *      AI_COUNCIL_PRESET, AI_COUNCIL_BUDGET_USD, AI_COUNCIL_QUORUM,
 *      XDG_STATE_HOME, REVIEW_BASE_BRANCH.
 *
 * The API key is read from the environment ONLY — never a flag (argv leaks
 * via `ps` and shell history). All error output passes through redact().
 */

import { parseArgs } from "node:util";
import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import { homedir } from "node:os";
import { join, basename } from "node:path";
import process from "node:process";

import { resolveConfig, gitToplevel } from "./lib/config.mjs";
import { getModelsCatalog, validateSlugs, chatCompletion, redact } from "./lib/openrouter.mjs";
import { estimateCost, budgetGate, estimateTokens } from "./lib/budget.mjs";
import { gatherInput, fitPayload, UsageError } from "./lib/input.mjs";
import { buildMessages, loadRubric, assembleUserPayload } from "./lib/prompts.mjs";
import { RESPONSE_FORMAT, extractJson, validateReview } from "./lib/schema.mjs";
import { clusterFindings } from "./lib/cluster.mjs";

const EXIT = { OK: 0, USAGE: 1, QUORUM: 2, BUDGET: 3, AUTH: 4 };

const major = Number(process.versions.node.split(".")[0]);
if (major < 20) {
  console.error(`ai-council-review requires node >= 20 (found ${process.versions.node})`);
  process.exit(EXIT.USAGE);
}

/** Experimental --personas focus areas, applied in roster order. */
const PERSONAS = [
  "Prioritize correctness and failure modes above all else.",
  "Prioritize security: trust boundaries, injection, secrets, authz.",
  "Prioritize API design, maintainability, and long-term cost of this change.",
  "Prioritize testing: what is untested, untestable, or asserting the wrong thing.",
  "Prioritize operational concerns: performance, resource use, observability.",
];

function stateRoot(/** @type {NodeJS.ProcessEnv} */ env) {
  return join(env.XDG_STATE_HOME || join(homedir(), ".local", "state"), "ai-council-review");
}

/** @param {string} cwd @param {NodeJS.ProcessEnv} env */
function makeRunDir(cwd, env, /** @type {string|undefined} */ override) {
  const slug = basename(gitToplevel(cwd) ?? cwd).replace(/[^a-zA-Z0-9._-]/g, "_");
  const runId = new Date().toISOString().replace(/[:.]/g, "-").replace("T", "-").slice(0, 19);
  let dir = override ?? join(stateRoot(env), slug, runId);
  if (!override) {
    // Never reuse a run dir — a same-second collision would overwrite the
    // spend record of the earlier run.
    for (let n = 2; existsSync(dir); n++) dir = join(stateRoot(env), slug, `${runId}-${n}`);
  }
  mkdirSync(join(dir, "raw"), { recursive: true, mode: 0o700 });
  mkdirSync(join(dir, "reviews"), { recursive: true, mode: 0o700 });
  return dir;
}

/** @param {string} model */
const fileSlug = (model) => model.replace(/\//g, "--");

const USD = (/** @type {number} */ n) => `$${n.toFixed(n < 0.1 ? 4 : 2)}`;

async function main() {
  // parseArgs cannot express an optional-value flag; `--branch [base]` is
  // documented with the base optional. Normalize a bare `--branch` (next
  // token missing or another flag) to `--branch=` so defaulting kicks in.
  const argv = process.argv.slice(2).flatMap((token, i, all) => {
    if (token !== "--branch") return [token];
    const next = all[i + 1];
    return next === undefined || next.startsWith("-") ? ["--branch="] : [token];
  });

  const { values: flags, positionals: rawPositionals } = parseArgs({
    args: argv,
    allowPositionals: true,
    options: {
      pr: { type: "string" },
      staged: { type: "boolean" },
      branch: { type: "string" },
      "input-file": { type: "string" },
      rubric: { type: "string" },
      preset: { type: "string" },
      models: { type: "string" },
      "dry-run": { type: "boolean" },
      yes: { type: "boolean" },
      budget: { type: "string" },
      timeout: { type: "string" },
      out: { type: "string" },
      context: { type: "string" },
      plan: { type: "string" },
      "no-context": { type: "boolean" },
      "no-cache": { type: "boolean" },
      personas: { type: "boolean" },
      verify: { type: "string" },
      quorum: { type: "string" },
      "confirm-threshold": { type: "string" },
      "max-output-tokens": { type: "string" },
    },
  });

  const [command, ...positionals] = rawPositionals;
  if (command !== "review" && command !== "models") {
    throw new UsageError(`Unknown command "${command ?? ""}". Use: council.mjs review|models (see file header for flags).`);
  }

  const env = process.env;
  const cwd = process.cwd();
  const config = resolveConfig({ flags, env, cwd });
  const catalog = await getModelsCatalog({
    baseUrl: config.baseUrl,
    stateDir: stateRoot(env),
    noCache: Boolean(flags["no-cache"]),
  });

  // Preflight: roster slugs must exist in the live catalog (slugs churn).
  // --verify only applies to the `models` subcommand — during `review` the
  // ACTUAL council roster must be validated, never a substitute list.
  const verifying = command === "models" && flags.verify !== undefined;
  const roster = verifying
    ? String(flags.verify).split(",").map((s) => s.trim()).filter(Boolean)
    : config.models;
  const { unknown } = validateSlugs(roster, catalog);
  if (unknown.length > 0) {
    for (const u of unknown) {
      console.error(
        `Unknown model slug: ${u.slug}` +
          (u.suggestions.length ? `\n  Did you mean: ${u.suggestions.join(", ")}` : ""),
      );
    }
    console.error("Fix the roster (--models / preset config) — the OpenRouter catalog changed.");
    process.exit(EXIT.USAGE);
  }

  if (command === "models") {
    const rows = roster.map((m) => {
      const info = catalog.get(m);
      return {
        model: m,
        context: info?.contextLength ?? 0,
        "in $/M": info ? (info.promptPrice * 1e6).toFixed(2) : "?",
        "out $/M": info ? (info.completionPrice * 1e6).toFixed(2) : "?",
        structured: info?.supportedParameters.includes("response_format") ? "yes" : "no",
      };
    });
    console.log(verifying ? "Verifying slugs (--verify list, not a preset):" : `Preset: ${config.preset}`);
    console.table(rows);
    process.exit(EXIT.OK);
  }

  // ---- review ----
  const rubric = String(flags.rubric ?? "code");
  loadRubric(rubric); // preflight: unknown rubric is a usage error, not a mid-dispatch quorum failure
  const input = gatherInput({ flags, positionals, cwd, env });
  const payloadRaw = assembleUserPayload(input.code, input.context);

  // Fit within the smallest context window across the council (reserve 20% for output/overhead).
  const minContext = Math.min(...config.models.map((m) => catalog.get(m)?.contextLength ?? Infinity));
  const fitted = fitPayload(payloadRaw, Math.floor(minContext * 0.8));
  if (!fitted.fits) {
    throw new UsageError(
      `Payload (~${estimateTokens(fitted.payload)} tokens after trimming) still exceeds the smallest ` +
        `council context window (${minContext}). Narrow the input: review a sub-range (--branch), ` +
        `specific files, or split the review.`,
    );
  }
  const payload = fitted.payload;

  const estimate = estimateCost({
    payload,
    models: config.models,
    catalog,
    outputTokensPerModel: config.outputTokensPerModel,
    maxOutputTokens: config.maxOutputTokens,
  });

  const estimateTable = config.models.map((m, i) => ({
    model: m,
    "input tok": estimate.perModel[i].inputTokens,
    "est cost": USD(estimate.perModel[i].usd),
  }));

  if (flags["dry-run"]) {
    console.log(`Reviewing: ${input.description}  (rubric: ${rubric}, preset: ${config.preset})`);
    if (fitted.dropped.length) console.log(`Dropped generated files: ${fitted.dropped.join(", ")}`);
    if (fitted.truncated.length) console.log(`Truncated sections: ${fitted.truncated.length}`);
    console.table(estimateTable);
    console.log(
      `Estimated total: ${USD(estimate.totalUsd)}, worst case ${USD(estimate.worstCaseUsd)}  ` +
        `(hard cap ${USD(config.budgetUsd)} vs worst case, confirmation threshold ` +
        `${USD(config.confirmThresholdUsd)} vs estimate)`,
    );
    process.exit(EXIT.OK);
  }

  // Unpriced members (catalog pricing missing or zero — e.g. :free variants)
  // make the estimate meaningless; a $0 estimate must not slip past the
  // consent gate. Require explicit --yes to dispatch to them.
  const unpriced = estimate.perModel.filter((m) => !m.priced).map((m) => m.model);
  if (unpriced.length > 0 && !flags.yes) {
    console.error(
      `No catalog pricing for: ${unpriced.join(", ")} — the cost estimate cannot cover ` +
        `these members, so the confirmation gate cannot price this run. Nothing was sent. ` +
        `Confirm with your human partner, then re-run with --yes (or drop the unpriced models).`,
    );
    console.table(estimateTable);
    process.exit(EXIT.BUDGET);
  }

  // Budget gate — before any authenticated request.
  const gate = budgetGate({
    estimateUsd: estimate.totalUsd,
    worstCaseUsd: estimate.worstCaseUsd,
    budgetUsd: config.budgetUsd,
    confirmThresholdUsd: config.confirmThresholdUsd,
    yes: Boolean(flags.yes),
  });
  if (gate.outcome !== "proceed") {
    console.error(gate.message);
    console.table(estimateTable);
    process.exit(EXIT.BUDGET);
  }

  const apiKey = env.OPENROUTER_API_KEY;
  if (!apiKey) {
    console.error(
      "OPENROUTER_API_KEY is not set. Get a key at https://openrouter.ai/keys and export it. Nothing was sent.",
    );
    process.exit(EXIT.AUTH);
  }

  const runDir = makeRunDir(cwd, env, config.outDir);
  writeFileSync(join(runDir, "input.txt"), payload, { mode: 0o600 });
  writeFileSync(
    join(runDir, "request-meta.json"),
    JSON.stringify(
      {
        description: input.description,
        rubric,
        preset: config.preset,
        models: config.models,
        estimate: { totalUsd: estimate.totalUsd, perModel: estimate.perModel },
        trimmed: { dropped: fitted.dropped, truncated: fitted.truncated },
        config: { ...config, presetsFile: undefined },
        startedAt: new Date().toISOString(),
      },
      null,
      2,
    ),
    { mode: 0o600 },
  );

  console.log(`Dispatching to ${config.models.length} council members (${input.description}) ...`);

  const results = await Promise.allSettled(
    config.models.map(async (model, i) => {
      const info = catalog.get(model);
      const structured = Boolean(info?.supportedParameters.includes("response_format"));
      const temperature = info?.supportedParameters.includes("temperature") ? 0.2 : undefined;
      // `payload` is the fitted/trimmed string — the same bytes the estimate
      // and input.txt are based on. Never rebuild from the untrimmed input.
      const messages = buildMessages({
        rubric,
        payload,
        structured,
        persona: flags.personas ? PERSONAS[i % PERSONAS.length] : undefined,
      });
      const res = await chatCompletion({
        baseUrl: config.baseUrl,
        apiKey,
        model,
        messages,
        responseFormat: structured ? RESPONSE_FORMAT : undefined,
        temperature,
        timeoutMs: config.timeoutMs,
        maxTokens: config.maxOutputTokens, // must match the worst-case gate math
      });
      writeFileSync(join(runDir, "raw", `${fileSlug(model)}.json`), JSON.stringify(res.raw, null, 2), { mode: 0o600 });
      return { model, ...res };
    }),
  );

  /** @type {{model: string, review: import("./lib/schema.mjs").Review}[]} */
  const parsed = [];
  const manifest = {
    runDir,
    description: input.description,
    rubric,
    preset: config.preset,
    personas: Boolean(flags.personas),
    quorum: config.quorum,
    estimateUsd: estimate.totalUsd,
    actualUsd: 0,
    degraded: false,
    members: /** @type {Record<string, {status: string, costUsd?: number, error?: string, parse?: string}>} */ ({}),
    finishedAt: "",
  };

  results.forEach((result, i) => {
    const model = config.models[i];
    const slug = fileSlug(model);
    if (result.status === "rejected") {
      const msg = redact(String(result.reason?.message ?? result.reason), apiKey);
      manifest.members[model] = { status: "failed", error: msg };
      console.error(`  ✗ ${model}: ${msg}`);
      return;
    }
    const { content, usage, finishReason } = result.value;
    const cost = Number(usage?.cost ?? 0);
    manifest.actualUsd += cost;

    const extractedJson = extractJson(content);
    const validated = extractedJson.ok ? validateReview(extractedJson.value) : undefined;
    if (extractedJson.ok && validated?.ok) {
      writeFileSync(join(runDir, "reviews", `${slug}.json`), JSON.stringify(validated.review, null, 2), { mode: 0o600 });
      parsed.push({ model, review: validated.review });
      manifest.members[model] = { status: "ok", costUsd: cost };
      console.log(`  ✓ ${model}: ${validated.review.findings.length} findings, verdict ${validated.review.verdict} (${USD(cost)})`);
    } else {
      // The opinion is never discarded: keep the raw text for the synthesizer.
      writeFileSync(join(runDir, "reviews", `${slug}.json`), JSON.stringify({ unstructured: content }, null, 2), { mode: 0o600 });
      let why = extractedJson.ok ? (validated && !validated.ok ? validated.error : "invalid review") : extractedJson.error;
      if (finishReason === "length") why += "; response truncated at max_tokens";
      manifest.members[model] = { status: "parse_failed", costUsd: cost, parse: why };
      console.error(`  ⚠ ${model}: response kept as unstructured text (${why})`);
    }
  });

  // parse_failed members still delivered an opinion — they count toward quorum.
  const delivered = Object.values(manifest.members).filter((m) => m.status !== "failed").length;
  manifest.degraded = delivered < config.models.length;
  manifest.finishedAt = new Date().toISOString();

  if (parsed.length > 0) {
    writeFileSync(join(runDir, "clusters.json"), JSON.stringify(clusterFindings(parsed), null, 2), { mode: 0o600 });
  }
  writeFileSync(join(runDir, "manifest.json"), JSON.stringify(manifest, null, 2), { mode: 0o600 });

  console.log(
    `\n${delivered}/${config.models.length} members delivered. ` +
      `Actual cost ${USD(manifest.actualUsd)} (estimated ${USD(estimate.totalUsd)}).`,
  );
  console.log(`RUN_DIR=${runDir}`);

  if (delivered < config.quorum) {
    console.error(
      `Quorum not met (${delivered} < ${config.quorum}). Do not synthesize from this run alone — ` +
        `report the failure and consider the single-model ai-review skill as a fallback.`,
    );
    process.exit(EXIT.QUORUM);
  }
  process.exit(EXIT.OK);
}

main().catch((err) => {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (err instanceof UsageError) {
    console.error(redact(err.message, apiKey));
    process.exit(EXIT.USAGE);
  }
  console.error(redact(err?.stack ?? String(err), apiKey));
  process.exit(EXIT.USAGE);
});
