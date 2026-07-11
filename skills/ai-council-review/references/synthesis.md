# Synthesis Protocol

How to turn N independent council reviews into one actionable report. Follow
the steps in order. The council members could not see the repository — you
can. That asymmetry is the whole point of synthesizing in-session: **you
verify, they opine.**

## Inputs

From `RUN_DIR` (printed by the dispatch script):

- `manifest.json` — per-member status, actual cost, `degraded`/quorum state
- `clusters.json` — mechanically pre-clustered findings (present when ≥1 review parsed)
- `reviews/<member>.json` — parsed findings, or `{"unstructured": "..."}` for members whose JSON could not be parsed
- `raw/<member>.json` — full API responses (rarely needed)
- `request-meta.json` — what was reviewed, config snapshot, cost estimate

## Step 1 — Establish M

Read `manifest.json`. **M = members whose status is `ok` or `parse_failed`**
(both delivered an opinion). All agreement counts below are **N/M, never
N/(council size)** — a 2/2 agreement from a degraded 4-member run is not a
4-model consensus, and the report must say so.

For every `parse_failed` member: read its `reviews/*.json` `unstructured`
text now and mentally extract its findings — they participate in every step
below exactly like parsed findings. An opinion is never discarded for being
badly formatted.

## Step 2 — Finish merging

`clusters.json` deliberately under-merges (only same-file/overlapping-lines
and near-identical titles). Scan the singleton clusters for semantic
duplicates the mechanical pass missed — same root cause described from
different angles counts as one finding; same file but genuinely different
problems does not. When merging, keep every member's attribution and
wording nuance; when unsure whether two findings are the same, **do not
merge** — under-merging costs a duplicate line, over-merging erases dissent.

## Step 3 — Score

For each merged finding record:

- **Agreement**: N/M distinct members.
- **Severity**: the members' median, noting an escalation flag if ANY member
  said `blocker` ("2/4, one calls it a blocker").
- **Confidence**: the members' aggregate, weighted toward members that gave
  concrete mechanisms over vibes.

## Step 4 — Verify against the repository (the core step)

For **every finding of severity major or blocker, and every contested
finding** (cap at the ~10–12 most consequential): open the actual files and
check whether the issue exists as described. Mark each:

- `verified` — you confirmed it in the code/document. Quote the confirming lines.
- `refuted` — the code does not do what the finding claims. State the
  refutation mechanism (the council reviewed a diff without repo context;
  guesses about unseen code are the most common refutation).
- `uncertain` — cannot be confirmed from the repo alone (runtime behavior,
  external systems). Say what evidence would settle it.

Refuted findings move to the appendix WITH their refutation reason — never
silently dropped, so the human can spot-check your refutations too.

## Step 5 — Preserve dissent

- A **1/M finding is a minority report, not noise.** Verify minority majors
  and blockers with the same rigor; a verified 1/M blocker outranks a 4/4
  style nit by construction of the ranking key.
- **Direct contradictions** (member A: "this is a bug"; member B: "this is
  clearly intentional") become **contested items**: present both positions
  in their strongest form, then adjudicate from the repository evidence.
  Your adjudication is one more opinion unless you verified — say which it is.

## Step 6 — Rank (anti-false-consensus rules)

Ranking key, in strict order: **verified > severity > agreement > confidence**.

Rules that override intuition:

- Agreement is **evidence, not truth**. Frontier models share training
  corpora and fashionable opinions; four models repeating the same plausible
  claim can all be wrong, and unanimous stylistic preferences are still just
  preferences.
- If the council includes a member from the synthesizer's own vendor (the
  `max` preset includes an Anthropic model and you are one), **discount
  pairwise agreement between you and that member** when judging consensus.
- If `--personas` was used (`manifest.personas: true`), agreement counting
  is INVALID — members had different assignments. Switch to coverage mode:
  report per-lens findings without consensus framing.

## Step 7 — Write the report

Write `report.md` into `RUN_DIR` following
`${CLAUDE_SKILL_DIR}/references/report-template.md`, then give the user a
condensed version in chat: overall verdict, the verified top findings,
contested items, and actual vs estimated cost. Link the run directory for
the full record.
