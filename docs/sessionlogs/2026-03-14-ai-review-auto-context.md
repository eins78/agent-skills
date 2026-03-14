# ai-review: Auto-include project context

**Date:** 2026-03-14
**Branch:** `feature/ai-review` (merged via PR #20)
**Skill:** ai-review v0.0.2

## Problem

When using the ai-review skill (Gemini CLI) to review code in ~/CODE/slideshow-app, Gemini produced false positives — flagging intentional design decisions (synchronous file I/O on model, `@Observable` without `@MainActor`, etc.) as issues. The workaround was a manual "Code Review Context" section in CLAUDE.md explaining every deliberate choice.

## Root Cause

The review script invokes Gemini with `-p` (prompt mode), which is single-shot: Gemini processes piped stdin and exits without using file-reading tools. Even though `--include-directories` grants sandbox access to the repo, Gemini never exercises it in `-p` mode. This is **our implementation choice**, not a Gemini CLI limitation — interactive mode supports full repo exploration.

## Solution

Stay with `-p` mode (deterministic, fast, provider-agnostic, quota-friendly) but **auto-prepend project context** into the review payload:

1. Implementation plan (`PLAN.md`, `.claude/plans/`, or `--plan` flag)
2. Project instructions (first of `CLAUDE.md`, `GEMINI.md`, `AGENTS.md`)
3. File tree (depth 3, capped at 200 entries)

Added `--no-context` flag to skip when payload size matters.

## Decisions

- **Prepend over agent mode:** `-p` mode with prepended context is preferred over switching to interactive/agent mode. Agent mode would let Gemini explore freely but is slower, uses more quota, harder to parse, and doesn't work with the codex provider. Documented as future improvement.
- **Plan inclusion:** Reviews should know what the code is *supposed* to do. Auto-detecting plan files (PLAN.md convention or Claude Code's `.claude/plans/`) addresses this.

## Cleanup

- Removed duplicate clone `~/CODE/skills-ai-review` (accidental full clone created during initial skill development). Repointed global symlink to main repo.

## Next Steps

- [ ] Test auto-context in a real review session (e.g., in slideshow-app)
- [ ] Consider agent mode (`--agent` flag) for thorough reviews as a future enhancement
- [ ] Remove the manual "Code Review Context" section from slideshow-app's CLAUDE.md once auto-context is verified
