---
"@eins78/agent-skills": minor
---

Introduce `ballot` skill (v1.0.0) and evolve `dossier` with a preflight gate, clickable citations, and reviewer checklists.

**`ballot` (new, v1.0.0).** Standalone per-reviewer decision-ballot skill for decisions that happen async — reviewed over chat, on a PR, on a train, after the session ends. Works for single-decider async and multi-reviewer panels alike; reviewer count is incidental to the trigger. Ships with template, conventions doc (one file per decider, empty checkboxes, no anti-options, Must/Should/Could tiers, reconciliation in sessionlog), and an 8-item reviewer checklist. One mechanical gate survives: `ballot-filename.sh` enforces the `DOSSIER-<slug>-BALLOT-<Reviewer>.md` naming pattern. Use cases: ADRs, architecture calls, hiring panels, vendor selection, household decisions, PR review handoffs.

**`dossier` (evolved).** Step-0 preflight gate — verify the research request is Specific, Unambiguous, and Well-understood; ask before starting if not. Balanced against over-interrogation: "the bar is 'the answer isn't obvious from context,' not 'I want to be extra sure.'" Key Facts box in the template (one screen: who decides, decision model, deadline, hard constraints, audience, 3–5 load-bearing claims). Clickable reference-link citations (`claim [S1][ref-S1]` with `[ref-S1]: url` defined in §Sources — renders as a click-through in GitHub, Obsidian, Bitbucket, and Confluence; backwards-compatible with bare `[Xn]`). Asymmetric template order: Glossary stays at the top (read-support), Sources stays at the end (trust-support). Commercial-bias source-flagging integrated into the reviewer checklist (pattern from the `@young.mete` Threads contribution). New 8-item reviewer checklist replaces the earlier grep-based audit hooks — those were overfit to the a11y-extension session and did not generalize across dossier styles.

**Hooks.** One mechanical gate (`ballot-filename.sh`), wired PostToolUse on Write|Edit through `dossier-hook-dispatcher.sh` (alerting level, not blocking — the file is on disk when the hook fires; PreToolUse upgrade is future work). Seven pattern-matching hooks that shipped during development were removed as overfit: `dossier-citation-audit.sh`, `dossier-forbidden-words.sh`, `dossier-section-order.sh`, `dossier-dated-claim-scan.sh`, `ballot-anti-option.sh`, `ballot-cover-archaeology.sh`, and `dossier-framing-declared.sh`. The `framing-mode` classification convention (`oss`/`commercial`/`hiring`/`vendor`/`personal`) was removed alongside the last hook — same anti-pattern as the grep gates. Replaced by judgment-capable reviewer checklists at `skills/dossier/references/review-checklist.md` and `skills/ballot/references/review-checklist.md`.

Minor bump for dossier (1.0.1 → 1.1.0); ballot ships directly at 1.0.0. Plugin minor bump. No breaking changes — existing `dossier` files remain valid; `[Xn]` citations still work but are not clickable until upgraded to `[Sn][ref-Sn]`.

<!--
bumps:
  skills:
    dossier: minor
-->
