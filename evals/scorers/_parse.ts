/** Markdown parsing utilities for dossier + ballot scorers */

/** All H2 headings in document order */
export function getH2Headings(content: string): string[] {
  return content
    .split("\n")
    .flatMap((line) => {
      const m = line.match(/^## (.+)/);
      return m ? [m[1].trim()] : [];
    });
}

/** Text under a specific H2 heading (stops at next H2 or end of file) */
export function getSection(content: string, headingFragment: string): string | null {
  const lines = content.split("\n");
  let inSection = false;
  const out: string[] = [];
  for (const line of lines) {
    if (/^## /.test(line)) {
      if (inSection) break;
      if (line.toLowerCase().includes(headingFragment.toLowerCase())) {
        inSection = true;
        continue;
      }
    }
    if (inSection) out.push(line);
  }
  return inSection ? out.join("\n") : null;
}

/** All `[ref-xxx]` citation keys used in body text */
export function getCitationRefs(content: string): Set<string> {
  const refs = new Set<string>();
  for (const m of content.matchAll(/\[[^\]]*\]\[(ref-[^\]]+)\]/g)) {
    refs.add(m[1]);
  }
  return refs;
}

/** All `[ref-xxx]: https://...` definition keys */
export function getCitationDefs(content: string): Set<string> {
  const defs = new Set<string>();
  for (const m of content.matchAll(/^\[(ref-[^\]]+)\]:\s*https?:\/\//gm)) {
    defs.add(m[1]);
  }
  return defs;
}

/** Count `[text](url)` inline links in a text string */
export function countInlineLinks(text: string): number {
  return (text.match(/\[[^\]]+\]\(https?:\/\/[^)]+\)/g) ?? []).length;
}

/**
 * Split prose into approximate sentences.
 * Strips code blocks and inline code first so link-heavy code blocks
 * don't inflate the per-sentence link count.
 */
export function getSentences(content: string): string[] {
  const stripped = content
    .replace(/```[\s\S]*?```/g, "")
    .replace(/`[^`\n]+`/g, "");
  return stripped
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 10);
}

/** Lines before the first `## ` or `### DEC-` heading (the cover block) */
export function getCoverBlock(content: string): string[] {
  const lines = content.split("\n");
  const out: string[] = [];
  for (const line of lines) {
    if (/^## /.test(line) || /^### DEC-/i.test(line)) break;
    out.push(line);
  }
  return out;
}

/** All checkbox lines with their checked state */
export function getCheckboxLines(content: string): Array<{ checked: boolean; line: string }> {
  return content
    .split("\n")
    .flatMap((line) => {
      const m = line.match(/^- \[([ xX])\]/);
      if (!m) return [];
      return [{ checked: m[1] !== " ", line }];
    });
}
