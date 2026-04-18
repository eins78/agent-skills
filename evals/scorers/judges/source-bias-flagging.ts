import { judge } from "./_model";

const RUBRIC = `
Commercially-motivated sources (vendor blogs, sponsored benchmarks, affiliate comparisons,
press releases) are flagged in §Sources or adjacent annotations. If most evidence comes from
sources with financial motivation, the §Executive Summary calls this out explicitly.

Red flags:
- §Sources is a flat list of URLs, 7+ of which are the vendor's own domain, with no annotation
- A comparison table whose "Pros" column matches the vendor's marketing page almost verbatim
- Silent reliance on one comparison article that turns out to be sponsored
- Affiliate links in body text without disclosure
`;

export async function judgeSourceBiasFlagging(content: string): Promise<number> {
  return judge(`You are a dossier quality reviewer. Score the following dossier on "Source Bias Flagging".

CRITERION:
${RUBRIC}

Score 1.0 if vendor/commercial sources are annotated OR the dossier has balanced sources.
Score 0.0 if vendor bias is present but unacknowledged.
Score 0.5 if ambiguous.

Respond with ONLY a decimal number between 0 and 1, nothing else.

DOSSIER:
${content}`);
}
