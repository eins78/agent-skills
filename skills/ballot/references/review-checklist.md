# Ballot Review Checklist

Walk through this checklist after authoring a ballot (multi-reviewer or single-decider async) and before handing it off. Each item is a concern that requires judgement, not a pattern a grep reliably catches. The one mechanical gate that remains is `ballot-filename.sh` — everything else is reviewed here.

Each item is structured:

- **What to check** — one concrete sentence
- **Why it matters** — the failure mode it prevents
- **What "good" looks like** — evidence of intent the reviewer can point to
- **Red flags** — specific patterns that suggest the check fails

---

## 1. Filename pattern

**What to check.** The filename matches `DOSSIER-<slug>-BALLOT-<Reviewer>.md`. The `<slug>` matches the parent dossier (if any). The `<Reviewer>` is the decider's name in a consistent casing — `DOSSIER-A11y-BALLOT-Max.md`, not `DOSSIER-A11y-BALLOT-max.md` or `DOSSIER-A11y-BALLOT-MAX.md` in the same folder.

**Why it matters.** `ballot-filename.sh` catches gross misnames (missing `-BALLOT-`, missing reviewer, non-`DOSSIER-` prefix). Subtler issues — inconsistent reviewer casing, slug drift across peers, misspelled `BALLOT` — slip through and confuse diffs and file listings.

**What good looks like.** All peer ballots in a folder share the exact slug. Reviewer names in TitleCase. The filename survives a `git log -- 'DOSSIER-*BALLOT*'` search and reads correctly in a phone's file listing.

**Red flags.**
- Peer ballots with differing slugs (`DOSSIER-A11y-BALLOT-Max.md` + `DOSSIER-a11y-BALLOT-Patrick.md`).
- Reviewer casing drift within a folder.
- `DOSSIER-<slug>-BALLOT-Reviewer1-Reviewer2.md` (multi-reviewer single file — see "one file per decider" convention).
- Missing `DOSSIER-` prefix (the gate fails on this).

---

## 2. Cover-block cleanliness

**What to check.** The cover block (everything before the first DEC heading) contains only: reviewer name, role, peer-ballot link (omit for single-decider async), full-dossier or context link. Nothing else.

**Why it matters.** A ballot is a decision artefact, not a development log. Archaeology ("updated 2026-04-18", "changes since previous version", "ballot v2") signals "this is still in flux" at exactly the moment the decider is supposed to commit. The earlier grep-gate caught specific phrases; this checklist item catches the shape of the concern.

**What good looks like.** Three or four metadata lines, a horizontal rule, then the ballot body. No "version", no "updated", no "changes since". Change history lives in the commit log.

**Red flags.**
- A paragraph at the top explaining what changed since the last ballot version.
- "Ballot updated 2026-04-18 — added DEC-005" (forces the reviewer to figure out whether to re-tick).
- Cover block with a Reviewer-only free-text preamble before the DECs.
- A "Status: DRAFT" banner (if it's draft, don't hand it off yet).

---

## 3. Anti-options

**What to check.** Options labelled "not recommended", "for completeness", "obviously wrong", or "maintenance trap" have been deleted. If one must appear (political visibility, stakeholder ask, compliance record), it has a `<!-- justify: <reason> -->` comment adjacent.

**Why it matters.** Anti-options cost the decider ticking time without changing outcomes. The decider reads, mentally rejects, moves on — net zero information gained, time spent. If the option is clearly bad, cut it. If it must stay, the justification explains why and the decider can skip it with context.

**What good looks like.** Every remaining option is a live choice the decider could plausibly tick. Options kept for justified reasons have an adjacent `<!-- justify: exec wants this acknowledged in the record -->` comment.

**Red flags.**
- "Do nothing / status quo" without a `justify` comment (often a hidden anti-option).
- Three options where two are parenthesized "(not recommended)" and the third is the obvious pick.
- A DEC whose prose recommendation explicitly recommends against two of its own options without cutting them.

---

## 4. Time-horizon-per-DEC

**What to check.** Each DEC represents one decision surface on one time-horizon. Multi-selects don't mix "launch-day" items with "next-year" items.

**Why it matters.** Mixed-horizon DECs force the decider to reason about two urgency frames simultaneously. A Must-tier launch-day item sharing a multi-select with a Could-tier next-year item obscures which items actually block delivery. The a11y session had an 11-option DEC combining launch-day social channels with next-year CFP commitments — reviewers split it at reconciliation.

**What good looks like.** Each DEC is in a tier section whose header names a single time-horizon ("Must — before first public commit", "Could — 6–12 months out"). The DEC's options all operate on that horizon.

**Red flags.**
- A Must-tier DEC whose options include both "deploy this week" and "set up for Q3".
- Multi-select DECs with 8+ options (often a sign of conflated surfaces; split).
- A tier header with two time-horizons in one line ("Must — before launch or Q2").

---

## 5. Recommended-but-not-pre-ticked

