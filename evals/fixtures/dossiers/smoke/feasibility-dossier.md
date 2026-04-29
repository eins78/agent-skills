---
framing-mode: personal
---

<!--
  Section-order rule: Glossary stays at top (read-support); Sources stays at end (trust-support).
  See skills/dossier/SKILL.md §SYNTHESIZE for the rationale.
-->

# Dossier: Evals for PR #43 — applicability and stack

**Date:** 2026-04-18
**Author:** Claude Code (research commissioned by [Max][ref-auth])
**Status:** Research complete — awaiting decision via [companion ballot](./DOSSIER-Dossier-Evals-Applicability-BALLOT-Max.md)

---

## Key Facts

| | |
|---|---|
| **Who decides** | Max (solo, personal repo [eins78/agent-skills][ref-repo]) |
| **Decision model** | Single async decider; recommending-author-plus-approver. Dossier recommends, ballot records |
| **Deadline** | No hard deadline. Soft: before next iteration on `dossier` or `ballot` skills |
| **Audience** | Max, reading this dossier on an iPad or in a chat handoff; future-self when re-opening `agent-skills` months from now |
| **Hard constraints** | (a) must not block [PR #43][ref-pr43] from shipping; (b) must fit a personal-repo maintenance budget (no 24/7 CI ops); (c) stack must work with the repo's existing pnpm + TypeScript + [changesets][ref-changesets] setup |
| **Load-bearing claim 1** | [Quatico PR #12][ref-q12] is Max's own prior art — same author, same ecosystem — so "Quatico stack" and "personal stack" aren't organizationally different choices, just design choices |
| **Load-bearing claim 2** | PR #43's polish pass already deleted 6 grep-based hooks as overfit and replaced them with two human-readable reviewer checklists ([dossier][ref-dcheck], [ballot][ref-bcheck]). Most eval-shaped gaps are already covered — by a live hook OR a checklist |
| **Load-bearing claim 3** | [evalite][ref-evalite] at [v0.19.0][ref-evalitever] is TS-native on top of [Vitest][ref-vitest] with LLM-as-judge scorers built in — lowest integration friction for this specific repo |

---

## Key Concepts

| Term | What it is | Learn more |
|------|-----------|------------|
| **Eval harness** | A program that runs a skill or prompt against a fixed set of inputs and scores the outputs for regressions | [Anthropic: building evals][ref-anthropic-evals] · [Hamel Husain: eval-driven development][ref-hamel] |
| **LLM-as-judge** | Using a second LLM call to score a first LLM's output against a rubric (vs. regex/structural assertions) | [Arize: LLM-as-a-judge primer][ref-arize] |
| **Mechanical vs. judgment eval** | Mechanical = regex, AST, structural checks (fast, deterministic). Judgment = requires LLM or human (slow, probabilistic) | [Braintrust: autoevals][ref-autoevals] |
| **Golden dataset** | A curated set of inputs + expected-outputs or expected-properties that an eval harness measures against | [OpenAI Cookbook: evals][ref-oai-evals] |
| **Scorer** | A callable returning a score (0–1 or pass/fail) given model output + expected value; evalite's primary primitive | [evalite scorers docs][ref-evalite-scorers] |
| **Regression check** | Comparing a current run's scores against a baseline to detect quality drops from a code change | [evalite: regression tests][ref-evalite-reg] |
| **Reviewer checklist** | A structured list of concerns a human (or judgment-capable model) walks before commit, in lieu of an automated gate | [skills/dossier/references/review-checklist.md][ref-dcheck] |
| **Preflight gate** | A PreToolUse hook that blocks a Write before it happens, vs. PostToolUse alerting after | [Claude Code hooks docs][ref-cc-hooks] |

---

## Management Summary

### Top Recommendations

| Rank | Option | Why | Trade-off |
|------|--------|-----|-----------|
| **1. Yes to evals, but in a follow-up PR — stack: [evalite][ref-evalite]** | Keeps PR #43 shipping; evalite's [Vitest][ref-vitest] foundation slots into the repo's TS + pnpm toolchain with near-zero glue; its [scorer model][ref-evalite-scorers] handles both mechanical and LLM-as-judge checks | Adds a real dep (evalite is still pre-1.0, moving fast); requires writing ~3 scorers and seeding 3–5 golden dossiers |
| **2. Replicate [Quatico PR #12][ref-q12]'s bespoke scenario-runner** | Zero new frameworks; Max already built and iterated on this pattern; [scenario.md + fixture][ref-q12-scenario] is cheap to author | Reinvents what evalite provides; no CI-friendly exit codes; needs custom LLM-as-judge glue via [Anthropic SDK][ref-anthropic-sdk] when judgment metrics are added |
| **3. Do nothing — the two checklists are the eval mechanism** | Lowest cost; honors PR #43's own conclusion that the grep hooks were overfit and that judgment-capable review is the right tool; small-N personal repo doesn't need CI gating | Regression-silent: a future refactor of `dossier` SKILL.md could silently degrade the skill and no automated signal would catch it |

**Recommendation:** **(B) Yes, in a follow-up PR, using [evalite][ref-evalite] v0.19.0 with mechanical + 3 LLM-as-judge metrics.** Ship PR #43 as-is on [its current branch][ref-pr43]; once merged, open a follow-up scoped to an `evals/` directory. Start narrow: three mechanical scorers (framing-mode presence, citation-integrity for reference-links, Key-Facts-box presence) plus three LLM-as-judge scorers (Executive-Summary crispness, source-bias flagging, ballot async-readability). Seed with 3 golden dossiers — [a11y-extension dossier][ref-a11y], any upcoming dossier, plus a deliberately-bad seed. This footprint is adoptable in a single session and earns its keep when `dossier` SKILL.md changes touch semantics — exactly the regressions the two live hooks and two checklists can't catch.

---

## Current State

### What PR #43 ships

Polished state after 4 sessions on branch [`dossier-skill-pitch`][ref-pr43-branch] ([commits visible in PR][ref-pr43-commits]). The relevant artefacts for an eval decision:

| Artefact | Line count | Purpose |
|---|---|---|
| [`skills/dossier/SKILL.md`][ref-dskill] | 140 | Skill source-of-truth; declares FRAME→GATHER→EVALUATE→SYNTHESIZE→DELIVER workflow |
| [`skills/dossier/templates/dossier.md`][ref-dtemplate] | 181 | Canonical dossier structure with section-order rule |
| [`skills/dossier/references/review-checklist.md`][ref-dcheck] | ~180 | 8 judgment items replacing 4 deleted grep hooks |
| [`skills/ballot/SKILL.md`][ref-bskill] | 107 | Ballot skill (new; async-decision framing after post-review polish) |
| [`skills/ballot/references/review-checklist.md`][ref-bcheck] | ~150 | 8 judgment items replacing 2 deleted grep hooks |
| `dossier-framing-declared.sh` hook | mechanical | Fires PostToolUse on `DOSSIER-*.md`; asserts `framing-mode:` YAML field |
| `ballot-filename.sh` hook | mechanical | Fires PostToolUse on `DOSSIER-*BALLOT*.md`; asserts filename ends `-BALLOT-<Reviewer>.md` |

**Deleted (as overfit) during polish pass:** `dossier-citation-audit.sh`, `dossier-forbidden-words.sh`, `dossier-section-order.sh`, `dossier-dated-claim-scan.sh`, `ballot-anti-option.sh`, `ballot-cover-archaeology.sh`. PR #43's body explains the deletion rationale: the grep gates encoded patterns specific to the [a11y-extension][ref-a11y] Chrome-Web-Store session (the `[Xn]` citation style, the OSS-mode forbidden-word list, H2 glossary heading, archaeology phrases). Dossiers in other styles use different conventions and the gates either missed real failures or fired spurious ones.

### What PR #43 does NOT ship

- Any automated eval harness (no `evals/`, no `__tests__/`, no CI workflow beyond plugin load).
- A regression-tracking mechanism when `dossier` or `ballot` SKILL.md changes.
- A golden dataset of example dossiers to regress against.

### What the repo already has

- `pnpm` workspace with [changesets][ref-changesets]-driven releases.
- `package.json` `"test"` runs `skills add . --list` — plugin load, not behavioral.
- TypeScript not yet used in the repo proper (skills are markdown); would be introduced with any eval framework.
- Two committed dossier directories so far (the [a11y-extension dossier folder][ref-a11y] and the [threads-addition research folder][ref-threads]) — small N.

---

## Requirements

| # | Requirement | Weight | Notes |
|---|------------|--------|-------|
| R1 | Must not block PR #43 from shipping | **Critical** | PR #43 is already large (4 sessions, 15+ commits); adding evals inside it risks a scope-stretch loop |
| R2 | Must detect regressions when `dossier` or `ballot` SKILL.md semantics change | **High** | This is the core unmet need — checklists + hooks don't catch prose-quality degradation |
| R3 | Must fit the repo's existing TS + pnpm + changesets toolchain | **High** | Introducing a new runner (Python, bespoke bash) is a dependency-footprint tax |
| R4 | Authorship friction: adding a new metric or new golden dossier = ≤30 min | **High** | Match the low friction Quatico PR #12 achieved (2–3 files per scenario) |
| R5 | LLM-as-judge support for prose-quality metrics | **Medium** | Not day-1 essential; mechanical battery alone is a valid starter scope |
| R6 | CI-friendly exit codes + machine-readable output | **Medium** | Enables later promotion to a PR gate without rewrite |
| R7 | Maintenance budget ≤1 half-day per quarter | **Medium** | Personal repo; author-plus-approver is Max alone; over-engineering dies on the vine |

---

## Evaluations

### 1. [evalite][ref-evalite] ★ RECOMMENDED

| Attribute | Detail |
|---|---|
| **What** | TypeScript-native eval runner built on Vitest; scorer-based API with [LLM-as-judge][ref-arize] and structural scorers |
| **Website** | [evalite.dev][ref-evalite] |
| **GitHub** | [mattpocock/evalite][ref-evalite-gh] · MIT |
| **Latest** | v0.19.0 ([Nov 2024, per npm][ref-evalitever]); v1 beta in progress per the author's [v1 preview writeup][ref-evalite-v1] |
| **Runtime** | Node 18+ / [Bun][ref-bun] |
| **Dependencies** | Vitest (already ubiquitous); small core |

Scorer model: tests declare `{ input, expected, scorers }` triples; scorers return `{ score, name }`. LLM-as-judge scorers are just scorers that internally call an LLM — evalite ships a few defaults (factuality, levenshtein) and custom scorers are ~10 lines of TS. A [localhost UI][ref-evalite-ui] shows traces, scores, and call-by-call diffs, which makes iteration on judge prompts much faster than bash-log-scrolling.

**Fit:** scorers align cleanly with the dossier skill's eval surface. Each reviewer-checklist item can be a scorer (mechanical or judgment). Golden dossiers are markdown files committed next to the eval — works with existing repo structure. Vitest underneath means `vitest --watch` just works; `evalite watch` adds a live score dashboard. CI: `vitest run` returns non-zero on failing thresholds.

**Risk:** pre-1.0 software; [release notes][ref-evalite-releases] show occasional breaking changes between minor versions. For a personal repo this is acceptable (pin the version; read notes before bumping).

#### Requirement Fit

| # | Fit |
|---|---|
| R1 | ✓ Opt-in — zero impact on current PR #43 if added in follow-up |
| R2 | ✓ Score thresholds + Vitest's diff report catch prose regressions |
| R3 | ✓ TS + pnpm native; Vitest is industry-standard |
| R4 | ✓ New scorer = new TS function (~20 lines); new golden dossier = new .md file |
| R5 | ✓ LLM-as-judge is first-class in the scorer model |
| R6 | ✓ Vitest exits non-zero on failure; JSON reporter available |
| R7 | ✓ Small footprint; evalite + Vitest + @anthropic-ai/sdk is the full list |

---

### 2. Quatico PR #12-style bespoke runner

| Attribute | Detail |
|---|---|
| **What** | Scenario-directory + subagent-dispatch pattern, Max's own prior art |
| **Reference** | [quatico-solutions/agent-skills PR #12][ref-q12] |
| **GitHub** | [Scenario 01 example][ref-q12-scenario] · [grade rubric][ref-q12-grade] · [runbook][ref-q12-runbook] |
| **Runtime** | Claude Code + `gh` CLI; optionally `claude -p` one-shot for scripted runs |
| **Dependencies** | None beyond `gh` + Claude CLI |

How it works: each eval scenario is a directory with a `scenario.md` (YAML frontmatter + review prompt) plus real fixture files (.tsx, .scss, etc.). Evaluation is a prompt dispatched to a subagent that invokes the skill under test and writes its output to `iteration-N/{scenario-id}/with_skill/output.md`. Scoring is manual or via a second LLM call against a [grading rubric][ref-q12-grade]. The approach produced a 67% → 100% pass-rate over 8 iterations.

**Fit:** Max built this; authorship friction is proven low (2–3 files per scenario). Works with any text-in/text-out skill. No new language or framework.

**Limits:** no standard runner → no `npm test` story → no CI exit code without building glue. Trigger-eval automation was deferred in PR #12 itself. For a prose-quality skill (dossier output) vs. a code-review skill (webbloqs), the fixture model translates — the fixture is a "dossier brief" and the skill-output is a "dossier draft" — but scoring that draft needs LLM-as-judge, which means building the Anthropic SDK integration evalite already provides.

#### Requirement Fit

| # | Fit |
|---|---|
| R1 | ✓ Opt-in, follow-up-compatible |
| R2 | ◐ Regression detection via iteration-diff; no baseline enforcement |
| R3 | ✓ Fits any toolchain (it's markdown + bash + Claude CLI) |
| R4 | ✓ 2–3 files per scenario, proven |
| R5 | ✗ Requires building LLM-as-judge glue yourself |
| R6 | ✗ No CI-friendly exit code without custom parser |
| R7 | ◐ Low per-scenario cost but custom tooling has to be maintained |

---

### 3. Roll-your-own (Vitest + @anthropic-ai/sdk + scorer library)

| Attribute | Detail |
|---|---|
| **What** | ~500–800 LoC across 4–6 files: test file, scorer library, golden fixtures, CI workflow |
| **Runtime** | Node / Bun + [Vitest][ref-vitest] |
| **Dependencies** | Vitest, `@anthropic-ai/sdk` ([docs][ref-anthropic-sdk]) |

Same shape as evalite but without the abstraction layer. Build the scorer interface yourself; keep everything in plain Vitest. Full control; no framework lock-in.

**Fit:** attractive for someone who wants to understand every line. Works well if the eval set stays very small (≤5 metrics).

**Limits:** by the time you've built a scorer interface, a golden-file loader, an LLM-as-judge wrapper, and a reporter, you've rebuilt ~70% of evalite. Maintenance tax compounds with every new metric.

#### Requirement Fit

| # | Fit |
|---|---|
| R1 | ✓ |
| R2 | ✓ once built |
| R3 | ✓ Pure TS |
| R4 | ◐ Low per-scorer after initial scaffold; high initial scaffold cost |
| R5 | ◐ Must build judge glue |
| R6 | ✓ |
| R7 | ✗ Maintenance tax scales with metric count |

---

### 4. [promptfoo][ref-promptfoo]

| Attribute | Detail |
|---|---|
| **What** | YAML-configured eval + red-teaming + guardrails platform; acquired by OpenAI 2026 |
| **Runtime** | Node 18+ |
| **License** | MIT |

Heavy-duty platform focused on prompt evaluation, red-teaming (50+ attack patterns), and guardrails. [YAML config][ref-promptfoo-ref] is declarative but verbose. LLM-as-judge is built-in via [model-graded assertions][ref-promptfoo-judge].

**Fit for this decision:** overkill. The red-teaming axis is not a need for `dossier` or `ballot`; YAML-declared prompts are a mismatch for skills that are invoked via Claude Code's Skill-tool (not as raw prompts). Worth a mention as the most full-featured alternative; not the right choice here.

#### Requirement Fit

| # | Fit |
|---|---|
| R1 | ✓ |
| R2 | ✓ |
| R3 | ◐ Node-native but YAML config is a second source-of-truth to maintain |
| R4 | ◐ Adding a metric means editing YAML + maybe a JS helper |
| R5 | ✓ First-class |
| R6 | ✓ |
| R7 | ✗ Platform-scale maintenance on a personal repo |

---

### 5. Do nothing — checklists are the mechanism

The intellectually honest steelman: PR #43's own polish-pass conclusion was that grep gates were overfit and judgment-capable review is the right tool. The two surviving hooks + two reviewer checklists are a deliberate design choice. Adding an eval harness second-guesses that choice.

**Why this might be right:**
- Personal repo with ~2 dossiers committed to date. Small-N means a regression probably gets noticed by the author next time they read a dossier.
- The checklists are structured — a judgment-capable reviewer (human or model) working through the 8 items is exactly what an LLM-as-judge would do, just without the framework.
- Every framework is a maintenance liability in a solo project.

**Why this is probably not right:**
- Checklists only fire when someone invokes them; they don't catch regressions in a drive-by edit.
- As the `dossier` skill accumulates additions (reference-links, preflight gates, new framing modes), the surface area of "things that could break" grows, and at some point N of committed dossiers crosses the threshold where manual review is no longer free.
- PR #43 has already accumulated enough surface that a regression test would be cheap insurance — the cost of *having* the harness, once built, is the cost of running it.

---

## Comparison Matrix

| Capability | evalite | Quatico-bespoke | Roll-your-own | promptfoo | Checklists-only |
|---|---|---|---|---|---|
| Setup cost (1–5 stars; lower=easier) | ★☆☆☆☆ | ★★☆☆☆ | ★★★☆☆ | ★★★☆☆ | ☆☆☆☆☆ |
| Authorship per metric | TS function | scenario dir | TS function | YAML block | checklist item |
| LLM-as-judge | built-in | hand-rolled | hand-rolled | built-in | N/A (human) |
| CI exit codes | ✓ (Vitest) | ✗ without glue | ✓ | ✓ | ✗ |
| Localhost UI | ✓ | ✗ | ✗ | ✓ | ✗ |
| Dependency footprint | small | zero | small | medium | zero |
| Aligns with repo's TS+pnpm | ✓ | neutral | ✓ | ✓ | neutral |
| Matures into PR-gate cleanly | ✓ | ✗ | ✓ | ✓ | ✗ |
| Verdict for PR #43 | **primary pick** | viable fallback | over-costly | overkill | honest steelman |

---

## Applicability verdict — both sides

### Steelman for adding evals

1. **Regression insurance.** PR #43's polish pass deleted 6 hooks and replaced them with prose checklists. A future `dossier` refactor could silently change behavior and no automated signal would catch it until a human eyeballs a generated dossier. An eval harness is the only regression detector.
2. **Proves conventions are measurable.** The review-checklists assert 8 + 8 concerns a reviewer should raise. If they're concerns, they're measurable — either mechanically (citation integrity) or judge-ably (crispness). Encoding them as scorers makes the skill's quality claim falsifiable.
3. **Mirrors Max's own prior art.** [PR #12][ref-q12] already invested in eval infrastructure for the webbloqs skill. Extending the same pattern to dossier+ballot reduces cognitive load ("the same mental model applies everywhere").
4. **Unlocks future automation.** Once the harness exists, the `preflight-gate` branch's work on ambiguity detection has somewhere to land a regression test for that specific behavior.

### Steelman for not adding evals

1. **Small N, mature skill.** The dossier skill has been iterated in-use (this very dossier is the 3rd committed one). Max reads every committed dossier; regressions are noticed by the author, not automation.
2. **PR #43's polish pass was an *anti*-grep decision.** Deleting 6 gates as overfit was a deliberate reaction against mechanistic measurement. An LLM-as-judge eval harness is not grep, but it's in the same cognitive family ("automated decision about quality"). Building the harness partially re-litigates a decision the author already made.
3. **Personal repo maintenance budget.** The `simplify` skill's lesson is "every dep is a liability." evalite at pre-1.0 will breaking-change; maintenance cost is real.
4. **The checklists ARE the eval.** 8 items × 2 skills × judgment-capable-reviewer at review time. A well-written checklist applied by a good reviewer is a higher-fidelity eval than any 3-scorer battery.

**Verdict:** both sides are genuine. The reason the recommendation lands on "yes, in follow-up, with evalite" is R2 — regression detection is the one capability neither side's steelman actually delivers without a harness. The "no" side concedes that regressions are caught by the author reading the dossier; the "yes" side notes that this catches regressions only when someone looks. For a skill Max edits infrequently (it's stable), and that produces an artefact read infrequently (dossiers are written once), the regression window is exactly where silent drift lives.

---

## Action Plan — if go

### Phase 1 — scaffold (one session, ~90 min)

1. Add `evals/` directory at repo root. New tree: `evals/dossier/*.eval.ts`, `evals/dossier/golden/*.md`, `evals/dossier/scorers.ts`.
2. Add devDeps: `evalite`, `vitest`, `@anthropic-ai/sdk`.
3. Write three mechanical scorers: `framingModeDeclared`, `citationIntegrityReferenceLink` (every `[Sn][ref-Sn]` has a matching `[ref-Sn]: url`), `keyFactsBoxPresent`.
4. Seed with 3 golden dossiers: the [a11y-extension dossier][ref-a11y], this dossier, and one deliberately-bad synthetic dossier (orphan citation, no Key Facts, forbidden-word, etc.).
5. Add `pnpm run eval` to `package.json`; wire to `evalite watch` locally and `vitest run evals/` in CI.

### Phase 2 — LLM-as-judge metrics (second session, ~60 min)

6. Add three judge scorers: `executiveSummaryCrispness`, `sourceBiasFlagging`, `ballotAsyncReadability`. Each is an Anthropic SDK call with a rubric prompt (use [Claude 4.7][ref-claude47] as the judge; pinned model string in config).
7. Cache judge responses per `(skill-version, golden-id, scorer-name)` hash so re-runs don't re-spend tokens.
8. Set thresholds: mechanical scorers must be 100%; judge scorers must stay ≥80% of prior-run score (no regression).

### Phase 3 — CI integration (optional)

9. Add a `.github/workflows/evals.yml` that runs on `skills/dossier/**` or `skills/ballot/**` changes only.
10. Require `ANTHROPIC_API_KEY` secret; budget ≤50k tokens/run. Skip on PRs from forks.

---

## Open Questions

1. **Should the [`dossier-preflight`][ref-preflight] branch land first?** If the preflight-gate refactor changes how the skill handles ambiguous requests, it changes what the eval harness needs to cover. Leaning: ship PR #43, merge preflight, then open the eval-harness PR — so the eval surface is stable before eval authoring starts.
2. **Port Quatico's runbook or start fresh?** Max's [`run-scenarios.md` runbook][ref-q12-runbook] in Quatico PR #12 could be ported as a template. Leaning: start fresh with evalite — the Quatico pattern was designed around chat-based subagent dispatch; evalite's CLI-native flow is different enough that porting would cost more than writing new.
3. **Token budget for LLM-as-judge runs?** At 3 scorers × 3 golden dossiers × ~5k input tokens + ~500 output tokens per scorer call, a full run is ~45k input + 4.5k output tokens. Affordable but non-zero. Leaning: implement caching before Phase 3.

---

## Sources

Source discipline for this dossier: every factual claim carries an inline reference-link `[Sn][ref-Sn]` pair, or an inline `[text](url)` hyperlink. Reference-link definitions live at the very end so renderers (GitHub, Obsidian, Bitbucket, terminal previewers) all resolve them consistently. This follows the citation convention introduced in [PR #43][ref-pr43] itself ([commit 517157c][ref-pr43-cite]).

### Authoring context

- **[R1]** [eins78/agent-skills repo][ref-repo] — the repo this dossier is about.
- **[R2]** [PR #43 (open)][ref-pr43] — the subject of the eval-applicability question.

### Quatico prior art

- **[Q1]** [quatico-solutions/agent-skills PR #12][ref-q12] — Max's prior eval harness for the webbloqs skill.
- **[Q2]** [webbloqs scenario-01 directory][ref-q12-scenario] — concrete example of scenario.md + fixture authoring.
- **[Q3]** [grade-scenarios.md][ref-q12-grade] — scoring rubric.
- **[Q4]** [run-scenarios.md][ref-q12-runbook] — local execution runbook.

### Eval-framework references

- **[E1]** [evalite home][ref-evalite], [GitHub][ref-evalite-gh], [npm v0.19.0][ref-evalitever], [v1 preview][ref-evalite-v1], [scorer docs][ref-evalite-scorers], [regression tests][ref-evalite-reg], [release notes][ref-evalite-releases], [localhost UI][ref-evalite-ui].
- **[E2]** [Vitest][ref-vitest] — the runner evalite wraps.
- **[E3]** [promptfoo][ref-promptfoo], [config reference][ref-promptfoo-ref], [model-graded assertions][ref-promptfoo-judge].
- **[E4]** [braintrust autoevals][ref-autoevals] — alternative scorer library.
- **[E5]** [inspect-ai (UK AISI)][ref-inspect-ai] — Python-first; not the right stack here, noted for completeness.

### Supporting reading

- **[S1]** [Anthropic: building evals][ref-anthropic-evals] — eval-design primer.
- **[S2]** [Hamel Husain: eval-driven development][ref-hamel] — the canonical essay on why evals matter.
- **[S3]** [Arize: LLM-as-a-judge primer][ref-arize] — judge-prompt design patterns.
- **[S4]** [OpenAI Cookbook: evals][ref-oai-evals] — golden-dataset patterns.
- **[S5]** [Anthropic SDK docs][ref-anthropic-sdk] — what the judge scorer would use.
- **[S6]** [Claude Code hooks][ref-cc-hooks] — what the existing two gates are built on.
- **[S7]** [changesets][ref-changesets] — the repo's versioning tooling.
- **[S8]** [Bun][ref-bun] — alternative runtime if Node is replaced.

### Repo internals (paths, not URLs)

- **[I1]** `skills/dossier/SKILL.md` (140 lines, v1.1.0). Source in current worktree at [ref-dskill][ref-dskill].
- **[I2]** `skills/dossier/templates/dossier.md` — the template this dossier follows.
- **[I3]** `skills/dossier/references/review-checklist.md` — the 8-item reviewer checklist on PR #43's branch.
- **[I4]** `skills/ballot/SKILL.md` (107 lines, v1.0.0).
- **[I5]** `skills/ballot/references/review-checklist.md` — 8-item ballot reviewer checklist on PR #43's branch.
- **[I6]** [a11y-extension research folder][ref-a11y] — one of two committed dossier folders.
- **[I7]** [threads research folder][ref-threads] — the other committed research folder.
- **[I8]** [PR #43 commit 517157c][ref-pr43-cite] — the clickable-citation convention this dossier follows.

<!-- Reference-link definitions. Keep sorted. -->

[ref-a11y]: https://github.com/eins78/agent-skills/tree/dossier-skill-pitch/research
[ref-anthropic-evals]: https://docs.claude.com/en/docs/build-with-claude/define-success
[ref-anthropic-sdk]: https://docs.claude.com/en/api/client-sdks
[ref-arize]: https://docs.arize.com/phoenix/evaluation/llm-evals
[ref-auth]: https://github.com/eins78
[ref-autoevals]: https://github.com/braintrustdata/autoevals
[ref-bcheck]: https://github.com/eins78/agent-skills/blob/dossier-skill-pitch/skills/ballot/references/review-checklist.md
[ref-bskill]: https://github.com/eins78/agent-skills/blob/dossier-skill-pitch/skills/ballot/SKILL.md
[ref-bun]: https://bun.sh/
[ref-cc-hooks]: https://docs.claude.com/en/docs/claude-code/hooks
[ref-changesets]: https://github.com/changesets/changesets
[ref-claude47]: https://docs.claude.com/en/docs/about-claude/models
[ref-dcheck]: https://github.com/eins78/agent-skills/blob/dossier-skill-pitch/skills/dossier/references/review-checklist.md
[ref-dskill]: https://github.com/eins78/agent-skills/blob/dossier-skill-pitch/skills/dossier/SKILL.md
[ref-dtemplate]: https://github.com/eins78/agent-skills/blob/dossier-skill-pitch/skills/dossier/templates/dossier.md
[ref-evalite]: https://www.evalite.dev/
[ref-evalite-gh]: https://github.com/mattpocock/evalite
[ref-evalite-reg]: https://www.evalite.dev/guides/regression-tests
[ref-evalite-releases]: https://github.com/mattpocock/evalite/releases
[ref-evalite-scorers]: https://www.evalite.dev/scorers
[ref-evalite-ui]: https://www.evalite.dev/guides/ui
[ref-evalite-v1]: https://www.aihero.dev/evalite-v1-preview
[ref-evalitever]: https://www.npmjs.com/package/evalite
[ref-hamel]: https://hamel.dev/blog/posts/evals/
[ref-inspect-ai]: https://inspect.aisi.org.uk/
[ref-oai-evals]: https://cookbook.openai.com/examples/evaluation/getting_started_with_openai_evals
[ref-preflight]: https://github.com/eins78/agent-skills/tree/dossier-preflight
[ref-promptfoo]: https://www.promptfoo.dev/
[ref-promptfoo-judge]: https://www.promptfoo.dev/docs/configuration/expected-outputs/model-graded/
[ref-promptfoo-ref]: https://www.promptfoo.dev/docs/configuration/reference/
[ref-pr43]: https://github.com/eins78/agent-skills/pull/43
[ref-pr43-branch]: https://github.com/eins78/agent-skills/tree/dossier-skill-pitch
[ref-pr43-cite]: https://github.com/eins78/agent-skills/commit/517157c
[ref-pr43-commits]: https://github.com/eins78/agent-skills/pull/43/commits
[ref-q12]: https://github.com/quatico-solutions/agent-skills/pull/12
[ref-q12-grade]: https://github.com/quatico-solutions/agent-skills/blob/feature/webbloqs-skill-rename/essentials/skills/webbloqs-workspace/grade-scenarios.md
[ref-q12-runbook]: https://github.com/quatico-solutions/agent-skills/blob/feature/webbloqs-skill-rename/essentials/skills/webbloqs-workspace/run-scenarios.md
[ref-q12-scenario]: https://github.com/quatico-solutions/agent-skills/tree/feature/webbloqs-skill-rename/essentials/skills/webbloqs/evals/review-scenarios/01-theme-default-aliases
[ref-repo]: https://github.com/eins78/agent-skills
[ref-threads]: https://github.com/eins78/agent-skills/tree/main
[ref-vitest]: https://vitest.dev/
