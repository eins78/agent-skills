// @ts-check
import { test } from "node:test";
import assert from "node:assert/strict";

import { estimateTokens, estimateCost, budgetGate, createRetryAllowance, worstCaseRequestUsd, worstCaseOutputTokens, assumedOutputTokens } from "../scripts/lib/budget.mjs";

/** @returns {Map<string, import("../scripts/lib/openrouter.mjs").ModelInfo>} */
function catalog() {
  return new Map([
    ["mock/pricey", { id: "mock/pricey", contextLength: 100000, promptPrice: 5e-6, completionPrice: 25e-6, supportedParameters: [] }],
    ["mock/cheap", { id: "mock/cheap", contextLength: 100000, promptPrice: 1e-7, completionPrice: 2e-7, supportedParameters: [] }],
    ["mock/unpriced", { id: "mock/unpriced", contextLength: 100000, promptPrice: 0, completionPrice: 0, supportedParameters: [] }],
  ]);
}

/** @returns {Map<string, import("../scripts/lib/openrouter.mjs").ModelInfo>} */
function reasoningCatalog() {
  return new Map([
    ["mock/reasoner", { id: "mock/reasoner", contextLength: 100000, promptPrice: 1e-6, completionPrice: 1e-6, supportedParameters: ["temperature", "reasoning"] }],
    ["mock/plain", { id: "mock/plain", contextLength: 100000, promptPrice: 1e-6, completionPrice: 1e-6, supportedParameters: ["temperature"] }],
  ]);
}

/** Measured output-length table, as resolved from config. @type {import("../scripts/lib/budget.mjs").ExpectedOutputTokens} */
const TABLE = { nonReasoningDefault: 3000, reasoningDefault: 9000, models: { "mock/measured": 4321 } };

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

