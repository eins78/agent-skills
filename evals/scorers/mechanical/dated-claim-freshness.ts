/**
 * Dossier checklist item 3 — Dated-Claim Freshness.
 * Event-context dates (closes, deadline, released, ends, due) must not be
 * more than 30 days before the production date in YAML frontmatter.
 */

const MONTH_NUMS: Record<string, string> = {
  january: "01", jan: "01", february: "02", feb: "02", march: "03", mar: "03",
  april: "04", apr: "04", may: "05", june: "06", jun: "06", july: "07", jul: "07",
  august: "08", aug: "08", september: "09", sep: "09", october: "10", oct: "10",
  november: "11", nov: "11", december: "12", dec: "12",
};

function parseEventDate(str: string): Date | null {
  // ISO YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    const d = new Date(str);
    return isNaN(d.getTime()) ? null : d;
  }
  // "DD Month YYYY" or "DD Mon YYYY"
  const dmyMatch = str.trim().match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/);
  if (dmyMatch) {
    const m = MONTH_NUMS[dmyMatch[2].toLowerCase()];
    if (m) {
      const d = new Date(`${dmyMatch[3]}-${m}-${dmyMatch[1].padStart(2, "0")}`);
      return isNaN(d.getTime()) ? null : d;
    }
  }
  // "Month DD, YYYY" or "Month DD YYYY"
  const mdyMatch = str.trim().match(/^([A-Za-z]+)\s+(\d{1,2})[,\s]+(\d{4})$/);
  if (mdyMatch) {
    const m = MONTH_NUMS[mdyMatch[1].toLowerCase()];
    if (m) {
      const d = new Date(`${mdyMatch[3]}-${m}-${mdyMatch[2].padStart(2, "0")}`);
      return isNaN(d.getTime()) ? null : d;
    }
  }
  return null;
}

export function scoreDatedClaimFreshness(content: string): number {
  const frontmatterDate = content.match(/^---[\s\S]*?^date:\s*(\d{4}-\d{2}-\d{2})/m)?.[1];
  const productionDate = frontmatterDate ? new Date(frontmatterDate) : new Date();

  const cutoff = new Date(productionDate);
  cutoff.setDate(cutoff.getDate() - 30);

  const eventDateRe =
    /(?:closes?\s+|deadline[:\s]+|by\s+|release[ds]?\s+|ends?\s+|due\s+)(\d{4}-\d{2}-\d{2}|\d{1,2}\s+\w+\s+\d{4}|\w+\s+\d{1,2}[,\s]+\d{4})/gi;

  for (const match of content.matchAll(eventDateRe)) {
    const parsed = parseEventDate(match[1]);
    if (parsed && parsed < cutoff) return 0;
  }
  return 1;
}
