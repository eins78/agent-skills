# DOSSIER: Multi-Model LLM Council Review — Prior Art

**Date:** 2026-07-12 · **Scope:** evidence base for hardening the
`ai-council-review` skill ([PR #62](https://github.com/eins78/agent-skills/pull/62))

## Key Facts

| | |
|---|---|
| Decider | Max (maintainer) — approved all 8 proposals; implemented on the PR #62 branch 2026-07-12 |
| Question | What does prior art (systems + literature) say the council skill should adopt, change, or explicitly reject? |
| Method | Deep-research fan-out: 5 angles → 21 sources fetched → 102 claims extracted → top 25 adversarially verified (3 independent refutation votes each) → **17 confirmed / 8 refuted** |
| Load-bearing claim 1 | Vendor diversity's verified benefit is **bias reduction**, not quality/recall — every diversity-improves-quality claim failed verification [P5][ref-P5] |
| Load-bearing claim 2 | Cross-model **agreement is a weak correctness signal** — models err together far above chance [P7][ref-P7][P14][ref-P14] |
| Load-bearing claim 3 | **No debate round**: interaction measurably destroys evidence and manufactures consensus [P6][ref-P6][P12][ref-P12] |
| Load-bearing claim 4 | In-session **repo verification appears novel** vs all surveyed systems [G1][ref-G1]–[G4][ref-G4] |

## Glossary

- **LLM-as-judge** — using a language model to evaluate another model's
  output; the paradigm whose biases this dossier catalogs [P11][ref-P11].
- **Self-preference bias** — a judge model rating its own (or its
  family's) outputs higher than merited [P2][ref-P2][C2][ref-C2].
- **Bandwagon bias** — a judge shifting toward a majority opinion embedded
  in its prompt, regardless of correctness [P3][ref-P3].
- **Position bias** — a judge's verdict changing when candidate order is
  swapped; mitigated by swap-and-average [C4][ref-C4].
- **MoA / Self-MoA** — Mixture-of-Agents: parallel proposer LLMs plus an
  aggregator [P4][ref-P4]; Self-MoA replaces the mixed proposers with
  repeated samples of the single best model [P5][ref-P5].
- **PoLL** — Panel of LLM judges drawn from disjoint model families,
  aggregated by voting/pooling [P1][ref-P1].
- **Correlated errors** — different models making the *same* mistakes on
  the same items, which caps what any panel can gain from more members
  [P7][ref-P7][P9][ref-P9].
- **Coverage mode** — this skill's `--personas` mode: distinct focus lens
  per member; breadth instead of countable consensus.

---

Evidence tiers used throughout: **[verified]** (survived 3-vote adversarial
verification), **[refuted]** (killed by verification — listed because they
are commonly believed), **[unverified lead]** (extracted from a fetched
primary source but not put through the verification stage; treat as
promising, not established).

Skill state at time of research: v0.1.0 as initially pushed to the PR
branch — blind parallel fan-out to ~4 vendor-diverse frontier models via
OpenRouter, conservative mechanical clustering, in-session synthesis with
repo verification, dissent preservation, ranking `verified > severity >
agreement > confidence`, two-tier budget gate. All eight proposals in §5
were subsequently approved and implemented on the same branch (2026-07-12).

---

## 1. Closest prior art (systems)

### Karpathy's llm-council **[verified]**

[karpathy/llm-council][ref-G1] — the closest architectural sibling. Three
stages: (1) parallel fan-out of the same query to all council LLMs, (2)
**anonymized** peer cross-review — outputs relabeled "Response A/B/C"
explicitly so models "can't play favorites", (3) a designated Chairman
model synthesizes. Default roster is exactly 4 vendor-diverse frontier
models via OpenRouter, same pattern as this skill [G1][ref-G1].

Differences: llm-council uses LLM cross-*ranking* where this skill uses
mechanical clustering; its Chairman synthesizes without ground-truth
verification (this skill's repo-verification step is genuinely novel
relative to it). Caveat: self-described "99% vibe coded Saturday hack" —
architecture prior art, zero efficacy evidence [G1][ref-G1].

**Transferable idea: anonymize member identities during synthesis** (see
Proposal 1).

### ChatEval **[verified]**

[chanchimin/ChatEval][ref-G2] (companion paper: Chan et al.,
[arXiv:2308.07201][ref-C1]) — multi-agent *debate* evaluation with a
different diversity strategy: same underlying model, distinct **personas**
via role-description prompts, 2 debate turns, sequential. Two load-bearing
results:

- Disagreement is explicitly preserved — each referee renders an
  independent judgment ("you are not required to output the same value as
  other referees"); aggregation (majority vote / averaging) is post-hoc
  [G2][ref-G2]. Matches this skill's dissent-preservation design.
- **Ablation: identical role descriptions degrade performance**
  [C1][ref-C1] — some induced reviewer diversity is load-bearing. Relevant
  to the skill's `--personas` coverage mode.

### pelednoam/multi-model-code-review-agent **[verified]**

[pelednoam/multi-model-code-review-agent][ref-G3] — a working multi-model
*code review* pipeline (caveat: 0-star personal repo; design prior art, no
adoption evidence). Two transferable patterns:

1. **Distinct review lens per member** (security / correctness /
   readability-performance / spec-compliance) across 3 vendors, each blind
   in an isolated process with no conversation history — preventing
   author-rationale contamination [G3][ref-G3].
2. **Finding fingerprints as a stuck-detector**: findings are fingerprinted
   for cross-round aggregation; identical blocking findings two consecutive
   rounds → exit code 2 → "human judgment needed". A concrete termination /
   cost control for iterative use [G3][ref-G3].

Note: the same repo's claim that its vendor-diverse reviewers catch
*complementary, non-overlapping* defects was **[refuted]** (anecdotal, no
evaluation) [G3][ref-G3].

### Mixture-of-Agents (Together AI) **[verified architecture, refuted performance]**

[togethercomputer/moa][ref-G4] (paper: Wang et al.,
[arXiv:2406.04692][ref-P4]) — validates the fan-out-plus-synthesizer
*shape* at the same scale (quickstart: 4 proposers, 1 aggregator, 2
layers) [G4][ref-G4]. But **all four of MoA's stronger claims failed
adversarial verification** in this research pass: beating GPT-4o on
AlpacaEval, diversity-beats-repeated-sampling, "collaborativeness" from
weaker models, and synthesis-beats-selection [P4][ref-P4]. Do not cite MoA
as evidence that mixing models improves quality.

---

## 2. What the bias literature establishes

### Self-preference bias is real and severe **[verified]**

Wataoka et al., ["Self-Preference Bias in LLM-as-a-Judge"][ref-P2] and
Panickssery et al., ["LLM Evaluators Recognize and Favor Their Own
Generations"][ref-C2]: among eight evaluators tested, GPT-4 showed the
strongest self-preference (bias score 0.520; recall 0.945 favoring own
outputs vs 0.425 opposing) [P2][ref-P2]. Corroborated by later work
measuring **self-family win rates of 75–84%** in pairwise judging, reduced
by cross-provider judging [C5][ref-C5][C6][ref-C6]. Ensemble evaluation
across vendors is the literature's proposed mitigation [P2][ref-P2].

→ Directly validates two existing skill decisions: vendor-diverse roster,
and excluding the synthesizer's own vendor (Anthropic) from the default
council. The `max` preset's "discount same-vendor pairwise agreement" rule
is also supported.

Note the *mechanism* claims did not survive: "familiarity/perplexity drives
self-preference" was **[refuted]** [P2][ref-P2], and one specific
self-enhancement measurement (consistency 0.688/0.610) was **[refuted]** as
misread from the source [P3][ref-P3]. The phenomenon is solid; pop-science
explanations of it are not. (Some self-preference even tracks genuine
quality: Chen et al., ["Do LLM Evaluators Prefer Themselves for a
Reason?"][ref-C7].)

### Bandwagon and position bias dictate protocol details **[verified]**

- **Bandwagon bias**: LLM judges shift toward an embedded majority opinion
  regardless of correctness (GPT-4-Turbo resisted injected false majorities
  only ~73% of the time), per the CALM bias framework — Ye et al.,
  ["Justice or Prejudice? Quantifying Biases in LLM-as-a-Judge"][ref-C3]
  ([project site][ref-P3]); replicated in reasoning models [C8][ref-C8],
  code-task judging [C9][ref-C9], and bias benchmarks [C10][ref-C10].
  → Supports **blind, parallel first-round review** — exactly what the
  skill does. Any future "debate round" must start from committed
  independent findings.
- **Position bias**: swapping candidate order changes verdicts (~10–15
  point win-rate swings on close calls). Systematic studies: Shi et al.,
  ["Judging the Judges: A Systematic Study of Position Bias"][ref-C4];
  mitigation surveys [C5][ref-C5][C11][ref-C11]. Standard mitigation is
  swap-and-average / order randomization. → Relevant wherever the
  synthesizer weighs two members' contradicting positions (see Proposal 4).

### PoLL (Panel of LLM judges) **[verified, with one refuted part]**

Verga et al., ["Replacing Judges with Juries"][ref-P1]: (1) judges from
**disjoint model families** reduce intra-model bias vs a single judge —
direct support for vendor-diverse rosters; (2) a panel of smaller judges
was **7–8× cheaper** than a single GPT-4 judge (April-2024 pricing)
[P1][ref-P1]. The accuracy claim — small-model panels *beat* a single
frontier judge — was **[refuted]** (1-2 vote; disputed by later work)
[P1][ref-P1]. Cost/bias benefits: yes. Accuracy benefit: unproven. The
LLMs-as-judges survey (Li et al.) cites PoLL's max-vote/average-pooling
aggregation as the effective-and-cheaper pattern [P11][ref-P11].

### Self-MoA: diversity is not inherently beneficial **[verified]**

Li et al., ["Rethinking Mixture-of-Agents: Is Mixing Different Large
Language Models Beneficial?"][ref-P5] (peer-reviewed;
[OpenReview K6WwK8URlV](https://openreview.net/forum?id=K6WwK8URlV)):
aggregating repeated samples from the *single best* model beat mixed
multi-model ensembles by **6.6 points on AlpacaEval 2.0** and **3.8% avg
across MMLU/CRUX/MATH** [P5][ref-P5]. Caveat: generation benchmarks with
2024-era open models, not defect-recall in review tasks.

→ The corrective for roster design: **vendor diversity earns its place
through bias reduction and error decorrelation, not an assumed quality
boost. Never add a weaker model purely for diversity.**

---

## 3. Unverified leads worth knowing (not put through verification)

These come from fetched primary sources but were outside the top-25
verification budget. Treat as strong hypotheses.

- **Cross-model agreement is a weak correctness signal.** Kim et al.,
  ["Correlated Errors in Large Language Models"][ref-P7] (evaluation of
  >350 LLMs): when two models both err, they pick the *same wrong answer*
  ~60% of the time; shared architectures and providers drive correlation,
  and *frontier models correlate more with each other*, even across
  vendors. Kohli, ["Nine Judges, Two Effective Votes"][ref-P14]: items
  where all 9 judges unanimously agree still carry a ~9.1% error rate (vs
  ~0.02% if errors were independent); judges 6–9 add only +0.22 effective
  votes; correlated errors cost panels 8–22 accuracy points vs the
  Condorcet ideal. Turkmen et al., ["Don't Always Pick the
  Highest-Performing Model"][ref-P9]: ensemble accuracy saturates at a
  nonzero error floor, top-k-by-accuracy selection is unreliable under
  correlated errors, and information-based member selection beats it at
  k=3–7.
  → Strongly supports the skill's existing "agreement is evidence, not
  truth" rule, and suggests demoting agreement even further relative to
  repo verification.
- **Debate rounds actively destroy evidence.** Wan et al., ["The
  Deliberative Illusion: Diagnosing Factual Attrition and Stance
  Homogenization in Multi-Agent LLM Deliberation"][ref-P6]: issue-critical
  facts drop 21.7–72.4% by the final round; inter-agent communication
  itself amplifies the loss (GPT-4.1 retains far more with no
  interaction); agent stances homogenize far beyond human discussions
  ("agree more while knowing less"); heterogeneous panels slow but don't
  stop the attrition. Smit et al., ["Should we be going MAD?"][ref-P12]
  (ICML 2024): multi-agent debate does **not** reliably beat
  self-consistency or simple ensembling, and is hyperparameter-sensitive.
  Wang et al., ["Rethinking the Bounds of LLM Reasoning: Are Multi-Agent
  Discussions the Key?"][ref-P13] (ACL 2024): a single agent with strong
  prompts matches multi-agent discussion across reasoning tasks. Related:
  sycophancy makes debate teams discard correct reasoning [C12][ref-C12];
  isolated self-correction beats unguided homogeneous debate
  [C13][ref-C13].
  → The skill's single-shot blind design is the right default; treat any
  debate feature as high-risk.
- **The *structure* of disagreement is informative.** Jiang, ["DiscoUQ:
  Structured Disagreement Analysis for Uncertainty Quantification in LLM
  Agent Ensembles"][ref-P8]: when minority agents introduce *genuinely new
  evidence*, the majority is less reliable at the same vote margin; late
  divergence on shared evidence means the majority is usually right.
  Disagreement-structure analysis beat vote counting for confidence
  estimation (AUROC 0.802 vs 0.791, ECE 0.036 vs 0.098). Panel-size
  ablation: disagreement signal improves monotonically 3→5 agents. Cost
  pattern: run the extra analysis only on non-unanimous items [P8][ref-P8].
- **Cascade cost controls.** Chen et al., ["FrugalGPT"][ref-P15]:
  try-cheap-first with escalation can match frontier accuracy at up to 98%
  lower cost. Madeyski, ["Triage: Routing Software Engineering Tasks to
  Cost-Effective LLM Tiers via Code Quality Signals"][ref-P16]: a concrete
  break-even rule — a cheap tier pays off only if its pass rate on routed
  tasks exceeds the cheap/heavy cost ratio (~20% for a Haiku→Opus pair at
  2026 API pricing); safest when an *objective* gate (tests, linter)
  checks the cheap tier's output. Practitioner OpenRouter PR-review setups
  document the same cheap-first pattern [W1][ref-W1].
- **Full-panel calibration beats top-k selection.** Li, ["Calibrate, Don't
  Curate: Label-Efficient Estimation from Noisy LLM Judges"][ref-P10]:
  with a small labeled calibration set (75 examples), keeping *all* judges
  — even weak ones, vote-flipped when reliably wrong (a "Calibrated Jury
  Theorem") — outperforms curating the top-k. Not directly actionable for
  this skill (no labeled ground truth per run), but relevant once the
  outcome archive accumulates verified/refuted outcomes across runs — that
  archive *is* a calibration set.

---

## 4. Scorecard: skill design vs prior art

| Skill design decision | Verdict from research |
|---|---|
| Blind parallel first round, no debate | **Validated** (bandwagon bias [C3][ref-C3]; fact-erasure in deliberation [P6][ref-P6]; MAD ≯ ensembling [P12][ref-P12]) |
| Vendor-diverse roster | **Validated, with corrected rationale**: bias reduction + partial error decorrelation [P1][ref-P1][P2][ref-P2] — *not* a recall/quality booster (Self-MoA [P5][ref-P5]; refuted complementary-defects claims [G3][ref-G3]) |
| Anthropic excluded from default council | **Validated** (self-preference bias [P2][ref-P2][C2][ref-C2]; self-family win rates 75–84% [C5][ref-C5][C6][ref-C6]) |
| In-session synthesis + repo verification | **Novel vs all prior art surveyed** [G1][ref-G1]–[G4][ref-G4] — and the correct antidote to correlated-error false consensus [P7][ref-P7] |
| `verified > severity > agreement > confidence` ranking | **Validated**; error-correlation leads suggest agreement deserves even less weight than intuition says [P7][ref-P7][P14][ref-P14] |
| Dissent preservation / minority reports | **Validated** (ChatEval pattern [G2][ref-G2]; DiscoUQ: minority novelty predicts majority error [P8][ref-P8]) |
| Conservative under-merging in clustering | Consistent with dissent-preservation evidence; no direct study found |
| Identical rubric for all members (default) | **Tension**: ChatEval ablation says identical roles degrade performance [C1][ref-C1]; pelednoam uses distinct lenses [G3][ref-G3]. But agreement counting requires identical assignments. See Proposal 3 |
| Two-tier budget gate | No direct prior art comparison; cascade literature offers a *complementary* pattern [P15][ref-P15][P16][ref-P16] (Proposal 5) |
| Synthesizer sees member identities | **Gap** — llm-council anonymizes for exactly this bias [G1][ref-G1]; see Proposal 1 |
| Fixed council size 4 (3 budget / 5 max) | Weakly supported: disagreement-signal ablation favors 4–5 over 3 [P8][ref-P8]; saturation says bigger ≠ better [P9][ref-P9][P14][ref-P14]. No verified optimal size exists |

---

## 5. Concrete proposals

Ordered by (evidence strength × effort). Status: **all eight approved by
the maintainer and implemented on the PR #62 branch (2026-07-12)** — see
the commit series `718a233`…`83f9bac` and the sessionlog for the
implementation record.

### P1. Anonymize member identities during synthesis (small, high value)

llm-council anonymizes so models "can't play favorites" [G1][ref-G1]; the
synthesizer here is an LLM with documented brand-prestige and
self-preference biases [P2][ref-P2][C2][ref-C2], previously handed
`reviews/openai-gpt-5.5.json` etc. by name.

- Dispatch writes `reviews/member-A.json` … with the model→letter mapping
  in a separate `roster-key.json` (not in `clusters.json` or the
  `manifest.json` member entries used during synthesis).
- `synthesis.md` steps 1–6 operate on anonymized labels; step 7 (report
  writing) de-anonymizes for attribution.
- This also mechanically enforces the existing `max`-preset rule
  ("discount agreement with your own vendor") — you can't favor what you
  can't identify. Keeps with the repo's **gates-over-rules** principle:
  the rule was prose; anonymization makes it structural.

### P2. Add correlated-error guardrails to the synthesis protocol (docs-only, small)

Step 6 already says "agreement is evidence, not truth". Strengthen with the
quantitative picture (frontier models pick the same wrong answer well above
chance [P7][ref-P7]; unanimity still carries meaningful error rates
[P14][ref-P14]):

- Require repo verification for **unanimous blockers too** (make explicit
  that unanimity grants no exemption).
- Add DiscoUQ-style contested-item triage [P8][ref-P8]: for each contested
  finding, note whether the minority position **introduces new evidence**
  (majority less trustworthy — verify first) or diverges late on shared
  evidence (majority usually right).
- Cite the saturation result [P9][ref-P9] in README design decisions:
  council size stays 4–5 because marginal members mostly duplicate
  correlated errors.

### P3. Resolve the identical-rubric vs distinct-lens tension explicitly (docs + small prompt change)

Evidence pulls both ways: ChatEval's ablation (identical roles degrade)
[C1][ref-C1] and pelednoam's lens design [G3][ref-G3] vs the skill's
agreement-counting requirement. Middle path:

- Keep the identical core rubric as the default (agreement stays valid).
- Promote `--personas` from "experimental and unvalidated" to a documented
  **coverage mode** citing ChatEval + pelednoam as prior art, with its
  already-specified synthesis switch.
- Optional cheap variant to evaluate later: identical rubric + one
  member-specific "pay extra attention to X" line, with agreement counted
  only on the shared rubric. Do not ship without testing — no prior art
  directly validates the hybrid.

### P4. Position-bias hygiene in adjudication (docs-only, tiny)

When step 5 adjudicates a contested item, the synthesis protocol should
instruct: evaluate each position against the repository evidence **before**
reading it side-by-side with its rival, or at minimum consider both
orderings — a swap-and-average analogue [C4][ref-C4]. Repo verification
already blunts this bias; the instruction closes the residual gap for
`uncertain` items where verification is inconclusive.

### P5. Two-stage triage flow as a documented pattern (docs-only now; optional flag later)

Cascade literature (FrugalGPT [P15][ref-P15]; break-even: cheap-tier pass
rate must exceed the cheap/heavy cost ratio [P16][ref-P16]) + PoLL's 7–8×
panel cost result [P1][ref-P1] suggest a usage pattern the skill can
document without code changes:

1. Run `--preset budget` (3 cheaper members).
2. Escalate to `default`/`max` **only if** the budget council produced
   majors/blockers or substantive disagreement — i.e., the escalation
   trigger is an objective property of the first run's clusters.

Later, a `--triage` flag could automate the two runs under one budget gate.
The gate math already handles per-run caps.

### P6. Finding fingerprints for cross-run comparison (code, medium)

Adopt pelednoam's fingerprint idea [G3][ref-G3]: emit a stable fingerprint
per cluster (normalized file path + title tokens) into `clusters.json`.
Enables:

- Cross-run comparison: mark findings as new / persisting / resolved when
  re-reviewing after fixes.
- The stuck-detector pattern: identical blocking fingerprints across two
  consecutive runs → recommend human escalation instead of a third run
  (a cost/termination gate proven in prior art [G3][ref-G3]).

### P7. Outcome archive for future calibration (code, small; pays off later)

The synthesis already produces per-finding `verified/refuted/uncertain`
verdicts — that is labeled ground truth about each member's precision, and
it was previously discarded after the report. Append per-member outcome
counts to a cumulative `~/.local/state/ai-council-review/outcomes.jsonl`.
After enough runs this enables evidence-based roster pruning and
per-member confidence weighting (the calibration literature's full-panel
result [P10][ref-P10]), replacing vibes with data. No behavior change
until the data exists.

### P8. Do NOT add a debate round (explicit non-goal, docs-only)

Multiple independent lines — bandwagon bias [C3][ref-C3], deliberation
fact-erasure [P6][ref-P6], MAD ≯ self-consistency [P12][ref-P12], single
agent matching discussions [P13][ref-P13], and ChatEval's gains being
setup-specific [C1][ref-C1] — say inter-member interaction is the riskiest
and least-proven extension. Record it as an explicit non-goal in the
README's design decisions with citations, so future "make them debate"
feature pressure meets the evidence. If ever revisited: llm-council's
Stage-2 shape (anonymized cross-critique starting from committed
independent findings [G1][ref-G1]) is the only defensible variant, and it
remains an open question (see below).

---

## 6. Open questions the literature does not answer

1. **Does cross-model agreement correlate with finding correctness in code
   review specifically?** No surviving quantitative claim. The skill's own
   outcome archive (P7) can answer this for itself over time.
2. **Optimal council size** for review tasks — no surviving claim; ablation
   hints 4–5 > 3 for disagreement signal [P8][ref-P8], saturation says
   more ≠ better [P9][ref-P9][P14][ref-P14].
3. **Blind round + anonymized cross-critique vs pure single round** —
   untested head-to-head anywhere.
4. **Does Self-MoA transfer to review?** Would 4 samples of the single best
   reviewer beat the 4-vendor council on defect recall [P5][ref-P5]? Cheap
   to A/B with the existing `--models` flag (same slug 4×, temperature > 0)
   once there is an evaluation set.

## 7. Refuted claims — do not cite these in the skill's docs

All killed by 2/3+ adversarial refutation votes in this research pass:

- Vendor-diverse reviewers catch complementary, non-overlapping defects
  (anecdote, no data) [G3][ref-G3].
- MoA with open-source models beats GPT-4o on AlpacaEval (65.1% vs 57.5%)
  [G4][ref-G4][P4][ref-P4].
- PoLL small-model panels *outperform* a single GPT-4 judge on accuracy
  [P1][ref-P1].
- Self-preference bias is driven by text familiarity/perplexity
  [P2][ref-P2].
- Specific self-enhancement consistency figures (0.688 ChatGPT / 0.610
  Claude-3.5) as evidence for vendor diversity [P3][ref-P3].
- "Collaborativeness": models improve when shown other models' outputs even
  from weaker models [P4][ref-P4].
- Proposer diversity beats repeated sampling of one model (MoA's 61.3% vs
  56.7% ablation) [P4][ref-P4].
- Synthesis-style aggregation beats selection-style aggregation (1-2 vote,
  disputed) [P4][ref-P4].

## 8. Caveats and source-quality notes

Three gaps in the surviving evidence: (1) no surviving claim demonstrates
that cross-vendor diversity improves defect *recall* in review tasks —
diversity's verified benefit is bias reduction only; (2) whether agreement
correlates with correctness, and the optimal panel size, produced no
surviving quantitative claims; (3) debate-vs-independent-review has no
direct verified head-to-head.

Source-quality: [G3][ref-G3] is a 0-star personal repo (design prior art,
zero adoption evidence); PoLL's 7–8× cost figure is April-2024 pricing
with GPT-4 as baseline [P1][ref-P1]; the 0.520 self-preference score uses
a 2023-era GPT-4 judge against mostly weak peers [P2][ref-P2]; Self-MoA
uses 2024-era open models on generation benchmarks, not frontier models on
review tasks [P5][ref-P5]; llm-council is self-described as a Saturday
hack [G1][ref-G1]. Benchmark-derived numbers (6.6pt, 3.8%, 0.520, 7–8×,
9.1%, 60%) are setup-specific — cite as paper findings, not constants.

## 9. Sources

Verification stats: 21 sources fetched, 102 claims extracted, top 25
verified with 3 adversarial refutation votes each → 17 confirmed / 8
refuted. Findings above carry per-claim citations; tokens below.

### Implementations (fetched)

- **[G1]** Karpathy, A. — *llm-council* (GitHub). <https://github.com/karpathy/llm-council>
- **[G2]** Chan, C. et al. — *ChatEval* (GitHub). <https://github.com/chanchimin/ChatEval>
- **[G3]** Peled, N. — *multi-model-code-review-agent* (GitHub). <https://github.com/pelednoam/multi-model-code-review-agent>
- **[G4]** Together AI — *MoA: Mixture-of-Agents* (GitHub). <https://github.com/togethercomputer/moa>

### Papers & project pages (fetched)

- **[P1]** Verga, P. et al. (2024). *Replacing Judges with Juries: Evaluating LLM Generations with a Panel of Diverse Models.* arXiv:2404.18796. <https://arxiv.org/abs/2404.18796>
- **[P2]** Wataoka, K. et al. (2024). *Self-Preference Bias in LLM-as-a-Judge.* arXiv:2410.21819. <https://arxiv.org/abs/2410.21819>
- **[P3]** *CALM: Quantifying Biases in LLM-as-a-Judge* — project site for Ye et al. [C3]. <https://llm-judge-bias.github.io/>
- **[P4]** Wang, J. et al. (2024). *Mixture-of-Agents Enhances Large Language Model Capabilities.* arXiv:2406.04692. <https://arxiv.org/abs/2406.04692>
- **[P5]** Li, W. et al. (2025). *Rethinking Mixture-of-Agents: Is Mixing Different Large Language Models Beneficial?* arXiv:2502.00674. <https://arxiv.org/abs/2502.00674>
- **[P6]** Wan, R. et al. (2026). *The Deliberative Illusion: Diagnosing Factual Attrition and Stance Homogenization in Multi-Agent LLM Deliberation.* arXiv:2606.03032. <https://arxiv.org/abs/2606.03032>
- **[P7]** Kim, J. et al. (2025). *Correlated Errors in Large Language Models.* arXiv:2506.07962. <https://arxiv.org/abs/2506.07962>
- **[P8]** Jiang, L. (2026). *DiscoUQ: Structured Disagreement Analysis for Uncertainty Quantification in LLM Agent Ensembles.* arXiv:2603.20975. <https://arxiv.org/abs/2603.20975>
- **[P9]** Turkmen, K. et al. (2026). *Don't Always Pick the Highest-Performing Model: An Information Theoretic View of LLM Ensemble Selection.* arXiv:2602.08003. <https://arxiv.org/abs/2602.08003>
- **[P10]** Li, S. (2026). *Calibrate, Don't Curate: Label-Efficient Estimation from Noisy LLM Judges.* arXiv:2605.09702. <https://arxiv.org/abs/2605.09702>
- **[P11]** Li, H. et al. (2024). *LLMs-as-Judges: A Comprehensive Survey on LLM-based Evaluation Methods.* arXiv:2412.05579. <https://arxiv.org/abs/2412.05579>
- **[P12]** Smit, A. et al. (2024). *Should we be going MAD? A Look at Multi-Agent Debate Strategies for LLMs.* ICML 2024; arXiv:2311.17371. <https://arxiv.org/abs/2311.17371>
- **[P13]** Wang, Q. et al. (2024). *Rethinking the Bounds of LLM Reasoning: Are Multi-Agent Discussions the Key?* ACL 2024. <https://aclanthology.org/2024.acl-long.331/>
- **[P14]** Kohli, N. (2026). *Nine Judges, Two Effective Votes: Correlated Errors Undermine LLM Evaluation Panels.* arXiv:2605.29800. <https://arxiv.org/abs/2605.29800>
- **[P15]** Chen, L., Zaharia, M., Zou, J. (2023). *FrugalGPT: How to Use Large Language Models While Reducing Cost and Improving Performance.* arXiv:2305.05176. <https://arxiv.org/abs/2305.05176>
- **[P16]** Madeyski, L. (2026). *Triage: Routing Software Engineering Tasks to Cost-Effective LLM Tiers via Code Quality Signals.* arXiv:2604.07494. <https://arxiv.org/abs/2604.07494>

### Practitioner (fetched)

- **[W1]** issy929 (dev.to). *AI-Powered Code Reviews with OpenRouter: Complete PR Agent Setup Guide.* <https://dev.to/issy929/ai-powered-code-reviews-with-openrouter-complete-pr-agent-setup-guide-5m3>

### Corroborating references (verifier-cited during adversarial verification; not part of the 21-source fetch sweep)

- **[C1]** Chan, C. et al. (2023). *ChatEval: Towards Better LLM-based Evaluators through Multi-Agent Debate.* arXiv:2308.07201. <https://arxiv.org/abs/2308.07201>
- **[C2]** Panickssery, A. et al. (2024). *LLM Evaluators Recognize and Favor Their Own Generations.* arXiv:2404.13076. <https://arxiv.org/abs/2404.13076>
- **[C3]** Ye, J. et al. (2024). *Justice or Prejudice? Quantifying Biases in LLM-as-a-Judge.* arXiv:2410.02736. <https://arxiv.org/abs/2410.02736>
- **[C4]** Shi, L. et al. (2024). *Judging the Judges: A Systematic Study of Position Bias in LLM-as-a-Judge.* arXiv:2406.07791. <https://arxiv.org/abs/2406.07791>
- **[C5]** Soumik, M. (2026). *Judging the Judges: A Systematic Evaluation of Bias Mitigation Strategies in LLM-as-a-Judge Pipelines.* arXiv:2604.23178. <https://arxiv.org/abs/2604.23178>
- **[C6]** Chen, Z. et al. (2025). *Beyond the Surface: Measuring Self-Preference in LLM Judgments.* arXiv:2506.02592. <https://arxiv.org/abs/2506.02592>
- **[C7]** Chen, W. et al. (2025). *Do LLM Evaluators Prefer Themselves for a Reason?* arXiv:2504.03846. <https://arxiv.org/abs/2504.03846>
- **[C8]** Wang, Y. et al. (2025). *Assessing Judging Bias in Large Reasoning Models: An Empirical Study.* arXiv:2504.09946. <https://arxiv.org/abs/2504.09946>
- **[C9]** Zhao, X. et al. (2026). *Bias in the Loop: Auditing LLM-as-a-Judge for Software Engineering.* arXiv:2604.16790. <https://arxiv.org/abs/2604.16790>
- **[C10]** Zhou, F. et al. (2026). *Toward Robust LLM-Based Judges: Taxonomic Bias Evaluation and Debiasing Optimization.* arXiv:2603.08091. <https://arxiv.org/abs/2603.08091>
- **[C11]** Xu, D. et al. (2026). *Ask the Right Comparison: Bias-Aware Bayesian Active Top-k Ranking with LLM Judges.* arXiv:2607.02104. <https://arxiv.org/abs/2607.02104>
- **[C12]** Yao, Z. et al. (2025). *Peacemaker or Troublemaker: How Sycophancy Shapes Multi-Agent Debate.* arXiv:2509.23055. <https://arxiv.org/abs/2509.23055>
- **[C13]** Bertalanič, B. et al. (2026). *The Cost of Consensus: Isolated Self-Correction Prevails Over Unguided Homogeneous Multi-Agent Debate.* arXiv:2605.00914. <https://arxiv.org/abs/2605.00914>

[ref-G1]: https://github.com/karpathy/llm-council
[ref-G2]: https://github.com/chanchimin/ChatEval
[ref-G3]: https://github.com/pelednoam/multi-model-code-review-agent
[ref-G4]: https://github.com/togethercomputer/moa
[ref-P1]: https://arxiv.org/abs/2404.18796
[ref-P2]: https://arxiv.org/abs/2410.21819
[ref-P3]: https://llm-judge-bias.github.io/
[ref-P4]: https://arxiv.org/abs/2406.04692
[ref-P5]: https://arxiv.org/abs/2502.00674
[ref-P6]: https://arxiv.org/abs/2606.03032
[ref-P7]: https://arxiv.org/abs/2506.07962
[ref-P8]: https://arxiv.org/abs/2603.20975
[ref-P9]: https://arxiv.org/abs/2602.08003
[ref-P10]: https://arxiv.org/abs/2605.09702
[ref-P11]: https://arxiv.org/abs/2412.05579
[ref-P12]: https://arxiv.org/abs/2311.17371
[ref-P13]: https://aclanthology.org/2024.acl-long.331/
[ref-P14]: https://arxiv.org/abs/2605.29800
[ref-P15]: https://arxiv.org/abs/2305.05176
[ref-P16]: https://arxiv.org/abs/2604.07494
[ref-W1]: https://dev.to/issy929/ai-powered-code-reviews-with-openrouter-complete-pr-agent-setup-guide-5m3
[ref-C1]: https://arxiv.org/abs/2308.07201
[ref-C2]: https://arxiv.org/abs/2404.13076
[ref-C3]: https://arxiv.org/abs/2410.02736
[ref-C4]: https://arxiv.org/abs/2406.07791
[ref-C5]: https://arxiv.org/abs/2604.23178
[ref-C6]: https://arxiv.org/abs/2506.02592
[ref-C7]: https://arxiv.org/abs/2504.03846
[ref-C8]: https://arxiv.org/abs/2504.09946
[ref-C9]: https://arxiv.org/abs/2604.16790
[ref-C10]: https://arxiv.org/abs/2603.08091
[ref-C11]: https://arxiv.org/abs/2607.02104
[ref-C12]: https://arxiv.org/abs/2509.23055
[ref-C13]: https://arxiv.org/abs/2605.00914
