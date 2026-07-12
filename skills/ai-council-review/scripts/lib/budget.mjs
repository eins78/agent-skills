// @ts-check
/**
 * Cost estimation and the budget gate.
 *
 * The gate is a GATE, not a rule (CLAUDE.md "Gates over rules"): dispatch is
 * impossible when it blocks — the dispatcher exits before any AUTHENTICATED
 * completion request is sent. (The unauthenticated GET /models catalog fetch
 * runs earlier; it prices the very estimate the gate decides on.) The
 * mock-server test asserts zero completion requests hit the wire when blocked.
 */

/**
 * Rough token estimate: bytes/4 heuristic with a 15% safety margin.
 * Deliberately conservative; the report shows estimate vs actual so the
 * heuristic's calibration is visible over time.
 * @param {string} text
 */
export function estimateTokens(text) {
  return Math.ceil((Buffer.byteLength(text, "utf8") / 4) * 1.15);
}

/**
 * @typedef {object} ModelEstimate
 * @property {string} model
 * @property {number} inputTokens
 * @property {number} outputTokens
 * @property {number} usd
 * @property {boolean} priced false when the catalog had no pricing for the model
 */

/**
 * Per-model and total cost estimate for one council dispatch.
 *
 * `totalUsd` is the EXPECTED cost (typical review length); `worstCaseUsd` is
 * the true ceiling — every member exhausting `maxOutputTokens`. The hard
 * budget cap is enforced against the worst case, because an expected-cost
 * gate is not a cap: a reasoning model can legally emit maxOutputTokens and
 * bill several times the estimate.
 *
 * @param {object} opts
 * @param {string} opts.payload   full prompt payload sent to every member
 * @param {string[]} opts.models
 * @param {Map<string, import("./openrouter.mjs").ModelInfo>} opts.catalog
 * @param {number} opts.outputTokensPerModel
 * @param {number} opts.maxOutputTokens
 * @returns {{perModel: ModelEstimate[], totalUsd: number, worstCaseUsd: number, inputTokens: number}}
 */
export function estimateCost({ payload, models, catalog, outputTokensPerModel, maxOutputTokens }) {
  const inputTokens = estimateTokens(payload);
  /** @type {ModelEstimate[]} */
  const perModel = models.map((model) => {
    const info = catalog.get(model);
    const priced = Boolean(info && (info.promptPrice > 0 || info.completionPrice > 0));
    const usd = info
      ? inputTokens * info.promptPrice + outputTokensPerModel * info.completionPrice
      : 0;
    return { model, inputTokens, outputTokens: outputTokensPerModel, usd, priced };
  });
  const totalUsd = perModel.reduce((sum, m) => sum + m.usd, 0);
  const worstCaseUsd = models.reduce((sum, model) => {
    const info = catalog.get(model);
    return sum + (info ? inputTokens * info.promptPrice + maxOutputTokens * info.completionPrice : 0);
  }, 0);
  return { perModel, totalUsd, worstCaseUsd, inputTokens };
}

/**
 * @typedef {object} GateResult
 * @property {"proceed"|"needs-confirmation"|"over-budget"} outcome
 * @property {string} message empty when outcome is "proceed"
 */

/**
 * Decide whether a dispatch may proceed.
 *
 * The confirmation threshold compares against the EXPECTED cost (UX: what a
 * run will typically cost); the hard cap compares against the WORST CASE
 * (guarantee: what a run can possibly bill, i.e. every member exhausting
 * max_tokens). An expected-cost "cap" would not be a cap.
 *
 * @param {object} opts
 * @param {number} opts.estimateUsd          expected cost
 * @param {number} opts.worstCaseUsd         ceiling if all members hit max_tokens
 * @param {number} opts.budgetUsd            hard cap — refuses even with --yes
 * @param {number} opts.confirmThresholdUsd  above this, --yes is required
 * @param {boolean} opts.yes
 * @returns {GateResult}
 */
export function budgetGate({ estimateUsd, worstCaseUsd, budgetUsd, confirmThresholdUsd, yes }) {
  const est = `$${estimateUsd.toFixed(2)}`;
  if (worstCaseUsd > budgetUsd) {
    return {
      outcome: "over-budget",
      message:
        `Worst-case cost $${worstCaseUsd.toFixed(2)} (every member exhausting max_tokens; ` +
        `expected ${est}) exceeds the hard budget cap ($${budgetUsd.toFixed(2)}). ` +
        `Nothing was sent. Narrow the input (e.g. --branch, fewer files) or, after your ` +
        `human partner explicitly approves this spend, re-run with --budget ${Math.ceil(worstCaseUsd)} --yes.`,
    };
  }
  if (estimateUsd > confirmThresholdUsd && !yes) {
    return {
      outcome: "needs-confirmation",
      message:
        `Estimated cost ${est} is above the confirmation threshold ($${confirmThresholdUsd.toFixed(2)}). ` +
        `Nothing was sent. Show this estimate to your human partner — sending will also transmit ` +
        `the reviewed content to external model providers — and re-run with --yes only after ` +
        `they confirm in this session.`,
    };
  }
  return { outcome: "proceed", message: "" };
}
