// @ts-check
/**
 * Single source of truth for the findings schema, shared by:
 *  - response_format json_schema (models that support structured outputs)
 *  - the prompt text (models that don't)
 *  - the lenient parser/validator applied to every response
 *
 * Degradation ladder on parse: strip fences → outermost braces → JSON.parse →
 * cheap repair → lenient validation. Final floor (in council.mjs): persist the
 * raw text as {unstructured} — an opinion is never discarded.
 */

export const SEVERITIES = /** @type {const} */ (["blocker", "major", "minor", "nit"]);
export const CATEGORIES = /** @type {const} */ ([
  "correctness", "security", "performance", "design",
  "maintainability", "testing", "docs", "other",
]);
export const VERDICTS = /** @type {const} */ (["approve", "request_changes", "comment"]);
export const CONFIDENCES = /** @type {const} */ (["high", "medium", "low"]);

/**
 * JSON Schema for the review each council member must return.
 *
 * Strict-structured-output compliant (OpenAI rejects anything less with a
 * 400): every object level lists ALL of its properties in `required`, and
 * optionality is expressed as nullable types — never by omission from
 * `required`. The validator treats null exactly like absent.
 */
export const REVIEW_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["verdict", "summary", "findings"],
  properties: {
    verdict: { type: "string", enum: [...VERDICTS] },
    summary: { type: "string", description: "2-4 sentence overall assessment" },
    findings: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["location", "severity", "category", "title", "description", "suggestion", "confidence"],
        properties: {
          location: {
            type: ["object", "null"],
            additionalProperties: false,
            required: ["file", "lines", "section"],
            properties: {
              file: { type: ["string", "null"] },
              lines: {
                type: ["array", "null"],
                items: { type: "integer" },
                description: "[startLine, endLine]",
              },
              section: { type: ["string", "null"], description: "for documents without file:line" },
            },
          },
          severity: { type: "string", enum: [...SEVERITIES] },
          category: { type: "string", enum: [...CATEGORIES] },
          title: { type: "string", description: "one line, specific" },
          description: { type: "string" },
          suggestion: { type: ["string", "null"], description: "concrete fix, if you have one" },
          confidence: { type: "string", enum: [...CONFIDENCES] },
        },
      },
    },
  },
};

/** response_format payload for models with structured-output support. */
export const RESPONSE_FORMAT = {
  type: "json_schema",
  json_schema: { name: "council_review", strict: true, schema: REVIEW_JSON_SCHEMA },
};

/**
 * @typedef {object} Finding
 * @property {{file?: string, lines?: [number, number], section?: string}} [location]
 * @property {typeof SEVERITIES[number]} severity
 * @property {typeof CATEGORIES[number]} category
 * @property {string} title
 * @property {string} description
 * @property {string} [suggestion]
 * @property {typeof CONFIDENCES[number]} confidence
 * @property {string[]} [unmapped] fields that failed lenient validation and were coerced
 */

/**
 * @typedef {object} Review
 * @property {typeof VERDICTS[number]} verdict
 * @property {string} summary
 * @property {Finding[]} findings
 */

/**
 * Pull a JSON object out of possibly-messy model output.
 * @param {string} text
 * @returns {{ok: true, value: unknown} | {ok: false, error: string}}
 */
export function extractJson(text) {
  let candidate = text.trim();
  if (candidate === "") return { ok: false, error: "empty response" };

  // 1. fenced code block, if present
  const fence = candidate.match(/```(?:json)?\s*\n([\s\S]*?)\n\s*```/);
  if (fence) candidate = fence[1].trim();

  // 2. outermost braces (drops chatty preamble/epilogue)
  const first = candidate.indexOf("{");
  const last = candidate.lastIndexOf("}");
  if (first === -1 || last === -1 || last <= first) {
    return { ok: false, error: "no JSON object found in response" };
  }
  candidate = candidate.slice(first, last + 1);

  // 3. parse, then 4. one cheap repair pass (trailing commas, smart quotes)
  for (const attempt of [candidate, repairJson(candidate)]) {
    try {
      return { ok: true, value: JSON.parse(attempt) };
    } catch {
      // try the next repair stage
    }
  }
  return { ok: false, error: "unparseable JSON in response" };
}

