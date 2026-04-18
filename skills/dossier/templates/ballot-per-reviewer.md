<!--
  Per-reviewer ballot template.

  One file per reviewer. Filename pattern: DOSSIER-<slug>-BALLOT-<Reviewer>.md.
  Do NOT create a single-file ballot with two reviewer columns — see
  .claude-plugin/hooks/dossier-ballot-filename.sh for the gate that enforces this.

  Cover-block rule: reviewer designation, role, peer-ballot cross-reference, link
  to the full dossier. Nothing else. No "ballot updated 2026-…" paragraph, no
  changelog, no "since last version" notes — archaeology belongs in the commit
  log and the sessionlog, not in the artefact a reviewer is ticking.

  Recommended-but-not-pre-ticked: each DEC can name a recommendation in prose,
  but the checkboxes stay EMPTY. The reviewer makes the mark. A pre-ticked
  checkbox is pressure, not a recommendation.

  Time-horizon rule: one DEC = one decision surface = one time-horizon. Do not
  mix "launch day channels" with "next year's CFP commitments" in one multi-select.

  Anti-option warning: if you add an option labelled "not recommended" or
  "for completeness", either add a short justification comment OR delete the
  option. Every anti-option costs reviewer ticking-time without changing outcomes.

  Reconciliation lives in the sessionlog, not in a third file. The ballots are
  the durable artefact; the reconciliation is a session output.
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
  Checks before delivering this ballot to the reviewer:

  1. Filename matches DOSSIER-<slug>-BALLOT-<Reviewer>.md.
     bash .claude-plugin/hooks/dossier-ballot-filename.sh <this-file>
  2. Every DEC heading has exactly one decision surface and one time-horizon.
  3. No option is labelled "not recommended" or "for completeness" without a
     justification OR removal.
  4. No checkbox is pre-ticked.
  5. Cover block contains only: reviewer, role, peer-ballot link, dossier link.
     No "updated" / "changes since" / "previous version" paragraph.
-->
