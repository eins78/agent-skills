// @ts-check
/**
 * End-to-end dispatch tests against a mock OpenRouter server (node:http).
 * council.mjs is spawned as a child process — the same way agents run it —
 * with OPENROUTER_BASE_URL pointed at the mock and XDG_* dirs isolated.
 */
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { mkdtempSync, rmSync, readFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const CLI = join(HERE, "..", "scripts", "council.mjs");
const DIFF = join(HERE, "fixtures", "tiny-diff.patch");
const TEST_KEY = "sk-or-test-SECRET-DO-NOT-PRINT";

const MOCK_MODELS = ["mock/alpha", "mock/beta", "mock/gamma", "mock/delta"];

/** A valid review body models return. */
const REVIEW_JSON = JSON.stringify({
  verdict: "request_changes",
  summary: "Assignment bug.",
  findings: [
    {
      location: { file: "src/greet.js", lines: [2, 2] },
      severity: "major",
      category: "correctness",
      title: "Assignment in condition",
      description: "name = \"\" assigns.",
      confidence: "high",
    },
  ],
});

/**
 * @typedef {(model: string, hitCount: number) => {status?: number, body?: string, content?: string, cost?: number, delayMs?: number}} Behavior
 */

/** @type {ReturnType<typeof createServer>} */
let server;
/** @type {string} */
let baseUrl;
/** @type {Behavior} */
let behavior = () => ({});
/** @type {Map<string, number>} */
let completionHits = new Map();
/** @type {((raw: string) => void) | undefined} */
let captureBody;

before(async () => {
  server = createServer((req, res) => {
    if (req.method === "GET" && req.url === "/models") {
      res.writeHead(200, { "content-type": "application/json" });
      res.end(
        JSON.stringify({
          data: [
            ...MOCK_MODELS.map((id, i) => ({
              id,
              context_length: 100000,
              pricing: { prompt: "0.000001", completion: "0.000002" },
              // alpha/gamma take the structured path, beta/delta the prompt-enforced path
              supported_parameters: i % 2 === 0 ? ["response_format", "temperature"] : ["temperature"],
            })),
            // zero-priced model (like OpenRouter ":free" variants) for the unpriced-gate test
            {
              id: "mock/free",
              context_length: 100000,
              pricing: { prompt: "0", completion: "0" },
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
      req.on("end", () => {
        captureBody?.(raw);
        const model = String(JSON.parse(raw).model);
        const hits = (completionHits.get(model) ?? 0) + 1;
        completionHits.set(model, hits);
        const b = behavior(model, hits);
        res.on("error", () => {}); // client may abort (timeout test) — never crash the shared server
        const respond = () => {
          if (res.destroyed || res.writableEnded || req.socket.destroyed) return;
          if (b.status && b.status !== 200) {
            res.writeHead(b.status, { "content-type": "application/json" });
            res.end(b.body ?? JSON.stringify({ error: { message: `mock ${b.status}` } }));
            return;
          }
          res.writeHead(200, { "content-type": "application/json" });
          res.end(
            JSON.stringify({
              id: "gen-mock",
              choices: [{ message: { role: "assistant", content: b.content ?? REVIEW_JSON } }],
              usage: { prompt_tokens: 100, completion_tokens: 50, cost: b.cost ?? 0.01 },
            }),
          );
        };
        if (b.delayMs) setTimeout(respond, b.delayMs);
        else respond();
      });
      return;
    }
    res.writeHead(404).end();
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", () => resolve(undefined)));
  const address = /** @type {import("node:net").AddressInfo} */ (server.address());
  baseUrl = `http://127.0.0.1:${address.port}`;
});

after(() => server.close());

/**
 * Async spawn — NOT spawnSync: the mock server lives in this process, and a
 * blocked event loop could never answer the child (deadlock until timeout).
 *
 * @param {string[]} args
 * @param {Record<string, string>} [envOverrides]
 * @param {string} [cwd] working directory override (defaults to a fresh tmpdir)
 */
function runCli(args, envOverrides = {}, cwd) {
  const home = mkdtempSync(join(tmpdir(), "council-test-"));
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [CLI, ...args], {
      cwd: cwd ?? home,
      env: {
        PATH: process.env.PATH,
        OPENROUTER_BASE_URL: baseUrl,
        OPENROUTER_API_KEY: TEST_KEY,
        XDG_STATE_HOME: join(home, "state"),
        XDG_CONFIG_HOME: join(home, "config"),
        COUNCIL_RETRY_BACKOFF_MS: "10",
        ...envOverrides,
      },
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (d) => (stdout += d));
    child.stderr.on("data", (d) => (stderr += d));
    const killer = setTimeout(() => child.kill("SIGKILL"), 30_000);
    child.on("error", reject);
    child.on("close", (status) => {
      clearTimeout(killer);
      resolve({
        status,
        stdout,
        stderr,
        runDir: stdout.match(/^RUN_DIR=(.+)$/m)?.[1],
        output: `${stdout}\n${stderr}`,
        cleanup: () => rmSync(home, { recursive: true, force: true }),
      });
    });
  });
}

const REVIEW_ARGS = ["review", "--input-file", DIFF, "--no-context", "--models", MOCK_MODELS.join(",")];

test("happy path: 4/4 deliver, cost aggregated, clusters written, exit 0", async () => {
  behavior = () => ({});
  completionHits = new Map();
  const r = await runCli(REVIEW_ARGS);
  assert.equal(r.status, 0, r.output);
  assert.ok(r.runDir, "RUN_DIR line must be printed");
  const manifest = JSON.parse(readFileSync(join(String(r.runDir), "manifest.json"), "utf8"));
  assert.equal(Object.values(manifest.members).filter((m) => /** @type {any} */ (m).status === "ok").length, 4);
  assert.ok(Math.abs(manifest.actualUsd - 0.04) < 1e-9, "usage.cost summed across members");
  assert.equal(manifest.degraded, false);
  assert.ok(existsSync(join(String(r.runDir), "clusters.json")));
  assert.ok(existsSync(join(String(r.runDir), "raw", "mock--alpha.json")));
  r.cleanup();
});

test("429 then success: exactly one retry, member recovers", async () => {
  behavior = (model, hits) => (model === "mock/alpha" && hits === 1 ? { status: 429 } : {});
  completionHits = new Map();
  const r = await runCli(REVIEW_ARGS);
  assert.equal(r.status, 0, r.output);
  assert.equal(completionHits.get("mock/alpha"), 2, "exactly one retry");
  assert.equal(completionHits.get("mock/beta"), 1);
  r.cleanup();
});

test("persistent 404 on one member: run continues 3/4, degraded, failure reported", async () => {
  behavior = (model) => (model === "mock/delta" ? { status: 404 } : {});
  completionHits = new Map();
  const r = await runCli(REVIEW_ARGS);
  assert.equal(r.status, 0, r.output);
  assert.equal(completionHits.get("mock/delta"), 1, "404 must not retry");
  const manifest = JSON.parse(readFileSync(join(String(r.runDir), "manifest.json"), "utf8"));
  assert.equal(manifest.members["mock/delta"].status, "failed");
  assert.equal(manifest.degraded, true);
  assert.match(r.output, /✗ mock\/delta/, "failure is reported, never silently dropped");
  r.cleanup();
});

test("quorum failure: 3 of 4 members down → exit 2", async () => {
  behavior = (model) => (model === "mock/alpha" ? {} : { status: 404 });
  completionHits = new Map();
  const r = await runCli(REVIEW_ARGS);
  assert.equal(r.status, 2, r.output);
  assert.match(r.output, /Quorum not met/);
  assert.match(r.output, /ai-review/, "points at the single-model fallback");
  r.cleanup();
});

test("timeout: slow member is aborted, others deliver, degraded exit 0", async () => {
  behavior = (model) => (model === "mock/gamma" ? { delayMs: 3000 } : {});
  completionHits = new Map();
  const r = await runCli(REVIEW_ARGS, { COUNCIL_TIMEOUT_MS: "400" });
  assert.equal(r.status, 0, r.output);
  const manifest = JSON.parse(readFileSync(join(String(r.runDir), "manifest.json"), "utf8"));
  assert.equal(manifest.members["mock/gamma"].status, "failed");
  assert.match(String(manifest.members["mock/gamma"].error), /Timeout/);
  r.cleanup();
});

test("unparseable member response is kept as unstructured and counts toward quorum", async () => {
  behavior = (model) => (model === "mock/beta" ? { content: "I simply approve of this change." } : {});
  completionHits = new Map();
  const r = await runCli(REVIEW_ARGS);
  assert.equal(r.status, 0, r.output);
  const review = JSON.parse(readFileSync(join(String(r.runDir), "reviews", "mock--beta.json"), "utf8"));
  assert.match(review.unstructured, /simply approve/);
  const manifest = JSON.parse(readFileSync(join(String(r.runDir), "manifest.json"), "utf8"));
  assert.equal(manifest.members["mock/beta"].status, "parse_failed");
  r.cleanup();
});

test("budget gate blocks BEFORE any completion request reaches the wire → exit 3", async () => {
  behavior = () => ({});
  completionHits = new Map();
  const r = await runCli([...REVIEW_ARGS, "--confirm-threshold", "0"]);
  assert.equal(r.status, 3, r.output);
  assert.equal(completionHits.size, 0, "zero POST /chat/completions hits");
  assert.match(r.output, /human partner/);
  r.cleanup();
});

test("hard cap refuses even with --yes → exit 3, zero hits", async () => {
  behavior = () => ({});
  completionHits = new Map();
  const r = await runCli([...REVIEW_ARGS, "--budget", "0", "--yes"]);
  assert.equal(r.status, 3, r.output);
  assert.equal(completionHits.size, 0);
  r.cleanup();
});

test("missing API key → exit 4, nothing dispatched, no key material in output", async () => {
  behavior = () => ({});
  completionHits = new Map();
  const r = await runCli(REVIEW_ARGS, { OPENROUTER_API_KEY: "" });
  assert.equal(r.status, 4, r.output);
  assert.equal(completionHits.size, 0);
  assert.match(r.output, /openrouter\.ai\/keys/);
  r.cleanup();
});

test("redaction: API key never appears in output even when the server echoes it", async () => {
  behavior = () => ({
    status: 401,
    body: JSON.stringify({ error: { message: `bad token: Bearer ${TEST_KEY}` } }),
  });
  completionHits = new Map();
  const r = await runCli(REVIEW_ARGS);
  assert.notEqual(r.status, 0);
  assert.ok(!r.output.includes(TEST_KEY), "literal key must never be printed");
  assert.match(r.output, /sk-or-\*\*\*/, "redaction placeholder appears instead");
  r.cleanup();
});

test("dry-run makes no completion requests and prints the estimate table", async () => {
  behavior = () => ({});
  completionHits = new Map();
  const r = await runCli([...REVIEW_ARGS, "--dry-run"], { OPENROUTER_API_KEY: "" });
  assert.equal(r.status, 0, r.output);
  assert.equal(completionHits.size, 0);
  assert.match(r.stdout, /Estimated total/);
  r.cleanup();
});

test("unknown rubric fails as a usage error before any dispatch", async () => {
  behavior = () => ({});
  completionHits = new Map();
  const r = await runCli([...REVIEW_ARGS, "--rubric", "bogus"]);
  assert.equal(r.status, 1, r.output);
  assert.equal(completionHits.size, 0, "no member requests for a config error");
  assert.match(r.output, /Unknown rubric/);
  r.cleanup();
});

test("trimmed payload is what actually reaches the wire (estimate ≡ sent)", async () => {
  /** @type {string[]} */
  const sentBodies = [];
  behavior = () => ({});
  completionHits = new Map();
  captureBody = (raw) => sentBodies.push(raw);
  try {
    // Oversized generated file must be dropped from the DISPATCHED prompt,
    // not only from input.txt/cost estimate (round-2 review finding).
    const home = mkdtempSync(join(tmpdir(), "council-fit-"));
    const bigDiff = join(home, "big.patch");
    const { writeFileSync } = await import("node:fs");
    writeFileSync(
      bigDiff,
      `diff --git a/src/app.js b/src/app.js\n+real change\n` +
        `diff --git a/pnpm-lock.yaml b/pnpm-lock.yaml\n${"+lock noise\n".repeat(60000)}`,
    );
    const r = await runCli(["review", "--input-file", bigDiff, "--no-context", "--models", MOCK_MODELS.join(",")]);
    assert.equal(r.status, 0, r.output);
    assert.ok(sentBodies.length >= 4, "members received requests");
    for (const raw of sentBodies) {
      const user = JSON.parse(raw).messages.at(-1).content;
      assert.ok(!user.includes("lock noise"), "dropped file must not be dispatched");
      assert.match(user, /real change/);
      assert.match(user, /TRUNCATED FILES/, "blind-spot notice is dispatched too");
    }
    r.cleanup();
    rmSync(home, { recursive: true, force: true });
  } finally {
    captureBody = undefined;
  }
});

test("--verify cannot bypass roster validation during review", async () => {
  behavior = () => ({});
  completionHits = new Map();
  // The actual roster is invalid; a valid --verify list must NOT rescue it.
  const r = await runCli(["review", "--input-file", DIFF, "--no-context", "--models", "bogus/nope", "--verify", "mock/alpha"]);
  assert.equal(r.status, 1, r.output);
  assert.equal(completionHits.size, 0);
  assert.match(r.output, /Unknown model slug: bogus\/nope/);
  r.cleanup();
});

test("bare --branch (no base) parses and defaults instead of crashing", async () => {
  behavior = () => ({});
  completionHits = new Map();
  // Set up a git repo where main...HEAD is empty: parseArgs must accept the
  // valueless --branch and reach the "nothing to review" usage error.
  const { execFileSync } = await import("node:child_process");
  const repo = mkdtempSync(join(tmpdir(), "council-branch-"));
  const git = (/** @type {string[]} */ ...args) =>
    execFileSync("git", args, { cwd: repo, stdio: "pipe" });
  git("init", "-q", "-b", "main");
  git("-c", "user.email=t@t", "-c", "user.name=t", "commit", "-q", "--allow-empty", "-m", "init");
  git("checkout", "-q", "-b", "feature");
  const r = await runCli(["review", "--branch", "--dry-run", "--models", MOCK_MODELS.join(",")], {}, repo);
  assert.equal(r.status, 1, r.output);
  assert.match(r.output, /Nothing to review/, "reached input validation, not a parseArgs crash");
  r.cleanup();
  rmSync(repo, { recursive: true, force: true });
});

test("unpriced (zero-cost catalog) member requires --yes — $0 estimate cannot bypass consent", async () => {
  behavior = () => ({});
  completionHits = new Map();
  const blocked = await runCli(["review", "--input-file", DIFF, "--no-context", "--models", "mock/alpha,mock/free"]);
  assert.equal(blocked.status, 3, blocked.output);
  assert.equal(completionHits.size, 0, "nothing dispatched while unconfirmed");
  assert.match(blocked.output, /No catalog pricing for: mock\/free/);
  blocked.cleanup();

  const allowed = await runCli(["review", "--input-file", DIFF, "--no-context", "--models", "mock/alpha,mock/free", "--yes"]);
  assert.equal(allowed.status, 0, allowed.output);
  allowed.cleanup();
});

test("duplicate model slugs in the roster are rejected as a usage error", async () => {
  behavior = () => ({});
  completionHits = new Map();
  const r = await runCli(["review", "--input-file", DIFF, "--no-context", "--models", "mock/alpha,mock/beta,mock/alpha"]);
  assert.equal(r.status, 1, r.output);
  assert.equal(completionHits.size, 0);
  assert.match(r.output, /Duplicate model slug/);
  r.cleanup();
});
