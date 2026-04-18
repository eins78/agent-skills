# Sessionlog — Pitch B implementation (ballot skill extraction)

**Date:** 2026-04-18
**Branch:** `worktree-dossier-b-impl` off `origin/dossier-skill-pitch`
**Scope:** PR #43 — add Path B on top of existing pitch + A + assessment
**Mode:** Autonomous implementation after plan approval

## Summary

Extracted `ballot` as a standalone skill, moved the per-reviewer ballot template, added two ballot audit hooks (anti-option, cover-archaeology), added `dossier-framing-declared` gate, consolidated forbidden-word lists into `framing-modes.yaml` consumed via `yq`, and fixed the six delegate ambiguities identified in the Pitch A assessment §6. 7 logical commits; validation passes; all hooks tested with seeded-bad and seeded-clean inputs.

## Decisions made

| # | Decision | Rationale |
|---|---|---|
| D1 | Skill name = `ballot` | Matches Quatico sales-hub precedent; short; Max already uses it. |
| D2 | Rename `dossier-ballot-filename.sh` → `ballot-filename.sh` | Ballot is standalone; dossier-prefix was misleading. Honest naming. |
| D3 | Keep single dispatcher, route by filename pattern | Existing `dossier-hook-dispatcher.sh` already branches on `*BALLOT*`; extending was one-line change vs. a separate dispatcher. No `plugin.json` wiring change needed. |
| D4 | Wordlist SSOT via YAML + `yq` | Two-location duplication (assessment §3.3) was inevitable drift. `yq v4` is on the house toolchain (homebrew). |
| D5 | Ship `dossier-framing-declared.sh` | One-liner bash; closes §3.2 declaration-vs-consequence split. |
| D6 | Drop manual-invocation commands from SKILL.md | Fixes §3.5 fragile paths. PostToolUse auto-fire covers the audit; docs now point to §Gates section only. |
| D7 | Citation no-op → stderr warning, exit 0 | Soft signal; cheapest disambiguation of assessment §6 ambiguity #6. |
| D8 | Must-tier "blocks delivery" → prose rule, not gate | Parsing ballot state (final vs. draft) to detect unticked Musts is too fragile; requires reconstructing reviewer intent. Deferred; flag in sessionlog if blocked. |
| D9 | Use cases inline in ballot SKILL.md | 5 scenarios × 2-3 lines each = 14 lines. Fits under 130-line target. |
| D10 | Template-placeholder handling documented in `framing-modes.md` | Wordlist-adjacent; lowest-cost home. Also added an explicit callout in `skills/ballot/references/ballot-conventions.md` §Template placeholder handling. |
| D11 | 6 logical commits (+ 1 for sessionlog) — no squash | Max's recommendation; easier to review piecewise. Commits: rename → extract → hooks → YAML SSOT → trim+fix → plumbing → sessionlog. |
| D12 | Push worktree branch → FF-merge into `dossier-skill-pitch` → push | Brief's git strategy; PR #43 picks up automatically; no new PR, no merge to main. |
| D13 | Drop "three prose lines" frontmatter duplication | One source of truth. Prose lines (decision model, audience) live in the Key Facts box where readers already look; frontmatter serves the gate only. |
| D14 | "Audience" as prose line in Key Facts, not frontmatter field | Aligns with reader-facing purpose; not a machine-readable field. Template has an Audience row added to the Key Facts table. |
| D15 | Initial ballot version `1.0.0` set directly; omit ballot from changeset `bumps:` block | Per memory note — `bump-skill-versions.sh` cannot produce an exact base version from nothing. |

## Deviations from the plan

- **framing-modes.md trim** — plan estimated ~30 lines saved; actual ~17 lines (122 → 105). Kept per-mode `When to use` + `Typical section emphasis` + one example framing per mode as human-readable documentation. Dropping more would have made the file a thin pointer to the YAML; current balance is better.
- **SKILL.md line count** — plan target was ~120 lines; dossier SKILL.md lands at 139 lines. The difference is in the Gates table and Common Mistakes table — both grew slightly when fixing ambiguities (new rows for framing-declared, citation no-op). Trade-off felt right.
- **No standalone `references/use-cases.md`** — plan left this optional. Use cases are 5 × 2-3 lines; inlined in SKILL.md under a `## Use Cases` section.

## Hook test matrix

All tests run against `/tmp/hook-test/DOSSIER-*.md` seed files with the dispatcher receiving a JSON payload via stdin:

