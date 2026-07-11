// @ts-check
import { test } from "node:test";
import assert from "node:assert/strict";

import { estimateTokens, estimateCost, budgetGate } from "../scripts/lib/budget.mjs";

/** @returns {Map<string, import("../scripts/lib/openrouter.mjs").ModelInfo>} */
function catalog() {
  return new Map([
    ["mock/pricey", { id: "mock/pricey", contextLength: 100000, promptPrice: 5e-6, completionPrice: 25e-6, supportedParameters: [] }],
    ["mock/cheap", { id: "mock/cheap", contextLength: 100000, promptPrice: 1e-7, completionPrice: 2e-7, supportedParameters: [] }],
    ["mock/unpriced", { id: "mock/unpriced", contextLength: 100000, promptPrice: 0, completionPrice: 0, supportedParameters: [] }],
  ]);
}

test("token estimate applies the bytes/4 heuristic with safety margin", () => {
  const tokens = estimateTokens("x".repeat(4000));
  assert.equal(tokens, Math.ceil(1000 * 1.15));
});

test("cost estimate: per-model math, total, and worst case", () => {
  const payload = "x".repeat(4000); // 1150 tokens
  const { perModel, totalUsd, worstCaseUsd } = estimateCost({
    payload,
    models: ["mock/pricey", "mock/cheap"],
    catalog: catalog(),
    outputTokensPerModel: 3000,
    maxOutputTokens: 24000,
  });
  const pricey = 1150 * 5e-6 + 3000 * 25e-6;
  const cheap = 1150 * 1e-7 + 3000 * 2e-7;
  assert.ok(Math.abs(perModel[0].usd - pricey) < 1e-9);
  assert.ok(Math.abs(perModel[1].usd - cheap) < 1e-9);
  assert.ok(Math.abs(totalUsd - (pricey + cheap)) < 1e-9);
  const worst = 1150 * 5e-6 + 24000 * 25e-6 + 1150 * 1e-7 + 24000 * 2e-7;
  assert.ok(Math.abs(worstCaseUsd - worst) < 1e-9, "worst case uses max_tokens, not the working estimate");
  assert.equal(perModel[0].priced, true);
});

test("unpriced models are flagged rather than silently costing $0", () => {
  const { perModel } = estimateCost({
    payload: "hello",
    models: ["mock/unpriced"],
    catalog: catalog(),
    outputTokensPerModel: 3000,
    maxOutputTokens: 24000,
  });
  assert.equal(perModel[0].priced, false);
});

test("gate: under threshold proceeds without --yes", () => {
  const g = budgetGate({ estimateUsd: 0.4, worstCaseUsd: 2, budgetUsd: 5, confirmThresholdUsd: 1, yes: false });
  assert.equal(g.outcome, "proceed");
});

test("gate: above threshold without --yes blocks and instructs human confirmation", () => {
  const g = budgetGate({ estimateUsd: 2.5, worstCaseUsd: 4, budgetUsd: 5, confirmThresholdUsd: 1, yes: false });
  assert.equal(g.outcome, "needs-confirmation");
  assert.match(g.message, /human partner/);
  assert.match(g.message, /external model providers/, "refusal re-surfaces the data disclosure");
});

test("gate: above threshold with --yes proceeds", () => {
  const g = budgetGate({ estimateUsd: 2.5, worstCaseUsd: 4, budgetUsd: 5, confirmThresholdUsd: 1, yes: true });
  assert.equal(g.outcome, "proceed");
});

test("gate: worst case above hard cap refuses even with --yes and even when estimate is low", () => {
  // Council-review finding (gpt-5.5, dogfood run): an expected-cost "cap" is
  // not a cap — members can legally bill up to max_tokens.
  const g = budgetGate({ estimateUsd: 0.5, worstCaseUsd: 9, budgetUsd: 5, confirmThresholdUsd: 1, yes: true });
  assert.equal(g.outcome, "over-budget");
  assert.match(g.message, /Worst-case/);
  assert.match(g.message, /--budget 9 --yes/, "tells the agent the explicit re-run incantation");
});

test("gate: custom budget respected", () => {
  const g = budgetGate({ estimateUsd: 9, worstCaseUsd: 15, budgetUsd: 20, confirmThresholdUsd: 10, yes: false });
  assert.equal(g.outcome, "proceed");
});
