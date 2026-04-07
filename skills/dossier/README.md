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

## Design Influences

- **[last30days](https://github.com/ScrapCreators/last30days-skill):** Parallel source dispatch + judge synthesis pass. Adapted: per-topic agent design instead of fixed 10+ platform roster.
- **[Claude Code ultraplan](https://code.claude.com/docs/en/claude-code-on-the-web):** Extended autonomous thinking for deep tasks. Adapted: monolithic synthesis pass for complex dossiers.
- **[writing-skills](https://github.com/anthropics/superpowers):** TDD for documentation, CSO (Claude Search Optimization), token efficiency.

## File Structure

```
dossier/
├── SKILL.md                  # Main skill
├── README.md                 # This file
├── references/
│   └── sources-by-domain.md  # Domain → source mapping (13 domains)
└── templates/
    └── dossier.md            # Report template with REQUIRED/OPTIONAL sections
```

## Dependencies

**Required:** WebSearch, WebFetch (built into Claude Code)
**Optional:** last30days skill (for social signal), commit-notation skill (for commit messages)

## Testing

To verify the skill works:

1. **Trigger test:** Say "research the best X" or "compare A vs B" — the skill should load
2. **Template test:** Check that a produced dossier includes all REQUIRED sections (Key Concepts, Management Summary, Evaluations, Sources)
3. **Citation test:** Verify every product/project is hyperlinked and key facts have inline citations
4. **Ballot test:** Ask for a comparison requiring a decision — verify `DOSSIER-Title-BALLOT.md` is created alongside
5. **Session test:** After dossier delivery, ask a follow-up question — verify session stays open

## Known Gaps

- No automated quality check for citation completeness
- Source reference file covers 13 domains — will grow with usage
- Template comments (REQUIRED/OPTIONAL markers) need to be stripped from final output

## Future Improvements

- Auto-detect research type from prompt (comparison vs evaluation vs investigation)
- Integration with Obsidian vault for persistent knowledge
- Structured data export (JSON) alongside markdown dossier
- Quality scoring rubric for self-assessment before delivery
- Cross-dossier reference index (link related dossiers)
