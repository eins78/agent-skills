# Ballot Conventions — rationale per rule

Long-form rationale for each convention in `SKILL.md` §Conventions. Consulted when a convention seems arbitrary, a team wants to propose an exception, or a new convention is being considered for adoption.

The ballot skill exists because decisions increasingly happen async — reviewers look at them over chat, on a PR, on a train, after the agent session ends. Reviewer count is incidental; async is the defining trait. A single decider reviewing after the session needs the same discipline (empty checkboxes, tiered urgency, filename that survives a multi-dossier listing, cover block readable 12 hours later) as a multi-reviewer panel.

Empirical source for most rules: the a11y-extension Chrome-Web-Store dossier session (2026-Q1), across two reviewers over multiple weeks. The multi-reviewer framing in the original rules reflects that source; the reframe to async-first happened in the 2026-04-18 polish pass when it became clear the conventions serve both cases equally well. Where a different source applies, it is named inline.

---

## One file per decider

**Rule.** Filename `DOSSIER-<slug>-BALLOT-<Reviewer>.md`. Single-file multi-column ballots rejected by `ballot-filename.sh`. Multi-reviewer ballots get one file per reviewer; single async deciders get one file.

**Why.** A ballot is read cold, on whatever device the decider has at hand — often a phone hours or days after the agent session ended. A two-column layout on a 390-px viewport is unreadable; one reviewer scrolls past the other's state for every DEC. For a single decider, a multi-column layout is just noise. The per-file-per-decider pattern keeps each decider's surface context-of-one, reads naturally on any width, and produces a clean diff when the decider ticks.

**How the template embodies it.** Filename pattern. Cover block names the decider explicitly. The peer-ballot link cross-references rather than inlines (and is omitted for single-decider async).

**Empirical source.** a11y session: started with a two-column ballot, both reviewers complained about phone UX within the first hour, split to per-reviewer files by session end. The same phone-reads-cold pressure applies to single-decider async handoffs — the polish pass generalized the rule.

---

## Clean cover block (no archaeology)

**Rule.** Cover block contains: reviewer name, role, peer-ballot link (if multi-reviewer), full-dossier/context link. Nothing else. No "updated 2026-04-18 — added DEC-005". No changelog. No "changes since previous version". Reviewed in `references/review-checklist.md`.

**Why.** A ballot is a decision artefact, not a development log. The decider wants to know who they are, what (if any) peers they are cross-referencing, and where the full context lives. Change history belongs in the commit log (`git log skills/ballot/...`) and in the sessionlog. A "ballot updated" paragraph at the top is clutter that signals "this is still in flux" at exactly the moment the decider is supposed to commit.

**How the template embodies it.** Three or four metadata lines (peer link conditional), then `---`, then the ballot body. No "version" or "updated" field.

**Empirical source.** a11y session: second iteration of the ballots added "ballot updated 2026-03-18" at the top; reviewer feedback was "does that mean I should re-tick or not?" The archaeology had caused exactly the confusion it pretended to prevent. Replaced the earlier grep-gate (`ballot-cover-archaeology.sh`) with a checklist item in the 2026-04-18 polish pass — the grep was too specific to catch the many shapes archaeology actually takes.

---

## Recommended-but-not-pre-ticked

**Rule.** A DEC can have a prose recommendation: `*Recommended: Option B — one-line why.*` The checkboxes stay empty. The reviewer's tick is the decision.

**Why.** A pre-ticked box communicates "approve this" rather than "consider this". Reviewers defer to a pre-ticked state even when they would have ticked differently unprompted — the mark becomes the default, not a decision. Prose preserves the recommendation signal without the anchoring effect.

**How the template embodies it.** Each DEC has a placeholder italic `*Recommended: ...*` line above the checkbox list; the checkboxes are all ` [ ] ` (empty).

**Empirical source.** a11y session + general decision-theory literature on default-state bias. The first round had pre-ticked recommendations; the reconciliation revealed reviewers had ticked "as presented" without considering alternatives for two of six DECs.

---

## One DEC = one decision surface = one time-horizon

**Rule.** Each DEC heading represents one choice. Do not combine "launch-day channels" and "next-year CFP commitments" in a multi-select. No enforcement hook — semantic rule.

**Why.** Mixed-horizon DECs force the reviewer to reason about two different decision frames simultaneously. A Must-tier launch-day item paired with a Could-tier next-year item in the same multi-select obscures which items actually block delivery. Splitting into two DECs keeps each decision at a consistent urgency.

**How the template embodies it.** The tier headers (`## Must — before first public commit`, `## Should — before v1.0`, `## Could — 6-12 months out`) each own a time-horizon. Placing a DEC under the wrong tier is how this rule gets broken; re-reading the tier headers when tiering each DEC is the discipline.

