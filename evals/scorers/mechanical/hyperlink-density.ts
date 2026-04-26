import { getSentences, countInlineLinks } from "../_parse";

/**
 * Dossier checklist item 6 — Hyperlink Density.
 * No sentence may contain more than 3 inline [text](url) links.
 */
const MAX_LINKS_PER_SENTENCE = 3;

export function scoreHyperlinkDensity(content: string): number {
  const sentences = getSentences(content);
  for (const sentence of sentences) {
    if (countInlineLinks(sentence) > MAX_LINKS_PER_SENTENCE) return 0;
  }
  return 1;
}
