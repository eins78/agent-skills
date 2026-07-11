// @ts-check
/**
 * Optional live smoke test against the real OpenRouter API.
 * Skips cleanly without OPENROUTER_API_KEY. Uses a council of one cheap
 * model (deepseek-v4-flash, ~$0.077/M input) on a 12-line diff with a hard
 * $0.02 budget — a run costs well under one cent.
 *
 * A failure here on a *deprecated slug* is loud on purpose: it is the
 * roster-churn alarm, not test flakiness (see README Known Gaps).
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const SMOKE_MODEL = "deepseek/deepseek-v4-flash";

test("live smoke: council of one reviews tiny diff for < $0.01", (t) => {
  if (!process.env.OPENROUTER_API_KEY) {
    return t.skip("OPENROUTER_API_KEY not set — skipping live smoke test");
  }
  const home = mkdtempSync(join(tmpdir(), "council-live-"));
  try {
    const r = spawnSync(
      process.execPath,
      [
        join(HERE, "..", "scripts", "council.mjs"),
        "review",
        "--input-file", join(HERE, "fixtures", "tiny-diff.patch"),
        "--no-context",
        "--models", SMOKE_MODEL,
        "--quorum", "1",
        "--budget", "0.02",
        "--timeout", "180",
      ],
      {
        cwd: home,
        encoding: "utf8",
        // generous margin over the CLI's own 180s request timeout + retry
        // backoff + catalog fetch — the inner timeout should fire first
        timeout: 300_000,
        env: { ...process.env, XDG_STATE_HOME: join(home, "state"), XDG_CONFIG_HOME: join(home, "config") },
      },
    );
    assert.equal(r.status, 0, `${r.stdout}\n${r.stderr}`);
    const runDir = r.stdout.match(/^RUN_DIR=(.+)$/m)?.[1];
    assert.ok(runDir);
    const manifest = JSON.parse(readFileSync(join(String(runDir), "manifest.json"), "utf8"));
    const member = manifest.members[SMOKE_MODEL];
    assert.ok(member.status === "ok" || member.status === "parse_failed", JSON.stringify(member));
    assert.ok(manifest.actualUsd > 0, "OpenRouter should report a real cost");
    assert.ok(manifest.actualUsd < 0.01, `smoke run cost ${manifest.actualUsd} — expected < $0.01`);
    // No content-quality assertions: model output is non-deterministic.
  } finally {
    rmSync(home, { recursive: true, force: true });
  }
});
