/**
 * Ballot checklist item 3 — Anti-Options.
 * Forbidden phrases ("not recommended", "for completeness", etc.) must each
 * have a <!-- justify: comment within ±2 lines.
 */
const ANTI_OPTION_PHRASES = [
  "not recommended",
  "for completeness",
  "obviously wrong",
  "maintenance trap",
  "if you insist",
];

const JUSTIFY_RE = /<!--\s*justify:/i;

export function scoreAntiOptions(content: string): number {
  const lines = content.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const lineLower = lines[i].toLowerCase();
    if (ANTI_OPTION_PHRASES.some((p) => lineLower.includes(p))) {
      const windowStart = Math.max(0, i - 2);
      const windowEnd = Math.min(lines.length, i + 3);
      const window = lines.slice(windowStart, windowEnd).join("\n");
      if (!JUSTIFY_RE.test(window)) return 0;
    }
  }
  return 1;
}
