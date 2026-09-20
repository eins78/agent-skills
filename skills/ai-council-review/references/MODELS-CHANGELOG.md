# Models changelog

Model rosters are **external dependencies**: OpenRouter slugs, prices, and
capabilities change on a schedule this skill does not control. A roster swap
can change every result the skill produces while looking like a patch bump
to the skill itself — so roster history lives here, separate from
`CHANGELOG.md`, hand-written at update time, and never generated. Newest
first. Each entry carries the date, the exact swap, the trigger (measured
failure, price change, deprecation, or a scheduled review), and the
verification command output.

## 2026-09-20 — roster overhaul: `default` becomes the code roster, new `prose`/`crowd`/`flagship` presets, astra into `max`, grok out of `budget`

**Trigger:** the first scheduled monthly model review (`docs/launchd-agents.md`
→ `li.kiste.ai-council-model-review-due`), run early at maintainer request.

**Swap:**

- `default` now carries the former `code` roster (`openai/gpt-5.3-codex` in
  place of `openai/gpt-5.5`) — code review is the normal use case for this
  skill, and the codex seat is also cheaper. The former `default` roster
  survives as the new `prose` preset.
- `budget`: `x-ai/grok-4.3` out, `qwen/qwen3.8-flash` in — three seats kept
  (not two), because `quorum: 2` means a two-seat preset fails on any single
  member failure.
- New `crowd` preset: `budget`'s three seats plus `qwen/qwen3.8-27b`,
  `tencent/hy4-preview`, `google/gemini-3-flash-preview` — six seats, five
  vendors (Alibaba twice), many-weak-independent-opinions rather than
  one-strong-seat-per-vendor. `crowd` was first drafted with
  `tencent/hunyuan-a13b-instruct` in this seat and approved before anyone
  checked context windows: `council.mjs` fits the payload to the *smallest*
  context window across the council (`council.mjs:299`, calling
  `fitPayload` in `lib/input.mjs`) before dispatch,
  and hunyuan's 131,072-token window — 8× smaller than every other seated
  model — was silently capping all six members' input at 131k, defeating
  what `crowd` is for. Caught before merge; swapped for `tencent/hy4-preview`
  (1,048,576 ctx, $0.83/$2.50) before this roster ever shipped. Effective
  cap is now 1,000,000 exactly, set by `qwen3.8-flash`/`qwen3.8-27b`, not by
  the Tencent seat. `crowd` input rises from $1.12/M to $1.81/M as a result.
- `max`: `openai/gpt-5.5` → `openai/gpt-6-astra` (upgrade, not an added seat —
  keeps one seat per vendor).
- New `flagship` preset: `openai/gpt-6-astra`, `anthropic/claude-fable-5.1`,
  `google/gemini-3.1-pro-preview`, `qwen/qwen3.8-max-0902`.

**Verification** (`council.mjs models --verify`, 2026-09-20):

```
┌─────────┬─────────────────────────────────┬─────────┬─────────┬─────────┬────────────┐
│ (index) │ model                           │ context │ in $/M  │ out $/M │ structured │
├─────────┼─────────────────────────────────┼─────────┼─────────┼─────────┼────────────┤
│ 0       │ 'openai/gpt-5.3-codex'          │ 400000  │ '1.75'  │ '14.00' │ 'yes'      │
│ 1       │ 'openai/gpt-5.5'                │ 1050000 │ '5.00'  │ '30.00' │ 'yes'      │
│ 2       │ 'openai/gpt-6-astra'            │ 1050000 │ '10.00' │ '50.00' │ 'yes'      │
│ 3       │ 'anthropic/claude-fable-5.1'    │ 1000000 │ '10.00' │ '50.00' │ 'yes'      │
│ 4       │ 'anthropic/claude-opus-4.8'     │ 1000000 │ '5.00'  │ '25.00' │ 'yes'      │
│ 5       │ 'google/gemini-3.1-pro-preview' │ 1048576 │ '2.00'  │ '12.00' │ 'yes'      │
│ 6       │ 'google/gemini-3-flash-preview' │ 1048576 │ '0.50'  │ '3.00'  │ 'yes'      │
│ 7       │ 'deepseek/deepseek-v4-flash'    │ 1048576 │ '0.04'  │ '0.07'  │ 'yes'      │
│ 8       │ 'z-ai/glm-5.3-flash'            │ 1310720 │ '0.09'  │ '0.30'  │ 'yes'      │
│ 9       │ 'qwen/qwen3.8-flash'            │ 1000000 │ '0.15'  │ '0.47'  │ 'yes'      │
│ 10      │ 'qwen/qwen3.8-27b'              │ 1000000 │ '0.20'  │ '2.55'  │ 'yes'      │
│ 11      │ 'qwen/qwen3.8-max-0902'         │ 1000000 │ '2.00'  │ '6.00'  │ 'yes'      │
│ 12      │ 'tencent/hy4-preview'           │ 1048576 │ '0.83'  │ '2.50'  │ 'yes'      │
└─────────┴─────────────────────────────────┴─────────┴─────────┴─────────┴────────────┘
```

(Row 12 was re-verified after `tencent/hunyuan-a13b-instruct` was swapped for
`tencent/hy4-preview` in the `crowd` seat — see above; all other rows are the
original 2026-09-20 verification.)

All 13 slugs resolved against the live OpenRouter catalog with structured
output support. Full reasoning, both rounds of the decision, and rejected
alternatives: PR that introduced this entry.

## 2026-09-20 — `deepseek-v4-pro` → `deepseek-v4-flash`, `glm-5.2` → `glm-5.3-flash` (PR #101)

**Trigger:** measured failure. A `code` preset run on a ~30k-token diff hit
a 240 s timeout on `deepseek/deepseek-v4-pro` and an empty completion from
`z-ai/glm-5.2` — the council degraded to 2 of 4 delivered members on a
single run.

**Swap:** every preset carrying `deepseek/deepseek-v4-pro` or `z-ai/glm-5.2`
moved to `deepseek/deepseek-v4-flash` and `z-ai/glm-5.3-flash` respectively.

**Verification** (`council.mjs models --verify`, 2026-09-20):

```
┌─────────┬──────────────────────────────┬─────────┬────────┬─────────┬────────────┐
│ (index) │ model                        │ context │ in $/M │ out $/M │ structured │
├─────────┼──────────────────────────────┼─────────┼────────┼─────────┼────────────┤
│ 0       │ 'deepseek/deepseek-v4-flash' │ 1048576 │ '0.04' │ '0.07'  │ 'yes'      │
│ 1       │ 'z-ai/glm-5.3-flash'         │ 1310720 │ '0.09' │ '0.30'  │ 'yes'      │
└─────────┴──────────────────────────────┴─────────┴────────┴─────────┴────────────┘
```

Both slugs verified live and support structured output; both are also
cheaper than the models they replaced.
