// @ts-check
/**
 * End-to-end tests for review.mjs against a mock OpenRouter server (node:http).
 * review.mjs is spawned as a child process, the way agents run it, with
 * OPENROUTER_BASE_URL pointed at the mock and XDG_* dirs isolated. No network,
 * no key, no money.
 */
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { mkdtempSync, rmSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const CLI = join(HERE, "..", "scripts", "review.mjs");
const DIFF = join(HERE, "fixtures", "tiny-diff.patch");
const TEST_KEY = "sk-or-test-SECRET-DO-NOT-PRINT";
const MODEL = "mock/solo";

/**
 * @typedef {object} Behavior
 * @property {number} [status] non-200 status to answer with
 * @property {string} [body] body for a non-200 answer
 * @property {{text?: string, delayMs?: number, error?: object}[]} [chunks] streamed pieces, in order
 * @property {number} [cost] usage.cost in the final chunk
 * @property {string} [finishReason]
 * @property {number} [hangMs] wait this long before answering at all
 */

/** @type {ReturnType<typeof createServer>} */
let server;
let baseUrl = "";
/** @type {(hit: number) => Behavior} */
let behavior = () => ({ chunks: [{ text: "ok" }] });
let chatHits = 0;
let anyHits = 0;
let modelsHits = 0;
/** @type {Record<string, unknown>|undefined} */
let lastBody;

before(async () => {
  server = createServer((req, res) => {
    anyHits++;
    if (req.method === "GET" && req.url === "/models") {
      modelsHits++;
      res.writeHead(200, { "content-type": "application/json" });
      res.end(
        JSON.stringify({
          data: [
            {
              id: MODEL,
              context_length: 100000,
              pricing: { prompt: "0.000001", completion: "0.000002" },
              supported_parameters: ["temperature", "reasoning"],
            },
            {
              id: "mock/plain",
              context_length: 100000,
              pricing: { prompt: "0.000001", completion: "0.000002" },
              supported_parameters: ["temperature"],
            },
          ],
        }),
      );
      return;
    }
    if (req.method === "POST" && req.url === "/chat/completions") {
      let raw = "";
      req.on("data", (c) => (raw += c));
      req.on("end", async () => {
        chatHits++;
        lastBody = JSON.parse(raw);
        const b = behavior(chatHits);
        res.on("error", () => {});
        if (b.hangMs) await new Promise((r) => setTimeout(r, b.hangMs));
        if (res.destroyed || req.socket.destroyed) return;
        if (b.status && b.status !== 200) {
          res.writeHead(b.status, { "content-type": "application/json" });
          res.end(b.body ?? JSON.stringify({ error: { message: `mock ${b.status}` } }));
          return;
        }
        res.writeHead(200, { "content-type": "text/event-stream" });
        res.write(": OPENROUTER PROCESSING\n\n");
        for (const c of b.chunks ?? []) {
          if (c.delayMs) await new Promise((r) => setTimeout(r, c.delayMs));
          if (res.destroyed) return;
          if (c.error) res.write(`data: ${JSON.stringify({ error: c.error, choices: [{ finish_reason: "error", delta: { content: "" } }] })}\n\n`);
          else res.write(`data: ${JSON.stringify({ choices: [{ delta: { content: c.text } }] })}\n\n`);
        }
        res.write(`data: ${JSON.stringify({ choices: [{ delta: { content: "" }, finish_reason: b.finishReason ?? "stop" }] })}\n\n`);
        res.write(`data: ${JSON.stringify({ choices: [], usage: { prompt_tokens: 100, completion_tokens: 50, cost: b.cost ?? 0.01 } })}\n\n`);
        res.end("data: [DONE]\n\n");
      });
      return;
    }
    res.writeHead(404).end();
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", () => resolve(undefined)));
  baseUrl = `http://127.0.0.1:${/** @type {import("node:net").AddressInfo} */ (server.address()).port}`;
});

after(() => server.close());

/**
 * Async spawn (the mock server lives in this process; a blocked event loop
 * could never answer the child).
 * @param {string[]} args
 * @param {Record<string, string | undefined>} [envOverrides] undefined removes a variable
 */
function runCli(args, envOverrides = {}) {
  const home = mkdtempSync(join(tmpdir(), "ai-review-test-"));
  chatHits = 0;
  anyHits = 0;
  modelsHits = 0;
  lastBody = undefined;
  /** @type {Record<string, string>} */
  const env = {
    PATH: process.env.PATH ?? "",
    OPENROUTER_BASE_URL: baseUrl,
    AI_COUNCIL_OPENROUTER_API_KEY: TEST_KEY,
    AI_REVIEW_MODEL: MODEL,
    XDG_STATE_HOME: join(home, "state"),
    XDG_CONFIG_HOME: join(home, "config"),
    COUNCIL_RETRY_BACKOFF_MS: "10",
  };
  for (const [k, v] of Object.entries(envOverrides)) {
    if (v === undefined) delete env[k];
    else env[k] = v;
  }
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [CLI, ...args], { cwd: home, env });
    let stdout = "";
    let stderr = "";
    const started = Date.now();
    /** @type {number|undefined} */
    let firstStdoutAt;
    child.stdout.on("data", (d) => {
      firstStdoutAt ??= Date.now() - started;
      stdout += d;
    });
    child.stderr.on("data", (d) => (stderr += d));
    const killer = setTimeout(() => child.kill("SIGKILL"), 30_000);
    child.on("error", reject);
    child.on("close", (status) => {
      clearTimeout(killer);
      rmSync(home, { recursive: true, force: true });
      resolve({ status, stdout, stderr, output: `${stdout}\n${stderr}`, firstStdoutAt, totalMs: Date.now() - started });
    });
  });
}

