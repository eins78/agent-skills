import { getCheckboxLines } from "../_parse";

/**
 * Ballot checklist item 5 — Recommended-but-not-pre-ticked.
 * No checkbox may be pre-ticked (- [x]) before the reviewer fills it.
 */
export function scoreRecommendedNotPreTicked(content: string): number {
  const checkboxes = getCheckboxLines(content);
  if (checkboxes.some((cb) => cb.checked)) return 0;
  return 1;
}
