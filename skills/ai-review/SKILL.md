---
name: ai-review
description: >-
  Get AI code review from a second model (Gemini/OpenAI) mid-session via CLI.
  Use when asked to review code, get a second opinion, check quality, or verify
  implementation — especially in unfamiliar stacks.
  Triggers on /ai-review, "review this", "get a second opinion",
  "check with another model".
globs: []
license: MIT
metadata:
  author: eins78
  repo: https://github.com/eins78/skills
  version: "0.0.1"
compatibility: Claude Code, Cursor
---

# AI Code Review

Request code reviews from a second AI model mid-session via CLI.

## Prerequisites

- `gemini` CLI installed (run `./scripts/install-dependencies.sh`)
- Google Account OAuth completed: run `gemini` interactively once
- Optional: `codex` CLI for OpenAI reviews: `brew install codex`

## CRITICAL: Never Skip Reviews

**Quality over speed.** When a review is requested, you MUST wait for the result. Do NOT:
- Skip the review because of rate limits or timeouts
- Proceed without the review and say "we can review later"
- Substitute your own review instead of calling the external model

The `gemini` CLI handles rate limit retries automatically. If the script exits with a timeout (exit code 2), ask your human partner for help — do not silently continue.

## Rate Limits (Free Tier — Google Account Auth)

| Metric | Limit |
|---|---|
| Requests per minute | 60 RPM |
| Requests per day | 1,000 RPD |
| Model | Auto-selected by Google (upgrades over time) |
| Cost | $0 |

The CLI retries automatically on rate limit hits (resets in seconds). The script has a 1-hour timeout — if exceeded, it aborts and you should ask the user for help.

## How to Use

### Step 1: Determine What to Review

Choose based on context:

| Situation | What to send |
|---|---|
| Just wrote code | The specific files changed |
| Mid-feature | `git diff` (unstaged changes) |
| Before commit | `git diff --cached` (staged changes) |
| Branch review | `git diff main...HEAD` |
| Specific concern | Single file or function |

### Step 2: Run the Review

Use the review script:

```bash
# Review unstaged changes (default)
./scripts/review.sh

# Review staged changes
./scripts/review.sh --staged

# Review specific files
./scripts/review.sh path/to/file1.swift path/to/file2.swift

# Review branch diff vs main
./scripts/review.sh --branch

# Review branch vs remote (when working on main directly)
REVIEW_BASE_BRANCH=origin/main ./scripts/review.sh --branch

# Add project context for better reviews
./scripts/review.sh --context "SwiftUI app, iOS 18+, Swift 6" path/to/file.swift
```

### Step 3: Act on Feedback

After receiving the review:
1. Address any ERROR-severity issues immediately
2. Consider WARNING items — fix unless there's a good reason not to
3. INFO items are suggestions — use judgment
4. If the review raises questions you're unsure about, discuss with the user

### Handling Failures

| Exit code | Meaning | Action |
|---|---|---|
| 0 | Success | Act on review feedback |
| 1 | No code to review / bad args | Check arguments |
| 2 | Timeout (>1 hour blocked) | **Ask user for help** — do not skip the review |

## Review Prompt Customization

Projects can add review context to their `CLAUDE.md`:

```markdown
## Code Review Context
- Stack: SwiftUI + Swift 6, targeting iOS 18+
- Review focus: Memory management, SwiftUI lifecycle correctness
- Conventions: MVVM pattern, async/await preferred over Combine
```

The skill will include this context automatically if present.

## Provider Configuration

Default provider is `gemini`. Override per-session:

```bash
# Use OpenAI instead
REVIEW_PROVIDER=codex ./scripts/review.sh
```

## Important Notes

- Reviews are advisory — the second model may have false positives
- Large diffs (>50KB) may be truncated. Split into smaller reviews if needed.
- The review model does NOT have access to your full codebase — include enough context in the files you send.
