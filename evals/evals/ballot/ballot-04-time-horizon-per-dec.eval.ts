import { evalite } from "evalite";
import { judgeTimeHorizonPerDec } from "../../scorers/judges/time-horizon-per-dec";
import { passRow, failRow } from "../../scorers/_fixtures";
import { isFullMode } from "../../scorers/_gate";

evalite("Ballot: Time-Horizon-per-DEC", {
  data: () =>
    isFullMode()
      ? [
          passRow("ballots/time-horizon-per-dec/pass.md"),
          failRow("ballots/time-horizon-per-dec/fail.md"),
        ]
      : [],
  task: (input) => judgeTimeHorizonPerDec(input.content),
  scorers: [
    {
      name: "Correct Classification",
      description: "1 when the judge correctly detected time-horizon-per-DEC status",
      scorer: ({ output, expected }) =>
        (output >= 0.5) === ((expected ?? 0) === 1) ? 1 : 0,
    },
  ],
});
