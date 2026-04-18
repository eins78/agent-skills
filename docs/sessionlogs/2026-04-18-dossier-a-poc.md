# Sessionlog — Dossier Pitch A POC

**Date:** 2026-04-18
**Branch:** `dossier-a-poc` (worktree local: `worktree-dossier-a-poc`)
**Based on:** `origin/dossier-skill-pitch` @ `8bec6a6`
**Session type:** Autonomous, single-turn-in single-turn-out. User present only at session start for brief.

## Goal

Build Pitch A as a real POC, then critically review it against the 11 failure modes the pitch claimed to address. The assessment is the real deliverable; implementation is scaffold.

## What was built

- **4 modified files.** `skills/dossier/SKILL.md` 99 → 156 lines. `templates/dossier.md` 151 → 187 (added Key Facts box + section-order preservation comment + `framing-mode:` frontmatter). `README.md` 63 → 82. `.claude-plugin/plugin.json` + `hooks` key wiring the dispatcher.
- **6 shell scripts** in `.claude-plugin/hooks/`: citation-audit, forbidden-words, section-order, ballot-filename, dated-claim-scan, hook-dispatcher (routes PostToolUse events).
- **2 references** (`framing-modes.md`, `audit-checks.md`) + **1 new template** (`ballot-per-reviewer.md`).
- **1 changeset** with `<!-- bumps: skills: dossier: minor -->` → expected version bump 1.0.1 → 1.1.0.
- **1 assessment** (`docs/pitches/2026-04-18-pitch-A-assessment.md`, 212 lines): scorecard + weaknesses + Path B recommendations.

Total: 14 new/modified files; ~1,400 lines including assessment and sessionlog.

## Time

- Exploration + planning: ~20 min (3 parallel Explore agents; one Claude Code hooks Q&A agent; plan file write + ExitPlanMode).
- Shell scripts + test seeds: ~25 min.
- References + template + SKILL.md rewrite: ~35 min.
- Plugin.json wiring + dispatcher pattern + verifying PostToolUse JSON extraction: ~15 min.
- Assessment writing: ~25 min.
- Sessionlog + commits: ~10 min.
- **Total: ~2 hours**. Pitch estimated "1–2 focused days of work"; the POC came in well under because the assessment focuses on teaching, not polish.

## Surprises

1. **PostToolUse hooks don't block writes.** I assumed "gate" in the pitch meant "blocking". Claude Code's PostToolUse hooks fire *after* the write; exit 2 feeds stderr to the agent but the file is on disk. Pitch's "gate-capable YES" for citation integrity and forbidden-words is honest only if you accept alerting as a gate. This was the single most useful discovery of the session — it reshapes Path B's scope.
2. **The template's `{oss | commercial | hiring | vendor | personal}` placeholder broke the forbidden-words hook** on first run (exited "unknown mode"). Had to add placeholder-sentinel detection. A future schema-driven wordlist design would avoid this.
3. **Failure mode #11 (glossary at back) is really "template-is-right, execution strayed".** The current template had Key Concepts at the front all along. The a11y-extension artefact violated its own template. So the fix is a *preservation comment* on the template (explaining the asymmetry with Sources) plus a gate to catch drift, not a template restructure. The POC captures this; the pitch phrased it as "restructure template" which overstates the change.
4. **The per-reviewer template landed with embedded conventions** (header comment spells out anti-options, time-horizon, reconciliation, no-archaeology). This was not in the pitch's scope — emerged naturally while writing — and it's the cleanest output of the session because a delegate only reading the template sees the rules.
5. **Dated-claim regex was case-sensitive** on the first pass and missed "Released in 2022" because "Released" was capitalized. Fixed with `grep -iE`. Small bug, zero implications for the assessment — but a reminder that regex-based gates need explicit case handling per-pattern.

## What I'd do differently

1. **Ship the anti-option and cover-block greps.** Pitch said they were partial-gate-capable. I shipped rule-only in both cases. Each is ~15 lines of bash. Time pressure was the real reason — not a principled choice. Flagged in assessment §3.4.
2. **Skill-local wrapper for hook invocation examples.** SKILL.md instructs agents to run `bash ${CLAUDE_SKILL_DIR}/../../.claude-plugin/hooks/dossier-citation-audit.sh`. Relative-path assumption breaks under `postinstall` (skills copied to `~/.claude/skills/`). A `skills/dossier/scripts/audit.sh` wrapper that resolves the real hook path would fix it. Assessment §3.5.
3. **Single source of truth for wordlists.** `references/framing-modes.md` and `.claude-plugin/hooks/dossier-forbidden-words.sh` carry duplicate vocabulary. A YAML file consumed by both the script (via `yq`) and a markdown generator would eliminate drift. Assessment §3.3.
4. **Declare-framing gate.** If the agent skips §0 entirely, no `framing-mode:` frontmatter exists, and the forbidden-words gate exits 0 silently. A one-line check (`grep -q 'framing-mode:' <dossier>`) would catch the cheapest failure mode. I chose to leave it out; regret-flagged in §3.2.
5. **Decide alerting-vs-blocking up front.** Architecture gap became visible only after wiring. A pre-implementation check on Claude Code hooks would have surfaced this. Next time, verify runtime semantics (blocking or not) before choosing the vocabulary (gate vs alert).

## Verification performed

- `pnpm test` (skills CLI list): pass
- `pnpm run validate` (frontmatter audit): pass — "All skills valid (0 warning(s))"
- Each gate script against a seeded bad input: exits 1 with specific message
- Each gate script against a clean input: exits 0
- Dispatcher against mock PostToolUse JSON (clean / orphan / forbidden / non-dossier / template): behaves per design
- Template itself under all three body-scoped gates: passes (placeholder handling works)

## Non-goals observed

- Did not open a PR. `dossier-a-poc` branch is pushed to origin as learning reference.
- Did not modify PR #43 (`dossier-skill-pitch`).
- Did not implement Path B or C.
- Did not rename the skill.

## Next steps (for future Max or future session)

1. Read `docs/pitches/2026-04-18-pitch-A-assessment.md` §5. The scope recommendation for Path B differs from the original pitch — lighter skill, reuse of POC's template, two additional gates added, resolution of the alerting-vs-blocking question before writing code.
2. Decide Path B go/no-go. The POC teaches that Path A under-delivers on two specific gates (#5 anti-options, #9 cover archaeology) and the single-skill dossier can absorb those without a split. This weakens the "extract ballot" motivation somewhat.
3. If Path B is go: fix the three architectural issues (wordlist single-source-of-truth, alerting-vs-blocking stance, skill-local wrapper) before or during the split.
