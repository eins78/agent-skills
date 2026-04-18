# ballot

## Purpose

Per-reviewer decision ballots for contested multi-reviewer decisions. Extracted from the `dossier` skill on 2026-04-18. Pairs with `dossier` when SYNTHESIZE surfaces decisions needing extraction; stands alone for ADRs, architecture calls, hiring panels, vendor selection, and household decisions.

## Tier

Publishable — project-agnostic. Works without `dossier`; works with any project convention that keeps a sessionlog.

## Provenance

- **Format convention:** the Quatico sales-hub per-reviewer ballot pattern. File-per-reviewer naming, Must/Should/Could tiers, prose-recommend-but-don't-pre-tick.
- **Empirical source:** the a11y-extension Chrome-Web-Store dossier session (2026-Q1). Decisions across two reviewers (publication sponsor + technical) needed sign-off over multiple days; the per-reviewer files are the pattern that worked.
- **Extraction:** Path B of the 2026-04-18 dossier-skill evolution pitch. Pitch: `docs/pitches/2026-04-18-dossier-skill-evolution.md`. Assessment of the path-A POC that informed B's scope: `docs/pitches/2026-04-18-pitch-A-assessment.md`.

## Design Influences

- `skills/dossier` — primary caller. Dossier SYNTHESIZE hands off to this skill when a decision surface is needed.
- `skills/lab-notes` — hypothesis-first structure. The ballot's Must/Should/Could tiering mirrors lab-notes' verdict tiers.
- `skills/bye` — sessionlog is the reconciliation surface; `/bye` rolls up what was decided.

## File Structure

```
skills/ballot/
├── SKILL.md                          # ~130 lines
├── README.md                         # this file
├── templates/
│   └── ballot-per-reviewer.md        # Must/Should/Could scaffold
└── references/
    └── ballot-conventions.md         # long-form rationale per rule
```

Hooks live in `.claude-plugin/hooks/ballot-*.sh` and are routed by `dossier-hook-dispatcher.sh` on `PostToolUse` Write/Edit events for files matching `DOSSIER-*BALLOT*.md`.

## Dependencies

- `jq` — used by the dispatcher to parse tool payloads.
- `bash` ≥ 4.0 — used by the audit scripts.
- No external services, no network calls.

## Testing

### Scenario 1: Standalone ballot (no dossier)

1. Create `DOSSIER-<slug>-BALLOT-<Reviewer>.md` from the template.
2. Omit or repoint the "Full dossier" link.
3. Verify the three hooks fire: filename, anti-option, cover-archaeology.

### Scenario 2: Dossier-invoked ballot

1. Run a `dossier` session that produces decisions.
2. SYNTHESIZE links at this skill's template.
3. Ballot files land in `research/YYYY-MM-DD-slug/` alongside the dossier.
4. All hooks fire, including dossier audits on the main dossier file.

### Scenario 3: Anti-option escape

1. Add an anti-option row: `- [ ] Option Z (not recommended)`.
2. Hook fires exit 1.
3. Add `<!-- justify: Option Z has exec visibility — must appear -->`.
4. Hook exits 0.

## Known Gaps

- **Gates are alerting-level, not blocking.** PostToolUse fires *after* file write. A motivated agent can ignore. True blocking requires PreToolUse with content inspection — a ~3× implementation cost. Planned; see `ballot-conventions.md` §"Gate rigor levels".
- **Must-tier blocker not shipped.** Parsing ballot state (final vs. draft) to detect an unticked Must at delivery is too fragile. Kept as a prose rule; flag in sessionlog.
- **No automated Must/Should/Could tier validator.** Agents can mis-tier (e.g. put a launch-blocking item in Could). Convention-only.

## Planned Improvements

- PreToolUse upgrade for `ballot-filename.sh` — filename is in `tool_input.file_path` before write, so this one is cheap and earns the "gate" label honestly.
- Template variants per use case (ADR, hiring, vendor) — reduce the adaptation burden documented in SKILL.md §Use Cases.
- Subagent test scenarios per writing-skills TDD methodology.
