# Ballot Conventions — rationale per rule

Long-form rationale for each convention in `SKILL.md` §Conventions. Consulted when a convention seems arbitrary, a team wants to propose an exception, or a new convention is being considered for adoption.

Empirical source for most rules: the a11y-extension Chrome-Web-Store dossier session (2026-Q1), across two reviewers over multiple weeks. Where a different source applies, it is named inline.

---

## One file per reviewer

**Rule.** Filename `DOSSIER-<slug>-BALLOT-<Reviewer>.md`. Single-file two-column ballots rejected by `ballot-filename.sh`.

**Why.** The reviewer reads on a phone or iPad as often as on a laptop. A two-column layout on a 390-px viewport is unreadable; one reviewer scrolls past the other's state for every DEC. The per-reviewer file keeps each reviewer's surface context-of-one, reads naturally on any width, and produces a clean diff when the reviewer ticks.

**How the template embodies it.** Filename pattern. Cover block names the reviewer explicitly. The peer-ballot link cross-references rather than inlines.

**Empirical source.** a11y session: we started with a two-column ballot, both reviewers complained about phone UX within the first hour, split to per-reviewer files by session end.

---

## Clean cover block (no archaeology)

**Rule.** Cover block contains: reviewer name, role, peer-ballot link, full-dossier link. Nothing else. No "updated 2026-04-18 — added DEC-005". No changelog. No "changes since previous version". Enforced by `ballot-cover-archaeology.sh`.

**Why.** A ballot is a decision artefact, not a development log. The reviewer wants to know who they are, what peers they are cross-referencing, and where the full context lives. Change history belongs in the commit log (`git log skills/ballot/...`) and in the sessionlog. A "ballot updated" paragraph at the top is clutter that signals "this is still in flux" at exactly the moment the reviewer is supposed to commit.

**How the template embodies it.** Four metadata lines, then `---`, then the ballot body. No "version" or "updated" field.

**Empirical source.** a11y session: second iteration of the ballots added "ballot updated 2026-03-18" at the top; reviewer feedback was "does that mean I should re-tick or not?" The archaeology had caused exactly the confusion it pretended to prevent.

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

**Rule.** Options labelled "not recommended", "for completeness", "obviously wrong", or "maintenance trap" are rejected by `ballot-anti-option.sh` unless annotated with `<!-- justify: <reason> -->` on a following line.

**Why.** Anti-options cost reviewer ticking-time without changing outcomes. If an option is clearly bad, cut it and note the decision in the dossier's "Considered and dropped" section. If the option must appear (political visibility, stakeholder ask, compliance record), the justification comment explains why — and the reviewer can then skip it with context.

**How the hook works.** Grep each `- [ ]` row for the trigger phrases; if hit, scan the next 3 lines for `<!-- justify:`; if absent, exit 1.

**Empirical source.** a11y session second iteration added a "Do nothing, stay on Edge Store only" anti-option for political visibility (exec wanted it acknowledged). Justification comment made this clear to the reviewer. Without the justification, the option would have read as a recommendation to do nothing.

---

## Must / Should / Could tiers

**Rule.** Must = blocks delivery. Should = blocks only if reviewers disagree. Could = informational, reviewer signals interest. No hard enforcement.

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

Current hooks (`ballot-filename.sh`, `ballot-anti-option.sh`, `ballot-cover-archaeology.sh`) fire `PostToolUse` on `Write|Edit`. The tool has already written the file when the hook fires — exit 2 feeds stderr back to Claude but the file is on disk. In practice Claude usually corrects, but a motivated agent can ignore the signal and proceed.

True blocking requires `PreToolUse`:

- Parse `tool_input.content` for a Write event, or
- Apply the proposed diff to the current file contents for an Edit event, then
- Run the check on the proposed post-edit state, and
- Return `permissionDecision: "deny"` with a reason on violation.

The implementation cost is roughly 3× the PostToolUse path per hook, plus per-tool input-parsing logic. `ballot-filename.sh` is the cheapest candidate for a PreToolUse upgrade — the filename is in `tool_input.file_path` before write, so no content parsing is needed. Planned as a follow-up PR.

---

## Template placeholder handling

Placeholder syntax in templates uses `{curly-brace-or-pipe}` to signal "fill this in". Example: `**Reviewer:** {Reviewer Name}`.

Hooks that consume the template file — `ballot-*.sh` and `dossier-forbidden-words.sh` — must skip brace-containing values. `dossier-forbidden-words.sh` does this explicitly for `framing-mode: {oss | commercial | ...}` (see `skills/dossier/references/framing-modes.md` §Template placeholder handling). `ballot-*.sh` hooks skip any file under `templates/` via the dispatcher's `*/templates/*` filter; they do not need their own brace handling.

If a new hook is added and it reads template files directly, it must add the same brace-skip.
