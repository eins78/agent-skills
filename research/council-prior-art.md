# Prior Art Research: Multi-Model LLM Council Review

Deep-research round on prior art for the `ai-council-review` skill (PR #62),
run 2026-07-12. Method: 5-angle web-search fan-out → 21 sources fetched →
102 claims extracted → top 25 adversarially verified (3 independent
refutation votes each) → 17 confirmed, 8 refuted. Findings below are
labeled **[verified]** (survived 3-vote adversarial verification),
**[refuted]** (killed by verification — listed because they are commonly
believed), or **[unverified lead]** (extracted from a primary source but not
put through the verification stage; treat as promising, not established).

Skill state at time of research: v0.1.0 as merged into the PR branch —
blind parallel fan-out to ~4 vendor-diverse frontier models via OpenRouter,
conservative mechanical clustering, in-session synthesis with repo
verification, dissent preservation, ranking `verified > severity >
agreement > confidence`, two-tier budget gate.

---

## 1. Closest prior art (systems)

### Karpathy's llm-council **[verified]**

<https://github.com/karpathy/llm-council> — the closest architectural
sibling. Three stages: (1) parallel fan-out of the same query to all
council LLMs, (2) **anonymized** peer cross-review — outputs relabeled
"Response A/B/C" explicitly so models "can't play favorites", (3) a
designated Chairman model synthesizes. Default roster is exactly 4
vendor-diverse frontier models via OpenRouter, same pattern as this skill.

Differences: llm-council uses LLM cross-*ranking* where this skill uses
mechanical clustering; its Chairman synthesizes without ground-truth
verification (this skill's repo-verification step is genuinely novel
relative to it). Caveat: self-described "99% vibe coded Saturday hack" —
architecture prior art, zero efficacy evidence.

**Transferable idea: anonymize member identities during synthesis** (see
Proposal 1).

### ChatEval **[verified]**

<https://github.com/chanchimin/ChatEval>, arXiv:2308.07201 — multi-agent
*debate* evaluation with a different diversity strategy: same underlying
model, distinct **personas** via role-description prompts, 2 debate turns,
sequential. Two load-bearing results:

- Disagreement is explicitly preserved — each referee renders an
  independent judgment ("you are not required to output the same value as
  other referees"); aggregation (majority vote / averaging) is post-hoc.
  Matches this skill's dissent-preservation design.
- **Ablation: identical role descriptions degrade performance** — some
  induced reviewer diversity is load-bearing. Relevant to the skill's
  `--personas` flag (currently "experimental and unvalidated").

### pelednoam/multi-model-code-review-agent **[verified]**

<https://github.com/pelednoam/multi-model-code-review-agent> — a working
multi-model *code review* pipeline (caveat: 0-star personal repo; design
prior art, no adoption evidence). Two transferable patterns:

1. **Distinct review lens per member** (security / correctness / readability-
   performance / spec-compliance) across 3 vendors, each blind in an
   isolated process with no conversation history — preventing
   author-rationale contamination.
2. **Finding fingerprints as a stuck-detector**: findings are fingerprinted
   for cross-round aggregation; identical blocking findings two consecutive
   rounds → exit code 2 → "human judgment needed". A concrete termination /
   cost control for iterative use.

Note: the same repo's claim that its vendor-diverse reviewers catch
*complementary, non-overlapping* defects was **[refuted]** (anecdotal, no
evaluation).

### Mixture-of-Agents (Together AI) **[verified architecture, refuted performance]**

<https://github.com/togethercomputer/moa>, arXiv:2406.04692 — validates the
fan-out-plus-synthesizer *shape* at the same scale (quickstart: 4 proposers,
1 aggregator, 2 layers). But **all four of MoA's stronger claims failed
adversarial verification** in this research pass: beating GPT-4o on
AlpacaEval, diversity-beats-repeated-sampling, "collaborativeness" from
weaker models, and synthesis-beats-selection. Do not cite MoA as evidence
that mixing models improves quality.

---

## 2. What the bias literature establishes

### Self-preference bias is real and severe **[verified]**

arXiv:2404.13076 / 2410.21819: among eight evaluators tested, GPT-4 showed
the strongest self-preference (bias score 0.520; recall 0.945 favoring own
outputs vs 0.425 opposing). Corroborated by later work measuring
**self-family win rates of 75–84%** in pairwise judging, reduced by
cross-provider judging. Ensemble evaluation across vendors is the
literature's proposed mitigation.

→ Directly validates two existing skill decisions: vendor-diverse roster,
and excluding the synthesizer's own vendor (Anthropic) from the default
council. The `max` preset's "discount same-vendor pairwise agreement" rule
is also supported.

Note the *mechanism* claims did not survive: "familiarity/perplexity drives
self-preference" was **[refuted]**, and one specific self-enhancement
measurement (consistency 0.688/0.610) was **[refuted]** as misread from the
source. The phenomenon is solid; pop-science explanations of it are not.

### Bandwagon and position bias dictate protocol details **[verified]**

- **Bandwagon bias**: LLM judges shift toward an embedded majority opinion
  regardless of correctness (GPT-4-Turbo resisted injected false majorities
  only ~73% of the time; replicated across reasoning models and code-task
  judging). → Supports **blind, parallel first-round review** — exactly what
  the skill does. Any future "debate round" must start from committed
  independent findings.
- **Position bias**: swapping candidate order changes verdicts (~10–15 point
  win-rate swings on close calls). Standard mitigation is swap-and-average /
  order randomization. → Relevant wherever the synthesizer weighs two
  members' contradicting positions (see Proposal 4).

### PoLL (Panel of LLM judges) **[verified, with one refuted part]**

arXiv:2404.18796: (1) judges from **disjoint model families** reduce
intra-model bias vs a single judge — direct support for vendor-diverse
rosters; (2) a panel of smaller judges was **7–8× cheaper** than a single
GPT-4 judge (April-2024 pricing). The accuracy claim — small-model panels
*beat* a single frontier judge — was **[refuted]** (1-2 vote; disputed by
later work). Cost/bias benefits: yes. Accuracy benefit: unproven.

### Self-MoA: diversity is not inherently beneficial **[verified]**

arXiv:2502.00674 (peer-reviewed): aggregating repeated samples from the
*single best* model beat mixed multi-model ensembles by **6.6 points on
AlpacaEval 2.0** and **3.8% avg across MMLU/CRUX/MATH**. Caveat: generation
benchmarks with 2024-era open models, not defect-recall in review tasks.

→ The corrective for roster design: **vendor diversity earns its place
through bias reduction and error decorrelation, not an assumed quality
boost. Never add a weaker model purely for diversity.**

---

## 3. Unverified leads worth knowing (not put through verification)

These come from fetched primary sources but were outside the top-25
verification budget. Treat as strong hypotheses.

- **Cross-model agreement is a weak correctness signal.** Large-scale
  studies of LLM error correlation (arXiv:2506.07962 and related): when two
  models both err, they pick the *same wrong answer* ~60% of the time; items
  where all 9 judges unanimously agree still carry a ~9.1% error rate (vs
  ~0.02% if errors were independent); *frontier models correlate more with
  each other*, even across vendors/architectures. Correlated errors cost
  panels 8–22 accuracy points vs the Condorcet ideal, and ensemble accuracy
  saturates — adding members converges to a nonzero error floor.
  → Strongly supports the skill's existing "agreement is evidence, not
  truth" rule, and suggests demoting agreement even further relative to
  repo verification.
- **Debate rounds actively destroy evidence.** Multi-round deliberation
  studies (arXiv ~2606.03032): issue-critical facts drop 21.7–72.4% by the
  final round; inter-agent communication itself amplifies the loss (GPT-4.1
  retains far more with no interaction); agent stances homogenize far beyond
  human discussions ("agree more while knowing less"); heterogeneous panels
  slow but don't stop the attrition. Plus ICML 2024 "Should we be going
  MAD?" (arXiv:2311.17371): multi-agent debate does **not** reliably beat
  self-consistency or simple ensembling, and is hyperparameter-sensitive.
  → The skill's single-shot blind design is the right default; treat any
  debate feature as high-risk.
- **The *structure* of disagreement is informative** (DiscoUQ,
  arXiv ~2603.20975): when minority agents introduce *genuinely new
  evidence*, the majority is less reliable at the same vote margin; late
  divergence on shared evidence means the majority is usually right.
  Disagreement-structure analysis beat vote counting for confidence
  estimation (AUROC 0.802 vs 0.791, ECE 0.036 vs 0.098). Panel-size
  ablation: disagreement signal improves monotonically 3→5 agents.
  Cost pattern: run the extra analysis only on non-unanimous items.
- **Cascade cost controls** (FrugalGPT, arXiv:2305.05176 + practitioner
  write-ups): try-cheap-first with escalation can match frontier accuracy at
  a fraction of cost; a concrete break-even rule — a cheap tier pays off only
  if its pass rate on routed tasks exceeds the cheap/heavy cost ratio; safest
  when an *objective* gate (tests, linter) checks the cheap tier's output.
- **Full-panel calibration beats top-k selection** (arXiv ~2605.09702):
  with a small labeled calibration set, keeping *all* judges (even weak
  ones, vote-flipped when reliably wrong) outperforms curating the top-k.
  Not directly actionable for this skill (no labeled ground truth per run),
  but relevant if the skill ever accumulates verified/refuted outcomes
  across runs — that archive *is* a calibration set.

---

## 4. Scorecard: current skill vs prior art

| Skill design decision | Verdict from research |
|---|---|
| Blind parallel first round, no debate | **Validated** (bandwagon bias; fact-erasure in deliberation; MAD ≯ ensembling) |
| Vendor-diverse roster | **Validated, with corrected rationale**: bias reduction + partial error decorrelation — *not* a recall/quality booster (Self-MoA; refuted complementary-defects claims) |
| Anthropic excluded from default council | **Validated** (self-preference bias; self-family win rates 75–84%) |
| In-session synthesis + repo verification | **Novel vs all prior art surveyed** — no system found does ground-truth verification; it is also the correct antidote to correlated-error false consensus |
| `verified > severity > agreement > confidence` ranking | **Validated**; error-correlation leads suggest agreement deserves even less weight than intuition says |
| Dissent preservation / minority reports | **Validated** (ChatEval pattern; DiscoUQ: minority novelty predicts majority error) |
| Conservative under-merging in clustering | Consistent with dissent-preservation evidence; no direct study found |
| Identical rubric for all members (default) | **Tension**: ChatEval ablation says identical roles degrade performance; pelednoam uses distinct lenses. But agreement counting requires identical assignments. See Proposal 3 |
| Two-tier budget gate | No direct prior art comparison; cascade literature offers a *complementary* pattern (Proposal 5) |
| Synthesizer sees member identities | **Gap** — llm-council anonymizes for exactly this bias; see Proposal 1 |
| Fixed council size 4 (3 budget / 5 max) | Weakly supported: disagreement-signal ablation favors 4–5 over 3; saturation literature says bigger ≠ better. No verified optimal size exists |

---

## 5. Concrete proposals

Ordered by (evidence strength × effort). None are implemented in this PR —
research only.

### P1. Anonymize member identities during synthesis (small, high value)

llm-council anonymizes so models "can't play favorites"; the synthesizer
here is an LLM with documented brand-prestige and self-preference biases,
currently handed `reviews/openai-gpt-5.5.json` etc. by name.

- Dispatch writes `reviews/member-A.json` … with the model→letter mapping
  in a separate `roster-key.json` (not in `clusters.json` or `manifest.json`
  member entries used during synthesis).
- `synthesis.md` steps 1–6 operate on anonymized labels; step 7 (report
  writing) de-anonymizes for attribution.
- This also mechanically enforces the existing `max`-preset rule
  ("discount agreement with your own vendor") — you can't favor what you
  can't identify. Keeps with the repo's **gates-over-rules** principle:
  today that rule is prose; anonymization makes it structural.

### P2. Add correlated-error guardrails to the synthesis protocol (docs-only, small)

Step 6 already says "agreement is evidence, not truth". Strengthen with the
quantitative picture (frontier models pick the same wrong answer well above
chance; unanimity still carries meaningful error rates):

- Require repo verification for **unanimous blockers too** (currently all
  majors/blockers — make explicit that unanimity grants no exemption).
- Add DiscoUQ-style contested-item triage: for each contested finding, note
  whether the minority position **introduces new evidence** (majority less
  trustworthy — verify first) or diverges late on shared evidence (majority
  usually right).
- Cite the saturation result in README design decisions: council size stays
  4–5 because marginal members mostly duplicate correlated errors.

### P3. Resolve the identical-rubric vs distinct-lens tension explicitly (docs + small prompt change)

Evidence pulls both ways: ChatEval's ablation (identical roles degrade) and
pelednoam's lens design vs the skill's agreement-counting requirement.
Middle path:

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
orderings — a swap-and-average analogue. Repo verification already blunts
this bias; the instruction closes the residual gap for `uncertain` items
where verification is inconclusive.

### P5. Two-stage triage flow as a documented pattern (docs-only now; optional flag later)

Cascade literature (FrugalGPT; break-even: cheap-tier pass rate must exceed
the cheap/heavy cost ratio) + PoLL's 7–8× panel cost result suggest a
usage pattern the skill can document without code changes:

1. Run `--preset budget` (3 cheaper members).
2. Escalate to `default`/`max` **only if** the budget council produced
   majors/blockers or substantive disagreement — i.e., the escalation
   trigger is an objective property of the first run's clusters.

Later, a `--triage` flag could automate the two runs under one budget gate.
The gate math already handles per-run caps.

### P6. Finding fingerprints for cross-run comparison (code, medium)

Adopt pelednoam's fingerprint idea: emit a stable fingerprint per cluster
(normalized file path + line bucket + title tokens) into `clusters.json`.
Enables:

- `--compare <prev-run-dir>`: mark findings as new / persisting / resolved
  when re-reviewing after fixes.
- The stuck-detector pattern: identical blocking fingerprints across two
  consecutive runs → recommend human escalation instead of a third run
  (a cost/termination gate proven in prior art).

### P7. Outcome archive for future calibration (code, small; pays off later)

The synthesis already produces per-finding `verified/refuted/uncertain`
verdicts — that is labeled ground truth about each member's precision, and
it is currently discarded after the report. Append per-member outcome
counts to a cumulative `~/.local/state/ai-council-review/outcomes.jsonl`.
After enough runs this enables evidence-based roster pruning and
per-member confidence weighting (the calibration literature's full-panel
result), replacing vibes with data. No behavior change until the data
exists.

### P8. Do NOT add a debate round (explicit non-goal, docs-only)

Multiple independent lines (bandwagon bias, deliberation fact-erasure,
MAD ≯ self-consistency, ChatEval's gains being setup-specific) say
inter-member interaction is the riskiest and least-proven extension.
Record it as an explicit non-goal in the README's design decisions with
citations, so future "make them debate" feature pressure meets the
evidence. If ever revisited: llm-council's Stage-2 shape (anonymized
cross-critique starting from committed independent findings) is the only
defensible variant, and it remains an open question (see below).

---

## 6. Open questions the literature does not answer

1. **Does cross-model agreement correlate with finding correctness in code
   review specifically?** No surviving quantitative claim. The skill's own
   outcome archive (P7) could answer this for itself over time.
2. **Optimal council size** for review tasks — no surviving claim; ablation
   hints 4–5 > 3 for disagreement signal, saturation says more ≠ better.
3. **Blind round + anonymized cross-critique vs pure single round** —
   untested head-to-head anywhere.
4. **Does Self-MoA transfer to review?** Would 4 samples of the single best
   reviewer beat the 4-vendor council on defect recall? Cheap to A/B with
   the existing `--models` flag (same slug 4×, temperature > 0) once there
   is an evaluation set.

## 7. Refuted claims — do not cite these in the skill's docs

All killed by 2/3+ adversarial refutation votes in this research pass:

- Vendor-diverse reviewers catch complementary, non-overlapping defects
  (anecdote, no data).
- MoA with open-source models beats GPT-4o on AlpacaEval (65.1% vs 57.5%).
- PoLL small-model panels *outperform* a single GPT-4 judge on accuracy.
- Self-preference bias is driven by text familiarity/perplexity.
- Specific self-enhancement consistency figures (0.688 ChatGPT / 0.610
  Claude-3.5) as evidence for vendor diversity.
- "Collaborativeness": models improve when shown other models' outputs even
  from weaker models.
- Proposer diversity beats repeated sampling of one model (MoA's 61.3% vs
  56.7% ablation).
- Synthesis-style aggregation beats selection-style aggregation (1-2 vote,
  disputed).

## 8. Sources

Primary sources fetched and used (per-claim citations inline above):
karpathy/llm-council · chanchimin/ChatEval + arXiv:2308.07201 ·
pelednoam/multi-model-code-review-agent · togethercomputer/moa +
arXiv:2406.04692 · arXiv:2404.18796 (PoLL) · arXiv:2404.13076 +
2410.21819 (self-preference) · llm-judge-bias.github.io (CALM) +
arXiv:2410.02736 · arXiv:2406.07791 · arXiv:2502.00674 (Self-MoA) ·
arXiv:2311.17371 (MAD, ICML 2024) · arXiv:2305.05176 (FrugalGPT) ·
plus error-correlation / disagreement-structure / calibration preprints
cited in §3 (unverified-lead tier).

Verification stats: 21 sources, 102 claims extracted, 25 verified with 3
adversarial votes each → 17 confirmed / 8 refuted; findings above marked
accordingly.
