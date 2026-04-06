# lab-notes

Structured experiment management with append-only running logs, two modes (Rigorous + Freeform), and formal verdicts.

## Structure

| File | Purpose |
|------|---------|
| `SKILL.md` | Workflow: FRAME -> SETUP -> RUN -> ANALYZE -> VERDICT, mode selection, phase gates, integration |
| `README.md` | This file — development documentation |
| `templates/log.md` | LOG template with all 6 design additions (fail condition, early stop, pre-committed decisions, motivation, confidence axis, failed attempts table) |

## Tier

**Publishable** — Reusable across projects. Generic experiment tracking applicable to any workspace using `experiments/` directories.

## Provenance

Extracted from 7 real experiments in the home-workspace repo (Feb-Apr 2026), formalized through:

- **Dossier research** (`research/2026-04-experiment-skill-design/`): 25+ sources across scientific lab notebooks, software engineering frameworks, knowledge management systems, and ML experiment trackers
- **Design patterns adopted:** Kromatic (fail condition, early stop), Strategyzer (test/learning card pairing), Gwern (completeness vs confidence axes), Sionic AI (failed attempts table), Fishman (pre-committed decisions), Spotify DIBB (motivation chain)
- **Architectural model:** story-tracking skill from quatico-solutions/agent-skills (folder-per-item, session log, auxiliary files, status markers)
- **Lab notebook tradition:** 400+ years of scientific convention (append-only, hypothesis-first, ALCOA+ data integrity)

## Reference Guides

- **NCI Guide for Lab Records** — embedded at `references/nci-lab-records-guide.md` (US government work, public domain). Official NIH requirements for lab notebook entries, corrections, witnessing, and retention.
- [Rice University Lab Notebook Guide](https://www.ruf.rice.edu/~bioslabs/tools/notebook/notebook.html) — Most practical hypothesis-procedure-observations-conclusions structure guide (copyrighted, linked only)

## Testing

- [ ] `/lab-notes new test-smoke: Verify the lab-notes skill works end-to-end` — verify directory + LOG creation
- [ ] Phase gate test: `/lab-notes run test-smoke` should be blocked in Rigorous (no environment) but allowed in Freeform
- [ ] Dispatcher test: `/lab-notes` with no args lists active experiments
- [ ] Log append test: `/lab-notes log test observation` appends correctly
- [ ] Mode upgrade test: switch from Freeform to Rigorous mid-experiment

## Known Gaps

- No automated scanner script (future: scan experiments/ and report status)
- No migration tool for pre-skill experiments (manual frontmatter addition)
- Phase gate enforcement depends on agent discipline — no PreToolUse hook yet
- No integration test with delegate-agents (planned for first delegated experiment)

## Planned Improvements

- `scripts/scan.sh` — list experiments with phases, deadlines, staleness
- Hook-based enforcement (PreToolUse: warn if LOG not updated in >2 hours during RUN)
- Template variants for specific experiment types (benchmark, comparison, integration)
- Obsidian Dataview integration for experiment dashboards
