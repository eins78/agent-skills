import { evalite } from "evalite";
import { judgePreflightEvidence } from "../../scorers/judges/preflight-evidence";
import { passRow, failRow } from "../../scorers/_fixtures";
import { isFullMode } from "../../scorers/_gate";

evalite("Dossier: Preflight Evidence", {
  data: () =>
    isFullMode()
      ? [
          passRow("dossiers/preflight-evidence/pass.md"),
          failRow("dossiers/preflight-evidence/fail.md"),
        ]
      : [],
  task: (input) => judgePreflightEvidence(input.content),
  scorers: [
    {
      name: "Correct Classification",
      description: "1 when the judge correctly detected preflight evidence status",
      scorer: ({ output, expected }) =>
        (output >= 0.5) === ((expected ?? 0) === 1) ? 1 : 0,
    },
  ],
});
