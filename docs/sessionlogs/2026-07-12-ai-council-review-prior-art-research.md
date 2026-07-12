# ai-council-review — prior-art deep-research round + implementation (PR #62)

**Date:** 2026-07-12
**Source:** Claude Code (Fable 5)
**Session:** Research round (morning), then maintainer-approved implementation of all 8 proposals (same day, same session/worktree) — nothing merged

## Summary

Ran a deep-research pass on prior art for the multi-model council pattern
(councils, ensembles, LLM-as-judge panels, multi-agent debate) to ground
future improvements to `ai-council-review`. Used the `deep-research`
workflow: 5 search angles → 21 primary sources fetched → 102 claims
extracted → top 25 adversarially verified with 3 independent refutation
votes each → **17 confirmed / 8 refuted** (103 subagents, ~3.3M tokens,
~14 min). Deliverables: `research/council-prior-art.md` (findings labeled
verified / refuted / unverified-lead, scorecard of current design vs
literature, 8 prioritized proposals) and a summary comment on PR #62
(<https://github.com/eins78/agent-skills/pull/62#issuecomment-4950449549>).

## Key findings

- **Current design broadly validated**: blind parallel review (bandwagon
  bias evidence), no debate round (deliberation *erases* 22–72% of
  issue-critical facts; MAD ≯ self-consistency, ICML 2024), vendor-diverse
  roster + Anthropic excluded (self-preference bias, self-family win rates
  75–84%, PoLL disjoint-families result), dissent preservation (ChatEval).
- **In-session repo verification appears novel** — no surveyed system
  (incl. Karpathy's llm-council, the closest architectural sibling)
  verifies findings against ground truth.
- **Corrective**: every "diversity improves quality/recall" claim failed
  adversarial verification; Self-MoA (arXiv:2502.00674) shows repeated
  samples of the best model beat mixed ensembles. Diversity's verified
  benefit is **bias reduction only** — never roster a weaker model for
  diversity's sake.
- **Agreement is weaker evidence than intuition says** (unverified-lead
  tier): frontier models pick the *same wrong answer* ~60% of the time when
  both err; unanimous 9-judge panels still ~9.1% wrong.

## Proposals written up (not implemented)

P1 anonymize member identities during synthesis (llm-council pattern;
gates-over-rules for the `max`-preset own-vendor discount) · P2
correlated-error guardrails in synthesis.md · P3 promote `--personas` to
documented coverage mode (ChatEval ablation) · P4 position-bias hygiene in
adjudication · P5 document budget→default triage cascade · P6 finding
fingerprints for cross-run compare + stuck-detector · P7 per-member
verified/refuted outcome archive (future calibration data) · P8 record
"no debate round" as an explicit non-goal.

## Decisions

- **Evidence tiers labeled throughout** — the deep-research verify stage
  killed 8 widely-cited claims (MoA beats GPT-4o, PoLL accuracy claim,
  "collaborativeness", diversity-beats-repetition); the research doc lists
  them explicitly so they never get cited into the skill's docs.
- **Research file lives in `research/`, not the skill directory** — it is
  repo-level context for the PR discussion, not skill content.

## Implementation round (same day, Max approved all 8)

All proposals implemented TDD-style (RED tests first for code changes;
full offline suite 55/55, typecheck clean, `pnpm test`/`validate` green;
subagent comprehension test on the revised synthesis protocol):

- **P1** — dispatch anonymizes members (shuffled `member-A`… labels in
  reviews/, raw/, manifest, clusters; mapping in `roster-key.json`, read at
  report time; per-member output re-sorted by label so roster position
  can't de-anonymize; failed members stay named). Protocol updated.
- **P2/P4** — synthesis.md: unanimity grants no verification exemption
  (correlated errors); minority-new-evidence triage for contested items;
  adjudication hygiene (evidence-first, order-swap check).
- **P3** — `--personas` promoted to documented coverage mode with tradeoff
  guidance. **P5** — optional budget→default triage pattern documented
  (suggestion only, per Max's instruction — NOT enforced).
- **P6** — stable cluster `fingerprint` (files + title tokens; never labels
  or lines) + re-review protocol with the two-runs stuck rule.
- **P7** — new offline `outcomes record|show` subcommand: per-member
  verified/refuted/uncertain tallies per run to XDG-state `outcomes.jsonl`
  (dedupe by run dir, labels translated via roster-key); synthesis step 8.
- **P8** — README: no-debate-round explicit non-goal with evidence;
  diversity rationale corrected to bias-control; new known gaps (soft
  blind, outcome-archive trust).

Commits: one per proposal theme (P1, P6, P7, P2+P4, P3+P5, P8) + changeset
(`20260712-ai-council-review-hardening.md`, minor — combines with the
initial changeset to still release at 0.1.0).

## Decisions (implementation)

- **Failed members are named, delivered members are not** — no findings, no
  bias risk, and roster repair needs the model name.
- **Label shuffle + label-sorted output** — without both, roster position
  (known from the estimate table) would de-anonymize labels.
- **No `--compare` flag for fingerprints** — the agent diffs two
  `clusters.json` files itself; a flag would be automation without need.
- **Outcome archive keyed by model slug, never labels** — labels are
  run-scoped by design.

## Dossier upgrade (same day, follow-up)

`research/council-prior-art.md` upgraded to a proper dossier (per the
`dossier` skill): Key Facts box + glossary added, every substantive claim
now carries a linked citation token (`[G#]`/`[P#]`/`[W#]` for the 21
fetched sources, `[C#]` for 13 verifier-cited corroborating references),
full bibliography with real titles/authors. All 34 URLs verified live
(HTTP 200) and all arXiv titles fetched from the arXiv API before citing —
including pinning two previously vague attributions (the cascade
break-even formula → the "Triage" paper, arXiv:2604.07494; the
single-agent-matches-debate result → Wang et al., ACL 2024). Citation
integrity checked mechanically (no orphan tokens, no unused definitions).
File path kept (PR comment, README provenance, and changeset link to it).

## Pending

- [ ] Max reviews PR #62 (research + implementation + dossier) and merges
- [ ] Dogfood a real council run against the hardened flow (anonymized
      synthesis end-to-end, outcomes recording)
- [ ] Open questions that only usage data can answer: agreement↔correctness
      in code review (the P7 archive now measures this), optimal council
      size, Self-MoA transfer to review tasks (A/B-able via `--models` with
      the same slug ×4)
