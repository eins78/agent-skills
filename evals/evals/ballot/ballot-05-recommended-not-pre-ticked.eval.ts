import { evalite } from "evalite";
import { scoreRecommendedNotPreTicked } from "../../scorers/mechanical/recommended-not-pre-ticked";
import { passRow, failRow } from "../../scorers/_fixtures";

evalite("Ballot: Recommended-Not-Pre-Ticked", {
  data: () => [
    passRow("ballots/recommended-not-pre-ticked/pass.md"),
    failRow("ballots/recommended-not-pre-ticked/fail.md"),
  ],
  task: (input) => scoreRecommendedNotPreTicked(input.content),
  scorers: [
    {
      name: "Correct Classification",
      description: "1 when the scorer correctly detected pre-ticked checkbox status",
      scorer: ({ output, expected }) =>
        (output >= 0.5) === ((expected ?? 0) === 1) ? 1 : 0,
    },
  ],
});
