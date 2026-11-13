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
 * the true ceiling — every member at its worst-case output (`maxOutputTokens`,
 * more for a reasoning model with an overrun factor). The hard
 * budget cap is enforced against the worst case, because an expected-cost
 * gate is not a cap: a reasoning model can legally emit maxOutputTokens and
 * bill several times the estimate.
 *
 * @param {object} opts
 * @param {string} opts.payload   full prompt payload sent to every member
 * @param {string[]} opts.models
 * @param {Map<string, import("./openrouter.mjs").ModelInfo>} opts.catalog
 * @param {number} opts.outputTokensPerModel
 * @param {Record<string, number>} [opts.outputTokensByModel]  per-model output-token estimates that override `outputTokensPerModel`; models not listed here fall back to `outputTokensPerModel`
 * @param {number} opts.maxOutputTokens
 * @param {number} [opts.reasoningOverrunFactor] see worstCaseOutputTokens (default 1: no allowance)
 * @returns {{perModel: ModelEstimate[], totalUsd: number, worstCaseUsd: number, inputTokens: number}}
 */
export function estimateCost({ payload, models, catalog, outputTokensPerModel, maxOutputTokens, outputTokensByModel, reasoningOverrunFactor }) {
  const inputTokens = estimateTokens(payload);
  /** @type {ModelEstimate[]} */
  const perModel = models.map((model) => {
    const info = catalog.get(model);
    const priced = Boolean(info && (info.promptPrice > 0 || info.completionPrice > 0));
    const outputTokens = outputTokensByModel?.[model] ?? outputTokensPerModel;
    const usd = info
      ? inputTokens * info.promptPrice + outputTokens * info.completionPrice
      : 0;
    return { model, inputTokens, outputTokens, usd, priced };
  });
  const totalUsd = perModel.reduce((sum, m) => sum + m.usd, 0);
  const worstCaseUsd = models.reduce(
    (sum, model) => sum + worstCaseRequestUsd({ model, inputTokens, catalog, maxOutputTokens, reasoningOverrunFactor }),
    0,
  );
  return { perModel, totalUsd, worstCaseUsd, inputTokens };
}

/**
 * The table of measured output lengths the cost estimate assumes.
 * @typedef {object} ExpectedOutputTokens
 * @property {number} nonReasoningDefault  mean output tokens of models without reasoning support
 * @property {number} reasoningDefault     mean output tokens of reasoning models
 * @property {Record<string, number>} models  per-model measured means (slug → tokens); a model's own entry wins
 */

/**
 * Assumed output tokens for ONE council member, and where the figure came
 * from (shown in the estimate table so the assumption is auditable).
 *
 * Precedence: the model's own measured entry, else the reasoning default when
 * the live catalog advertises reasoning support, else the non-reasoning
 * default. This only moves the EXPECTED cost; the hard cap still prices every
 * member at its worst case (worstCaseRequestUsd).
 *
 * @param {object} opts
 * @param {string} opts.model
 * @param {Map<string, import("./openrouter.mjs").ModelInfo>} opts.catalog
 * @param {ExpectedOutputTokens} opts.table
 * @returns {{tokens: number, source: "model entry"|"reasoning default"|"non-reasoning default"}}
 */
export function assumedOutputTokens({ model, catalog, table }) {
  if (table.models[model] !== undefined) {
    return { tokens: table.models[model], source: "model entry" };
  }
  if (catalog.get(model)?.supportedParameters.includes("reasoning")) {
    return { tokens: table.reasoningDefault, source: "reasoning default" };
  }
  return { tokens: table.nonReasoningDefault, source: "non-reasoning default" };
}