/** @param {string} s */
function repairJson(s) {
  return s
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/,\s*([}\]])/g, "$1");
}

/**
 * Lenient validation: coerce a parsed object into a Review, downgrading
 * unknown enum values instead of rejecting (noted in `unmapped`).
 *
 * @param {unknown} value
 * @returns {{ok: true, review: Review} | {ok: false, error: string}}
 */
export function validateReview(value) {
  if (typeof value !== "object" || value === null) {
    return { ok: false, error: "response is not an object" };
  }
  const obj = /** @type {Record<string, unknown>} */ (value);
  if (!Array.isArray(obj.findings)) {
    return { ok: false, error: "response has no findings array" };
  }

  const inEnum = (/** @type {readonly string[]} */ list, /** @type {unknown} */ v) =>
    typeof v === "string" && list.includes(v);

  /** @type {Finding[]} */
  const findings = [];
  for (const raw of obj.findings) {
    if (typeof raw !== "object" || raw === null) continue;
    const f = /** @type {Record<string, unknown>} */ (raw);
    /** @type {string[]} */
    const unmapped = [];

    const severity = inEnum(SEVERITIES, f.severity)
      ? /** @type {Finding["severity"]} */ (f.severity)
      : (unmapped.push(`severity:${String(f.severity)}`), "minor");
    const category = inEnum(CATEGORIES, f.category)
      ? /** @type {Finding["category"]} */ (f.category)
      : (unmapped.push(`category:${String(f.category)}`), "other");
    const confidence = inEnum(CONFIDENCES, f.confidence)
      ? /** @type {Finding["confidence"]} */ (f.confidence)
      : (unmapped.push(`confidence:${String(f.confidence)}`), "medium");

    /** @type {Finding["location"]} */
    let location;
    if (typeof f.location === "object" && f.location !== null) {
      const loc = /** @type {Record<string, unknown>} */ (f.location);
      location = {};
      if (typeof loc.file === "string") location.file = loc.file;
      if (typeof loc.section === "string") location.section = loc.section;
      if (
        Array.isArray(loc.lines) && loc.lines.length === 2 &&
        loc.lines.every((n) => Number.isInteger(n))
      ) {
        location.lines = /** @type {[number, number]} */ ([loc.lines[0], loc.lines[1]]);
      }
      // strict-mode responses send {file: null, lines: null, section: null}
      if (Object.keys(location).length === 0) location = undefined;
    }

    findings.push({
      ...(location ? { location } : {}),
      severity,
      category,
      title: typeof f.title === "string" ? f.title : String(f.title ?? "(untitled finding)"),
      description: typeof f.description === "string" ? f.description : "",
      ...(typeof f.suggestion === "string" ? { suggestion: f.suggestion } : {}),
      confidence,
      ...(unmapped.length ? { unmapped } : {}),
    });
  }

  const verdict = inEnum(VERDICTS, obj.verdict)
    ? /** @type {Review["verdict"]} */ (obj.verdict)
    : "comment";

  return {
    ok: true,
    review: {
      verdict,
      summary: typeof obj.summary === "string" ? obj.summary : "",
      findings,
    },
  };
}

/** Compact schema description for prompt-enforced JSON (non-structured models). */
export function schemaPromptBlock() {
  return [
    "Respond with ONLY a single JSON object — no prose before or after, no markdown fences.",
    "Shape:",
    JSON.stringify(
      {
        verdict: "approve | request_changes | comment",
        summary: "2-4 sentence overall assessment",
        findings: [
          {
            location: { file: "path (optional)", lines: [1, 2], section: "for docs (optional)" },
            severity: "blocker | major | minor | nit",
            category: CATEGORIES.join(" | "),
            title: "one line, specific",
            description: "what and why",
            suggestion: "concrete fix (optional)",
            confidence: "high | medium | low",
          },
        ],
      },
      null,
      2,
    ),
  ].join("\n");
}
