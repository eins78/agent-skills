import { evalite } from "evalite";
import { judgeSelectivity } from "../../scorers/judges/selectivity";
import { passRow, failRow } from "../../scorers/_fixtures";
import { isFullMode } from "../../scorers/_gate";

evalite("Dossier: Selectivity", {
  data: () =>
    isFullMode()
      ? [
          passRow("dossiers/selectivity/pass.md"),
          failRow("dossiers/selectivity/fail.md"),
        ]
      : [],
  task: (input) => judgeSelectivity(input.content),
  scorers: [
    {
      name: "Correct Classification",
      description: "1 when the judge correctly detected selectivity status",
      scorer: ({ output, expected }) =>
        (output >= 0.5) === ((expected ?? 0) === 1) ? 1 : 0,
    },
  ],
});
