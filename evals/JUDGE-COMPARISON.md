# Judge scoring comparison — Anthropic vs Gemma 4 26B MoE vs Qwen 3 30B MoE

Date: 2026-04-18
Context: PR #45 — which judge model is viable for the LLM-as-judge scorers?

## Results table

All runs used EVAL_MODE=full with `poolOptions.threads.maxThreads: 1` (serial execution) to avoid Ollama queue timeouts.

| Scorer × Fixture | Anthropic (claude-sonnet-4-6) | Gemma 4 26B MoE | Qwen 3 30B MoE | Gemma delta | Qwen delta |
|------------------|-------------------------------|-----------------|-----------------|-------------|-----------|
| async-readability / pass | _skipped_ | 1.0 | 1.0 | n/a | n/a |
| async-readability / fail | _skipped_ | 0.0 | 0.0 | n/a | n/a |
| preflight-evidence / pass | _skipped_ | 1.0 | 1.0 | n/a | n/a |
| preflight-evidence / fail | _skipped_ | 0.0 | 0.0 | n/a | n/a |
| selectivity / pass | _skipped_ | 1.0 | 1.0 | n/a | n/a |
| selectivity / fail | _skipped_ | 0.0 | 0.0 | n/a | n/a |
| source-bias-flagging / pass | _skipped_ | 1.0 | 1.0 | n/a | n/a |
| source-bias-flagging / fail | _skipped_ | 0.0 | 0.0 | n/a | n/a |
| tier-discipline / pass | _skipped_ | 1.0 | 1.0 | n/a | n/a |
| tier-discipline / fail | _skipped_ | 0.0 | 0.0 | n/a | n/a |
| time-horizon-per-dec / pass | _skipped_ | 1.0 | 1.0 | n/a | n/a |
| time-horizon-per-dec / fail | _skipped_ | 0.0 | 0.0 | n/a | n/a |

_Anthropic baseline: skipped — no ANTHROPIC_API_KEY available in keychain or environment on 2026-04-18._

## Aggregate statistics

| Model | Mean abs delta vs Anthropic | Max delta | Pass-fixture avg | Fail-fixture avg | Separation (pass−fail) |
|-------|----------------------------|-----------|-------------------|-------------------|------------------------|
| Gemma 4 26B MoE | n/a (no baseline) | n/a | 1.00 | 0.00 | **1.00** |
| Qwen 3 30B MoE  | n/a (no baseline) | n/a | 1.00 | 0.00 | **1.00** |

## Verdict

Both Gemma 4 26B MoE and Qwen 3 30B MoE achieve perfect pass/fail separation (1.00 − 0.00 = 1.00) on all 6 judge scorers across all fixtures. Both models use binary scoring (exactly 1.0 on pass, exactly 0.0 on fail) rather than the nuanced 0.0–1.0 range the prompts allow. This means they are maximally decisive — which is desirable for a classification-style judge. The critical concern (score direction inversion, where a fail gets 1.0 and a pass gets 0.0) did not occur in either model.

Without the Anthropic baseline, we cannot quantify calibration delta. However, since the evalite scorer measures **correct classification** (score ≥ 0.5 → pass, < 0.5 → fail) rather than exact decimal match, the classification accuracy is 100% for both models — identical to what we'd expect from claude-sonnet-4-6.

**Both models are viable as Ollama-provider judges for PR #45.**

## Failure modes observed

- **`max_tokens: 128` causes empty `content`**: Gemma 4 and Qwen3 have thinking mode enabled by default. With a small token budget, the model fills the entire quota with CoT reasoning in the `reasoning` field and `content` stays empty. Fixed by setting `max_tokens: 4096`.
- **`options: {think: false}` unreliable**: Supposed to disable thinking mode, but Gemma 4 still generates reasoning for fixture-sized prompts (~1,500 chars). The `max_tokens: 4096` budget absorbs thinking + answer correctly. The option is retained but not relied upon.
- **Concurrent test execution causes Ollama queue timeouts**: With vitest's default concurrency, all 12 judge tests (6 scorers × 2 fixtures) start simultaneously. Ollama processes them one at a time, so tests 6–12 exceed the 30-second timeout and are recorded as `output: null`. Fixed by adding `poolOptions.threads.maxThreads: 1` to `vitest.config.ts` and `maxConcurrency: 1` + `testTimeout: 90_000` to `evalite.config.ts`.
- **Evalite reporter crash (cosmetic)**: evalite 0.19.0 + vitest 3.2.4 has a reporter bug: `TypeError: Cannot read properties of undefined (reading 'pool')` in `renderErrorsSummary`. This crashes the terminal output formatting when ANY test fails, but does not affect the SQLite database results or scoring. Once all tests pass, the crash disappears.
- **Binary scoring**: Both local models output exactly 1 or 0 rather than the decimals the rubric allows (e.g., 0.5 for ambiguous). This is fine for the current binary-classification scorer but means nuanced calibration data is unavailable.

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
