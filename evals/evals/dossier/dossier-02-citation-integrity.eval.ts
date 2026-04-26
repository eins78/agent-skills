import { evalite } from "evalite";
import { scoreCitationIntegrity } from "../../scorers/mechanical/citation-integrity";
import { passRow, failRow } from "../../scorers/_fixtures";

evalite("Dossier: Citation Integrity", {
  data: () => [
    passRow("dossiers/citation-integrity/pass.md"),
    failRow("dossiers/citation-integrity/fail.md"),
  ],
  task: (input) => scoreCitationIntegrity(input.content),
  scorers: [
    {
      name: "Correct Classification",
      description: "1 when the scorer correctly detected citation integrity status",
      scorer: ({ output, expected }) =>
        (output >= 0.5) === ((expected ?? 0) === 1) ? 1 : 0,
    },
  ],
});
