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
 * One chat completion with per-request timeout and a single retry on 429/5xx.
 * 400/401/404 fail fast: they are configuration errors, retrying cannot help.
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
 * @returns {Promise<{content: string, finishReason: string, usage: {prompt_tokens?: number, completion_tokens?: number, cost?: number}, raw: unknown}>}
 */
export async function chatCompletion(opts) {
  const { baseUrl, apiKey, model, messages, responseFormat, temperature, timeoutMs } = opts;
  /** @type {Record<string, unknown>} */
  const body = {
    model,
    messages,
    // Generous ceiling: reasoning models spend completion tokens on thinking
    // before the JSON; 8k proved too tight in live runs (finish_reason=length).
    max_tokens: opts.maxTokens ?? 24000,
    usage: { include: true },
  };
  if (responseFormat) {
    body.response_format = responseFormat;
    body.provider = { require_parameters: true };
  }
  if (temperature !== undefined) body.temperature = temperature;

  /** @type {Error|undefined} */
  let lastError;
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
      const res = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          ...ATTRIBUTION_HEADERS,
        },
        body: JSON.stringify(body),
      });

      if (res.status === 429 || res.status >= 500) {
        const text = await res.text().catch(() => "");
        lastError = new Error(
          `HTTP ${res.status} from ${model}: ${redact(text.slice(0, 500), apiKey)}`,
        );
        continue; // retryable
      }
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(
          `HTTP ${res.status} from ${model} (not retryable): ${redact(text.slice(0, 500), apiKey)}`,
        );
      }

      const json = /** @type {any} */ (await res.json());
      // OpenRouter can return 200 with an error payload (e.g. moderation)
      if (json.error) {
        throw new Error(`API error from ${model}: ${redact(JSON.stringify(json.error).slice(0, 500), apiKey)}`);
      }
      const content = json.choices?.[0]?.message?.content;
      if (typeof content !== "string" || content.length === 0) {
        throw new Error(`Empty completion from ${model}`);
      }
      return {
        content,
        finishReason: String(json.choices?.[0]?.finish_reason ?? "unknown"),
        usage: json.usage ?? {},
        raw: json,
      };
    } catch (err) {
      const e = /** @type {Error} */ (err);
      if (e.name === "AbortError") {
        throw new Error(`Timeout after ${Math.round(timeoutMs / 1000)}s waiting for ${model}`);
      }
      if (e.message.includes("not retryable") || e.message.startsWith("API error") || e.message.startsWith("Empty completion")) {
        throw new Error(redact(e.message, apiKey));
      }
      lastError = new Error(redact(e.message, apiKey)); // network-level: allow the one retry
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastError ?? new Error(`Request to ${model} failed`);
}
