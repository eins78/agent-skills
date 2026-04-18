import { evalite } from "evalite";
import { scoreAntiOptions } from "../../scorers/mechanical/anti-options";
import { passRow, failRow } from "../../scorers/_fixtures";

evalite("Ballot: Anti-Options", {
  data: () => [
    passRow("ballots/anti-options/pass.md"),
    passRow("ballots/anti-options/pass-with-justify.md"),
    failRow("ballots/anti-options/fail.md"),
  ],
  task: (input) => scoreAntiOptions(input.content),
  scorers: [
    {
      name: "Correct Classification",
      description: "1 when the scorer correctly detected anti-option presence",
      scorer: ({ output, expected }) =>
        (output >= 0.5) === ((expected ?? 0) === 1) ? 1 : 0,
    },
  ],
});