```bash
echo '{"tool_input":{"file_path":"/tmp/hook-test/DOSSIER-X.md"}}' | bash .claude-plugin/hooks/dossier-hook-dispatcher.sh
```

| Hook | Seeded-bad input | Bad exit | Seeded-clean input | Clean exit |
|---|---|:-:|---|:-:|
| `ballot-filename.sh` | `DOSSIER-Test-BALLOT.md` (no reviewer) | 1 | `DOSSIER-Test-BALLOT-Max.md` | 0 |
| `ballot-anti-option.sh` | `- [ ] Option B (not recommended)` in a DEC, no `<!-- justify -->` | 1 | Same row with `<!-- justify: ... -->` 3 lines later | 0 |
| `ballot-cover-archaeology.sh` | `**Updated:** 2026-04-18 — added DEC-005` in cover | 1 | Clean reviewer/role/peer/dossier cover block | 0 |
| `dossier-framing-declared.sh` | `DOSSIER-X.md` with no `framing-mode:` frontmatter | 1 | `framing-mode: oss` in frontmatter | 0 |
| `dossier-forbidden-words.sh` (YAML-backed) | `framing-mode: oss` + "revenue" in body | 1 | `framing-mode: oss`, community-themed body | 0 |
| `dossier-forbidden-words.sh` (placeholder) | `framing-mode: {oss \| commercial \| ...}` (template) | 0 (skipped) | — | — |
| `dossier-forbidden-words.sh` (unknown mode) | `framing-mode: bogus` | 2 | — | — |
| `dossier-citation-audit.sh` (no refs) | dossier with zero `[Xn]` refs | 0 + warning | dossier with matched `[X1]` + §Sources `[X1]` def | 0 silent |

Dispatcher end-to-end (5 paths): all routed correctly, aggregate exit 2 when any sub-check fails, exit 0 when all pass.

Regex bugs caught in testing and fixed in-session:
- `ballot-anti-option.sh` initial pattern used BRE alternation (`\|`) inside an ERE grep (`-E`). Fixed to ERE syntax (`|`). Seeded-bad then correctly exit 1.
- `ballot-cover-archaeology.sh` `updated [0-9]{4}...` required a literal space before the date; failed to match `**Updated:** 2026-04-18`. Widened to `updated[^a-z]*[0-9]{4}...` — matches the colon + whitespace between `updated` and the date.

## What didn't ship and why

- **PreToolUse rigor upgrade** — documented as future work in both `skills/ballot/SKILL.md` §Gates and `skills/ballot/references/ballot-conventions.md` §Gate rigor levels. Cost ~3× the PostToolUse implementation plus per-tool content parsing. Cheapest candidate: `ballot-filename.sh` since filename is in `tool_input.file_path` before write.
- **Must-tier blocker hook** — too fragile. Detecting "final-status ballot with unticked Must" would require parsing reviewer delivery intent. Kept as prose rule with "flag in sessionlog if blocked" consequence.
- **`dossier` → `research-dossier` rename** — pitch Q3 recommendation stood (keep). Not in B's scope.
- **Path C** (three-way research split) — both pitch and assessment §5 said defer.
- **Per-use-case ballot templates** (hiring, vendor, ADR variants) — noted in `skills/ballot/README.md` §Planned Improvements. Current use cases are in SKILL.md as text sketches, which is sufficient for the a11y-session audience.

## Files touched

**New (9):**
- `skills/ballot/SKILL.md` (107 lines)
- `skills/ballot/README.md` (76 lines)
- `skills/ballot/references/ballot-conventions.md` (118 lines)
- `skills/ballot/templates/ballot-per-reviewer.md` (moved from dossier; header trimmed from 26 to 6 lines)
- `.claude-plugin/hooks/ballot-anti-option.sh` (57 lines)
- `.claude-plugin/hooks/ballot-cover-archaeology.sh` (62 lines)
- `.claude-plugin/hooks/dossier-framing-declared.sh` (53 lines)
- `skills/dossier/references/framing-modes.yaml` (62 lines)
- `.changeset/20260418-pitch-b-ballot-extraction.md` (23 lines)
- `docs/sessionlogs/2026-04-18-pitch-b-impl.md` (this file)

