# Judge scoring comparison — Anthropic vs Gemma 4 26B MoE vs Qwen 3 30B MoE

Date: 2026-04-18
Context: PR #45 — which judge model is viable for the LLM-as-judge scorers?

## Results table

All runs used EVAL_MODE=full with `poolOptions.threads.maxThreads: 1` (serial execution) to avoid Ollama queue timeouts. Anthropic baseline was captured on 2026-04-18 using `claude-sonnet-4-6` from workspace `homebot-evals`.

| Scorer × Fixture | Anthropic (claude-sonnet-4-6) | Gemma 4 26B MoE | Qwen 3 30B MoE | Gemma delta | Qwen delta |
|------------------|-------------------------------|-----------------|-----------------|-------------|-----------|
| async-readability / pass | 0.9 | 1.0 | 1.0 | +0.1 | +0.1 |
| async-readability / fail | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 |
| preflight-evidence / pass | 1.0 | 1.0 | 1.0 | 0.0 | 0.0 |
| preflight-evidence / fail | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 |
| selectivity / pass | 1.0 | 1.0 | 1.0 | 0.0 | 0.0 |
| selectivity / fail | 0.1 | 0.0 | 0.0 | −0.1 | −0.1 |
| source-bias-flagging / pass | 1.0 | 1.0 | 1.0 | 0.0 | 0.0 |
| source-bias-flagging / fail | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 |
| tier-discipline / pass | 0.9 | 1.0 | 1.0 | +0.1 | +0.1 |
| tier-discipline / fail | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 |
| time-horizon-per-dec / pass | 0.8 | 1.0 | 1.0 | +0.2 | +0.2 |
| time-horizon-per-dec / fail | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 |

## Aggregate statistics

| Model | Mean abs delta vs Anthropic | Max delta | Pass-fixture avg | Fail-fixture avg | Separation (pass−fail) |
|-------|----------------------------|-----------|-------------------|-------------------|------------------------|
| Anthropic (claude-sonnet-4-6) | — | — | 0.933 | 0.017 | **0.917** |
| Gemma 4 26B MoE | 0.042 | 0.20 | 1.00 | 0.00 | **1.00** |
| Qwen 3 30B MoE  | 0.042 | 0.20 | 1.00 | 0.00 | **1.00** |

## Runtime and cost

| Provider | Model | Wall-clock (34 evals, serial) | Cost per full run | Cost per 30 CI runs/day |
|----------|-------|-------------------------------|-------------------|-------------------------|
| Anthropic API | claude-sonnet-4-6 | 2.4 s | $0.02 | ~$18/month |
| Ollama (local) | gemma4:26b | ~21 s | $0.00 | $0.00 |
| Ollama (local) | qwen3:30b | ~24 s | $0.00 | $0.00 |

Anthropic is roughly 9× faster in wall-clock than the local MoEs on this harness, while costing ~$0.02 per run at current Sonnet 4.6 prices. The $18/month figure is a ceiling estimate (30 runs/day × 30 days); typical dev-plus-CI usage should sit well below that.

## Verdict

All three providers achieve 100% classification accuracy (34/34 evals) on the "Correct Classification" scorer, which uses score ≥ 0.5 → pass, < 0.5 → fail.

- **Anthropic (claude-sonnet-4-6)** produces nuanced decimal scores (0.8–1.0 on pass fixtures; 0.0–0.1 on fail). This reveals prompt-level calibration concerns the rubric exposes — for example, `time-horizon-per-dec` pass scored 0.8 and `selectivity` fail scored 0.1, both indicating the judge saw partial ambiguity that a binary model would hide.
- **Gemma 4 26B MoE** and **Qwen 3 30B MoE** both output pure binary 1.0/0.0 with thinking mode absorbing all nuance. This is fine for classification but hides calibration signal.
- **Mean absolute delta** is 0.042 across 12 cells with a max of 0.20 — small enough that the MoEs track Anthropic's judgments closely, never inverting direction (no pass scored <0.5, no fail scored ≥0.5).

The critical concern (score direction inversion) did not occur for any provider × scorer × fixture combination.

**All three models are viable as judges for PR #45. The decision becomes a cost/latency/calibration-nuance trade:**

- Want canonical, fast, nuanced scoring → Anthropic (`EVAL_PROVIDER=anthropic`, default)
- Want offline/free + decisive classification → Gemma 4 26B (`EVAL_PROVIDER=ollama EVAL_OLLAMA_MODEL=gemma4:26b`)
- Alternative local, slightly slower → Qwen 3 30B

## Failure modes observed

- **`max_tokens: 128` causes empty `content`**: Gemma 4 and Qwen3 have thinking mode enabled by default. With a small token budget, the model fills the entire quota with CoT reasoning in the `reasoning` field and `content` stays empty. Fixed by setting `max_tokens: 4096`.
- **`options: {think: false}` unreliable**: Supposed to disable thinking mode, but Gemma 4 still generates reasoning for fixture-sized prompts (~1,500 chars). The `max_tokens: 4096` budget absorbs thinking + answer correctly. The option is retained but not relied upon.
- **Concurrent test execution causes Ollama queue timeouts**: With vitest's default concurrency, all 12 judge tests (6 scorers × 2 fixtures) start simultaneously. Ollama processes them one at a time, so tests 6–12 exceed the 30-second timeout and are recorded as `output: null`. Fixed by adding `poolOptions.threads.maxThreads: 1` to `vitest.config.ts` and `maxConcurrency: 1` + `testTimeout: 90_000` to `evalite.config.ts`.
- **Evalite reporter crash (cosmetic)**: evalite 0.19.0 + vitest 3.2.4 has a reporter bug: `TypeError: Cannot read properties of undefined (reading 'pool')` in `renderErrorsSummary`. This crashes the terminal output formatting when ANY test fails, but does not affect the SQLite database results or scoring. Once all tests pass, the crash disappears.
- **Binary scoring on local MoEs**: Both Gemma 4 and Qwen 3 output exactly 1.0 or 0.0 rather than the decimals the rubric allows. This is fine for the current binary-classification scorer but means nuanced calibration data is unavailable — an Anthropic baseline is needed to spot scorer-prompt ambiguity (as surfaced here on `time-horizon-per-dec` and `selectivity`).

## Recommended default

PR #45 should default to `EVAL_PROVIDER=anthropic` (the current default), with Ollama as an explicitly opt-in provider via `EVAL_PROVIDER=ollama`. Both `gemma4:26b` and `qwen3:30b` achieve correct classification on all 12 judge fixtures, making either a viable local alternative for users without an Anthropic API key. Since Gemma 4 26B is slightly faster than Qwen 3 30B in this eval (~21s vs ~24s for a full run), it remains the `EVAL_OLLAMA_MODEL` default.

**To run with Anthropic (canonical baseline, requires key):**
```bash
ANTHROPIC_API_KEY=sk-... pnpm evals:full:anthropic
```

**To run offline (no key needed):**
```bash
pnpm evals:full:ollama-gemma    # Gemma 4 26B MoE — slightly faster
pnpm evals:full:ollama-qwen     # Qwen 3 30B MoE — alternative
```
