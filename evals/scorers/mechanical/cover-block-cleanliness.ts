import { getCoverBlock } from "../_parse";

/**
 * Ballot checklist item 2 — Cover-Block Cleanliness.
 * Content before the first DEC heading must be ≤10 non-blank lines
 * and must not contain archaeology phrases ("updated", "changes since", etc.).
 */
const FORBIDDEN_PHRASES = [
  "updated ",
  "changes since",
  "ballot v",
  "status: draft",
  "previous version",
  "ballot updated",
  "rewritten",
];

const MAX_COVER_LINES = 10;

export function scoreCoverBlockCleanliness(content: string): number {
  const coverLines = getCoverBlock(content);
  const nonBlank = coverLines.filter((l) => l.trim().length > 0);

  if (nonBlank.length > MAX_COVER_LINES) return 0;

  const coverText = coverLines.join("\n").toLowerCase();
  if (FORBIDDEN_PHRASES.some((p) => coverText.includes(p))) return 0;

  return 1;
}
