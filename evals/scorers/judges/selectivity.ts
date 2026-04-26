import { judge } from "./_model";

const RUBRIC = `
The dossier answers the decision(s) it was commissioned for, not every adjacent question
the research turned up. Scope expansions during research are called out and justified.

Red flags:
- §Recommendations is 200 lines; §Further Reading is 400 lines
- A §Related Technologies section whose items aren't referenced in §Recommendations
- An §Appendix that is deeper than the main body
- Three parallel recommendations when the commissioning question had one decider axis
`;

export async function judgeSelectivity(content: string): Promise<number> {
  return judge(`You are a dossier quality reviewer. Score the following dossier on "Selectivity".

CRITERION:
${RUBRIC}

Score 1.0 if the dossier stays tightly scoped to the question it was commissioned for.
Score 0.0 if the dossier covers excessive adjacent topics and recommendations don't map to requirements.
Score 0.5 if ambiguous.

Respond with ONLY a decimal number between 0 and 1, nothing else.

DOSSIER:
${content}`);
}