**What to check.** No checkbox is pre-ticked. Where a recommendation exists, it is in prose (`*Recommended: Option B — one-line why.*`) above the checkbox list, not a tick mark.

**Why it matters.** A pre-ticked box introduces default-state bias — the decider defers to the mark even when they would have chosen differently unprompted. Prose preserves the recommendation signal without the anchoring effect.

**What good looks like.** Every `- [ ]` in the file has an empty bracket. Every DEC either has no recommendation or a `*Recommended: ...*` prose line. The recommendation explains *why*, not just *which*.

**Red flags.**
- A `- [x]` anywhere in the ballot before the decider has ticked.
- A "suggested" checkbox styled differently (e.g. with emoji).
- A prose recommendation that contradicts the option's "Pros" in the dossier (suggests the recommendation wasn't updated after a late change).

---

## 6. Tier discipline

**What to check.** The Must / Should / Could assignment follows the meaning of the tiers, not a time-horizon mapping.

- **Must** = blocks delivery.
- **Should** = blocks if reviewers disagree (or if a single async decider flags dissent).
- **Could** = informational; the decider signals interest without committing.

**Why it matters.** Tier confusion breaks the "what blocks delivery" signal. An easy drafting mistake is to use tiers as a time-horizon axis (Must = now, Should = soon, Could = later). The tiers are orthogonal to time-horizon — a next-year commitment can be Must-tier if missing it blocks delivery today (e.g. "confirm a 6-month runway before shipping").

**What good looks like.** Must tier contains items that would stop delivery if unresolved. Could tier contains items the decider can skip and the delivery still ships. Tier assignment survives the question "if the decider doesn't tick this, does delivery still happen?".

**Red flags.**
- Must tier containing 11 items (dilutes the "blocks delivery" meaning; most are probably Should).
- Could tier empty (suggests everything was treated as equally critical — the tiering didn't happen).
- A tier header like "Must — later this year" (time-horizon and urgency conflated).

---

## 7. Async-readability

**What to check.** The ballot reads sensibly to the decider seeing it cold, 12 hours after handoff, on a phone. Single-screen cover block. DEC questions are full sentences, not token names. Options are recognizable without the parent dossier open.

**Why it matters.** Ballots are the artefact that survives the agent session. The decider may open them on a train, after a meeting, days later. If the reader needs the session context to understand a DEC, the ballot has failed as a durable artefact — and that failure shows up as reviewer latency and reconciliation friction.

**What good looks like.** Each DEC question is a full sentence a reviewer could paraphrase in one read-through. Each option is a phrase with enough context to evaluate ("Adopt Kubernetes 1.29 with the Gateway API" not "K8s-1.29-GW"). The cover block tells the decider who they are and where to find context if they need it.

**Red flags.**
- A DEC heading that reads `DEC-004 — MOR vs DYI` (unexplained abbreviation).
- An option like `- [ ] Option A` with no further description.
- Cover block with a dossier link that 404s or requires auth the decider doesn't have.
- Body text that references "the chart above" or "as shown in §4" — cross-references that break if the ballot is read in isolation.

---

## 8. Reconciliation location

**What to check.** Reconciliation (walking through each DEC, noting agreement/disagreement, recording outcomes) is in the sessionlog, not in the ballot and not in a third file like `DOSSIER-*-RECONCILE.md`.

**Why it matters.** Ballots are durable artefacts — point-in-time captures of what the decider ticked. Reconciliation is a session output — a discussion that resolves the ticks into decisions. Co-locating them in a third file conflates the two kinds of thing and produces a file that goes stale in the one week before the next check-in.

**What good looks like.** The ballot has no "Reconciliation" section. The sessionlog (`docs/sessionlogs/YYYY-MM-DD-*.md` or equivalent) contains the reconciliation walkthrough, named decisions, and any remaining open items flagged for follow-up. The ballot's Free-text section, if used, contains only the reviewer's own comments, not a reconciliation summary.

**Red flags.**
- A `DOSSIER-<slug>-RECONCILE.md` file in the folder.
- A "Reconciliation" heading inside the ballot.
- Sessionlog that summarizes decisions made in the session but doesn't walk through the DECs one by one.
- The ballot's Free-text section containing a summary of what other reviewers said.

---

## Why this replaced the old grep hooks

Earlier iterations shipped two grep-based ballot audit hooks: `ballot-anti-option.sh` (matched "not recommended", "for completeness", "obviously wrong", "maintenance trap") and `ballot-cover-archaeology.sh` (matched "updated YYYY-MM-DD", "changes since", "previous version", "ballot updated"). Both were overfit to the a11y-extension session's exact vocabulary.

Anti-options take many shapes — "(legacy)", "(not a real choice)", "(if you insist)" — and archaeology can hide in ways the grep doesn't see ("note: rewritten after the call last week"). A judgement-capable reviewer reading this checklist catches the concern more reliably than a phrase match. The one mechanical check that stayed (`ballot-filename.sh`) is genuinely pattern-mechanical: a filename either matches `DOSSIER-<slug>-BALLOT-<Reviewer>.md` or it doesn't.