const ARGS = ["--input-file", DIFF, "--no-context"];

test("missing key: exit 4 before any network request", async () => {
  const r = await runCli(ARGS, { AI_COUNCIL_OPENROUTER_API_KEY: undefined });
  assert.equal(r.status, 4, r.output);
  assert.match(r.stderr, /AI_COUNCIL_OPENROUTER_API_KEY/);
  assert.match(r.stderr, /environment of the process/);
  assert.equal(anyHits, 0, "the key check must come before the catalog fetch");
});

test("--dry-run needs no key and sends nothing", async () => {
  const r = await runCli([...ARGS, "--dry-run"], { AI_COUNCIL_OPENROUTER_API_KEY: undefined });
  assert.equal(r.status, 0, r.output);
  assert.match(r.stdout, /Estimated cost/);
  assert.equal(chatHits, 0);
});

test("dry-run assumes 9000 output tokens for a reasoning model without its own entry", async () => {
  const r = await runCli([...ARGS, "--dry-run"]);
  assert.equal(r.status, 0, r.output);
  assert.match(r.stdout, /Assumed output: 9000 tokens \(reasoning default\)/);
});

test("dry-run assumes 3000 output tokens for a model without reasoning", async () => {
  const r = await runCli([...ARGS, "--dry-run"], { AI_REVIEW_MODEL: "mock/plain" });
  assert.equal(r.status, 0, r.output);
  assert.match(r.stdout, /Assumed output: 3000 tokens \(non-reasoning default\)/);
});

test("the shipped default model has its own measured entry", () => {
  const defaults = JSON.parse(readFileSync(join(HERE, "..", "references", "models.json"), "utf8"));
  assert.ok(defaults.expectedOutputTokens.models[defaults.model] > 3000, "the default model's entry must exist and exceed the old flat 3000");
});

test("pricing comes from the live catalog on every run, never from a cache", async () => {
  const stateHome = mkdtempSync(join(tmpdir(), "ai-review-state-"));
  try {
    for (let i = 0; i < 2; i++) {
      const r = await runCli([...ARGS, "--dry-run"], { XDG_STATE_HOME: stateHome });
      assert.equal(r.status, 0, r.output);
      assert.equal(modelsHits, 1, `run ${i + 1} must fetch the catalog itself`);
    }
  } finally {
    rmSync(stateHome, { recursive: true, force: true });
  }
});