test("worst case covers a provider that bills reasoning past max_tokens (recorded run: 32,675 billed against max_tokens 24,000)", () => {
  // Numbers from the recorded response (usage and upstream_inference_*_cost fields):
  // 32,435 input tokens at $0.70/M, 32,675 output tokens at $0.17/M, billed $0.02825925.
  const cat = new Map([
    ["mock/reasoner", { id: "mock/reasoner", contextLength: 1_000_000, promptPrice: 7e-7, completionPrice: 1.7e-7, supportedParameters: ["reasoning"] }],
    ["mock/plain", { id: "mock/plain", contextLength: 1_000_000, promptPrice: 7e-7, completionPrice: 1.7e-7, supportedParameters: [] }],
  ]);
  const billed = 32_435 * 7e-7 + 32_675 * 1.7e-7;
  assert.ok(Math.abs(billed - 0.02825925) < 1e-8, "the test numbers reproduce the recorded bill");
  const base = { inputTokens: 32_435, catalog: cat, maxOutputTokens: 24_000 };

  const old = worstCaseRequestUsd({ ...base, model: "mock/reasoner" });
  assert.ok(old < billed, "without an allowance the worst case is below what was billed: the cap did not hold");

  const factor2 = worstCaseRequestUsd({ ...base, model: "mock/reasoner", reasoningOverrunFactor: 2 });
  assert.ok(factor2 >= billed, "with factor 2 the worst case covers the recorded bill");
  assert.equal(worstCaseOutputTokens({ model: "mock/reasoner", catalog: cat, maxOutputTokens: 24_000, reasoningOverrunFactor: 2 }), 48_000);

  // a model that does not list reasoning keeps max_tokens as its ceiling, and a factor below 1 is ignored
  assert.equal(worstCaseOutputTokens({ model: "mock/plain", catalog: cat, maxOutputTokens: 24_000, reasoningOverrunFactor: 2 }), 24_000);
  assert.equal(worstCaseOutputTokens({ model: "mock/reasoner", catalog: cat, maxOutputTokens: 24_000, reasoningOverrunFactor: 0.5 }), 24_000);

  // estimateCost passes the factor to the worst case, not to the expected cost
  const e1 = estimateCost({ payload: "x".repeat(4000), models: ["mock/reasoner"], catalog: cat, outputTokensPerModel: 9000, maxOutputTokens: 24_000 });
  const e2 = estimateCost({ payload: "x".repeat(4000), models: ["mock/reasoner"], catalog: cat, outputTokensPerModel: 9000, maxOutputTokens: 24_000, reasoningOverrunFactor: 2 });
  assert.equal(e1.totalUsd, e2.totalUsd);
  assert.ok(e2.worstCaseUsd > e1.worstCaseUsd);
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

test("outputTokensByModel overrides outputTokensPerModel for a listed model and not for an unlisted one", () => {
  const payload = "x".repeat(4000); // 1150 tokens
  const { perModel } = estimateCost({
    payload,
    models: ["mock/pricey", "mock/cheap"],
    catalog: catalog(),
    outputTokensPerModel: 3000,
    maxOutputTokens: 24000,
    outputTokensByModel: { "mock/pricey": 9500 },
  });
  assert.equal(perModel[0].outputTokens, 9500, "the listed model uses its own figure");
  assert.equal(perModel[1].outputTokens, 3000, "the unlisted model keeps the flat default");
  assert.ok(Math.abs(perModel[0].usd - (1150 * 5e-6 + 9500 * 25e-6)) < 1e-9);
  assert.ok(Math.abs(perModel[1].usd - (1150 * 1e-7 + 3000 * 2e-7)) < 1e-9);
});

test("a call without outputTokensByModel behaves exactly as before", () => {
  const { perModel } = estimateCost({
    payload: "x".repeat(4000),
    models: ["mock/cheap"],
    catalog: catalog(),
    outputTokensPerModel: 3000,
    maxOutputTokens: 24000,
  });
  assert.equal(perModel[0].outputTokens, 3000);
});

test("assumedOutputTokens: the model's own entry wins", () => {
  assert.deepEqual(assumedOutputTokens({ model: "mock/measured", catalog: reasoningCatalog(), table: TABLE }), {
    tokens: 4321,
    source: "model entry",
  });
});

test("assumedOutputTokens: reasoning default for a model that supports reasoning", () => {
  assert.deepEqual(assumedOutputTokens({ model: "mock/reasoner", catalog: reasoningCatalog(), table: TABLE }), {
    tokens: 9000,
    source: "reasoning default",
  });
});

test("assumedOutputTokens: non-reasoning default otherwise", () => {
  assert.deepEqual(assumedOutputTokens({ model: "mock/plain", catalog: reasoningCatalog(), table: TABLE }), {
    tokens: 3000,
    source: "non-reasoning default",
  });
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
  assert.match(g.message, /Worst-case cost \$9\.00 /, "the dollar sign is printed");
  assert.match(g.message, /--budget 9 --yes/, "tells the agent the explicit re-run incantation");
});

test("gate fails closed: a worst case that is not a number blocks, even with --yes", () => {
  for (const worstCaseUsd of [NaN, Infinity]) {
    const g = budgetGate({ estimateUsd: 0.1, worstCaseUsd, budgetUsd: 5, confirmThresholdUsd: 1, yes: true });
    assert.equal(g.outcome, "over-budget", String(worstCaseUsd));
    assert.doesNotMatch(g.message, /--budget NaN|--budget Infinity/);
  }
  // a catalog entry with a non-numeric completion price gives a NaN worst case, which the gate must refuse
  const cat = new Map([["mock/bad", { id: "mock/bad", contextLength: 100000, promptPrice: 1e-6, completionPrice: NaN, supportedParameters: [] }]]);
  const e = estimateCost({ payload: "hello", models: ["mock/bad"], catalog: cat, outputTokensPerModel: 3000, maxOutputTokens: 24000 });
  assert.equal(budgetGate({ estimateUsd: e.totalUsd, worstCaseUsd: e.worstCaseUsd, budgetUsd: 5, confirmThresholdUsd: 1, yes: true }).outcome, "over-budget");
});

test("a reasoningOverrunFactor that is not a number counts as 1, never as NaN", () => {
  const cat = reasoningCatalog();
  for (const reasoningOverrunFactor of [NaN, undefined, Infinity]) {
    assert.equal(worstCaseOutputTokens({ model: "mock/reasoner", catalog: cat, maxOutputTokens: 24_000, reasoningOverrunFactor }), 24_000);
  }
});

test("gate: custom budget respected", () => {
  const g = budgetGate({ estimateUsd: 9, worstCaseUsd: 15, budgetUsd: 20, confirmThresholdUsd: 10, yes: false });
  assert.equal(g.outcome, "proceed");
});

test("retry allowance: only what the hard cap leaves over the worst case, reserved once", () => {
  const allowance = createRetryAllowance(1.0, 0.7);
  assert.equal(allowance.reserve(0.2), true);
  assert.equal(allowance.reserve(0.2), false, "0.1 left: a second 0.2 retry would breach the cap");
  assert.equal(allowance.reserve(0.1), true);
  assert.ok(Math.abs(allowance.remaining()) < 1e-12);
  assert.equal(createRetryAllowance(0.5, 0.7).reserve(0.01), false, "no negative headroom");
});

test("worst case of one request matches the per-member term of estimateCost", () => {
  const cat = catalog();
  const pricey = worstCaseRequestUsd({ model: "mock/pricey", inputTokens: 1150, catalog: cat, maxOutputTokens: 24000 });
  assert.ok(Math.abs(pricey - (1150 * 5e-6 + 24000 * 25e-6)) < 1e-12);
  assert.equal(worstCaseRequestUsd({ model: "mock/unknown", inputTokens: 1150, catalog: cat, maxOutputTokens: 24000 }), 0);
});
