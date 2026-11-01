// @ts-check
/**
 * Minimal OpenRouter client. Zero dependencies: native fetch + AbortController.
 *
 * Security invariant: the API key must never appear in anything this module
 * throws, logs, or returns. Every error path goes through redact().
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, statSync } from "node:fs";
import { join } from "node:path";

const ATTRIBUTION_HEADERS = {
  "HTTP-Referer": "https://github.com/eins78/agent-skills",
  "X-Title": "ai-council-review",
};

const MODELS_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

/**
 * Replace any occurrence of the API key in a string with a placeholder.
 * @param {string} text
 * @param {string|undefined} apiKey
 */
export function redact(text, apiKey) {
  if (!apiKey) return text;
  return text.split(apiKey).join("sk-or-***");
}

/**
 * @typedef {object} ModelInfo
 * @property {string} id
 * @property {number} contextLength
 * @property {number} promptPrice     USD per token
 * @property {number} completionPrice USD per token
 * @property {string[]} supportedParameters
 */

/**
 * Fetch the public model catalog, cached on disk for 24h.
 * No auth required — safe to call before any key check for --dry-run flows.
 *
 * @param {object} opts
 * @param {string} opts.baseUrl
 * @param {string} opts.stateDir directory for models-cache.json
 * @param {boolean} [opts.noCache]
 * @returns {Promise<Map<string, ModelInfo>>}
 */
export async function getModelsCatalog({ baseUrl, stateDir, noCache = false }) {
  const cacheFile = join(stateDir, "models-cache.json");
  /** @type {{data: unknown[]}|undefined} */
  let payload;

  if (!noCache && existsSync(cacheFile)) {
    const age = Date.now() - statSync(cacheFile).mtimeMs;
    if (age < MODELS_CACHE_TTL_MS) {
      try {
        payload = JSON.parse(readFileSync(cacheFile, "utf8"));
      } catch {
        payload = undefined; // corrupt cache: fall through to refetch
      }
    }
  }

  if (!payload) {
    const res = await fetch(`${baseUrl}/models`, { headers: { ...ATTRIBUTION_HEADERS } });
    if (!res.ok) {
      throw new Error(`Failed to fetch model catalog: HTTP ${res.status} ${res.statusText}`);
    }
    payload = /** @type {{data: unknown[]}} */ (await res.json());
    mkdirSync(stateDir, { recursive: true, mode: 0o700 });
    writeFileSync(cacheFile, JSON.stringify(payload));
  }

  /** @type {Map<string, ModelInfo>} */
  const catalog = new Map();
  for (const entry of payload.data ?? []) {
    const m = /** @type {any} */ (entry);
    if (!m?.id) continue;
    catalog.set(m.id, {
      id: m.id,
      contextLength: Number(m.context_length ?? 0),
      promptPrice: Number(m.pricing?.prompt ?? 0),
      completionPrice: Number(m.pricing?.completion ?? 0),
      supportedParameters: Array.isArray(m.supported_parameters) ? m.supported_parameters : [],
    });
  }
  return catalog;
}

/**
 * Validate roster slugs against the catalog; suggest near-misses for typos
 * and renamed/deprecated models (slugs churn often on OpenRouter).
 *
 * @param {string[]} models
 * @param {Map<string, ModelInfo>} catalog
 * @returns {{ok: string[], unknown: {slug: string, suggestions: string[]}[]}}
 */
export function validateSlugs(models, catalog) {
  /** @type {string[]} */
  const ok = [];
  /** @type {{slug: string, suggestions: string[]}[]} */
  const unknown = [];
  const all = [...catalog.keys()];
  for (const slug of models) {
    if (catalog.has(slug)) {
      ok.push(slug);
    } else {
      const vendor = slug.split("/")[0];
      const stem = (slug.split("/")[1] ?? "").replace(/[-.\d]+$/, "");
      const suggestions = all
        .filter((id) => id.startsWith(`${vendor}/`) && (stem === "" || id.includes(stem)))
        .slice(0, 5);
      unknown.push({ slug, suggestions });
    }
  }
  return { ok, unknown };
}

