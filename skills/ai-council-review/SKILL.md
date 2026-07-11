---
name: ai-council-review
description: >-
  Convene a council of ~4 frontier models via the OpenRouter API for
  independent parallel reviews of a PR, plan doc, or files, then synthesize
  agreements and dissents in-session. Use for high-stakes or contested
  changes, before irreversible decisions, or when one extra model's opinion
  is not enough — costs real money per run. Triggers on /ai-council-review,
  "council review", "panel review", "multi-model review", "review with
  multiple models", "ask several models", "get a third opinion",
  "high-stakes review", "openrouter review". For a quick single-model
  second opinion, use ai-review instead.
globs: []
license: MIT
metadata:
  author: eins78
  repo: https://github.com/eins78/agent-skills
  version: "0.0.0"
compatibility: Claude Code, Cursor
---

# AI Council Review

Several frontier models review the same material in parallel — blind to each
other — via one API (OpenRouter). A dispatch script handles fan-out, cost
gating, and clustering; **you** synthesize, because you can do the one thing
the council cannot: verify findings against the actual repository.

This is the heavyweight sibling of `ai-review` (single model, ~$0.03). A
council run costs real money (~$0.30–0.90 with default presets). Use it for
high-stakes decisions, not routine diffs.

## Data leaves the machine — confirm before first dispatch

Everything submitted (diffs, plan docs, file contents) is sent to the
OpenRouter API and forwarded to **multiple third-party model providers**
(different companies, different data-retention policies). For private or
proprietary code this means unreleased source leaves the machine.

- Before the FIRST council run in a session, confirm with your human partner
  that sending this content to external providers is acceptable — especially
  in private repos or anything under NDA. Consent given for this repo earlier
  in this session carries over; do not re-ask per run.
- Reduce exposure: review the diff, not the whole tree; never include `.env`
  files, credentials, or customer data in the input.
- Account-wide tightening: OpenRouter privacy settings (disable logging,
  restrict to ZDR-eligible providers).

## Prerequisites

- Node.js >= 20 (`node --version`)
- `OPENROUTER_API_KEY` exported (get one: <https://openrouter.ai/keys>).
  The script reads it from the environment only and never prints it. If it is
  missing, dispatch exits with code 4 — ask your human partner; do NOT hunt
  for keys in keychains, dotfiles, or session archives.

## CRITICAL rules

- **Never fabricate or substitute a council opinion.** If members fail or
  quorum is not met, report that and offer the `ai-review` fallback — do not
  write "what the model would probably say", and do not pass your own review
  off as a member's.
- **Never pass `--yes` on your own.** `--yes` asserts that your human partner
  saw the printed cost estimate and approved it *in this session*. Budget
  gate refusals (exit 3) are a stop, not an obstacle to route around.
- **Never skip the synthesis protocol.** Raw per-model output is not the
  deliverable; the verified, dissent-preserving report is.

## Workflow

Script: `${CLAUDE_SKILL_DIR}/scripts/council.mjs` (always via this absolute
path — never a relative `./scripts/...`).

### 1. Classify

| Input | Flags | Rubric |
|---|---|---|
| GitHub PR | `--pr <N>` | `--rubric code` |
| Unstaged / staged / branch diff | *(default)* / `--staged` / `--branch [base]` | `--rubric code` |
| Plan or design doc | `<file>` or `--plan <file>` | `--rubric plan` |
| Any other document/files | `<file...>` or `--input-file <f>` | `--rubric doc` |

Preset: `code` rubric → `--preset code`; otherwise the default preset is
already right. `--models a,b,c` overrides for custom councils. `--personas`
(experimental) gives members different focus lenses — it invalidates
agreement counting; the synthesis protocol switches to coverage mode.

### 2. Estimate (spend-free)

```bash
node ${CLAUDE_SKILL_DIR}/scripts/council.mjs review <flags> --dry-run
```

Show the user the per-model table and total. If the estimate exceeds the
confirmation threshold (default $1), you MUST get an explicit go-ahead in
this session before step 3.

### 3. Dispatch (1–4 minutes — run in background)

```bash
node ${CLAUDE_SKILL_DIR}/scripts/council.mjs review <same flags> [--yes]
```

The script fans out in parallel, retries once on 429/5xx, aborts hung
members at the timeout, persists everything, and prints `RUN_DIR=<path>` as
its last line.

| Exit | Meaning | Your move |
|---|---|---|
| 0 | Quorum met (check `degraded` in manifest) | Synthesize (step 4) |
| 1 | Usage/input error (bad slug, empty diff, oversized payload) | Fix per the message; slug errors include suggestions — update roster, retry |
| 2 | Quorum failed | Report which members failed and why; offer `ai-review` fallback; do NOT synthesize or self-substitute |
| 3 | Budget gate blocked (nothing sent) | Relay the estimate to your human partner; only proceed how they decide |
| 4 | API key missing/rejected | Ask your human partner to set `OPENROUTER_API_KEY` |

### 4. Synthesize

Follow `${CLAUDE_SKILL_DIR}/references/synthesis.md` step by step. Core
moves: agreement is counted over delivered members; parse-failed members'
raw text is read and included; top findings are **verified against the
actual repo** before being reported; dissent is preserved as contested items
and minority reports; ranking is `verified > severity > agreement >
confidence`.

### 5. Report

Write `report.md` into the run dir per
`${CLAUDE_SKILL_DIR}/references/report-template.md`; give the user the
condensed version in chat with actual vs estimated cost.

### 6. Optional: post to the PR

Only on explicit user request, post findings with `gh pr comment` (or a
formal review via `gh api`). The script never posts anywhere.

## Configuration

Precedence: flags > `AI_COUNCIL_*` env > repo `.ai-council.json` >
`~/.config/ai-council-review/config.json` > bundled
`references/presets.json` (presets: `default`, `code`, `budget`, `max`,
`smoke`; scalars: `budgetUsd`, `confirmThresholdUsd`, `timeoutMs`,
`quorum`, `preset`).

Useful env: `OPENROUTER_BASE_URL` (testing), `COUNCIL_TIMEOUT_MS`,
`REVIEW_BASE_BRANCH` (for `--branch`).

Run artifacts live under `~/.local/state/ai-council-review/<repo>/<run-id>/`
(override: `--out`). They contain the reviewed source — treat as sensitive;
never commit them.

## Inspecting the roster

```bash
node ${CLAUDE_SKILL_DIR}/scripts/council.mjs models                 # current council + live pricing
node ${CLAUDE_SKILL_DIR}/scripts/council.mjs models --verify a,b    # diagnose slugs
```

Model slugs churn. When dispatch exits 1 with "Unknown model slug", the fix
is a roster update (config override or a patch to `references/presets.json`)
— pick the suggested replacement closest in capability.
