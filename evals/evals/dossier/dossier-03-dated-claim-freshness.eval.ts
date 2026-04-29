import { evalite } from "evalite";
import { scoreDatedClaimFreshness } from "../../scorers/mechanical/dated-claim-freshness";
import { passRow, failRow } from "../../scorers/_fixtures";

evalite("Dossier: Dated-Claim Freshness", {
  data: () => [
    passRow("dossiers/dated-claim-freshness/pass.md"),
    failRow("dossiers/dated-claim-freshness/fail.md"),
  ],
  task: (input) => scoreDatedClaimFreshness(input.content),
  scorers: [
    {
      name: "Correct Classification",
      description: "1 when the scorer correctly detected dated-claim freshness status",
      scorer: ({ output, expected }) =>
        (output >= 0.5) === ((expected ?? 0) === 1) ? 1 : 0,
    },
  ],
});
