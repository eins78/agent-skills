import { evalite } from "evalite";
import { scoreReconciliationLocation } from "../../scorers/mechanical/reconciliation-location";
import { passRow, failRow } from "../../scorers/_fixtures";

evalite("Ballot: Reconciliation Location", {
  data: () => [
    passRow("ballots/reconciliation-location/pass.md"),
    failRow("ballots/reconciliation-location/fail.md"),
  ],
  task: (input) => scoreReconciliationLocation(input.content),
  scorers: [
    {
      name: "Correct Classification",
      description: "1 when the scorer correctly detected reconciliation location",
      scorer: ({ output, expected }) =>
        (output >= 0.5) === ((expected ?? 0) === 1) ? 1 : 0,
    },
  ],
});
