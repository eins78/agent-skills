// @ts-check
/**
 * Prompt assembly: rubric (references/prompts/<rubric>.md) + schema
 * instructions + payload. Every council member receives the IDENTICAL
 * prompt — agreement counting across members is only valid when the
 * assignment was the same for all of them (see README Design Decisions).
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { SKILL_DIR, UsageError } from "./config.mjs";
import { schemaPromptBlock } from "./schema.mjs";

export const RUBRICS = /** @type {const} */ ({
  code: "code-review.md",
  plan: "plan-review.md",
  doc: "document-review.md",
});

/** @param {string} rubric */
export function loadRubric(rubric) {
  const file = RUBRICS[/** @type {keyof typeof RUBRICS} */ (rubric)];
  if (!file) {
    throw new UsageError(`Unknown rubric "${rubric}". Available: ${Object.keys(RUBRICS).join(", ")}`);
  }
  return readFileSync(join(SKILL_DIR, "references", "prompts", file), "utf8");
}

/**
 * Assemble the user-message body from context + material. The caller fits
 * THIS exact string against context windows and cost estimates, then passes
 * it back via buildMessages — so what is estimated is byte-for-byte what is
 * sent.
 *
 * @param {string} code    material under review
 * @param {string} context auto-context block ("" if disabled)
 */
export function assembleUserPayload(code, context) {
  return [
    context ? `# Project context\n\n${context}` : "",
    `# Material under review\n\n${code}`,
  ]
    .filter(Boolean)
    .join("\n\n");
}

/**
 * @param {object} opts
 * @param {string} opts.rubric   code | plan | doc
 * @param {string} opts.payload  final user-message body (already fitted/trimmed)
 * @param {boolean} opts.structured true when the model gets response_format json_schema
 * @param {string} [opts.persona] experimental --personas focus paragraph
 * @returns {{role: "system"|"user", content: string}[]}
 */
export function buildMessages({ rubric, payload, structured, persona }) {
  const system = [
    loadRubric(rubric).trim(),
    persona ? `\nAdditional focus for this reviewer:\n${persona}` : "",
    // Structured-output models get the schema via response_format; the rest
    // get it spelled out in the prompt. Same schema either way (schema.mjs).
    structured
      ? "Return your review as a JSON object following the response schema you were given."
      : schemaPromptBlock(),
  ]
    .filter(Boolean)
    .join("\n\n");

  return [
    { role: "system", content: system },
    { role: "user", content: payload },
  ];
}