test("401: exit 4 at once, one request, key never printed", async () => {
  behavior = () => ({ status: 401, body: JSON.stringify({ error: { message: `bad key ${TEST_KEY}` } }) });
  const r = await runCli(ARGS);
  assert.equal(r.status, 4, r.output);
  assert.equal(chatHits, 1, "an auth failure must not be retried");
  assert.ok(!r.output.includes(TEST_KEY), "the key must be redacted");
});

test("429 then ok: one retry, exit 0, review on stdout", async () => {
  behavior = (hit) => (hit === 1 ? { status: 429 } : { chunks: [{ text: "Looks fine.\n" }, { text: "VERDICT: APPROVE" }] });
  const r = await runCli(ARGS);
  assert.equal(r.status, 0, r.output);
  assert.equal(chatHits, 2);
  assert.equal(r.stdout, "Looks fine.\nVERDICT: APPROVE\n");
  assert.match(r.stderr, /cost \$0\.0100/);
});

test("timeout: exit 2 with a clear message", async () => {
  behavior = () => ({ hangMs: 3000, chunks: [{ text: "late" }] });
  const r = await runCli(ARGS, { AI_REVIEW_TIMEOUT_MS: "300" });
  assert.equal(r.status, 2, r.output);
  assert.match(r.stderr, /Timeout after/);
});

test("budget gate: exit 3 and nothing sent to the model", async () => {
  const r = await runCli([...ARGS, "--budget", "0.0001"]);
  assert.equal(r.status, 3, r.output);
  assert.equal(chatHits, 0);
  assert.match(r.stderr, /hard budget cap/);
});

test("streaming: the first text reaches stdout before the answer is complete", async () => {
  behavior = () => ({ chunks: [{ text: "First part. " }, { text: "Second part.", delayMs: 700 }] });
  const r = await runCli(ARGS);
  assert.equal(r.status, 0, r.output);
  assert.equal(r.stdout, "First part. Second part.\n");
  assert.ok(r.firstStdoutAt !== undefined && r.totalMs - r.firstStdoutAt > 400, `first text at ${r.firstStdoutAt} ms, total ${r.totalMs} ms`);
  assert.match(r.stderr, /first text after/);
  assert.equal(lastBody?.stream, true);
});

test("error after partial text: exit 2, partial text kept, no retry", async () => {
  behavior = () => ({ chunks: [{ text: "Partial finding. " }, { error: { code: 502, message: "upstream died" } }] });
  const r = await runCli(ARGS);
  assert.equal(r.status, 2, r.output);
  assert.equal(chatHits, 1, "text already shown: a retry would repeat it");
  assert.match(r.stdout, /Partial finding\./);
  assert.match(r.stderr, /incomplete/);
});

test("truncated review: exit 0 with a loud warning", async () => {
  behavior = () => ({ chunks: [{ text: "Cut off" }], finishReason: "length" });
  const r = await runCli(ARGS);
  assert.equal(r.status, 0, r.output);
  assert.match(r.stderr, /WARNING: the review was cut off/);
});

test("REVIEW_PROVIDER is ignored with one notice", async () => {
  behavior = () => ({ chunks: [{ text: "ok" }] });
  const r = await runCli(ARGS, { REVIEW_PROVIDER: "gemini" });
  assert.equal(r.status, 0, r.output);
  assert.equal(r.stderr.match(/REVIEW_PROVIDER/g)?.length, 1);
  assert.match(r.stderr, /OpenRouter only/);
});

test("unknown model slug: exit 1 before spending", async () => {
  const r = await runCli(ARGS, { AI_REVIEW_MODEL: "mock/missing" });
  assert.equal(r.status, 1, r.output);
  assert.match(r.stderr, /Unknown model slug/);
  assert.equal(chatHits, 0);
});

test("nothing to review: exit 1", async () => {
  const r = await runCli([]); // empty tmp dir is not a git repo: git diff fails
  assert.equal(r.status, 1, r.output);
});
