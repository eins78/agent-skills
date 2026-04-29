import { evalite } from "evalite";
import { judgeSourceBiasFlagging } from "../../scorers/judges/source-bias-flagging";
import { passRow, failRow } from "../../scorers/_fixtures";
import { isFullMode } from "../../scorers/_gate";

evalite("Dossier: Source Bias Flagging", {
  data: () =>
    isFullMode()
      ? [
          passRow("dossiers/source-bias-flagging/pass.md"),
          failRow("dossiers/source-bias-flagging/fail.md"),
        ]
      : [],
  task: (input) => judgeSourceBiasFlagging(input.content),
  scorers: [
    {
      name: "Correct Classification",
      description: "1 when the judge correctly detected source bias flagging status",
      scorer: ({ output, expected }) =>
        (output >= 0.5) === ((expected ?? 0) === 1) ? 1 : 0,
    },
  ],
});
