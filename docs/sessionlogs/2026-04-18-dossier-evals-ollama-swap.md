# 2026-04-18 — dossier evals: Ollama provider swap

## What was refactored

- `evals/scorers/judges/_model.ts`: replaced `JUDGE_MODEL` constant with `judge()` async helper.
  Provider-aware: `EVAL_PROVIDER=anthropic` uses `@anthropic-ai/sdk`; `EVAL_PROVIDER=ollama` uses
  native `fetch` to Ollama's OpenAI-compatible endpoint (`/v1/chat/completions`).
- 6 judge files (`async-readability`, `preflight-evidence`, `selectivity`, `source-bias-flagging`,
  `tier-discipline`, `time-horizon-per-dec`): removed Anthropic client, now call `judge(prompt)`.
- `evals/package.json`: added `evals:full:anthropic`, `evals:full:ollama`, `evals:full:ollama-gemma`,
  `evals:full:ollama-qwen` scripts.
- `evals/README.md`: provider table, Ollama setup instructions, score parsing notes.
- `evals/evalite.config.ts` (new): `maxConcurrency: 1`, `testTimeout: 90_000` — required for serial
  Ollama execution.
- `evals/vitest.config.ts`: added `poolOptions.threads.maxThreads: 1` to prevent concurrent file
  execution from saturating the Ollama request queue.

## Models tested

- Gemma 4 26B MoE (`gemma4:26b` via Ollama) — 21s wall time for full 34-eval run
- Qwen 3 30B MoE (`qwen3:30b` via Ollama) — 24s wall time for full 34-eval run
- Anthropic `claude-sonnet-4-6` — skipped (no ANTHROPIC_API_KEY available)

## Comparison summary

→ See `docs/2026-04-18-judge-comparison.md` for full per-fixture scores and aggregate statistics.

Both models score **1.0 on pass fixtures, 0.0 on fail fixtures** across all 6 judge scorers.
Perfect classification accuracy. Binary scoring rather than nuanced decimals, but this
is sufficient for the `score ≥ 0.5 → pass` classification check the evals use.

**Recommended default:** keep `EVAL_PROVIDER=anthropic` as default; Ollama is opt-in.
Both local models are viable for users without an Anthropic API key.

## Gotchas

1. **Thinking mode + `max_tokens: 128` = empty `content`**: Gemma 4 and Qwen3 run extended
   thinking by default. With 128 tokens, the model fills the budget with CoT reasoning in
   the `reasoning` field and outputs nothing in `content`. Fix: `max_tokens: 4096`.

2. **`options: {think: false}` unreliable**: Does not reliably disable thinking on Gemma 4
   for complex prompts. Model still generates reasoning. Retained in code but the high
   `max_tokens` budget is the actual fix.

3. **Concurrent Ollama requests cause test timeouts**: Evalite runs test FILES in parallel
   by default. With 6 judge eval files × 2 fixtures = 12 simultaneous Ollama requests,
   and Ollama processing one at a time, requests #2–12 timeout within vitest's 30s default.
   Fix: `poolOptions.threads.maxThreads: 1` in `vitest.config.ts` + `maxConcurrency: 1`
   in `evalite.config.ts`.

4. **Evalite reporter crash (cosmetic)**: evalite 0.19.0 + vitest 3.2.4 has a formatting
   bug in `renderErrorsSummary` that triggers when any test fails. Does not affect DB results.
   Disappears once all tests pass.