/**
 * Output tokens one request can bill at worst. `max_tokens` is a request,
 * not a guarantee: a provider may bill reasoning tokens on top of it. Seen
 * once in 77 recorded responses: deepseek-v4-flash sent `max_tokens` 24000
 * and billed 32,675 output tokens (32,156 of them reasoning), a factor of
 * 1.36. Every other recorded response stayed at or under 24,000. So a model
 * whose catalog entry lists `reasoning` is priced at maxOutputTokens times
 * `reasoningOverrunFactor`; other models at maxOutputTokens. The default
 * factor 1 keeps the earlier behaviour; callers that enforce a hard cap pass
 * the factor from their own data (ai-review: references/models.json).
 *
 * @param {object} opts
 * @param {string} opts.model
 * @param {Map<string, import("./openrouter.mjs").ModelInfo>} opts.catalog
 * @param {number} opts.maxOutputTokens
 * @param {number} [opts.reasoningOverrunFactor]
 */
export function worstCaseOutputTokens({ model, catalog, maxOutputTokens, reasoningOverrunFactor = 1 }) {
  const reasons = Boolean(catalog.get(model)?.supportedParameters.includes("reasoning"));
  // a factor that is not a number counts as 1, never as NaN (NaN would slip past the cap)
  const factor = Number.isFinite(reasoningOverrunFactor) ? Math.max(1, /** @type {number} */ (reasoningOverrunFactor)) : 1;
  return reasons ? Math.ceil(maxOutputTokens * factor) : maxOutputTokens;
}

/**
 * Worst-case cost of ONE request to one model: the full payload plus
 * worstCaseOutputTokens. Zero for a model the catalog does not price.
 *
 * @param {object} opts
 * @param {string} opts.model
 * @param {number} opts.inputTokens
 * @param {Map<string, import("./openrouter.mjs").ModelInfo>} opts.catalog
 * @param {number} opts.maxOutputTokens
 * @param {number} [opts.reasoningOverrunFactor]
 */
export function worstCaseRequestUsd({ model, inputTokens, catalog, maxOutputTokens, reasoningOverrunFactor }) {
  const info = catalog.get(model);
  if (!info) return 0;
  const out = worstCaseOutputTokens({ model, catalog, maxOutputTokens, reasoningOverrunFactor });
  return inputTokens * info.promptPrice + out * info.completionPrice;
}

/**
 * Budget headroom for second attempts. The hard cap is checked against one
 * worst-case request per member; a retried empty completion can bill a
 * second full request, so each retry must first reserve its own worst case
 * from what the cap leaves over. Dispatch is single-threaded JS, so a
 * synchronous reserve() is race-free across parallel members.
 *
 * @param {number} budgetUsd     hard cap
 * @param {number} worstCaseUsd  the gate's one-request-per-member ceiling
 * @returns {{reserve: (usd: number) => boolean, remaining: () => number}}
 */
export function createRetryAllowance(budgetUsd, worstCaseUsd) {
  let remaining = Math.max(0, budgetUsd - worstCaseUsd);
  return {
    reserve(usd) {
      if (usd > remaining) return false;
      remaining -= usd;
      return true;
    },
    remaining: () => remaining,
  };
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
 * (guarantee: what a run can possibly bill, i.e. every member at its
 * worst-case output). An expected-cost "cap" would not be a cap. The gate
 * fails closed: a worst case that is not a number blocks.
 *
 * @param {object} opts
 * @param {number} opts.estimateUsd          expected cost
 * @param {number} opts.worstCaseUsd         ceiling if every member bills its worst-case output
 * @param {number} opts.budgetUsd            hard cap — refuses even with --yes
 * @param {number} opts.confirmThresholdUsd  above this, --yes is required
 * @param {boolean} opts.yes
 * @returns {GateResult}
 */
export function budgetGate({ estimateUsd, worstCaseUsd, budgetUsd, confirmThresholdUsd, yes }) {
  const est = `$${estimateUsd.toFixed(2)}`;
  if (!Number.isFinite(worstCaseUsd)) {
    return {
      outcome: "over-budget",
      message:
        `The worst-case cost could not be computed (a price or setting is not a number; expected ${est}). ` +
        `Nothing was sent. Check the model's pricing in the catalog and the cost settings.`,
    };
  }
  if (!(worstCaseUsd <= budgetUsd)) {
    return {
      outcome: "over-budget",
      message:
        `Worst-case cost $${worstCaseUsd.toFixed(2)} (every member at its worst-case output; ` +
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
