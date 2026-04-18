---
name: ballot
description: >-
  Use when a decision has two or more reviewers and needs a durable artefact.
  Triggers: decision ballot, multi-reviewer decision, architecture call,
  architecture decision record, ADR, hiring panel, vendor selection, household
  decision, reconcile, per-reviewer, contested decision, tick box for each
  reviewer, ballot.
compatibility: claude-code, cursor
license: MIT
metadata:
  author: eins78
  repo: https://github.com/eins78/agent-skills
  version: "1.0.0"
---

# Ballot

Per-reviewer decision ballots for contested multi-reviewer decisions. One file per reviewer, tiered into Must / Should / Could horizons, with an empty checkbox per option. Reconciliation happens in the sessionlog; the ballots are the durable artefact.

Extracted from the `dossier` skill — pairs with it when SYNTHESIZE produces decisions needing extraction, and stands alone for ADRs, architecture calls, hiring panels, vendor selection, and household decisions.

## When to Use

- Two or more reviewers. A single-decider decision does not need a ballot.
- Each reviewer signs off independently and the signed-off state is a reviewable artefact (ADRs, hiring panels, architecture committees).
- Decisions have mixed urgency — some block delivery, some are directional, some are informational. The Must/Should/Could tiers encode that.
- Reviewers may be asynchronous. The ballot format survives the reviewer reading it on their phone on a train.

## When NOT to Use

- Single decider. Ask in chat; write the outcome in a sessionlog.
- Low-stakes vote with no durable consequence (lunch options).
- Decision surface is not yet framed. Frame first; ballot once options are real.
- Ongoing reconciliation. Ballots are point-in-time; ongoing discussion lives in its own venue (sessionlog, meeting notes).

## Workflow

1. **Frame the decisions.** For each DEC, one decision surface, one time-horizon, at least two real options. Tag Must / Should / Could.
2. **Create one ballot file per reviewer.** Filename: `DOSSIER-<slug>-BALLOT-<Reviewer>.md` (the `DOSSIER-` prefix keeps the ballot next to the dossier in a file listing even when the ballot is standalone — see §Standalone vs. Dossier-invoked).
3. **Prose-recommend per DEC, but leave checkboxes empty.** A pre-ticked box is pressure, not a recommendation.
4. **Deliver ballots to reviewers.** Each reviewer ticks independently.
5. **Reconcile in the sessionlog.** Walk each DEC, note where reviewers agreed or split, record the decided outcome. Reconciliation is a session output, not a third ballot file.

Template: `${CLAUDE_SKILL_DIR}/templates/ballot-per-reviewer.md`.

## Conventions

These rules are empirical — each came from a concrete ballot that went wrong before it was fixed. Full rationale: `${CLAUDE_SKILL_DIR}/references/ballot-conventions.md`.

- **One file per reviewer.** Do NOT create a single-file two-column ballot. Each reviewer scrolling past the other's column is cramped, especially on phones. Enforced by `ballot-filename.sh` — the filename must end `-BALLOT-<Reviewer>.md`.
- **Clean cover block.** Reviewer, role, peer-ballot link, dossier link. Nothing else. No "updated 2026-04-18" paragraph, no changelog, no "changes since previous version". Archaeology belongs in the commit log and sessionlog. Enforced by `ballot-cover-archaeology.sh`.
- **Recommended-but-not-pre-ticked.** A DEC can have a prose recommendation (`*Recommended: Option B — one-line why.*`), but checkboxes stay empty. The reviewer's tick is the decision.
- **One DEC = one decision surface = one time-horizon.** Do not mix "launch-day channels" with "next year's CFP commitments" in a single multi-select.
- **No anti-options.** If you added an option labelled "not recommended" or "for completeness", either add a `<!-- justify: ... -->` comment (e.g. the option has political visibility) or delete it. Anti-options cost reviewer ticking-time without changing outcomes. Enforced by `ballot-anti-option.sh`.
- **Must / Should / Could tiers.** Must blocks delivery. Should blocks only if reviewers disagree. Could is informational. If the Must tier has unresolved disagreement at delivery time, flag in the sessionlog — the ballot skill does not ship a hard gate for this (too fragile to parse; see §Gates).
- **Reconciliation in the sessionlog.** Not in a third file. Ballots are durable; reconciliation is session-scoped.

