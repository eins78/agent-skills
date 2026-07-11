// @ts-check
import { test } from "node:test";
import assert from "node:assert/strict";

import { clusterFindings } from "../scripts/lib/cluster.mjs";

/**
 * @param {string} title
 * @param {Partial<import("../scripts/lib/schema.mjs").Finding>} [extra]
 * @returns {import("../scripts/lib/schema.mjs").Finding}
 */
const finding = (title, extra = {}) => ({
  severity: "major",
  category: "correctness",
  title,
  description: "desc",
  confidence: "high",
  ...extra,
});

/** @param {string} model @param {import("../scripts/lib/schema.mjs").Finding[]} findings */
const review = (model, findings) => ({
  model,
  review: { verdict: /** @type {const} */ ("comment"), summary: "", findings },
});

test("same file + overlapping lines from different models merge into one cluster", () => {
  const clusters = clusterFindings([
    review("a", [finding("assignment in condition", { location: { file: "src/greet.js", lines: [2, 2] } })]),
    review("b", [finding("uses = instead of ===", { location: { file: "./src/greet.js", lines: [1, 3] } })]),
    review("c", [finding("guard clause assigns", { location: { file: "b/src/greet.js", lines: [2, 4] } })]),
  ]);
  assert.equal(clusters.length, 1);
  assert.deepEqual(clusters[0].models.sort(), ["a", "b", "c"]);
});

test("different files never merge — dissent-preserving under-merge", () => {
  const clusters = clusterFindings([
    review("a", [finding("null check missing", { location: { file: "src/x.js", lines: [10, 12] } })]),
    review("b", [finding("null check missing", { location: { file: "src/y.js", lines: [10, 12] } })]),
  ]);
  assert.equal(clusters.length, 2, "same title in different files must stay separate");
});

test("distant line ranges in the same file stay separate", () => {
  const clusters = clusterFindings([
    review("a", [finding("issue one", { location: { file: "src/x.js", lines: [1, 3] } })]),
    review("b", [finding("issue two", { location: { file: "src/x.js", lines: [100, 105] } })]),
  ]);
  assert.equal(clusters.length, 2);
});

test("location-less findings merge only on clear title similarity", () => {
  const clusters = clusterFindings([
    review("a", [finding("missing rollback plan for the migration")]),
    review("b", [finding("the migration has no rollback plan")]),
    review("c", [finding("budget estimate ignores retention costs")]),
  ]);
  assert.equal(clusters.length, 2);
  const merged = clusters.find((c) => c.models.length === 2);
  assert.ok(merged, "the two rollback findings should cluster");
});

test("clusters sort by severity then agreement; minority blocker outranks popular nit", () => {
  const clusters = clusterFindings([
    review("a", [
      finding("tabs vs spaces", { severity: "nit", category: "docs", location: { file: "a.js", lines: [1, 1] } }),
      finding("sql injection in query builder", { severity: "blocker", category: "security", location: { file: "db.js", lines: [5, 9] } }),
    ]),
    review("b", [finding("tabs versus spaces argh", { severity: "nit", category: "docs", location: { file: "a.js", lines: [1, 2] } })]),
    review("c", [finding("tabs and spaces mixed", { severity: "nit", category: "docs", location: { file: "a.js", lines: [1, 1] } })]),
  ]);
  assert.equal(clusters[0].maxSeverity, "blocker");
  assert.equal(clusters[0].models.length, 1, "1/3 blocker sorts first despite 3/3 nit");
});

test("per-model attribution survives clustering", () => {
  const clusters = clusterFindings([
    review("a", [finding("x", { location: { file: "f.js", lines: [1, 1] } })]),
    review("b", [finding("x", { location: { file: "f.js", lines: [1, 1] } })]),
  ]);
  assert.equal(clusters[0].members.length, 2);
  assert.ok(clusters[0].members.every((m) => typeof m.findingIndex === "number"));
});
