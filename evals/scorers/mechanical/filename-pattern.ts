import type { DocInput } from "../_fixtures";

/**
 * Ballot checklist item 1 — Filename Pattern.
 * Ballot filename must match DOSSIER-<slug>-BALLOT-<Reviewer>.md
 * where <Reviewer> is TitleCase (e.g. Max, Patrick).
 */
const BALLOT_FILENAME_RE = /^DOSSIER-[\w-]+-BALLOT-[A-Z][a-z]+\.md$/;

export function scoreFilenamePattern(input: DocInput): number {
  return BALLOT_FILENAME_RE.test(input.filename) ? 1 : 0;
}
