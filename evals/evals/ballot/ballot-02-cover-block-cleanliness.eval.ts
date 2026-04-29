import { evalite } from "evalite";
import { scoreCoverBlockCleanliness } from "../../scorers/mechanical/cover-block-cleanliness";
import { passRow, failRow } from "../../scorers/_fixtures";

evalite("Ballot: Cover-Block Cleanliness", {
  data: () => [
    passRow("ballots/cover-block-cleanliness/pass.md"),
    failRow("ballots/cover-block-cleanliness/fail.md"),
  ],
  task: (input) => scoreCoverBlockCleanliness(input.content),
  scorers: [
    {
      name: "Correct Classification",
      description: "1 when the scorer correctly detected cover-block cleanliness",
      scorer: ({ output, expected }) =>
        (output >= 0.5) === ((expected ?? 0) === 1) ? 1 : 0,
    },
  ],
});
