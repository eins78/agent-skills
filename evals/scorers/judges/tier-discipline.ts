import Anthropic from "@anthropic-ai/sdk";
import { JUDGE_MODEL } from "./_model";

const client = new Anthropic();

const RUBRIC = `
The Must / Should / Could assignment follows the meaning of the tiers:
- Must = blocks delivery
- Should = blocks if reviewers disagree (or if a single async decider flags dissent)
- Could = informational; the decider signals interest without committing

Red flags:
- Must tier containing 11 items (dilutes the "blocks delivery" meaning)
- Could tier empty (suggests everything was treated as equally critical — tiering didn't happen)
- A tier header like "Must — later this year" (time-horizon and urgency conflated)
`;

export async function judgeTierDiscipline(content: string): Promise<number> {
  const response = await client.messages.create({
    model: JUDGE_MODEL,
    max_tokens: 128,
    messages: [
      {
        role: "user",
        content: `You are a ballot quality reviewer. Score the following ballot on "Tier Discipline".

CRITERION:
${RUBRIC}

Score 1.0 if Must/Should/Could assignments correctly reflect delivery-blocking urgency.
Score 0.0 if tiers are misused (too many Must items, empty Could tier, time-horizon confusion).
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
