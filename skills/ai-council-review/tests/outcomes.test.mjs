// @ts-check
/**
 * Outcome archive (P7): per-member verified/refuted/uncertain tallies from
 * synthesis, recorded per run and aggregated per model across runs. The
 * archive is the skill's only ground-truth source for future roster tuning.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { recordOutcomes, aggregateOutcomes } from "../scripts/lib/outcomes.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const CLI = join(HERE, "..", "scripts", "council.mjs");

/** Build a fake run dir with roster-key.json + manifest.json. */
function makeRun(/** @type {string} */ root, /** @type {string} */ name) {
  const runDir = join(root, name);
  mkdirSync(runDir, { recursive: true });
  writeFileSync(
    join(runDir, "roster-key.json"),
    JSON.stringify({ "member-A": "mock/alpha", "member-B": "mock/beta", "member-C": "mock/gamma" }),
  );
  writeFileSync(
    join(runDir, "manifest.json"),
    JSON.stringify({ rubric: "code", finishedAt: "2026-07-12T10:00:00.000Z", members: {} }),
  );
  return runDir;
}

test("record translates labels to models and appends one archive line", () => {
  const home = mkdtempSync(join(tmpdir(), "council-outcomes-"));
  const stateDir = join(home, "state");
  const runDir = makeRun(home, "run-1");
  const rec = recordOutcomes({
    runDir,
    stateDir,
    verdictsByLabel: {
      "member-A": { verified: 2, refuted: 1, uncertain: 0 },
      "member-B": { verified: 1, refuted: 0, uncertain: 2 },
    },
  });
  assert.deepEqual(rec.models["mock/alpha"], { verified: 2, refuted: 1, uncertain: 0 });
  assert.deepEqual(rec.models["mock/beta"], { verified: 1, refuted: 0, uncertain: 2 });
  assert.equal(rec.rubric, "code");
  const lines = readFileSync(join(stateDir, "outcomes.jsonl"), "utf8").trim().split("\n");
  assert.equal(lines.length, 1);
  assert.ok(!lines[0].includes("member-A"), "archive speaks model slugs, not run-scoped labels");
  rmSync(home, { recursive: true, force: true });
});

test("the same run cannot be recorded twice", () => {
  const home = mkdtempSync(join(tmpdir(), "council-outcomes-"));
  const stateDir = join(home, "state");
  const runDir = makeRun(home, "run-1");
  const verdictsByLabel = { "member-A": { verified: 1, refuted: 0, uncertain: 0 } };
  recordOutcomes({ runDir, stateDir, verdictsByLabel });
  assert.throws(() => recordOutcomes({ runDir, stateDir, verdictsByLabel }), /already recorded/);
  const lines = readFileSync(join(stateDir, "outcomes.jsonl"), "utf8").trim().split("\n");
  assert.equal(lines.length, 1, "no duplicate line was appended");
  rmSync(home, { recursive: true, force: true });
});

test("unknown labels and malformed counts are usage errors, nothing is written", () => {
  const home = mkdtempSync(join(tmpdir(), "council-outcomes-"));
  const stateDir = join(home, "state");
  const runDir = makeRun(home, "run-1");
  assert.throws(
    () => recordOutcomes({ runDir, stateDir, verdictsByLabel: { "member-Z": { verified: 1, refuted: 0, uncertain: 0 } } }),
    /member-Z/,
  );
  assert.throws(
    () => recordOutcomes({ runDir, stateDir, verdictsByLabel: { "member-A": { verified: -1, refuted: 0, uncertain: 0 } } }),
    /non-negative integer/,
  );
  assert.throws(() => readFileSync(join(stateDir, "outcomes.jsonl")), /ENOENT/);
  rmSync(home, { recursive: true, force: true });
});

test("aggregate sums per model across runs and computes precision", () => {
  const home = mkdtempSync(join(tmpdir(), "council-outcomes-"));
  const stateDir = join(home, "state");
  recordOutcomes({
    runDir: makeRun(home, "run-1"),
    stateDir,
    verdictsByLabel: { "member-A": { verified: 2, refuted: 1, uncertain: 1 } },
  });
  recordOutcomes({
    runDir: makeRun(home, "run-2"),
    stateDir,
    verdictsByLabel: { "member-A": { verified: 1, refuted: 0, uncertain: 0 } },
  });
  const agg = aggregateOutcomes(stateDir);
  const alpha = agg.find((m) => m.model === "mock/alpha");
  assert.deepEqual(alpha, { model: "mock/alpha", runs: 2, verified: 3, refuted: 1, uncertain: 1, precision: 0.75 });
  rmSync(home, { recursive: true, force: true });
});

