// @ts-check
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { gatherInput, fitPayload } from "../scripts/lib/input.mjs";

/** Build a throwaway non-git project with a plan file. */
function makeProject() {
  const dir = mkdtempSync(join(tmpdir(), "council-input-"));
  mkdirSync(join(dir, ".claude", "plans"), { recursive: true });
  writeFileSync(join(dir, ".claude", "plans", "the-plan.md"), "# The plan\n\nBuild the thing.\n");
  writeFileSync(join(dir, "CLAUDE.md"), "# Project instructions\n");
  return dir;
}

test("reviewing the plan file itself does not duplicate it into auto-context", () => {
  const dir = makeProject();
  try {
    const planRel = join(".claude", "plans", "the-plan.md");
    const result = gatherInput({
      flags: {},
      positionals: [planRel],
      cwd: dir,
      env: {},
    });
    assert.match(result.code, /Build the thing/);
    assert.ok(!result.context.includes("IMPLEMENTATION PLAN"), "plan must not appear as context");
    assert.match(result.context, /PROJECT INSTRUCTIONS/, "other context still included");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("reviewing another file still includes the plan as context", () => {
  const dir = makeProject();
  try {
    writeFileSync(join(dir, "code.js"), "export const x = 1;\n");
    const result = gatherInput({ flags: {}, positionals: ["code.js"], cwd: dir, env: {} });
    assert.match(result.context, /IMPLEMENTATION PLAN/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("fitPayload drops lockfiles first and reports blind spots in the payload", () => {
  const payload = [
    `diff --git a/src/app.js b/src/app.js\n+real change\n`,
    `diff --git a/pnpm-lock.yaml b/pnpm-lock.yaml\n${"+lock noise\n".repeat(2000)}`,
  ].join("");
  const { payload: fitted, fits, dropped } = fitPayload(payload, 1000);
  assert.ok(fits);
  assert.deepEqual(dropped, ["pnpm-lock.yaml"]);
  assert.match(fitted, /real change/);
  assert.match(fitted, /TRUNCATED FILES/);
  assert.ok(!fitted.includes("lock noise"));
});

test("fitPayload leaves small payloads untouched", () => {
  const { payload, fits, dropped, truncated } = fitPayload("small diff", 1000);
  assert.equal(payload, "small diff");
  assert.ok(fits);
  assert.equal(dropped.length + truncated.length, 0);
});
