import { evalite } from "evalite";
import { scoreFilenamePattern } from "../../scorers/mechanical/filename-pattern";
import { fixtureDocWithName, readFixture } from "../../scorers/_fixtures";

evalite("Ballot: Filename Pattern", {
  data: () => [
    // Filename is what matters here; content is a minimal ballot body
    {
      input: fixtureDocWithName("ballots/filename-pattern/pass.md", "DOSSIER-A11y-BALLOT-Max.md"),
      expected: 1 as const,
    },
    {
      input: fixtureDocWithName("ballots/filename-pattern/fail.md", "ballot-draft.md"),
      expected: 0 as const,
    },
    {
      input: fixtureDocWithName("ballots/filename-pattern/fail-lowercase.md", "DOSSIER-a11y-BALLOT-max.md"),
      expected: 0 as const,
    },
  ],
  task: (input) => scoreFilenamePattern(input),
  scorers: [
    {
      name: "Correct Classification",
      description: "1 when the scorer correctly classified the ballot filename",
      scorer: ({ output, expected }) =>
        (output >= 0.5) === ((expected ?? 0) === 1) ? 1 : 0,
    },
  ],
});
