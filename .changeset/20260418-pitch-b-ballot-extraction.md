---
"@eins78/agent-skills": minor
---

Extract `ballot` skill; close three Pitch A gaps; consolidate framing-mode wordlists (Path B from `docs/pitches/2026-04-18-dossier-skill-evolution.md`; assessment: `docs/pitches/2026-04-18-pitch-A-assessment.md`):

- **New `ballot` skill** (v1.0.0) — per-reviewer decision ballots for contested decisions. Template moved from `skills/dossier/templates/`; conventions captured in `skills/ballot/SKILL.md` and `references/ballot-conventions.md`. Standalone for ADRs, architecture calls, hiring panels, vendor selection, household decisions; `dossier` cross-references it.
- **Two new ballot gates**: `ballot-anti-option.sh` (options labelled "not recommended" / "for completeness" / etc. require a `<!-- justify: ... -->` comment) and `ballot-cover-archaeology.sh` (cover blocks may not contain "updated YYYY-MM-DD" or changelog text). Closes assessment §3.4.
- **Framing-declared gate** (`dossier-framing-declared.sh`) — a non-ballot `DOSSIER-*.md` without a `framing-mode:` declaration fails the gate. Closes the silent-skip documented in assessment §3.2 (missing declaration bypassed all vocabulary enforcement).
- **Wordlist single source of truth** — `skills/dossier/references/framing-modes.yaml` is the canonical per-mode forbidden-word list, consumed by `dossier-forbidden-words.sh` via `yq` (mikefarah v4). Closes assessment §3.3.
- **Citation-audit no-op warning** — zero-`[Xn]`-ref dossiers now emit a stderr warning (exit 0); prompts the author to confirm inline-hyperlink-only was deliberate. Closes assessment §6 ambiguity #6.
- **Six delegate-ambiguity fixes** in `dossier` SKILL.md per assessment §6 — decision-model examples per axis, audience format specified, manual-invocation commands dropped (PostToolUse auto-fires), framing-mode declaration single-sourced (frontmatter only), Must-tier softened to prose rule with sessionlog-flag-if-blocked consequence, citation no-op documented.
- **Hook rename**: `dossier-ballot-filename.sh` → `ballot-filename.sh`. Ballot is standalone; the dossier-prefix was misleading. Dispatcher routes ballot files (`DOSSIER-*BALLOT*.md`) to `ballot-*.sh` and main dossiers to `dossier-*.sh`.
- **Template-placeholder pattern** documented in `references/framing-modes.md` — hooks that read `framing-mode:` from template files must skip brace- or pipe-containing values.
- **Reading-time trim** — dossier SKILL.md Common Mistakes table drops 6 ballot-specific rows (now in ballot skill); template section-order comment reduced from 14 to 4 lines; framing-modes.md embedded wordlists replaced by pointers to YAML.

Hooks remain `PostToolUse`-alerting; PreToolUse upgrade is documented future work (see `skills/ballot/references/ballot-conventions.md` §Gate rigor levels).

<!--
bumps:
  skills:
    dossier: minor
-->
