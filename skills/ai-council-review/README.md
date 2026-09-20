# AI Council Review Skill

## Purpose

Council review: ~4 frontier models from different vendors review a PR, plan
doc, or files independently and in parallel via the OpenRouter API; the
orchestrating agent synthesizes agreements and dissents in-session and
verifies top findings against the actual repository. For high-stakes changes
where `ai-review`'s single second opinion is not enough.

**Tier:** Publishable — reusable across projects and machines.

## Components

```
ai-council-review/
├── SKILL.md                    # orchestration workflow, consent note, critical rules
├── README.md                   # this file
├── jsconfig.json               # checkJs+strict type-checking config (dev-time)
├── scripts/
│   ├── council.mjs             # CLI entry: review | models
│   └── lib/
│       ├── config.mjs          # config precedence, presets, UsageError
│       ├── openrouter.mjs      # fetch client: catalog cache, retry/timeout, redact()
│       ├── budget.mjs          # token/cost estimate, budget gate
│       ├── input.mjs           # diff/PR/file gathering, auto-context, trim ladder
│       ├── prompts.mjs         # message assembly from rubric files
│       ├── schema.mjs          # findings JSON schema + lenient extractor
│       ├── cluster.mjs         # conservative pre-clustering + fingerprints
│       └── outcomes.mjs        # per-member outcome archive (record/aggregate)
├── references/
│   ├── synthesis.md            # the synthesis protocol (the skill's core value)
│   ├── report-template.md      # report.md structure
│   ├── presets.json            # council rosters + default thresholds (data, not code)
│   └── prompts/                # code-review.md, plan-review.md, document-review.md
└── tests/
    ├── fixtures/               # synthetic sample responses + tiny-diff.patch
    ├── extract.test.mjs        # offline: JSON extraction ladder
    ├── cluster.test.mjs        # offline: dedup merges, dissent preserved
    ├── budget.test.mjs         # offline: estimate math, gate arithmetic
    ├── dispatch.test.mjs       # mock OpenRouter server (node:http)
    ├── outcomes.test.mjs       # offline: outcome archive record/show
    └── live-smoke.test.mjs     # optional live test, skips without key
```

## Dependencies

| Dependency | Required | Install |
|---|---|---|
| Node.js >= 20 | Yes | `brew install node` |
| `AI_COUNCIL_OPENROUTER_API_KEY` | For dispatch (not for `--dry-run`/`models`); falls back to `OPENROUTER_API_KEY` | <https://openrouter.ai/keys> |
| npm packages | **None** | — (zero runtime dependencies by design) |
| `gh` CLI | Only for `--pr` mode | `brew install gh` |

## Usage

See SKILL.md for the agent workflow. Quick reference:

```bash
# roster + live pricing
node scripts/council.mjs models

# spend-free estimate for a branch diff
node scripts/council.mjs review --branch main --dry-run

# dispatch a plan review with explicit consent to a $2 estimate
node scripts/council.mjs review docs/plan.md --rubric plan --yes

# custom council, custom cap
node scripts/council.mjs review --pr 42 --models openai/gpt-5.5,z-ai/glm-5.2 --budget 2

# record synthesis outcomes for a run; show the per-model archive
node scripts/council.mjs outcomes record --run RUN_DIR --json '{"member-A": {"verified": 2, "refuted": 1, "uncertain": 0}}'
node scripts/council.mjs outcomes show
```

Exit codes: `0` ok · `1` usage/input · `2` quorum failed · `3` budget-blocked
(nothing sent) · `4` API key missing. Env vars:
`AI_COUNCIL_OPENROUTER_API_KEY` (fallback: `OPENROUTER_API_KEY`),
`OPENROUTER_BASE_URL`, `COUNCIL_TIMEOUT_MS`, `COUNCIL_RETRY_BACKOFF_MS`,
`AI_COUNCIL_{MODELS,PRESET,BUDGET_USD,CONFIRM_THRESHOLD_USD,QUORUM}`,
`REVIEW_BASE_BRANCH`, `XDG_STATE_HOME`.

## Council rosters

Rosters live in `references/presets.json` (data, not code) and are repeated
here, in `SKILL.md`, and in `tests/live-smoke.test.mjs`; all three move
together on a roster change. Full swap history, with triggers and
verification output, is in `references/MODELS-CHANGELOG.md` — models are
external dependencies and sit outside this skill's semver contract, so their
history is tracked separately from `CHANGELOG.md` below.

These tables are hand-kept against `presets.json`; nothing enforces the
sync. A generator (e.g. `council.mjs models --markdown`) is a reasonable
follow-up if this drifts.

### Presets

