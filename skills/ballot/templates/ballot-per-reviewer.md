<!--
  Per-reviewer ballot template.

  Conventions and rationale: see skills/ballot/SKILL.md (§Conventions).
  Gates: ballot-filename.sh (naming), ballot-anti-option.sh (option quality),
  ballot-cover-archaeology.sh (clean cover block). Full detail:
  skills/ballot/references/ballot-conventions.md.
-->

# Ballot — {Dossier Title}

**Reviewer:** {Reviewer Name}
**Role:** {e.g. publication sponsor / product owner / technical reviewer}
**Peer ballot:** [DOSSIER-{slug}-BALLOT-{Other Reviewer}.md](./DOSSIER-{slug}-BALLOT-{Other Reviewer}.md)
**Full dossier:** [DOSSIER-{slug}-{YYYY-MM-DD}.md](./DOSSIER-{slug}-{YYYY-MM-DD}.md)

---

## How to use this ballot

<!-- REQUIRED. Keep to one screen. -->

- Tick the checkbox you choose. Boxes are **empty by default** — your mark is the decision.
- **Must** items block delivery. **Should** items block only if both reviewers disagree. **Could** items are informational.
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
  Delivery checklist — the hooks in .claude-plugin/hooks/ballot-*.sh enforce
  the first three; the last two are agent discipline:

  1. Filename matches DOSSIER-<slug>-BALLOT-<Reviewer>.md (ballot-filename.sh).
  2. No anti-options ("not recommended", "for completeness", etc.) without a
     <!- - justify: ... - -> comment (ballot-anti-option.sh).
  3. Cover block is clean — no "updated YYYY-MM-DD" / "changes since" /
     "previous version" paragraph (ballot-cover-archaeology.sh).
  4. Every DEC heading: one decision surface, one time-horizon.
  5. No checkbox is pre-ticked.
-->
