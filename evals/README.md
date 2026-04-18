# evals — dossier + ballot skill regression harness

Regression harness for the `dossier` and `ballot` skill reviewer-checklists. 16 scorers — one per checklist item — catch quality regressions when those skills change.

## How to run

```bash
cd evals
pnpm install

# Mechanical scorers only (zero API cost, fast, default dev loop)
pnpm evals

# All 16 scorers — Anthropic judges (requires ANTHROPIC_API_KEY)
ANTHROPIC_API_KEY=sk-... pnpm evals:full:anthropic
# or: copy .env.example to .env and add your key, then:
pnpm evals:full:anthropic

# All 16 scorers — Ollama judges (requires Ollama running on localhost:11434)
pnpm evals:full:ollama-gemma    # gemma4:26b (default)
pnpm evals:full:ollama-qwen     # qwen3:30b

# Watch mode
pnpm evals:watch
pnpm evals:full:watch
```

`.env` is gitignored. Copy from `.env.example`:

```
ANTHROPIC_API_KEY=sk-ant-...
```

### Provider env vars

| Variable | Default | Description |
|----------|---------|-------------|
| `EVAL_PROVIDER` | `anthropic` | `anthropic` or `ollama` |
| `EVAL_ANTHROPIC_MODEL` | `claude-sonnet-4-6` | Anthropic model ID |
| `EVAL_OLLAMA_BASE_URL` | `http://localhost:11434/v1` | Ollama OpenAI-compatible endpoint |
| `EVAL_OLLAMA_MODEL` | `gemma4:26b` | Ollama model tag |

**Anthropic:** needs `ANTHROPIC_API_KEY`. `.env` is gitignored — copy from `.env.example`.

**Ollama:** needs `ollama serve` running locally with the target model pulled (`ollama pull gemma4:26b`). No API key required. Models with thinking mode (Gemma 4, Qwen3) have thinking disabled via `options: {think: false}` so the score lands in `content`, not `reasoning`.

### Score parsing

Judges prompt for a bare decimal (`0.7`). If a model responds with surrounding prose (`"The score is 0.7."`), the parser extracts the first word-boundary decimal in range `[0, 1]`. If no decimal can be found, the scorer throws so the fixture is not silently scored `0`.

## Stack

Evalite 0.19.0 + Vitest 3.2.4 + Node + pnpm.

**Why not bun?** The ballot round resolved to bun-first with an explicit node+pnpm fallback. Evalite 0.19.0 depends on `better-sqlite3`, a Node-native addon that bun cannot load ([evalite #377](https://github.com/mattpocock/evalite/issues/377), closed not-planned 2026-02-11). This is the documented DEC-2 fallback, not a deviation.

## Scorer classification: 10 mechanical + 6 judge

The brief's rough estimate was 8+8. Three items are concretely mechanical on closer inspection:

| Item | Why mechanical |
|------|---------------|
| Hyperlink density | Link count per sentence is countable |
| Dated-claim freshness | Date regex vs. frontmatter `date:` comparison |
| Anti-options | Forbidden phrases + `<!-- justify: -->` sentinel |

### Dossier scorers (8)

| # | Scorer | Type |
|---|--------|------|
| 1 | Preflight Evidence | judge |
| 2 | Citation Integrity | mechanical |
| 3 | Dated-Claim Freshness | mechanical |
| 4 | Section Ordering | mechanical |
| 5 | Source Bias Flagging | judge |
| 6 | Hyperlink Density | mechanical |
| 7 | Selectivity | judge |
| 8 | Key Facts Box | mechanical |

### Ballot scorers (8)

| # | Scorer | Type |
|---|--------|------|
| 1 | Filename Pattern | mechanical |
| 2 | Cover-Block Cleanliness | mechanical |
| 3 | Anti-Options | mechanical |
| 4 | Time-Horizon-per-DEC | judge |
| 5 | Recommended-Not-Pre-Ticked | mechanical |
| 6 | Tier Discipline | judge |
| 7 | Async-Readability | judge |
| 8 | Reconciliation Location | mechanical |

## Cost gating

The 6 judge scorers call `claude-sonnet-4-6`. Running all 16 costs ~$0.05–0.15 per run depending on fixture sizes. Mechanical scorers always run; judge scorers only run with `EVAL_MODE=full`.

The gate is in `scorers/_gate.ts`:

```ts
export const isFullMode = () => process.env.EVAL_MODE === "full";
```

Judge eval files use `data: () => isFullMode() ? [...rows] : []` — an empty data array means the task function (and the API call) is never invoked.

## Add a scorer

1. **Classify** mechanical vs. judge.
2. **Write the scorer** in `scorers/{mechanical,judges}/<name>.ts`. Mechanical: pure function returning 0..1. Judge: calls `judgeXxx(content: string): Promise<number>` via Anthropic SDK using `JUDGE_MODEL` from `scorers/judges/_model.ts`.
3. **Add fixtures** in `fixtures/{dossiers,ballots}/<name>/pass.md` and `fail.md`. Keep ≤50 lines per fixture, focused on exercising exactly one concern.
4. **Add the `.eval.ts` file** in `evals/{dossier,ballot}/`. Use `passRow()`/`failRow()` from `scorers/_fixtures.ts`. Gate judges with `isFullMode()`.
5. **Verify**: `pnpm evals` shows the new eval with correct fixture count; `pnpm evals:full` scores 1.0 on pass and 0.0 on fail.

## Add a fixture

Pass fixture: minimal `.md` exercising the scorer's "good" path.
Fail fixture: same, but broken on exactly the one concern the scorer checks.

Smoke fixtures in `fixtures/{dossiers,ballots}/smoke/` are real artefacts from `docs/research/`. They test that scorers don't regress on known-good real-world input.

## Model

Judge provider and model are configured via env vars (see Provider env vars above). Default: Anthropic `claude-sonnet-4-6`. Provider switching is centralized in `scorers/judges/_model.ts`.
