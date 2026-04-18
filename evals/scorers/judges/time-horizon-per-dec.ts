import { judge } from "./_model";

const RUBRIC = `
Each DEC represents one decision surface on one time-horizon. Multi-selects don't mix
"launch-day" items with "next-year" items.

Red flags:
- A Must-tier DEC whose options include both "deploy this week" and "set up for Q3"
- Multi-select DECs with 8+ options (often a sign of conflated surfaces; should be split)
- A tier header with two time-horizons in one line ("Must — before launch or Q2")
`;

export async function judgeTimeHorizonPerDec(content: string): Promise<number> {
  return judge(`You are a ballot quality reviewer. Score the following ballot on "Time-Horizon-per-DEC".

CRITERION:
${RUBRIC}

Score 1.0 if each DEC cleanly covers one time-horizon with coherent options.
Score 0.0 if DECs mix time-horizons or have too many conflated options.
Score 0.5 if ambiguous.

Respond with ONLY a decimal number between 0 and 1, nothing else.

BALLOT:
${content}`);
}
