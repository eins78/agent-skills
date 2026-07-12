# ai-council-review — prior-art deep-research round (PR #62)

**Date:** 2026-07-12
**Source:** Claude Code (Fable 5)
**Session:** No compactions · research-only round on the PR #62 worktree — no skill behavior changed, nothing merged

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

## Pending

- [ ] Max reviews the proposals; pick which to implement (P1/P2/P8 are the
      cheap high-evidence ones)
- [ ] Open questions that only usage data can answer: agreement↔correctness
      in code review (P7 outcome archive would measure this), optimal
      council size, Self-MoA transfer to review tasks (A/B-able via
      `--models` with the same slug ×4)
