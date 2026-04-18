<!--
  Per-decider ballot template. Works for multi-reviewer async sign-off AND
  single-decider async handoffs (PR review, chat sign-off, remote collaboration).

  Conventions and rationale: see skills/ballot/SKILL.md (§Conventions).
  Review: skills/ballot/references/review-checklist.md.
  Filename gate: ballot-filename.sh (naming). Full detail:
  skills/ballot/references/ballot-conventions.md.
-->

# Ballot — {Dossier Title}

**Reviewer:** {Reviewer Name}
**Role:** {e.g. publication sponsor / product owner / technical reviewer / PR reviewer}
<!-- Omit the Peer ballot line for a single async decider. -->
**Peer ballot:** [DOSSIER-{slug}-BALLOT-{Other Reviewer}.md](./DOSSIER-{slug}-BALLOT-{Other Reviewer}.md)
**Full dossier:** [DOSSIER-{slug}-{YYYY-MM-DD}.md](./DOSSIER-{slug}-{YYYY-MM-DD}.md)

---

## How to use this ballot

<!-- REQUIRED. Keep to one screen. -->

- Tick the checkbox you choose. Boxes are **empty by default** — your mark is the decision.
- **Must** items block delivery. **Should** items block if reviewers disagree (or if a single async decider flags dissent). **Could** items are informational.
- If you want to change an already-ticked box, strike through and re-tick — a diff is cleaner than a rewrite.
- Reconciliation happens in the sessionlog, not here.

---

## Must — {Time horizon, e.g. "before first public commit"}

<!-- REQUIRED for decisions that block delivery. -->

### DEC-001 — {Decision question}

<!-- OPTIONAL: one-sentence recommendation in prose. Do NOT pre-tick any box. -->

*Recommended: {option name} — {one-sentence why}.*

- [ ] {Option A}
- [ ] {Option B}
- [ ] {Option C}

{Optional: 1-2 sentences of context if the decision needs it. Link to the dossier section where this was analysed.}

### DEC-002 — {Decision question}

*Recommended: {option name}.*

- [ ] {Option A}
- [ ] {Option B}

---

## Should — {Time horizon, e.g. "before v1.0"}

<!-- OPTIONAL. Decisions that steer but don't block. -->

### DEC-003 — {Decision question}

*Recommended: {option name}.*

- [ ] {Option A}
- [ ] {Option B}

---

## Could — {Time horizon, e.g. "6–12 months out"}

<!-- OPTIONAL. Informational — reviewer signals interest, doesn't commit. -->

### DEC-010 — {Decision question}

- [ ] Interested — worth following up
- [ ] Pass for now

---

## Free-text

<!-- OPTIONAL. Reviewer-only comments. Not a reconciliation surface — that's the sessionlog. -->

{Any notes the reviewer wants captured alongside their decisions.}

---

<!--
  Delivery checklist — ballot-filename.sh enforces naming; everything else is
  reviewed against skills/ballot/references/review-checklist.md before handoff:

  1. Filename matches DOSSIER-<slug>-BALLOT-<Reviewer>.md (ballot-filename.sh).
  2. Cover block is clean — no "updated YYYY-MM-DD" / changelog / "changes since".
  3. No anti-options ("not recommended", "for completeness", etc.) without a
     <!- - justify: ... - -> comment.
  4. Every DEC heading: one decision surface, one time-horizon.
  5. No checkbox is pre-ticked.
  6. Reads sensibly on a phone 12 hours after handoff.
-->