## Use Cases

Each is a 2-3 line sketch of how the template adapts.

- **ADR voting.** Senior engineers approve an architectural decision. Must tier = the chosen architecture; Could tier = migration preferences. Dossier optional; the ADR itself can be the context doc.
- **Architecture call reconciliation.** Whiteboard session ended contested. Ballot captures the surviving options per sub-decision, each reviewer ticks over the following week, reconciliation at the next standup.
- **Hiring panel.** Must = ship offer / reject / more-interview. Should = role scoping (seniority band, onboarding pairing). Could = onboarding prefs. Use `hiring` framing mode in the companion dossier (compensation stays out of the ballot body).
- **Vendor selection.** Must = which vendor (one option per vendor). Should = contract term, payment schedule. Could = optional add-ons. Dossier provides the comparison table; ballot captures commitments.
- **Household decision.** Max + partner choosing among options (holiday, appliance, move-date). Low-stakes but the ballot mechanism scales down — two Must items is plenty.

## Gates (hooks)

Three hooks wire into `.claude-plugin/hooks/dossier-hook-dispatcher.sh`, triggered PostToolUse on `Write|Edit` for files matching `DOSSIER-*BALLOT*.md`:

| Hook | Fails on |
|------|----------|
| `ballot-filename.sh` | Single-file format — anything not `DOSSIER-*-BALLOT-<Reviewer>.md` |
| `ballot-anti-option.sh` | Option rows containing "not recommended" / "for completeness" / "obviously wrong" / "maintenance trap" without a `<!-- justify: ... -->` comment |
| `ballot-cover-archaeology.sh` | Cover block containing "updated YYYY-MM-DD" / "changes since" / "previous version" / "ballot updated" |

**Alerting level, not true blocking.** PostToolUse fires *after* the file is written to disk. Exit 2 feeds stderr back to Claude, which usually corrects — but a motivated agent can ignore and proceed. Upgrading to true blocking requires PreToolUse content-inspection hooks (a ~3× implementation cost). Documented as future work; see `references/ballot-conventions.md` §"Gate rigor levels" for what PreToolUse would look like.

Must-tier "blocks delivery" is a convention, not a gate. A ballot-state parser to detect final-status-with-unticked-Must would be too fragile (requires reconstructing reviewer intent). Flag in the sessionlog if a Must item is unresolved at delivery time.

## Standalone vs. Dossier-invoked

**Standalone.** For ADRs, architecture calls, hiring, vendor selection, household decisions. The `DOSSIER-` filename prefix stays — it keeps ballots grouped with any companion documents and makes the gates fire. No dossier file needs to exist; the cover-block "Full dossier" link can point to a meeting notes doc, an ADR markdown file, or be omitted.

**Dossier-invoked.** When a `dossier` SYNTHESIZE surfaces decisions needing per-reviewer sign-off, the dossier skill points at this skill's template and conventions. The dossier owns the research; the ballot owns the decision surface. See `skills/dossier/SKILL.md` §SYNTHESIZE.

## Related Skills

| Skill | Integration |
|-------|-------------|
| `dossier` | Primary caller. Dossier research produces decisions; ballot extracts them. |
| `bye` | Reconciliation lives in the sessionlog — same sessionlog `/bye` builds at session end. |
| `commit-notation` | `D:` prefix for ballot commits when delivered with a dossier; otherwise commit-intention matches the parent artefact (e.g. `F:` for an ADR, `D:` for a hiring decision doc). |

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Single-file ballot with two reviewer columns | One file per reviewer — `DOSSIER-*-BALLOT-<Reviewer>.md` |
| Cover block with "updated 2026-…" or changelog paragraph | Commit log holds history; cover block holds reviewer/role/links only |
| Pre-ticked checkbox as "recommendation" | Use prose: `*Recommended: Option B.*` Checkboxes stay empty |
| Mixing time-horizons in one DEC | Split into two DECs (e.g. DEC-003 launch-day, DEC-004 next-year) |
| Anti-option listed for completeness | Either justify (`<!-- justify: ... -->`) or delete |
| Reconciliation as a third file | Reconciliation lives in the sessionlog, not a `DOSSIER-*-RECONCILE.md` |
| Must-tier item unresolved, delivery called complete | Flag in sessionlog; no gate enforces this |
