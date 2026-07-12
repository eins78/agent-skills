// @ts-check
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { extractJson, validateReview } from "../scripts/lib/schema.mjs";

const FIXTURES = join(dirname(fileURLToPath(import.meta.url)), "fixtures", "sample-responses");
const load = (/** @type {string} */ name) => readFileSync(join(FIXTURES, name), "utf8");

test("clean JSON parses and validates", () => {
  const extracted = extractJson(load("clean.json"));
  assert.ok(extracted.ok);
  const validated = validateReview(extracted.value);
  assert.ok(validated.ok);
  assert.equal(validated.review.verdict, "request_changes");
  assert.equal(validated.review.findings.length, 1);
  assert.equal(validated.review.findings[0].severity, "major");
  assert.deepEqual(validated.review.findings[0].location?.lines, [2, 2]);
});

test("fenced JSON with prose around the fence parses", () => {
  const extracted = extractJson(load("fenced.txt"));
  assert.ok(extracted.ok);
  const validated = validateReview(extracted.value);
  assert.ok(validated.ok);
  assert.equal(validated.review.findings[0].category, "maintainability");
});

test("chatty preamble/epilogue with a trailing comma is repaired", () => {
  const extracted = extractJson(load("chatty.txt"));
  assert.ok(extracted.ok, "repair pass should handle the trailing comma");
  const validated = validateReview(extracted.value);
  assert.ok(validated.ok);
  assert.equal(validated.review.findings[0].severity, "blocker");
});

test("truncated JSON fails with a typed error, not a throw", () => {
  const extracted = extractJson(load("malformed.txt"));
  assert.equal(extracted.ok, false);
  assert.match(/** @type {{error: string}} */ (extracted).error, /unparseable|no JSON/);
});

test("empty response fails cleanly", () => {
  const extracted = extractJson("   \n  ");
  assert.equal(extracted.ok, false);
});

test("pure prose (no JSON at all) fails cleanly", () => {
  const extracted = extractJson("I approve this change, great work everyone.");
  assert.equal(extracted.ok, false);
});

test("unknown enum values are coerced leniently, not rejected", () => {
  const validated = validateReview({
    verdict: "LGTM", // not a valid verdict
    summary: "ok",
    findings: [
      {
        severity: "critical", // not in taxonomy → minor + unmapped note
        category: "style", // not in taxonomy → other
        title: "t",
        description: "d",
        confidence: "certain", // → medium
      },
    ],
  });
  assert.ok(validated.ok);
  assert.equal(validated.review.verdict, "comment");
  const f = validated.review.findings[0];
  assert.equal(f.severity, "minor");
  assert.equal(f.category, "other");
  assert.equal(f.confidence, "medium");
  assert.ok(f.unmapped && f.unmapped.length === 3);
});

test("missing findings array is a validation error", () => {
  const validated = validateReview({ verdict: "approve", summary: "fine" });
  assert.equal(validated.ok, false);
});

test("strict-mode nulls (location/suggestion/lines: null) validate like absent", () => {
  const validated = validateReview({
    verdict: "approve",
    summary: "ok",
    findings: [
      {
        location: null,
        severity: "nit",
        category: "docs",
        title: "a",
        description: "b",
        suggestion: null,
        confidence: "low",
      },
      {
        location: { file: null, lines: null, section: null },
        severity: "nit",
        category: "docs",
        title: "c",
        description: "d",
        suggestion: null,
        confidence: "low",
      },
    ],
  });
  assert.ok(validated.ok);
  assert.equal(validated.review.findings[0].location, undefined);
  assert.equal(validated.review.findings[0].suggestion, undefined);
  assert.equal(validated.review.findings[1].location, undefined, "all-null location collapses to absent");
});

test("schema is strict-structured-output compliant (OpenAI 400 regression)", async () => {
  // OpenAI strict mode: every object level must list ALL property keys in
  // `required`; optionality only via nullable types. Live-run regression:
  // gpt-5.5 rejected the schema when location's keys were not in required.
  const { REVIEW_JSON_SCHEMA } = await import("../scripts/lib/schema.mjs");
  /** @param {any} node @param {string} path */
  const walk = (node, path) => {
    if (typeof node !== "object" || node === null) return;
    const types = Array.isArray(node.type) ? node.type : [node.type];
    if (types.includes("object") && node.properties) {
      assert.deepEqual(
        [...(node.required ?? [])].sort(),
        Object.keys(node.properties).sort(),
        `strict mode violated at ${path}: required must include every property key`,
      );
    }
    for (const [k, v] of Object.entries(node)) walk(v, `${path}.${k}`);
  };
  walk(REVIEW_JSON_SCHEMA, "$");
});
