---
name: ai-review
description: >-
  Get a code review from one second AI model (via OpenRouter) mid-session.
  The review streams as it is written. Use when asked to review code, get a
  second opinion, check quality, or verify implementation — especially in
  unfamiliar stacks. Triggers on /ai-review, "review this", "get a second
  opinion", "check with another model". For several models at once, use
  ai-council-review.
globs: []
license: MIT
metadata:
  author: eins78
  repo: https://github.com/eins78/agent-skills
  version: "0.0.3"
compatibility: Claude Code, Cursor
---

# AI Code Review

One second model reviews your change and the review streams back while it is written. Same OpenRouter API and key as `ai-council-review`; this skill asks **one** model, the council asks several and you synthesize.

## Prerequisites

- Node.js >= 20 (`node --version`). No CLI to install.
- An OpenRouter key in `AI_COUNCIL_OPENROUTER_API_KEY` (or `OPENROUTER_API_KEY` as a fallback), exported **in the environment of the process that runs the script** — your own shell, not only your login shell's profile. Get one at <https://openrouter.ai/keys>. If neither variable is set the script exits with code 4 before it does anything else. Ask your human partner for the key; do not hunt for it in keychains, dotfiles or session archives.
- `gh` only for `--pr`.
- Default model: `google/gemini-3.1-pro-preview`, about $0.06 for a 12k-token diff. Change it with `--model SLUG` or `AI_REVIEW_MODEL`.

## Data leaves the machine

The diff, files and project context go to OpenRouter and from there to the model's provider. Before the FIRST review in a session, confirm with your human partner that this is acceptable, especially for private or proprietary code. Consent given earlier in the session carries over. Do not include `.env` files, credentials or customer data.

## CRITICAL: Never Skip Reviews

When a review is requested, wait for the result. Do NOT skip it because of an error, do not proceed without it, and do not substitute your own review for the model's. If the script exits with a non-zero code, follow the table below and ask your human partner when it says so.

## How to run

The script is `${CLAUDE_SKILL_DIR}/scripts/review.mjs`. Always use this absolute path, never `./scripts/review.mjs`.

**Run it with output to a file, in the background, and read the file while it grows.** A review can take several minutes, longer than many agent tool limits. **Never pipe it** (`| tail`, `| head`): a pipe hides all output until the end and replaces the exit code with the pipe's.

```bash
out="$(mktemp -t ai-review.XXXXXX)"
# run in the background (your harness's background option), or end the line with &
(${CLAUDE_SKILL_DIR}/scripts/review.mjs --branch > "$out" 2>&1; echo "exit=$?" >> "$out") &
# then read $out now and again later; the review is done when the last line is exit=N
```

The first lines of `$out` (stderr) show the model, the estimate and the key variable in use. The review text follows as it streams. If nothing appears for a while, a `still waiting for the first text` line appears every 30 s. The last stderr lines show time, cost and `finish_reason`.

| What to review | Command |
|---|---|
| Unstaged changes (default) | `review.mjs` |
| Staged changes | `review.mjs --staged` |
| Branch vs main | `review.mjs --branch` (or `--branch origin/main`; `REVIEW_BASE_BRANCH` also works) |
| A pull request | `review.mjs --pr 42` (needs `gh`) |
| Specific files | `review.mjs path/a.ts path/b.ts` |
| A diff from a file | `review.mjs --input-file change.patch` (`-` reads stdin) |

Useful flags: `--context "Swift 6, iOS 18"` adds a line of context; `--plan PLAN.md` names the plan file; `--no-context` sends only the code; `--model SLUG`; `--dry-run` prints the estimate and sends nothing (needs no key); `--timeout SECS` limits one request (default 600).

## Exit codes

| Exit | Meaning | Your move |
|---|---|---|
| 0 | Review written to stdout | Act on it (below). A `WARNING: ... cut off` line on stderr means the review is incomplete |
| 1 | Usage or input error (bad flag, nothing to review, unknown model slug) | Fix as the message says; slug errors suggest near matches |
| 2 | The reviewer failed: HTTP error, timeout, broken stream, empty answer | Read the message. Retry once if it names a timeout or a 5xx. Otherwise ask your human partner. Text that arrived before the failure is above it and is incomplete |
| 3 | Budget gate blocked the request (nothing was sent) | Relay the estimate to your human partner. Only add `--yes` (or a larger `--budget`) after they approve **in this session** |
| 4 | API key missing or rejected | Ask your human partner to set `AI_COUNCIL_OPENROUTER_API_KEY` in the environment the agent runs in |

Never pass `--yes` on your own. It states that your human partner saw the estimate and approved it.

## Act on the feedback

1. Address `blocker` and `major` findings now.
2. Consider `minor` findings; fix them unless there is a good reason not to.
3. `nit` items are suggestions.
4. The reviewer sees a diff and limited context, not the repository, and may be wrong. Check a finding against the code before you act on it.
5. If a finding raises a question you cannot settle, ask your human partner.

## Auto-context

Unless you pass `--no-context`, the script prepends project context: the implementation plan (`--plan`, else `PLAN.md`, else the newest `.claude/plans/*.md`), project instructions (first of `CLAUDE.md`, `GEMINI.md`, `AGENTS.md`), and the file tree (depth 3). Large payloads are trimmed to fit the model's context window: lock files go first, big sections are cut, and the reviewer is told what was cut.

## Configuration

Flags > `AI_REVIEW_MODEL`, `AI_REVIEW_TIMEOUT_MS`, `AI_REVIEW_BUDGET_USD` > `~/.config/ai-review/config.json` > bundled `references/models.json`. The hard cap is on the worst-case cost (default $5); an estimate above $1 needs `--yes`.

`REVIEW_PROVIDER` and `--provider` from earlier versions are ignored with a notice: the Gemini and Codex CLIs are no longer used.
