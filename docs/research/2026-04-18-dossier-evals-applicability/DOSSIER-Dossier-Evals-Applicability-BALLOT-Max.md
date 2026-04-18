<!--
  Per-reviewer ballot — async single-decider case.
  Conventions: skills/ballot/SKILL.md.
  Gates enforced on Write: ballot-filename.sh (naming).
  Judgment review: skills/ballot/references/review-checklist.md (8 items).
-->

# Ballot — Dossier Evals Applicability (PR #43)

**Reviewer:** Max
**Role:** Solo decider on the eins78/agent-skills personal-OSS repo
**Full dossier:** [DOSSIER-Dossier-Evals-Applicability-2026-04-18.md](./DOSSIER-Dossier-Evals-Applicability-2026-04-18.md)

---

## How to use this ballot

- Tick the checkbox you choose. Boxes are **empty by default** — your mark is the decision.
- **Must** blocks PR #43 delivery (currently only DEC-1). **Should** steers the follow-up if DEC-1 = yes. **Could** is informational.
- Prose `*Recommended:*` lines are the dossier's recommendation; the tick is yours.
- If you change your mind, strike through and re-tick — a diff is cleaner than a rewrite.
- Reconciliation (if needed) happens in the sessionlog, not here.

---

## Must — before PR #43 merges

### DEC-1 — Should PR #43 ship with evals?

*Recommended: (b) Yes, but in a follow-up PR — keeps PR #43 scope bounded while not foreclosing the eval harness.*

- [ ] (a) Yes, in this PR — add the eval harness inside PR #43 before merge
- [ ] (b) Yes, in a follow-up PR — ship PR #43 now, open a separate eval harness PR after merge
- [ ] (c) No — the two review-checklists + two live hooks are the eval mechanism; no harness needed

One-line rationale per option:
- (a) Biggest regression safety net but stretches an already-large PR through another session.
- (b) Unblocks PR #43, preserves eval option, earns regression coverage on the next skill edit.
- (c) Honors the polish-pass anti-grep conclusion; accepts regression-silent drift as the cost.

---

## Should — if DEC-1 = (a) or (b)

### DEC-2 — Which eval stack?

*Recommended: (b) evalite — TS + pnpm + LLM-as-judge scorers match the repo exactly; Vitest underneath is industry-standard.*

- [ ] (a) Replicate Quatico PR #12's bespoke scenario-runner — match Max's own prior art, zero framework deps <!-- justify: this is Max's proven pattern and a legitimate "reinvent-over-adopt" choice -->
- [ ] (b) [evalite](https://www.evalite.dev/) v0.19.0 — TS-native, Vitest-based, LLM-as-judge built in
- [ ] (c) Roll your own (Vitest + @anthropic-ai/sdk + custom scorer lib) — full control, ~500–800 LoC
- [ ] (d) Pending on DEC-1 — do not choose a stack unless DEC-1 ≠ (c)

One-line rationale per option:
- (a) Lowest framework cost; high glue cost once LLM-as-judge is needed.
- (b) Lowest integration friction for THIS repo's toolchain; handles mechanical + judgment in one model.
- (c) Appealing for understanding; maintenance compounds with each new metric.
- (d) Keep this box empty if you ticked (c) on DEC-1 — honest abstention.

### DEC-3 — Scope for the initial eval set

*Recommended: (b) Mechanical + 3 LLM-as-judge — proves both patterns on a small footprint before scaling.*

- [ ] (a) Mechanical only — 3 scorers (framing-mode, citation-integrity, Key-Facts presence); no LLM costs
- [ ] (b) Mechanical + 3 LLM-as-judge — adds Executive-Summary crispness, source-bias flagging, ballot async-readability
- [ ] (c) Full coverage — every reviewer-checklist item gets a scorer (8 dossier + 8 ballot = 16)

One-line rationale per option:
- (a) Cheapest; catches structural breaks but not prose-quality drift.
- (b) Proves LLM-as-judge works without committing to a full matrix.
- (c) Over-engineering for a personal repo with ~3 committed dossiers today.

---

## Could — directional / informational

### DEC-4 — Ordering relative to the `dossier-preflight` branch

*Recommended: merge preflight first, then open eval-harness PR — so the eval surface is stable before eval authoring starts.*

- [ ] (a) Eval harness before preflight — lets evals cover preflight when it lands
- [ ] (b) Preflight before eval harness — eval surface stable first
- [ ] (c) In parallel — merge conflicts accepted

### DEC-5 — Port Quatico's `run-scenarios.md` runbook into this repo as a template

*Recommended: don't port — evalite's CLI-native flow is different enough that writing new is cheaper than translating.*

- [ ] Port — keep the Quatico authoring pattern consistent across both repos
- [ ] Don't port — let the evalite stack shape its own runbook

---

## Free-text

<!-- Reviewer-only comments. Not a reconciliation surface — that's the sessionlog. -->

{Any notes, deferrals, or scope adjustments. Empty is fine.}

---

<!--
  Post-write self-check against skills/ballot/references/review-checklist.md:
  1. Filename: DOSSIER-Dossier-Evals-Applicability-BALLOT-Max.md ✓
  2. Cover block: reviewer, role, dossier link only; no archaeology ✓
  3. Anti-options: DEC-2 (a) has a <!-- justify: ... --> comment; DEC-2 (d) is an
     explicit abstention depending on DEC-1, not an anti-option ✓
  4. Time-horizons: Must=PR #43 merge window; Should=follow-up scope; Could=directional ✓
  5. Recommended-not-pre-ticked: every box is `- [ ]` ✓
  6. Tier discipline: only DEC-1 blocks PR #43 merge; DEC-2/3 steer follow-up ✓
  7. Async-readability: every DEC is a full sentence; options have full context ✓
  8. Reconciliation: not in this file — lives in sessionlog if needed ✓
-->
