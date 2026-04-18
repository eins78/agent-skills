# Dossier Skill — Development Documentation

## Purpose

Structured research workflow producing actionable reports with ranked recommendations, cited sources, and optional decision ballots. Codifies a pattern used 16+ times since January 2026.

**Tier:** Published (beta) — available in the [eins78/agent-skills](https://github.com/eins78/agent-skills) plugin

## Provenance

Extracted from validated research artifacts across multiple domains:
- **Auth solution evaluation:** 7 products, 9 weighted requirements, phased migration plan, categorized sources (official, community, articles, blogs, podcasts, repos)
- **URL shortener research:** 12+ products in tiered format
- **Customer portal research:** /last30days + 40+ WebSearch pages
- **Sprint retrospective synthesis:** 4 detailed sub-reports
- 10+ additional research sessions (Japan travel, Grafana plugins, AI code review, MeteoSwiss, etc.)

**Path A extension (2026-04-18).** Extended per Pitch A in `docs/pitches/2026-04-18-dossier-skill-evolution.md`, with FRAME phase, Key Facts box, four enforcement hooks, per-reviewer ballot template, and framing-mode wordlists. Addresses 11 failure modes observed in the `heading-outline-extension` dossier session (2026-04-17 / 2026-04-18).

**Path B refactor (2026-04-18).** Ballot conventions and template extracted into a standalone `ballot` skill — see `skills/ballot/`. The dossier SKILL now cross-references ballot; the per-reviewer template moved from `skills/dossier/templates/` to `skills/ballot/templates/`. Wordlists consolidated into `references/framing-modes.yaml` (single source of truth, consumed by the gate via yq). Added `dossier-framing-declared` gate (closes the declaration-vs-consequence split) and citation-audit no-op warning. Rationale: `docs/pitches/2026-04-18-pitch-A-assessment.md` §§3, 5, 6.

**Post-review polish (2026-04-18).** Six overfit grep hooks removed (citation-audit, forbidden-words, section-order, dated-claim-scan, ballot-anti-option, ballot-cover-archaeology); two mechanical hooks kept (`dossier-framing-declared`, `ballot-filename`). The removed hooks encoded a11y-session-specific patterns that didn't generalize across dossier styles. Replaced by `references/review-checklist.md` — a reviewer-facing audit doc that generalizes the concerns. `framing-modes.yaml` and `audit-checks.md` were deleted as orphaned; `framing-modes.md` temporarily retained mode-selection guidance (removed in the preflight-gate pass below).

**Preflight gate (2026-04-18).** `dossier-framing-declared.sh` and `framing-modes.md` removed — the framing-mode convention (`oss`/`commercial`/`hiring`/`vendor`/`personal`) was over-specific, same anti-pattern as the six deleted grep hooks. Replaced the `### 0. FRAME` step with a three-check preflight gate (Specific / Unambiguous / Well-understood). Review-checklist item 1 swapped from "framing coherence" to "preflight evidence".

## Design Influences

- **[last30days](https://github.com/ScrapCreators/last30days-skill):** Parallel source dispatch + judge synthesis pass. Adapted: per-topic agent design instead of fixed 10+ platform roster.
- **[Claude Code ultraplan](https://code.claude.com/docs/en/claude-code-on-the-web):** Extended autonomous thinking for deep tasks. Adapted: monolithic synthesis pass for complex dossiers.
- **[writing-skills](https://github.com/anthropics/superpowers):** TDD for documentation, CSO (Claude Search Optimization), token efficiency.

## File Structure

```
dossier/
├── SKILL.md                          # Main skill
├── README.md                         # This file
├── references/
│   ├── sources-by-domain.md          # Domain → source mapping (13 domains)
│   └── review-checklist.md           # Reviewer audit checklist (8 items)
└── templates/
    └── dossier.md                    # Report template with REQUIRED/OPTIONAL sections
                                      # (ballot template moved to skills/ballot/)

# Hooks (repo-level, wired in .claude-plugin/plugin.json via dossier-hook-dispatcher.sh):
.claude-plugin/hooks/
├── ballot-filename.sh                # Gate: per-reviewer ballot naming (owned by skills/ballot)
└── dossier-hook-dispatcher.sh        # Argv/stdin shim — extracts file_path from PostToolUse JSON and invokes ballot-filename.sh
```

## Dependencies

**Required:** WebSearch, WebFetch (built into Claude Code)
**Optional:** last30days skill (for social signal), commit-notation skill (for commit messages)

## Testing

To verify the skill works:

1. **Trigger test:** Say "research the best X" or "compare A vs B" — the skill should load
2. **Preflight test:** Give an ambiguous request ("look into the AI space") — the skill should ask for clarification before starting research
3. **Template test:** Check that a produced dossier includes all REQUIRED sections (Key Facts, Key Concepts, Management Summary, Evaluations, Sources)
4. **Ballot filename gate:** Write a file named `DOSSIER-Test-BALLOT.md` (no reviewer) — the `ballot-filename.sh` hook fires, stderr reports the pattern mismatch, exit code 2.
5. **Review-checklist pass:** After delivering a dossier, walk through `references/review-checklist.md` — each of the 8 items should be actionable against the finished dossier.
6. **Ballot test:** Ask for a comparison requiring a decision — verify the `ballot` skill's per-reviewer template is used.
7. **Session test:** After dossier delivery, ask a follow-up question — verify session stays open.

## Known Gaps

- **Alerting-level gate.** PostToolUse fires *after* file write; exit 2 feeds stderr back to Claude but a motivated agent can ignore. Only one gate remains (`ballot-filename.sh`) after the polish and preflight passes removed the other six. PreToolUse rigor is documented future work; `ballot-filename.sh` is the cheapest upgrade candidate (filename is in `tool_input.file_path` before write).
- **Checklist discipline depends on the reviewer.** The review-checklist replaces 4 deleted grep hooks; its value depends on a judgement-capable reviewer actually running it. Agents under time pressure may skim. Planned: seed a subagent test scenario that runs the checklist.
- **Must-tier ballot gate deferred.** A hook that detects unticked Must items at delivery time would require parsing reviewer intent; too fragile. Kept as a prose rule in `skills/ballot/SKILL.md` — flag in sessionlog if blocked.
- **Source reference file** covers 13 domains — will grow with usage.
- **Template comments** (REQUIRED/OPTIONAL markers) need to be stripped from final output.
- **Hook routing scope.** Wiring targets Write/Edit on `DOSSIER-*.md` paths only; non-dossier research files are not audited.

## Future Improvements

- Auto-detect research type from prompt (comparison vs evaluation vs investigation)
- Integration with Obsidian vault for persistent knowledge
- Structured data export (JSON) alongside markdown dossier
- Quality scoring rubric for self-assessment before delivery
- Cross-dossier reference index (link related dossiers)
