import { judge } from "./_model";

const RUBRIC = `
Is there evidence the preflight ran? Either (a) the sessionlog or commit message states
the objective back to the operator in concrete terms, or (b) the dossier's Executive Summary
is crisp and specific enough that you can tell the agent understood the ask without hedging.

Red flags:
- §Executive Summary opens with scope hedging ("this dossier explores the broad space of…")
- The dossier covers adjacent topics the operator didn't ask about, with no explanation of why
- §Recommendations answers a different question than the one scoped in §Key Facts
`;

export async function judgePreflightEvidence(content: string): Promise<number> {
  return judge(`You are a dossier quality reviewer. Score the following dossier on "Preflight Evidence".

CRITERION:
${RUBRIC}

Score 1.0 if the dossier clearly shows preflight evidence (crisp objective, bounded scope).
Score 0.0 if the dossier lacks evidence of preflight (hedging, scope drift, wrong question answered).
Score 0.5 if ambiguous.

Respond with ONLY a decimal number between 0 and 1, nothing else.

DOSSIER:
${content}`);
}
