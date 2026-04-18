import { getH2Headings } from "../_parse";

/**
 * Dossier checklist item 4 — Section Ordering.
 * Key Concepts / Glossary must appear before Executive / Management Summary.
 * Sources must be the last H2.
 */
const GLOSSARY_PATTERNS = ["key concepts", "glossary", "terminology"];
const SUMMARY_PATTERNS = ["executive summary", "management summary", "summary"];
const SOURCES_PATTERN = "sources";

export function scoreSectionOrdering(content: string): number {
  const headings = getH2Headings(content).map((h) => h.toLowerCase());

  const glossaryIdx = headings.findIndex((h) => GLOSSARY_PATTERNS.some((p) => h.includes(p)));
  const summaryIdx = headings.findIndex((h) => SUMMARY_PATTERNS.some((p) => h.includes(p)));
  const sourcesIdx = headings.findIndex((h) => h.includes(SOURCES_PATTERN));

  // Rule 1: if both glossary and summary are present, glossary must come first
  if (glossaryIdx !== -1 && summaryIdx !== -1 && glossaryIdx > summaryIdx) return 0;

  // Rule 2: if Sources is present, it must be the last H2
  if (sourcesIdx !== -1 && sourcesIdx !== headings.length - 1) return 0;

  return 1;
}
