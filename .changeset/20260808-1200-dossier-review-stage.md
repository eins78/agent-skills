---
"@eins78/agent-skills": minor
---

**`dossier`** — adds a REVIEW stage between SYNTHESIZE and DELIVER, run by three fresh-context subagents and enforced by a commit gate.

- **Why a stage and not a stronger instruction.** DELIVER already said to run the 12-item review checklist. That is a *rule* by the gates-over-rules test: "did I run it?" is answerable affirmatively without the work being done. It failed exactly that way — the author of review-checklist item 12 shipped a dossier violating item 12 about two hours after writing it. The README had recorded this limitation months earlier *and named this fix as the plan*; recording a limitation does not mitigate it.
- **The isolation is the mechanism, not the subagents.** Reviewers must not receive the research conversation. A defect survives its author because the author half-remembers the sources and the claim *feels* supported; a reviewer holding that reasoning inherits the feeling, while one holding only the document asks what the reader asks — was I shown the basis for this?
- **Three lenses with deliberately different inputs.** **Shape** (brief + dossier) judges genre, skimmability, order, Key Facts. **Support** (dossier + `sources/`) traces claims, with absence claims called out as their own category since they require having searched. **Insights** (dossier only) checks inversion, reachability, stance. The Insights lens is starved on purpose: give it `sources/` and it can verify a claim the document never cited, then pass something the reader cannot verify. Its blindness is why it catches stance.
- **The gate is PreToolUse on `git commit`.** `review-artifact-present.sh` requires a `review-YYYY-MM-DD.md` beside any staged main dossier, with every `### F<n>` finding carrying a `**Disposition:** fixed|waived — <reason>` line; `dossier-commit-gate.sh` is the Bash shim. PostToolUse on Write would be alerting-level (file already on disk) and fire on every edit during SYNTHESIZE — noise that trains the reader to ignore it. Commit is the delivery act, which makes it the one moment the check is both meaningful and rare.
- **No mtime freshness check, deliberately.** The obvious test — review newer than dossier — is inverted: the correct workflow is review → findings → fix, which leaves the dossier newer than the review every time. Such a gate would fire on every properly-executed review and pass only when nothing was changed. Staleness (>14 days) warns instead.
- **Waiving is a first-class outcome.** A fresh-context reviewer will sometimes flag a correctly-cited claim it could not verify — the direct cost of the isolation that makes it useful. The gate requires a decision, not agreement.

Legitimate under the skill's own criterion: like the two surviving hooks and unlike the six removed in 2026-04, this gate checks a file-level fact and never greps document prose.

<!--
bumps:
  skills:
    dossier: minor
-->
