# AI Review Skill

## Purpose

A second opinion on a change from **one** model, through the same OpenRouter API and key as `ai-council-review`. The review streams to stdout while the model writes it. Made for the moments when the human cannot review (unfamiliar stack) or wants a quick check before committing. Several models at once, with synthesis: `ai-council-review`.

**Tier:** Publishable — reusable across projects and machines.

## Components

```
ai-review/
├── SKILL.md                      # agent instructions
├── README.md                     # this file
├── jsconfig.json                 # checkJs + strict (dev time only)
├── scripts/
│   ├── review.mjs                # the entry point: args, preflight, stream, exit codes
│   └── lib/                      # COPIES of ai-council-review/scripts/lib (see below)
├── references/
│   ├── models.json               # default model, timeout, budget (data, not code)
│   └── prompts/solo-review.md    # the reviewer prompt
└── tests/
    ├── review.test.mjs           # mock OpenRouter server, no network
    └── fixtures/tiny-diff.patch
```

## Shared library — read before you edit anything in `scripts/lib/`

`ai-review` and `ai-council-review` share one library, `scripts/lib/` (OpenRouter client, cost estimate and budget gate, input gathering and auto-context, config helpers, prompt assembly).

- **The canonical files are in `skills/ai-council-review/scripts/lib/`.** The council wins.
- **`skills/ai-review/scripts/lib/*.mjs` are byte-for-byte copies**, made so that `ai-review` works when it is installed alone (a skill installed on its own has no sibling skill directory to import from). The list of copied files is `SHARED` in [`.dev/scripts/sync-shared-lib.sh`](../../.dev/scripts/sync-shared-lib.sh): `config`, `openrouter`, `budget`, `input`, `prompts`, `schema`.
- **Always keep the copies in sync.** Change the library in `ai-council-review/scripts/lib/` only, then run `pnpm run sync:lib` (the copy overwrites; nothing flows the other way) and commit both directories together. Never edit a file in `ai-review/scripts/lib/` by hand: the next sync erases it.
- **A drift check enforces this.** `pnpm run validate` runs `sync-shared-lib.sh --check`, which fails when a copy differs from the original, is missing, or when `lib/` holds a file that is not on the list. CI runs `validate` on every pull request.
- **A change to a shared file touches both skills**: add the council tests for it, run `pnpm run test:council` and `pnpm run test:review`, and give both skills a bump in the changeset.
- If `review.mjs` needs another library file, add its name to `SHARED`, run the sync, commit.

The same rule is written in `ai-council-review/README.md`.

## Dependencies

| Dependency | Required | Install |
|---|---|---|
| Node.js >= 20 | Yes | `brew install node` |
| `AI_COUNCIL_OPENROUTER_API_KEY` (fallback `OPENROUTER_API_KEY`) | For a review (not for `--dry-run`) | <https://openrouter.ai/keys> |
| `gh` CLI | Only for `--pr` | `brew install gh` |
| npm packages | None (zero runtime dependencies) | — |

## Usage

See SKILL.md for the agent workflow. Quick reference:

```bash
review.mjs --dry-run                 # estimate, sends nothing, needs no key
review.mjs --branch > out.txt 2>&1   # stream the review into a file
review.mjs --pr 42 --model openai/gpt-5.3-codex
```

Exit codes: `0` ok · `1` usage/input · `2` reviewer failed or timed out · `3` budget gate · `4` key missing or rejected. The numbers match `ai-council-review`.

## Testing

```bash
node --test skills/ai-review/tests/*.test.mjs     # offline: mock OpenRouter server, no key, no network
pnpm run typecheck:review                         # tsc, needs `pnpm install` once
pnpm run validate                                 # frontmatter + the shared-library drift check
```

To try a real review (costs about $0.06): `AI_COUNCIL_OPENROUTER_API_KEY=... review.mjs --branch`.

## Design Decisions

- **One backend with the council.** The Gemini CLI hung without output and returned raw provider exit codes; the council's HTTP client already fails fast on 400/401/404, retries once on 429/5xx/network/empty, redacts keys and gates cost. `ai-review` reuses it instead of keeping a second backend.
- **Two skills, two names.** "A second opinion" and "a council" are different requests. `ai-review` is not "a council with one member": no anonymous labels, no clustering, no synthesis step, plain text out.
- **Streaming (`stream: true`).** The first text and every error reach the caller early. With the 600 s per-request limit and one retry a run can pass an agent's tool limit, so SKILL.md tells agents to run it in the background with output to a file. A retry happens only while no text has been shown; after that a failure keeps the partial text and exits 2.
- **Preflight first.** The key check is the first thing after argument parsing, before git, catalog or payload work. Exit 4 means "ask the human"; it is the same code the council uses.
- **No pipes.** Documented in SKILL.md: a pipe hides output and masks the exit code (a reported run lost a provider failure to `tail`'s exit 0).
- **No automatic fallback model.** A second model is a second charge and a different answer. The exit code tells the agent to ask.
- **Plain markdown output, not JSON.** The old `ERROR/WARNING/INFO` labels became `blocker/major/minor/nit` to match the council's severities; text streams naturally, JSON does not.
- **Default model `google/gemini-3.1-pro-preview`.** Chosen for its window (1M tokens), no known delivery failures in the council's model notes, and a different vendor from the host agent. Check the slug against the catalog with `--dry-run`.
- **Gemini and Codex removed at once** (1.0.0), including `REVIEW_PROVIDER`; a set `REVIEW_PROVIDER` gets one notice on stderr.

## Provenance

Created 2026-03-14 as a Gemini CLI wrapper (`review.sh`). Rebuilt on the OpenRouter backend in 1.0.0. Input gathering and auto-context come from the original script via `ai-council-review`'s port of it.

## Known Gaps

- The 600 s per-request limit is the council's value; a reasoning model on a large diff can use all of it.
- No cached or incremental reviews; every run sends the whole payload.
- The model catalog is cached 24 h under `~/.local/state/ai-review/` (`--no-cache` refetches).

## Changelog

### 1.0.0

- Rebuilt on OpenRouter with a streamed review; `scripts/review.mjs` replaces `review.sh` and `install-dependencies.sh`.
- Gemini and Codex CLIs removed; `REVIEW_PROVIDER` is ignored with a notice.
- Key preflight with exit code 4; exit codes 0–4 as in `ai-council-review`.
- Cost estimate and budget gate before any request; `--dry-run`, `--pr`, `--input-file`, `--model`.
- Shared library copied from `ai-council-review`, with a drift check in `pnpm run validate`.

### 0.0.2

- Auto-context: prepend project plan, instructions and file tree; `--plan`, `--no-context`.

### 0.0.1

- Initial release: Gemini CLI primary provider, OpenAI Codex secondary.