**Empirical source.** a11y session first-iteration DEC-003 combined "which social channels to post the launch on" with "which conferences to submit to next year" as one eleven-option multi-select. Reviewers split it at reconciliation. The rule codifies the split.

---

## No anti-options (without justification)

**Rule.** Options labelled "not recommended", "for completeness", "obviously wrong", or "maintenance trap" should be deleted, unless annotated with `<!-- justify: <reason> -->` on a following line. Reviewed in `references/review-checklist.md`.

**Why.** Anti-options cost reviewer ticking-time without changing outcomes. If an option is clearly bad, cut it and note the decision in the dossier's "Considered and dropped" section. If the option must appear (political visibility, stakeholder ask, compliance record), the justification comment explains why — and the reviewer can then skip it with context.

**Empirical source.** a11y session second iteration added a "Do nothing, stay on Edge Store only" anti-option for political visibility (exec wanted it acknowledged). Justification comment made this clear to the reviewer. Without the justification, the option would have read as a recommendation to do nothing. Replaced the earlier grep-gate (`ballot-anti-option.sh`) with a checklist item in the 2026-04-18 polish pass — the phrase list was overfit to the a11y session and didn't generalize.

---

## Must / Should / Could tiers

**Rule.** Must = blocks delivery. Should = blocks only if reviewers disagree (or a single async decider flags dissent). Could = informational, decider signals interest. No hard enforcement.

**Why.** Not all decisions have equal weight. A ballot that treats every DEC as equally blocking slows delivery for DECs that could have been handled post-launch. The three tiers make urgency explicit.

**How the template embodies it.** Three H2 sections, each with its own time-horizon declaration. Must is required; Should and Could are optional.

**Caveat.** A gate that checks "no unticked Must at delivery time" would require parsing the ballot's delivery state — too fragile. Convention only. If a Must is unresolved at delivery, flag in the sessionlog.

**Empirical source.** a11y session: without tiering, all 11 DECs were treated equally, and the launch was blocked on a Could item (onboarding-email copy) that no one had prioritised. Post-tiering retrospective identified this as the single biggest time-waster.

---

## Reconciliation in the sessionlog

**Rule.** Reconciliation (walking through each DEC, noting agreement/disagreement, recording the decided outcome) lives in the sessionlog. Not in a third ballot file like `DOSSIER-*-RECONCILE.md`.

**Why.** The ballots are durable artefacts — they capture a reviewer's signed-off state at a moment. The reconciliation is a session output — it captures a group discussion. These are different kinds of thing. Co-locating them in a third file conflates the two and produces a file that becomes a third state to keep in sync.

**How the template embodies it.** The ballot has a "Free-text" section (reviewer comments only, not reconciliation). No "Reconciliation" section.

**Empirical source.** a11y session: first pass created a `RECONCILE.md`. At session end, `bye` produced a sessionlog that already captured the discussion. The `RECONCILE.md` was redundant and went stale in the one week before the next reviewer check-in.

---

## Gate rigor levels

This section exists for future work, not as a rule.

The one remaining hook (`ballot-filename.sh`) fires `PostToolUse` on `Write|Edit`. The tool has already written the file when the hook fires — exit 2 feeds stderr back to Claude but the file is on disk. In practice Claude usually corrects, but a motivated agent can ignore the signal and proceed.

True blocking requires `PreToolUse`:

- Parse `tool_input.content` for a Write event, or
- Apply the proposed diff to the current file contents for an Edit event, then
- Run the check on the proposed post-edit state, and
- Return `permissionDecision: "deny"` with a reason on violation.

`ballot-filename.sh` is the cheapest candidate for a PreToolUse upgrade — the filename is in `tool_input.file_path` before write, so no content parsing is needed. Planned as a follow-up PR.

The other audit concerns (cover archaeology, anti-options, tier discipline, async-readability) are reviewed via `references/review-checklist.md` rather than script-gated. A 2026-04-18 polish pass removed the earlier grep-gates after they proved overfit to the a11y-extension session — the phrase lists didn't generalize to other ballot styles (ADR votes, PR review handoffs, hiring panels use different vocabularies). A judgement-capable reviewer catches the same concerns more reliably than a pattern match.

---

## Template placeholder handling

Placeholder syntax in templates uses `{curly-brace-or-pipe}` to signal "fill this in". Example: `**Reviewer:** {Reviewer Name}`.

`ballot-filename.sh` skips any file under `templates/` (the hook returns 0 for paths that don't match the production-ballot pattern). If a new hook is added and reads template files directly, it should skip brace-containing values.