**`default`** / **`code`** — code review, the normal use case for this skill; identical rosters, `code` kept as the explicit name.

| Slug | Vendor | in $/M | out $/M | Context |
|---|---|---|---|---|
| `openai/gpt-5.3-codex` | OpenAI | 1.75 | 14.00 | 400,000 |
| `google/gemini-3.1-pro-preview` | Google | 2.00 | 12.00 | 1,048,576 |
| `deepseek/deepseek-v4-flash` | DeepSeek | 0.04 | 0.07 | 1,048,576 |
| `z-ai/glm-5.3-flash` | Z-AI | 0.09 | 0.30 | 1,310,720 |
| **Total** | | **3.88** | **26.37** | |

**`prose`** — the pre-2026-09-20 default roster; use for plan docs and prose where a codex-tuned seat is a downgrade.

| Slug | Vendor | in $/M | out $/M | Context |
|---|---|---|---|---|
| `openai/gpt-5.5` | OpenAI | 5.00 | 30.00 | 1,050,000 |
| `google/gemini-3.1-pro-preview` | Google | 2.00 | 12.00 | 1,048,576 |
| `deepseek/deepseek-v4-flash` | DeepSeek | 0.04 | 0.07 | 1,048,576 |
| `z-ai/glm-5.3-flash` | Z-AI | 0.09 | 0.30 | 1,310,720 |
| **Total** | | **7.13** | **42.37** | |

**`budget`** — cheapest three-seat council. Three seats, not two, because `quorum: 2` means a two-seat preset fails outright on any single member failure.

| Slug | Vendor | in $/M | out $/M | Context |
|---|---|---|---|---|
| `qwen/qwen3.8-flash` | Alibaba | 0.15 | 0.47 | 1,000,000 |
| `deepseek/deepseek-v4-flash` | DeepSeek | 0.04 | 0.07 | 1,048,576 |
| `z-ai/glm-5.3-flash` | Z-AI | 0.09 | 0.30 | 1,310,720 |
| **Total** | | **0.28** | **0.84** | |

**`crowd`** — `budget`'s three seats plus three more: many weak independent opinions rather than one strong seat per vendor. Deliberately carries two Alibaba seats (`qwen3.8-flash`, `qwen3.8-27b`) — the exception to the one-seat-per-vendor rule below, because `crowd`'s thesis is opinion count, not per-vendor independence; still six seats but only five vendors. **Effective context cap is 1,000,000 exactly** — the smallest window in the council, set by `qwen3.8-flash`/`qwen3.8-27b` (both 1,000,000, not 1,048,576) — since the dispatch script trims every member's payload to the council's smallest window.

| Slug | Vendor | in $/M | out $/M | Context |
|---|---|---|---|---|
| `qwen/qwen3.8-flash` | Alibaba | 0.15 | 0.47 | 1,000,000 |
| `deepseek/deepseek-v4-flash` | DeepSeek | 0.04 | 0.07 | 1,048,576 |
| `z-ai/glm-5.3-flash` | Z-AI | 0.09 | 0.30 | 1,310,720 |
| `qwen/qwen3.8-27b` | Alibaba | 0.20 | 2.55 | 1,000,000 |
| `tencent/hy4-preview` | Tencent | 0.83 | 2.50 | 1,048,576 |
| `google/gemini-3-flash-preview` | Google | 0.50 | 3.00 | 1,048,576 |
| **Total** | | **1.81** | **8.89** | |

**`max`** — five seats, one vendor per seat, for high-stakes review. `gpt-6-astra` replaces (not adds to) the OpenAI seat that `gpt-5.5` held before 2026-09-20, keeping vendor independence rather than buying a correlated second OpenAI opinion.

| Slug | Vendor | in $/M | out $/M | Context |
|---|---|---|---|---|
| `anthropic/claude-opus-4.8` | Anthropic | 5.00 | 25.00 | 1,000,000 |
| `openai/gpt-6-astra` | OpenAI | 10.00 | 50.00 | 1,050,000 |
| `google/gemini-3.1-pro-preview` | Google | 2.00 | 12.00 | 1,048,576 |
| `deepseek/deepseek-v4-flash` | DeepSeek | 0.04 | 0.07 | 1,048,576 |
| `z-ai/glm-5.3-flash` | Z-AI | 0.09 | 0.30 | 1,310,720 |
| **Total** | | **17.13** | **87.37** | |

**`flagship`** — deliberately extravagant; four seats, four vendors, no correlated pair. Carries no second Anthropic seat: `claude-fable-5.1` ranks above `claude-opus-4.8`, so a second Anthropic seat would be the strictly weaker half of a same-vendor pair. At `outputTokensPerModel: 3000` a four-seat run is ~$0.35 in output alone before input — a real diff-sized run lands near $1 and **will** trip the $1 confirmation gate (`confirmThresholdUsd`).

