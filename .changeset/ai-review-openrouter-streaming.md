---
"@eins78/agent-skills": major
---

**`ai-review`** — now reviews through OpenRouter with a streamed answer, and the Gemini and Codex CLIs are gone.

`ai-review` 1.0.0 uses the same API and key as `ai-council-review` (`AI_COUNCIL_OPENROUTER_API_KEY`, else `OPENROUTER_API_KEY`), prints the review as it is written, checks the key before any work (exit 4), and shares the exit codes 0–4. `REVIEW_PROVIDER` and `GEMINI_API_KEY` no longer do anything; `review.sh` is replaced by `review.mjs`. `ai-council-review` gets a streaming client function, a changed exit-2 hint, and its auto-context no longer reads a `CLAUDE.md`, `PLAN.md` or plan file that is a symbolic link leading outside the repository; its rosters and defaults are unchanged.

<!--
bumps:
  skills:
    ai-review: major
    ai-council-review: patch
-->
