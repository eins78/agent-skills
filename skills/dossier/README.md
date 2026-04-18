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
│   ├── framing-modes.md              # OSS/commercial/hiring/vendor/personal wordlists
│   └── audit-checks.md               # Gate documentation + manual invocation
└── templates/
    ├── dossier.md                    # Report template with REQUIRED/OPTIONAL sections
    └── ballot-per-reviewer.md        # Per-reviewer decision ballot template

# Hooks (repo-level, wired in .claude-plugin/plugin.json):
.claude-plugin/hooks/
├── dossier-citation-audit.sh         # Gate: [Xn] refs all defined in §Sources
├── dossier-forbidden-words.sh        # Gate: declared framing-mode's wordlist
├── dossier-section-order.sh          # Gate: Glossary first, Sources last
├── dossier-ballot-filename.sh        # Gate: per-reviewer naming
└── dossier-dated-claim-scan.sh       # Rule+partial-gate: lists dates for re-verify
```

## Dependencies

**Required:** WebSearch, WebFetch (built into Claude Code)
**Optional:** last30days skill (for social signal), commit-notation skill (for commit messages)

## Testing

To verify the skill works:

1. **Trigger test:** Say "research the best X" or "compare A vs B" — the skill should load
2. **FRAME test:** Verify the produced dossier declares framing mode, decision model, and audience before research content
3. **Template test:** Check that a produced dossier includes all REQUIRED sections (Key Facts, Key Concepts, Management Summary, Evaluations, Sources)
4. **Citation test:** Verify every product/project is hyperlinked and key facts have inline citations; run `.claude-plugin/hooks/dossier-citation-audit.sh <dossier.md>` — should exit 0
5. **Forbidden-word test:** Seed an intentional violation (e.g. `monetization` in an `oss`-framed dossier), run `dossier-forbidden-words.sh` — should exit 1
6. **Section-order test:** Move Glossary to the back and run `dossier-section-order.sh` — should exit 1
7. **Ballot test:** Ask for a comparison requiring a decision — verify per-reviewer `DOSSIER-*-BALLOT-<Reviewer>.md` files are created (not a single-file ballot)
8. **Session test:** After dossier delivery, ask a follow-up question — verify session stays open

## Known Gaps

- Forbidden-word wordlists live in two places (`references/framing-modes.md` and `.claude-plugin/hooks/dossier-forbidden-words.sh`) and must be kept in sync manually
- Time-horizon-per-DEC and reconciliation-in-sessionlog are rules only — no gate can detect violations without NLP
- Anti-option detection is a rule, not a gate — the script cannot distinguish a deliberate "not recommended" justification from a lazy one
- Source reference file covers 13 domains — will grow with usage
- Template comments (REQUIRED/OPTIONAL markers) need to be stripped from final output
- Hooks are wired via `plugin.json`'s `hooks` key; the wiring conservatively targets Write/Edit on `DOSSIER-*.md` paths only — other paths that happen to contain `[Xn]` citations are not audited

## Future Improvements

- Auto-detect research type from prompt (comparison vs evaluation vs investigation)
- Integration with Obsidian vault for persistent knowledge
- Structured data export (JSON) alongside markdown dossier
- Quality scoring rubric for self-assessment before delivery
- Cross-dossier reference index (link related dossiers)
