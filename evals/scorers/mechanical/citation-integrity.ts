import { getCitationRefs, getCitationDefs } from "../_parse";

/**
 * Dossier checklist item 2 — Citation Integrity.
 * Every [Xn][ref-Xn] in body must have a matching [ref-Xn]: https://... definition,
 * and every definition must be referenced in the body.
 */
export function scoreCitationIntegrity(content: string): number {
  const refs = getCitationRefs(content);
  const defs = getCitationDefs(content);

  if (refs.size === 0 && defs.size === 0) return 1; // zero-citation doc is acceptable

  for (const ref of refs) {
    if (!defs.has(ref)) return 0; // orphan citation — no matching definition
  }
  for (const def of defs) {
    if (!refs.has(def)) return 0; // orphan definition — URL not referenced in body
  }
  return 1;
}