test("CLI: outcomes record + show work offline (no network, no API key)", () => {
  const home = mkdtempSync(join(tmpdir(), "council-outcomes-cli-"));
  const runDir = makeRun(home, "run-1");
  const env = {
    PATH: process.env.PATH,
    XDG_STATE_HOME: join(home, "state"),
    // Deliberately no OPENROUTER_API_KEY and an unroutable base URL:
    // the outcomes subcommand must never touch the network.
    OPENROUTER_BASE_URL: "http://127.0.0.1:1",
  };
  const record = execFileSync(
    process.execPath,
    [CLI, "outcomes", "record", "--run", runDir, "--json", JSON.stringify({ "member-A": { verified: 1, refuted: 1, uncertain: 0 } })],
    { env, encoding: "utf8" },
  );
  assert.match(record, /recorded/i);
  const show = execFileSync(process.execPath, [CLI, "outcomes", "show"], { env, encoding: "utf8" });
  assert.match(show, /mock\/alpha/);
  assert.match(show, /precision/i);
  rmSync(home, { recursive: true, force: true });
});

test("a corrupt line in outcomes.jsonl is skipped — record and show keep working", () => {
  const home = mkdtempSync(join(tmpdir(), "council-outcomes-"));
  const stateDir = join(home, "state");
  recordOutcomes({
    runDir: makeRun(home, "run-1"),
    stateDir,
    verdictsByLabel: { "member-A": { verified: 1, refuted: 0, uncertain: 0 } },
  });
  // Simulate a crash mid-append / hand edit.
  const archive = join(stateDir, "outcomes.jsonl");
  writeFileSync(archive, `${readFileSync(archive, "utf8")}{"truncated`);
  // Both paths must survive: the archive is the skill's only ground-truth
  // dataset, and record's dedupe check also reads it.
  const rec = recordOutcomes({
    runDir: makeRun(home, "run-2"),
    stateDir,
    verdictsByLabel: { "member-A": { verified: 2, refuted: 1, uncertain: 0 } },
  });
  assert.deepEqual(rec.models["mock/alpha"], { verified: 2, refuted: 1, uncertain: 0 });
  const agg = aggregateOutcomes(stateDir);
  assert.equal(agg.find((m) => m.model === "mock/alpha")?.runs, 2, "good lines on both sides of the corrupt one still count");
  rmSync(home, { recursive: true, force: true });
});

test("dedupe normalizes the run path — trailing slash and relative variants cannot double-record", () => {
  const home = mkdtempSync(join(tmpdir(), "council-outcomes-"));
  const stateDir = join(home, "state");
  const runDir = makeRun(home, "run-1");
  recordOutcomes({ runDir, stateDir, verdictsByLabel: { "member-A": { verified: 1, refuted: 0, uncertain: 0 } } });
  assert.throws(
    () => recordOutcomes({ runDir: `${runDir}/`, stateDir, verdictsByLabel: { "member-A": { verified: 1, refuted: 0, uncertain: 0 } } }),
    /already recorded/,
    "trailing-slash variant of the same run must dedupe",
  );
  const lines = readFileSync(join(stateDir, "outcomes.jsonl"), "utf8").trim().split("\n");
  assert.equal(lines.length, 1);
  rmSync(home, { recursive: true, force: true });
});

test("CLI: recording the same run twice exits non-zero", () => {
  const home = mkdtempSync(join(tmpdir(), "council-outcomes-cli-"));
  const runDir = makeRun(home, "run-1");
  const env = { PATH: process.env.PATH, XDG_STATE_HOME: join(home, "state") };
  const args = [CLI, "outcomes", "record", "--run", runDir, "--json", JSON.stringify({ "member-A": { verified: 1, refuted: 0, uncertain: 0 } })];
  execFileSync(process.execPath, args, { env, encoding: "utf8" });
  assert.throws(() => execFileSync(process.execPath, args, { env, encoding: "utf8", stdio: "pipe" }), /already recorded/);
  rmSync(home, { recursive: true, force: true });
});
