import { evalite } from "evalite";
import { judgeAsyncReadability } from "../../scorers/judges/async-readability";
import { passRow, failRow } from "../../scorers/_fixtures";
import { isFullMode } from "../../scorers/_gate";

evalite("Ballot: Async-Readability", {
  data: () =>
    isFullMode()
      ? [
          passRow("ballots/async-readability/pass.md"),
          failRow("ballots/async-readability/fail.md"),
        ]
      : [],
  task: (input) => judgeAsyncReadability(input.content),
  scorers: [
    {
      name: "Correct Classification",
      description: "1 when the judge correctly detected async-readability status",
      scorer: ({ output, expected }) =>
        (output >= 0.5) === ((expected ?? 0) === 1) ? 1 : 0,
    },
  ],
});
