import { evalite } from "evalite";
import { judgeTierDiscipline } from "../../scorers/judges/tier-discipline";
import { passRow, failRow } from "../../scorers/_fixtures";
import { isFullMode } from "../../scorers/_gate";

evalite("Ballot: Tier Discipline", {
  data: () =>
    isFullMode()
      ? [
          passRow("ballots/tier-discipline/pass.md"),
          failRow("ballots/tier-discipline/fail.md"),
        ]
      : [],
  task: (input) => judgeTierDiscipline(input.content),
  scorers: [
    {
      name: "Correct Classification",
      description: "1 when the judge correctly detected tier discipline status",
      scorer: ({ output, expected }) =>
        (output >= 0.5) === ((expected ?? 0) === 1) ? 1 : 0,
    },
  ],
});
