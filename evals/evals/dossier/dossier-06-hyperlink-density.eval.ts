import { evalite } from "evalite";
import { scoreHyperlinkDensity } from "../../scorers/mechanical/hyperlink-density";
import { passRow, failRow } from "../../scorers/_fixtures";

evalite("Dossier: Hyperlink Density", {
  data: () => [
    passRow("dossiers/hyperlink-density/pass.md"),
    failRow("dossiers/hyperlink-density/fail.md"),
  ],
  task: (input) => scoreHyperlinkDensity(input.content),
  scorers: [
    {
      name: "Correct Classification",
      description: "1 when the scorer correctly detected hyperlink density",
      scorer: ({ output, expected }) =>
        (output >= 0.5) === ((expected ?? 0) === 1) ? 1 : 0,
    },
  ],
});