/**
 * What one request attempt left behind, kept so a failed member can be
 * diagnosed after the run: the parsed response body when there was one
 * (finish_reason, usage, generation id, provider), otherwise the HTTP status
 * and body text, or the network/timeout error. API-key-redacted.
 *
 * @typedef {{response: unknown} | {httpStatus: number, body: string} | {error: string}} AttemptRecord
 */

/** Cap on stored error-body text per attempt — enough for any provider error JSON. */
const ATTEMPT_BODY_LIMIT = 20_000;

/**
 * A failed completion, carrying every attempt so the caller can persist the
 * evidence. `message` keeps the historical prefixes ("HTTP 404 from …",
 * "Empty completion from …", "Timeout after …") — the manifest and the
 * skill's documentation match on them.
 */
export class CompletionError extends Error {
  /**
   * @param {string} message
   * @param {AttemptRecord[]} attempts
   */
  constructor(message, attempts) {
    super(message);
    this.name = "CompletionError";
    this.attempts = attempts;
  }
}

/**
 * Why a 200 response carried no content, in the provider's own terms: a
 * reasoning model that spends its whole output budget thinking ends with
 * finish_reason "length" and an empty content field.
 * @param {any} json
 */
function emptyDetail(json) {
  const parts = [`finish_reason=${json?.choices?.[0]?.finish_reason ?? "unknown"}`];
  const reasoning = json?.usage?.completion_tokens_details?.reasoning_tokens;
  const completion = json?.usage?.completion_tokens;
  if (completion !== undefined) parts.push(`completion_tokens=${completion}`);
  if (reasoning !== undefined) parts.push(`reasoning_tokens=${reasoning}`);
  return parts.join(", ");
}

/**
 * One chat completion with per-request timeout and a single retry on 429/5xx,
 * on network errors, and on an empty completion (a 200 with no content, which
 * some providers return intermittently). 400/401/404 fail fast: they are
 * configuration errors, retrying cannot help. Every failure is thrown as a
 * CompletionError carrying the attempts it saw.
 *
 * @param {object} opts
 * @param {string} opts.baseUrl
 * @param {string} opts.apiKey
 * @param {string} opts.model
 * @param {{role: string, content: string}[]} opts.messages
 * @param {object|undefined} opts.responseFormat json_schema response_format, if the model supports it
 * @param {number|undefined} opts.temperature
 * @param {number} opts.timeoutMs
 * @param {number} [opts.maxTokens]
 * @param {string} [opts.reasoningEffort] reasoning.effort value — caller must gate this on the
 *   model's `supported_parameters` including "reasoning"; sending it to a model that doesn't
 *   support it is a 400, not a graceful ignore
 * @param {string} [opts.providerSort] provider.sort value (e.g. "throughput") — a routing hint,
 *   not a model capability, so it is safe to send unconditionally
 * @param {(string|undefined)[]} [opts.redactAlso] further secrets to redact from every record and
 *   message, e.g. an API key that is set in the environment but not the one being sent
 * @param {() => boolean} [opts.mayRetryEmpty] asked before retrying an empty completion; return
 *   false to fail instead (the retry may bill a second full request). Omitted: always retry.
 * @returns {Promise<{content: string, finishReason: string, usage: {prompt_tokens?: number, completion_tokens?: number, cost?: number}, raw: unknown, attempts: AttemptRecord[]}>}
 */