**Modified (9):**
- `skills/dossier/SKILL.md` (156 → 139 lines; ballot section removed, decision-model split to 3 axes, manual-invocation dropped, gates table updated)
- `skills/dossier/README.md` (92 lines; Path B refactor note, updated known-gaps, updated testing scenarios)
- `skills/dossier/templates/dossier.md` (180 lines; section-order comment trimmed 14→4, Audience row added to Key Facts)
- `skills/dossier/references/framing-modes.md` (122 → 105 lines; wordlists → pointers to YAML, template-placeholder section added)
- `skills/dossier/references/audit-checks.md` (74 lines; rewritten to reflect renamed hooks + YAML wordlist + alerting level)
- `.claude-plugin/hooks/dossier-hook-dispatcher.sh` (74 lines; added framing-declared + 2 ballot hooks to routing)
- `.claude-plugin/hooks/dossier-forbidden-words.sh` (102 lines; bash arrays → yq-backed lookup)
- `.claude-plugin/hooks/dossier-citation-audit.sh` (54 lines; stderr warning on zero-`[Xn]` case)
- `.claude-plugin/marketplace.json` (+10 lines; ballot entry)
- `README.md` (+1 line; ballot row in skills table)

**Renamed (1):**
- `.claude-plugin/hooks/dossier-ballot-filename.sh` → `.claude-plugin/hooks/ballot-filename.sh`

## Reading-time estimate for Max

Assessment §7 measured Path A at ~14 min scan / ~30 min careful read across 5 artefacts.

Post-B estimate (both skills combined):

| Artefact | Lines | Scan (min) | Careful read (min) |
|---|---|---|---|
| `skills/dossier/SKILL.md` | 139 | 3 | 8 |
| `skills/ballot/SKILL.md` | 107 | 3 | 7 |
| `skills/ballot/README.md` | 76 | 1 | 3 |
| `skills/dossier/README.md` | 92 | 2 | 4 |
| `skills/ballot/references/ballot-conventions.md` | 118 | 2 | 6 |
| `skills/dossier/references/framing-modes.md` | 105 | 2 | 5 |
| `skills/dossier/references/audit-checks.md` | 74 | 2 | 4 |
| **Total** | 711 | **15** | **37** |

Total raw line count rose (672 → 711), but coverage is now split across two coherent skills instead of one oversized one. Scan-time target <10 min is still missed, but the skills are now decomposed — a reader touching only ballot skips the dossier artefacts, and vice versa.

**Recommended reading path for Max (targets ~15 min):**
1. `docs/pitches/2026-04-18-pitch-A-assessment.md` §§3, 5, 6, 8 (already read in Session 1 — skim) — 3 min
2. `skills/ballot/SKILL.md` — 7 min
3. `skills/dossier/SKILL.md` (the delta from Path A) — 5 min
4. This sessionlog §Decisions + §Hook tests — 3 min

Total: ~18 min. The 37-min figure above is exhaustive reading; 18 min is "enough to approve".

## Zero-ambiguity re-read (delegate perspective)

After commit 5, re-read both SKILL.md files cold. Findings:

**`skills/ballot/SKILL.md`**: zero blocking ambiguities. Minor observations logged but none require a fix:
- `${CLAUDE_SKILL_DIR}/templates/...` env var is agent-context only; empty in a fresh shell. This is a read-reference pattern consistent with sibling skills (lab-notes, tracer-bullets). Acceptable.
- Hiring use case mentions "companion dossier" but a standalone hiring ballot may not have one. The §Standalone vs. Dossier-invoked section handles this explicitly. Acceptable.

**`skills/dossier/SKILL.md`**: zero blocking ambiguities. All six assessment-identified ambiguities closed:
1. Decision-model axes split into who/when/how with inline examples per axis.
2. Frontmatter `framing-mode:` is the single declaration; prose-line requirement removed.
3. Manual-invocation commands dropped; SKILL.md explains PostToolUse auto-fire.
4. Audience explicitly a prose line in Key Facts box; template has the row.
5. Must-tier softened to prose rule with sessionlog-flag-if-blocked consequence; no gate shipped (fragility rationale documented in ballot-conventions.md).
6. Citation no-op warning in `dossier-citation-audit.sh`; Common Mistakes table has a row.

## PR #43 update — next action

After this commit, I will:
1. Push `worktree-dossier-b-impl` to origin (optional staging push).
2. Fast-forward merge into local `dossier-skill-pitch`; push that branch.
3. `gh pr edit 43 --body-file /tmp/pr43-body.md` with the TL;DR / What shipped / What to review / Out of scope / Read time structure.

PR #43 then contains the full narrative: pitch → Pitch A POC → assessment → Pitch B implementation.
