import { evalite } from "evalite";
import { scoreKeyFactsBox } from "../../scorers/mechanical/key-facts-box";
import { passRow, failRow } from "../../scorers/_fixtures";

evalite("Dossier: Key Facts Box", {
  data: () => [
    passRow("dossiers/key-facts-box/pass.md"),
    failRow("dossiers/key-facts-box/fail.md"),
  ],
  task: (input) => scoreKeyFactsBox(input.content),
  scorers: [
    {
      name: "Correct Classification",
      description: "1 when the scorer correctly detected Key Facts box presence/quality",
      scorer: ({ output, expected }) =>
        (output >= 0.5) === ((expected ?? 0) === 1) ? 1 : 0,
    },
  ],
});