| Slug | Vendor | in $/M | out $/M | Context |
|---|---|---|---|---|
| `openai/gpt-6-astra` | OpenAI | 10.00 | 50.00 | 1,050,000 |
| `anthropic/claude-fable-5.1` | Anthropic | 10.00 | 50.00 | 1,000,000 |
| `google/gemini-3.1-pro-preview` | Google | 2.00 | 12.00 | 1,048,576 |
| `qwen/qwen3.8-max-0902` | Alibaba | 2.00 | 6.00 | 1,000,000 |
| **Total** | | **24.00** | **118.00** | |

**`smoke`** — one member, for the live smoke test only.

| Slug | Vendor | in $/M | out $/M | Context |
|---|---|---|---|---|
| `deepseek/deepseek-v4-flash` | DeepSeek | 0.04 | 0.07 | 1,048,576 |
| **Total** | | **0.04** | **0.07** | |

### Models

One row per distinct slug across every preset above. "Last verified" is the
date `council.mjs models --verify` last confirmed the slug against the live
OpenRouter catalog.

| Slug | What it's for | Presets | Known failure modes | Last verified |
|---|---|---|---|---|
| `openai/gpt-5.3-codex` | Codex-tuned seat for diff review | `default`, `code` | none known | 2026-09-20 |
| `openai/gpt-5.5` | General-purpose frontier seat for prose/plan review | `prose` | none known | 2026-09-20 |
| `openai/gpt-6-astra` | Strongest available OpenAI seat | `max`, `flagship` | none known | 2026-09-20 |
| `anthropic/claude-fable-5.1` | Strongest available Anthropic seat (ranks above `claude-opus-4.8`) | `flagship` | none known | 2026-09-20 |
| `anthropic/claude-opus-4.8` | Anthropic seat, paired with the synthesizer's own-vendor discount rule | `max` | none known | 2026-09-20 |
| `google/gemini-3.1-pro-preview` | Google frontier seat | `default`, `code`, `prose`, `max`, `flagship` | none known | 2026-09-20 |
| `google/gemini-3-flash-preview` | Cheap Google seat for breadth | `crowd` | none known | 2026-09-20 |
| `deepseek/deepseek-v4-flash` | Cheap, fast seat present in nearly every preset | `default`, `code`, `prose`, `budget`, `crowd`, `max`, `smoke` | predecessor `deepseek/deepseek-v4-pro` timed out at 240 s on a ~30k-token diff (2026-09-20) — this flash variant replaced it | 2026-09-20 |
| `z-ai/glm-5.3-flash` | Cheap, fast seat present in nearly every preset | `default`, `code`, `prose`, `budget`, `crowd`, `max` | predecessor `z-ai/glm-5.2` returned an empty completion on the same 2026-09-20 run — this flash variant replaced it | 2026-09-20 |
| `qwen/qwen3.8-flash` | Cheapest four-vendor `budget` seat | `budget`, `crowd` | none known | 2026-09-20 |
| `qwen/qwen3.8-27b` | Extra `crowd` seat (second Alibaba seat, deliberate exception to one-seat-per-vendor) | `crowd` | none known | 2026-09-20 |
| `qwen/qwen3.8-max-0902` | Strongest available Alibaba seat | `flagship` | none known | 2026-09-20 |
| `tencent/hy4-preview` | `crowd` breadth seat | `crowd` | replaced `tencent/hunyuan-a13b-instruct` in this seat (2026-09-20): hunyuan's 131,072-token window was 8× smaller than every other member and capped `crowd`'s whole payload via the trim ladder before anyone checked context windows | 2026-09-20 |

## Testing

```bash
# offline suite (unit + mock OpenRouter server) — no key, no network
node --test skills/ai-council-review/tests/*.test.mjs

# type-check (needs `pnpm install` at repo root once)
pnpm run typecheck:council

# live smoke: one tiny diff to deepseek-v4-flash, < $0.01; skips without key
AI_COUNCIL_OPENROUTER_API_KEY=sk-or-... node --test skills/ai-council-review/tests/live-smoke.test.mjs

# root convenience (offline suite + live smoke if key is set)
pnpm run test:council
```

Skill-level testing followed writing-skills TDD: baseline (RED) scenarios ran
before authoring — unaided agents guessed stale model slugs, hand-rolled
sequential curl loops, self-discovered credentials from the keychain, and
self-authorized real spend without asking. Pressure scenarios (GREEN) tested
the budget gate against "just run it", member failure against self-
substitution, and trigger discrimination against `ai-review` in both
directions.

