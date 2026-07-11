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
│       └── cluster.mjs         # conservative pre-clustering
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
    └── live-smoke.test.mjs     # optional live test, skips without key
```

## Dependencies

| Dependency | Required | Install |
|---|---|---|
| Node.js >= 20 | Yes | `brew install node` |
| `OPENROUTER_API_KEY` | For dispatch (not for `--dry-run`/`models`) | <https://openrouter.ai/keys> |
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
```

Exit codes: `0` ok · `1` usage/input · `2` quorum failed · `3` budget-blocked
(nothing sent) · `4` API key missing. Env vars: `OPENROUTER_API_KEY`,
`OPENROUTER_BASE_URL`, `COUNCIL_TIMEOUT_MS`, `COUNCIL_RETRY_BACKOFF_MS`,
`AI_COUNCIL_{MODELS,PRESET,BUDGET_USD,CONFIRM_THRESHOLD_USD,QUORUM}`,
`REVIEW_BASE_BRANCH`, `XDG_STATE_HOME`.

## Testing

```bash
# offline suite (unit + mock OpenRouter server) — no key, no network
node --test skills/ai-council-review/tests/*.test.mjs

# type-check (needs `pnpm install` at repo root once)
pnpm run typecheck:council

# live smoke: one tiny diff to deepseek-v4-flash, < $0.01; skips without key
OPENROUTER_API_KEY=sk-or-... node --test skills/ai-council-review/tests/live-smoke.test.mjs

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
- **Anthropic excluded from the default council** — the synthesizer is
  Claude in-session; excluding its vendor from the council maximizes
  independent signal and avoids self-agreement bias. Opus is in the `max`
  preset, paired with a "discount same-vendor pairwise agreement" rule in
  the synthesis protocol.
- **Identical rubric for every member (no personas by default)** — agreement
  counting is only valid when the assignment was identical; vendor diversity
  already provides the lens diversity. `--personas` exists as an
  experimental flag and flips synthesis to coverage mode.
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
- `--personas` is experimental and unvalidated.

## Changelog

- 0.1.0 (2026-07-11): initial release.
