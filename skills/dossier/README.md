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
│   ├── framing-modes.md              # When to pick each mode + template-placeholder guidance
│   ├── framing-modes.yaml            # Canonical forbidden-word lists (consumed by the gate via yq)
│   └── audit-checks.md               # Gate documentation + rationale
└── templates/
    └── dossier.md                    # Report template with REQUIRED/OPTIONAL sections
                                      # (ballot template moved to skills/ballot/)

# Hooks (repo-level, wired in .claude-plugin/plugin.json):
.claude-plugin/hooks/
├── dossier-framing-declared.sh       # Gate: framing-mode: declared in frontmatter
├── dossier-citation-audit.sh         # Gate: [Xn] refs all defined in §Sources; warns on zero-[Xn] dossiers
├── dossier-forbidden-words.sh        # Gate: mode's wordlist (from framing-modes.yaml)
├── dossier-section-order.sh          # Gate: Glossary first, Sources last
├── dossier-dated-claim-scan.sh       # Listing-only: flags dates at audit time

# Ballot-specific hooks (owned by skills/ballot; route when filename matches *BALLOT*):
├── ballot-filename.sh                # Gate: per-reviewer naming
├── ballot-anti-option.sh             # Gate: "not recommended" options need <!-- justify -->
└── ballot-cover-archaeology.sh       # Gate: no "updated YYYY-MM-DD" in cover block
```

## Dependencies

**Required:** WebSearch, WebFetch (built into Claude Code)
**Optional:** last30days skill (for social signal), commit-notation skill (for commit messages)

## Testing

To verify the skill works:

1. **Trigger test:** Say "research the best X" or "compare A vs B" — the skill should load
2. **FRAME test:** Verify the produced dossier declares framing mode, decision model, and audience before research content
3. **Template test:** Check that a produced dossier includes all REQUIRED sections (Key Facts, Key Concepts, Management Summary, Evaluations, Sources)
4. **Citation test:** Verify every product/project is hyperlinked and key facts have inline citations. The citation-audit hook fires automatically on Write/Edit; a dossier with zero `[Xn]` refs produces a stderr warning (no-op guard against accidentally missed refs).
5. **Forbidden-word test:** Seed an intentional violation (e.g. `monetization` in an `oss`-framed dossier) — the gate fires via the dispatcher, stderr reports the hit, exit code 2.
6. **Section-order test:** Move Glossary after Management Summary and re-save — section-order hook fires.
7. **Framing-declaration test:** Remove the `framing-mode:` frontmatter — the new `dossier-framing-declared` hook fires before the other audits.
8. **Ballot test:** Ask for a comparison requiring a decision — verify the `ballot` skill's per-reviewer template is used and hooks fire on the ballot files.
9. **Session test:** After dossier delivery, ask a follow-up question — verify session stays open.

## Known Gaps

- **Alerting-level gates.** PostToolUse fires *after* file write; exit 2 feeds stderr back to Claude but a motivated agent can ignore. PreToolUse rigor is documented future work; `ballot-filename.sh` is the cheapest upgrade candidate (filename is in `tool_input.file_path` before write).
- **Must-tier ballot gate deferred.** A hook that detects unticked Must items at delivery time would require parsing reviewer intent; too fragile. Kept as a prose rule in `skills/ballot/SKILL.md` — flag in sessionlog if blocked.
- **Time-horizon-per-DEC semantics** cannot be machine-checked — remains a convention in the ballot skill.
- **Source reference file** covers 13 domains — will grow with usage.
- **Template comments** (REQUIRED/OPTIONAL markers) need to be stripped from final output.
- **Hook routing scope.** Wiring targets Write/Edit on `DOSSIER-*.md` paths only; other paths that happen to contain `[Xn]` citations are not audited.

## Future Improvements

- Auto-detect research type from prompt (comparison vs evaluation vs investigation)
- Integration with Obsidian vault for persistent knowledge
- Structured data export (JSON) alongside markdown dossier
- Quality scoring rubric for self-assessment before delivery
- Cross-dossier reference index (link related dossiers)