## Design Decisions

- **Node `.mjs` + `// @ts-check` + JSDoc, zero npm deps** — first Node-based
  skill scripts in this repo (previously bash/python). Rationale: native
  fetch, AbortController, `node:test`, JSON handling; no install step for
  consumers. Type-checking runs from root devDependencies, dev-time only.
- **OpenRouter over per-provider CLIs** — one key, one OpenAI-compatible API
  shape, per-request cost accounting (`usage.cost`), and the roster is data
  (`references/presets.json`), not code.
- **Its own key variable (`AI_COUNCIL_OPENROUTER_API_KEY`)** — a run fans one
  payload out to several third-party providers and spends real money doing it,
  so which key pays, and which account's privacy settings therefore apply,
  should be a deliberate choice rather than whatever `OPENROUTER_API_KEY` a
  shell happens to export. `OPENROUTER_API_KEY` stays as a fallback so existing
  setups keep working, but a run that falls back to it says so on stderr — a
  borrowed key is visible, never silent. Both variables are redacted from all
  output, including the one that was not used.
- **Anthropic excluded from the default council** — the synthesizer is
  Claude in-session; excluding its vendor from the council maximizes
  independent signal and avoids self-agreement bias (self-preference bias
  is well replicated; self-family win rates of 75–84% have been measured in
  pairwise judging). Opus is in the `max` preset, paired with a "discount
  same-vendor pairwise agreement" fallback rule in the synthesis protocol.
- **Members are anonymized during synthesis** — reviews, clusters, and the
  manifest carry shuffled `member-A`… labels; the label→model mapping lives
  in `roster-key.json`, read only at report time. The synthesizer is an LLM
  with documented brand/self-preference biases; anonymization is the
  structural version of the same-vendor discount rule (prior art:
  llm-council anonymizes its cross-review stage for exactly this reason).
  Failed members stay named — they contribute no findings, and fixing the
  roster needs the name.
- **Vendor diversity is a bias control, not a recall booster** — the
  verified benefit of a cross-vendor roster is reduced self/intra-family
  bias and partially decorrelated errors. Claims that mixing vendors
  improves output quality did not survive adversarial verification in our
  research round (and Self-MoA found repeated samples of the best model
  beat mixed ensembles on generation benchmarks). Roster rule: pick the
  strongest available models that happen to be from different vendors —
  never a weaker model for diversity's sake.
- **Identical rubric for every member (no personas by default)** — agreement
  counting is only valid when the assignment was identical; vendor diversity
  already provides lens diversity. `--personas` is a documented coverage
  mode (distinct focus lenses, synthesis switches to per-lens coverage
  reporting; prior art: ChatEval's ablation shows identical referee roles
  degrade performance, and lens-per-reviewer pipelines exist). The default
  stays identical-rubric because consensus is the default's signal.
- **No debate round — explicit non-goal** — members never see each other's
  reviews, and no cross-critique round is planned. Evidence: LLM judges
  show bandwagon bias (they shift toward an embedded majority regardless of
  correctness); multi-round deliberation measurably erases issue-critical
  facts and homogenizes stances ("agree more while knowing less"); and
  multi-agent debate does not reliably beat independent ensembling (ICML
  2024). If ever revisited, the only defensible shape is llm-council-style
  anonymized cross-critique starting from committed independent findings —
  currently unproven. See `research/council-prior-art.md` (P8).
- **Outcome archive over vibes** — synthesis verdicts (verified/refuted/
  uncertain per member) are recorded to an XDG-state `outcomes.jsonl` via
  `outcomes record`; `outcomes show` aggregates per model. This is the only
  data that can answer whether cross-model agreement tracks correctness for
  this council (open question in the literature) and makes future roster
  changes evidence-based.
- **Cluster fingerprints for re-review** — stable across runs (files +
  title tokens; never labels or line numbers), enabling
  new/persisting/resolved classification and the stuck rule: identical
  blocking fingerprints two runs running → recommend human judgment, not a
  third run (prior art: fingerprint stuck-detection in a multi-model review
  pipeline).
- **In-session synthesis over a synthesis API call** — the synthesizer can
  open the repo and verify findings (the hallucination kill-switch); an
  API-side synthesizer cannot. Also: no fifth model's bias, no extra cost.
- **Conservative mechanical pre-clustering** — the script only merges
  near-certain duplicates; fuzzy merging is the synthesizer's job. Over-
  merging would erase dissent, which is the signal this skill exists to
  preserve.
