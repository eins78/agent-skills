// @ts-check
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, mkdirSync, writeFileSync, symlinkSync } from "node:fs";
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

test("auto-context never follows a symlink that leaves the repository", () => {
  const dir = mkdtempSync(join(tmpdir(), "council-input-"));
  const outside = mkdtempSync(join(tmpdir(), "council-outside-"));
  try {
    writeFileSync(join(outside, "secret.txt"), "TOP-SECRET-VALUE\n");
    symlinkSync(join(outside, "secret.txt"), join(dir, "CLAUDE.md"));
    symlinkSync(join(outside, "secret.txt"), join(dir, "PLAN.md"));
    writeFileSync(join(dir, "AGENTS.md"), "# Real instructions\n");
    symlinkSync(join(dir, "AGENTS.md"), join(dir, "GEMINI.md")); // a link INSIDE the repo is fine
    writeFileSync(join(dir, "code.js"), "export const x = 1;\n");
    const result = gatherInput({ flags: {}, positionals: ["code.js"], cwd: dir, env: {} });
    assert.ok(!result.context.includes("TOP-SECRET-VALUE"), "outside-repo symlink must not be read");
    assert.match(result.context, /Real instructions/, "an in-repo symlink and a regular file still work");
  } finally {
    rmSync(dir, { recursive: true, force: true });
    rmSync(outside, { recursive: true, force: true });
  }
});

test("auto-context skips a symlink that points at a hidden file inside the repository (.env, .git)", () => {
  const dir = mkdtempSync(join(tmpdir(), "council-input-"));
  try {
    writeFileSync(join(dir, ".env"), "API_TOKEN=HIDDEN-SECRET\n");
    mkdirSync(join(dir, ".git"));
    writeFileSync(join(dir, ".git", "config"), "[remote]\nurl=HIDDEN-GIT-CONFIG\n");
    symlinkSync(join(dir, ".env"), join(dir, "CLAUDE.md"));
    symlinkSync(join(dir, ".git", "config"), join(dir, "PLAN.md"));
    writeFileSync(join(dir, "code.js"), "export const x = 1;\n");
    const result = gatherInput({ flags: {}, positionals: ["code.js"], cwd: dir, env: {} });
    assert.ok(!result.context.includes("HIDDEN-SECRET"));
    assert.ok(!result.context.includes("HIDDEN-GIT-CONFIG"));
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
