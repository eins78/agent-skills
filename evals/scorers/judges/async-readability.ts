import Anthropic from "@anthropic-ai/sdk";
import { JUDGE_MODEL } from "./_model";

const client = new Anthropic();

const RUBRIC = `
The ballot reads sensibly to the decider seeing it cold, 12 hours after handoff, on a phone.
Single-screen cover block. DEC questions are full sentences, not token names. Options are
recognizable without the parent dossier open.

Red flags:
- A DEC heading that reads "DEC-004 — MOR vs DYI" (unexplained abbreviation)
- An option like "- [ ] Option A" with no further description
- Cover block with a dossier link that 404s or requires auth the decider doesn't have
- Body text that references "the chart above" or "as shown in §4" (breaks if read in isolation)
`;

export async function judgeAsyncReadability(content: string): Promise<number> {
  const response = await client.messages.create({
    model: JUDGE_MODEL,
    max_tokens: 128,
    messages: [
      {
        role: "user",
        content: `You are a ballot quality reviewer. Score the following ballot on "Async-Readability".

CRITERION:
${RUBRIC}

Score 1.0 if the ballot is self-contained and readable cold without the parent dossier.
Score 0.0 if DEC questions or options are incomprehensible without additional context.
Score 0.5 if ambiguous.

Respond with ONLY a decimal number between 0 and 1, nothing else.

BALLOT:
${content}`,
      },
    ],
  });

  const text = response.content[0]?.type === "text" ? response.content[0].text.trim() : "0";
  const score = parseFloat(text);
  return isNaN(score) ? 0 : Math.min(1, Math.max(0, score));
}