- **Budget gate lives inside the script** (CLAUDE.md "Gates over rules"):
  above-threshold dispatch without `--yes` is impossible, and the mock test
  asserts zero HTTP requests when blocked. `--yes` is the only bypass and is
  reserved for relaying human consent.
- **Two-tier gate math** (added after the dogfood council flagged it): the
  confirmation threshold compares the *expected* cost, but the hard cap
  compares the *worst case* — every member exhausting `max_tokens` — because
  an expected-cost "cap" is not a cap. `max_tokens` in the request is the
  same number the worst-case math uses.
- **Key from env only, never a flag** (argv leaks via `ps`/history); all
  error paths pass through `redact()`; the mock test asserts the key never
  appears in output even when a server echoes it back.
- **`OPENROUTER_BASE_URL` + `COUNCIL_RETRY_BACKOFF_MS` overrides** exist for
  testability (mock server, fast retry tests).
- **Run artifacts in XDG state** (`~/.local/state/ai-council-review/`), not
  the repo (no gitignore pollution) and not tmp (runs are records of money
  spent). 0700/0600 modes; they contain reviewed source.
- **Trigger split with `ai-review`**: bare "review this" / "second opinion"
  belong to `ai-review`; plural-model and stakes vocabulary ("council",
  "panel", "multi-model", "third opinion", "high-stakes") belong here. Both
  descriptions cross-point.

## Provenance

Designed and built 2026-07-11 in a plan-first session (architecture and
packaging designed by parallel planning agents, reconciled, human-approved).
Model roster slugs and per-token pricing verified live against the
OpenRouter API on 2026-07-11 (`GET /api/v1/models`), including
`deepseek/deepseek-v4-flash` (~$0.077/M input) for the live smoke test.
Input-gathering semantics (diff modes, auto-context) ported from this repo's
`ai-review` skill (`scripts/review.sh`). Packaging follows repo conventions
as of `@eins78/agent-skills` v3.1.0. Grok was removed from the default
preset by maintainer decision (2026-07-11); `z-ai/glm-5.2` backfills to keep
a 4-member council (quorum unchanged at 2).

Roster history from 2026-09-20 onward — including the `deepseek-v4-pro` →
`-flash` swap and the `default`/`prose`/`crowd`/`flagship` overhaul — is
tracked in `references/MODELS-CHANGELOG.md`, not narrated here, since
models are external dependencies outside this skill's semver contract.

Hardened 2026-07-12 from a deep-research round on council/ensemble prior
art (`research/council-prior-art.md`, PR #62): synthesis anonymization
(P1), correlated-error and position-bias guardrails (P2/P4), personas
coverage mode (P3), triage pattern docs (P5), cluster fingerprints (P6),
outcome archive (P7), no-debate non-goal (P8). All maintainer-approved.

## Known Gaps

- **Model churn**: roster slugs and pricing go stale. Dispatch preflights
  slugs against the live catalog and fails loudly with suggestions — that
  failure is the roster-churn alarm, not flakiness. Fixes are data patches
  to `references/presets.json`.
- Pricing snapshot in docs drifts; estimates always use the live catalog
  (cached 24h).
- No streaming: the run waits on the slowest member (bounded by timeout).
- No multi-call chunking for payloads exceeding the smallest council
  context; the trim ladder (drop generated files → truncate largest
  sections) then a hard usage error with narrowing advice.
- The consent-before-first-dispatch requirement and the "never self-`--yes`"
  rule are prose (the gate itself is code); a PreToolUse hook intercepting
  `council.mjs .* --yes` is possible future work.
- Data residency depends on OpenRouter's downstream routing; no per-provider
  ZDR enforcement in v0.
- `--personas` coverage mode has no efficacy evaluation yet (prior art
  supports lens diversity, but nothing here measures it).
- Anonymization is a soft blind: `roster-key.json` sits readable in the run
  dir (the protocol forbids reading it before the report; the filesystem
  does not). The known correlators are closed structurally — raw responses
  are identity-scrubbed, costs are model-keyed only (`costs.json`), cluster
  member lists and manifest entries are label-sorted, personas are assigned
  by label rank — but response *style* can still hint at identities. A hard
  blind would need the mapping held outside the synthesizer's reach.
- The outcome archive trusts the synthesizer's own verdicts; a member could
  look artificially bad if the synthesizer's refutations are wrong. Spot-
  check refutations (the report keeps them in the appendix for this reason).

## Changelog

- 0.1.0 (2026-07-11, hardened 2026-07-12): initial release, plus the
  prior-art hardening round — anonymized synthesis, cluster fingerprints,
  outcome archive, synthesis guardrails, personas coverage mode, triage
  pattern (research/council-prior-art.md P1–P8).
