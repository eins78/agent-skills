/**
 * Dossier checklist item 8 — Key Facts Box.
 * ## Key Facts heading must be present, appear early, content ≤15 non-blank lines,
 * and include at least 2 of: who decides, deadline, audience, constraints.
 */
const REQUIRED_KEYWORDS = ["who decides", "deadline", "audience", "constraint", "decision model"];
const MIN_KEYWORD_HITS = 2;
const MAX_SECTION_LINES = 15;
const MAX_HEADING_LINE = 60;

export function scoreKeyFactsBox(content: string): number {
  const lines = content.split("\n");

  const headingIdx = lines.findIndex((l) => /^## key facts/i.test(l));
  if (headingIdx === -1) return 0;

  // Compute frontmatter end so we don't count frontmatter lines
  const fmEndIdx = (() => {
    if (!lines[0]?.startsWith("---")) return 0;
    const end = lines.indexOf("---", 1);
    return end === -1 ? 0 : end + 1;
  })();

  if (headingIdx - fmEndIdx > MAX_HEADING_LINE) return 0;

  // Collect content lines of the Key Facts section
  const sectionLines: string[] = [];
  for (let i = headingIdx + 1; i < lines.length; i++) {
    if (/^## /.test(lines[i])) break;
    sectionLines.push(lines[i]);
  }

  const nonBlank = sectionLines.filter((l) => l.trim().length > 0);
  if (nonBlank.length > MAX_SECTION_LINES) return 0;

  const sectionText = sectionLines.join("\n").toLowerCase();
  const hits = REQUIRED_KEYWORDS.filter((kw) => sectionText.includes(kw)).length;
  if (hits < MIN_KEYWORD_HITS) return 0;

  return 1;
}