export async function chatCompletion(opts) {
  const { baseUrl, apiKey, model, messages, responseFormat, temperature, timeoutMs, reasoningEffort, providerSort } = opts;
  /** @type {Record<string, unknown>} */
  const body = {
    model,
    messages,
    // Generous ceiling: reasoning models spend completion tokens on thinking
    // before the JSON; 8k proved too tight in live runs (finish_reason=length).
    max_tokens: opts.maxTokens ?? 24000,
    usage: { include: true },
  };
  if (responseFormat) body.response_format = responseFormat;
  if (temperature !== undefined) body.temperature = temperature;
  if (reasoningEffort) body.reasoning = { effort: reasoningEffort };
  /** @type {Record<string, unknown>} */
  const provider = {};
  if (responseFormat) provider.require_parameters = true;
  if (providerSort) provider.sort = providerSort;
  if (Object.keys(provider).length > 0) body.provider = provider;

  // Redact every candidate key, not only the one sent: callers pass the
  // others in `redactAlso` (key material present in the environment).
  const secrets = [apiKey, ...(opts.redactAlso ?? [])];
  /** @param {string} text @returns {string} */
  const scrub = (text) => {
    for (const key of secrets) text = redact(text, key);
    return text;
  };
  /** @type {AttemptRecord[]} */
  const attempts = [];
  /** @param {string} message */
  const fail = (message) => new CompletionError(scrub(message), attempts);

  /** @type {string|undefined} */
  let lastMessage;
  for (let attempt = 0; attempt < 2; attempt++) {
    if (attempt > 0) {
      // jittered 2–8s backoff before the single retry (env override for
      // tests — explicit parse so "0" is honored, not treated as unset)
      const raw = Number(process.env.COUNCIL_RETRY_BACKOFF_MS ?? NaN);
      const backoff = Number.isFinite(raw) && raw >= 0 ? raw : 2000 + Math.random() * 6000;
      await new Promise((r) => setTimeout(r, backoff));
    }
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      /** @type {Response} */
      let res;
      try {
        res = await fetch(`${baseUrl}/chat/completions`, {
          method: "POST",
          signal: controller.signal,
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            ...ATTRIBUTION_HEADERS,
          },
          body: JSON.stringify(body),
        });
      } catch (err) {
        const e = /** @type {Error} */ (err);
        if (e.name === "AbortError") throw e;
        attempts.push({ error: scrub(e.message) });
        lastMessage = e.message; // network-level: allow the one retry
        continue;
      }

      // Redact BEFORE any slice: a cut through an echoed key leaves a
      // fragment that exact-match redaction can no longer recognize.
      if (!res.ok) {
        const text = scrub(await res.text().catch(() => ""));
        attempts.push({ httpStatus: res.status, body: text.slice(0, ATTEMPT_BODY_LIMIT) });
        if (res.status === 429 || res.status >= 500) {
          lastMessage = `HTTP ${res.status} from ${model}: ${text.slice(0, 500)}`;
          continue; // retryable
        }
        throw fail(`HTTP ${res.status} from ${model} (not retryable): ${text.slice(0, 500)}`);
      }

      // Read text first: a 200 carrying an HTML error page or broken JSON
      // must still leave its status and body in the attempt record.
      const text = await res.text();
      /** @type {any} */
      let json;
      try {
        json = JSON.parse(text);
      } catch {
        const clean = scrub(text);
        attempts.push({ httpStatus: res.status, body: clean.slice(0, ATTEMPT_BODY_LIMIT) });
        lastMessage = `Malformed response from ${model} (HTTP ${res.status}, not JSON): ${clean.slice(0, 200)}`;
        continue; // as before: allow the one retry
      }
      attempts.push({ response: JSON.parse(scrub(JSON.stringify(json))) });
      // OpenRouter can return 200 with an error payload (e.g. moderation)
      if (json.error) {
        throw fail(`API error from ${model}: ${scrub(JSON.stringify(json.error)).slice(0, 500)}`);
      }
      const content = json.choices?.[0]?.message?.content;
      if (typeof content !== "string" || content.length === 0) {
        lastMessage = `Empty completion from ${model} (${emptyDetail(json)})`;
        // An empty completion can be billed in full, so its retry is a second
        // charge the budget gate must have room for — the caller decides.
        if (attempt === 0 && opts.mayRetryEmpty && !opts.mayRetryEmpty()) {
          throw fail(`${lastMessage}; not retried: no budget headroom for a second attempt`);
        }
        continue; // intermittent on some providers: allow the one retry
      }
      return {
        content,
        finishReason: String(json.choices?.[0]?.finish_reason ?? "unknown"),
        usage: json.usage ?? {},
        raw: json,
        attempts,
      };
    } catch (err) {
      if (err instanceof CompletionError) throw err;
      const e = /** @type {Error} */ (err);
      if (e.name === "AbortError") {
        attempts.push({ error: `timeout after ${timeoutMs} ms` });
        throw fail(`Timeout after ${Math.round(timeoutMs / 1000)}s waiting for ${model}`);
      }
      // a connection dropped mid-body, or similar: allow the one retry
      attempts.push({ error: scrub(e.message) });
      lastMessage = e.message;
    } finally {
      clearTimeout(timer);
    }
  }
  throw fail(lastMessage ?? `Request to ${model} failed`);
}
