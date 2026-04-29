import { evalite } from "evalite";
import { scoreSectionOrdering } from "../../scorers/mechanical/section-ordering";
import { passRow, failRow } from "../../scorers/_fixtures";

evalite("Dossier: Section Ordering", {
  data: () => [
    passRow("dossiers/section-ordering/pass.md"),
    failRow("dossiers/section-ordering/fail.md"),
  ],
  task: (input) => scoreSectionOrdering(input.content),
  scorers: [
    {
      name: "Correct Classification",
      description: "1 when the scorer correctly detected section ordering",
      scorer: ({ output, expected }) =>
        (output >= 0.5) === ((expected ?? 0) === 1) ? 1 : 0,
    },
  ],
});
