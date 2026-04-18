# ballot

## Purpose

Durable decision artefact for decisions that happen async — whenever the decider(s) aren't all present in the agent session. Canonical cases: review a dossier's recommendations over chat, review a pull request after hours, hand off to remote collaborators, ADR sign-off across an architecture committee, hiring panel reconciliation. Reviewer count is incidental — a single decider reviewing async benefits from the same structure (empty checkboxes, tiered Must/Should/Could, filename that survives multi-dossier listings, reads sensibly 12 hours later). Multiple reviewers get per-reviewer files; a single async decider gets one file.

Extracted from the `dossier` skill on 2026-04-18. Pairs with `dossier` when SYNTHESIZE surfaces decisions needing extraction; stands alone anywhere a decision leaves the immediate session.

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
    ├── ballot-conventions.md         # long-form rationale per rule
    └── review-checklist.md           # reviewer audit checklist
```

The one mechanical hook (`ballot-filename.sh`) fires `PostToolUse` on Write/Edit for files matching `DOSSIER-*BALLOT*.md` directly from `plugin.json`. Everything else — cover-block cleanliness, anti-options, tier discipline, async-readability — is reviewed via `references/review-checklist.md`.

## Dependencies

- `bash` ≥ 4.0 — used by `ballot-filename.sh`.
- No external services, no network calls.

## Testing

### Scenario 1: Standalone ballot (single async decider)

1. Create `DOSSIER-<slug>-BALLOT-<Reviewer>.md` from the template.
2. Omit the `**Peer ballot:**` line (single decider).
3. Verify `ballot-filename.sh` exits 0 on the correct filename.
4. Verify the ballot reads sensibly to the reviewer on a phone cold.

### Scenario 2: Multi-reviewer ballot

1. Create one file per reviewer: `DOSSIER-<slug>-BALLOT-<Reviewer1>.md` and `DOSSIER-<slug>-BALLOT-<Reviewer2>.md`.
2. Keep the `**Peer ballot:**` cross-link on each.
3. Verify `ballot-filename.sh` accepts both files.

### Scenario 3: Dossier-invoked ballot

1. Run a `dossier` session that produces decisions.
2. SYNTHESIZE links at this skill's template.
3. Ballot files land in `research/YYYY-MM-DD-slug/` alongside the dossier.

### Scenario 4: Reviewer-checklist review pass

1. Run the review-checklist against a completed ballot before handing off.
2. Each item in the checklist should be actionable — if a reviewer can't perform the check, the checklist item is broken.

## Known Gaps

- **Filename gate is alerting-level, not blocking.** PostToolUse fires *after* file write. A motivated agent can ignore. True blocking requires PreToolUse with content inspection. Planned; `ballot-filename.sh` is the cheapest candidate for a PreToolUse upgrade since the filename is in `tool_input.file_path` before write.
- **Must-tier blocker not shipped.** Parsing ballot state (final vs. draft) to detect an unticked Must at delivery is too fragile. Kept as a prose rule; flag in sessionlog.
- **No automated Must/Should/Could tier validator.** Agents can mis-tier (e.g. put a launch-blocking item in Could). Convention-only; caught by the reviewer checklist.

## Planned Improvements

- PreToolUse upgrade for `ballot-filename.sh` — filename is in `tool_input.file_path` before write, so this one is cheap and earns the "gate" label honestly.
- Template variants per use case (ADR, hiring, vendor) — reduce the adaptation burden documented in SKILL.md §Use Cases.
- Subagent test scenarios per writing-skills TDD methodology.
