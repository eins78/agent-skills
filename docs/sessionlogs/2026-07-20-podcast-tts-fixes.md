# text-to-speech: L1 subagent isolation + field-report fixes

**Date:** 2026-07-20
**Source:** Claude Code
**Session:** Reconstructed from 1 compaction · plan-mode design, then execution

## Summary

Fixed four issues from a fresh-machine field report on the `text-to-speech`
skill's Kokoro pipeline, plus one feature added mid-session. The headline
fix (Finding 2) removes the pipeline's default nested `claude --print` call
and replaces it with SKILL.md-driven subagent dispatch, closing a real
context-inheritance bug that leaked session output-style commentary into
rendered audio.

## Key Accomplishments

- **Finding 2 (priority):** redesigned L1 narrative rewrite. Empirically
  verified the fix works by dispatching a real rewrite subagent from
  *within this explanatory-output-style session* — the exact failure
  condition Max hit — and confirmed it returned clean prose with no
  leaked `★ Insight` block. Added `validate_narrative()` as a
  source-agnostic backstop and verified all three of its hard-fail paths
  (missing markers, word-count collapse, contamination denylist) with
  real `pipeline.py` runs, plus the negative-gate path (no narrative, no
  opt-in flag → loud failure) and the opt-in inline fallback's `--safe-mode`
  argv construction (via a stub `claude` binary).
- **Finding 1:** fixed `synth-audio.sh`'s always-on `--verify` bug; verified
  both directions with a stub backend that echoes its argv.
- **Finding 3:** added an idempotent espeak-ng data-path preflight to
  `kokoro.sh` (macOS), derived from `$(brew --prefix espeak-ng)` rather than
  a hardcoded prefix. Verified the symlink loop is idempotent and never
  clobbers a real (non-symlink) file, using a fake dylib since espeak-ng
  isn't actually installed via brew in this sandbox (confirmed: `brew
  --prefix` resolves a theoretical path even for uninstalled formulas — the
  code's `-f` existence check on the actual dylib correctly caught that and
  fell through to the warning branch).
- **Finding 4:** added a loud `VIRTUAL_ENV` precondition to `kokoro.sh`
  (chose loud-fail over silent `sys.prefix` inference, per plan review —
  `uv run --no-project` can resolve an interpreter that isn't a
  pip-installable venv). Verified it fires before any pipeline work starts.
- **Finding 5 (added mid-session, user request):** embedded the final
  `narrative.txt` (chapter markers stripped to plain title lines) as an ID3
  `USLT` lyrics frame, alongside the existing CHAP/CTOC injection. Verified
  via `inject_chapters.py`'s extended self-test (fresh write, idempotent
  re-inject, marker-stripping) and a standalone-CLI test (default
  sibling-file detection, `--no-lyrics` suppression).
- Updated the stale `claude-sonnet-4-6` default to `claude-sonnet-5` (user's
  choice, via AskUserQuestion) across all three call sites.
- Confirmed `private-podcast-feed` needed no changes — grepped for every
  finding pattern, zero matches.
- `pnpm test` (skill frontmatter validation) passes after all changes.

## Changes Made

- Modified: `skills/text-to-speech/scripts/synth-audio.sh` — F1 fix, F2/F5
  flag pass-through (`--allow-inline-llm-rewrite`, `--no-lyrics`)
- Modified: `skills/text-to-speech/scripts/backends/kokoro.sh` — F2 model id
  + flag pass-through, F3 espeak-ng preflight, F4 VIRTUAL_ENV precondition,
  F5 flag pass-through
- Modified: `skills/text-to-speech/scripts/backends/lib/pipeline.py` — F2
  gate (`--allow-inline-llm-rewrite`), `--safe-mode` on the inline fallback,
  `validate_narrative()`, model id
- Modified: `skills/text-to-speech/scripts/backends/lib/chunk_and_rewrite.py`
  — F2 `--safe-mode`, model id, doc note pointing to subagent-dispatch as
  the preferred in-session path
- Modified: `skills/text-to-speech/scripts/backends/lib/inject_chapters.py`
  — F5: `USLT` frame support, `strip_chapter_markers()`,
  `read_back_lyrics()`, `--lyrics`/`--no-lyrics` CLI, extended self-test
- Modified: `skills/text-to-speech/scripts/backends/lib/kokoro_round5.py` —
  F5: reads `narrative.txt`, threads `lyrics` through to `inject_chapters`
- Modified: `skills/text-to-speech/SKILL.md` — new L1 subagent-dispatch
  section, breaking-change callout in Quick Start, F3/F4/F5 dependency and
  usage docs, version 1.1.0 → 2.0.0
- Modified: `skills/text-to-speech/README.md` — F3/F4/F5 deps and usage,
  breaking-change note, changelog notes section
- Created: `.changeset/20260720-tts-l1-subagent-isolation.md`
- Created: this sessionlog

## Decisions

- **Gate, don't delete, the inline `claude --print` path** (Finding 2):
  Max said "get rid of" the nested call but also asked how to handle a
  standalone run with no driving agent. Resolved by removing it from the
  *default* path (now a loud failure without `narrative.txt`) but keeping
  it behind an explicit opt-in flag (`--allow-inline-llm-rewrite`) isolated
  with `--safe-mode`, default off — surfaced as a stated tradeoff in the
  plan rather than decided silently.
- **`--safe-mode` over `--bare` for the inline fallback's isolation flag:**
  `--bare` also restricts auth to `ANTHROPIC_API_KEY`/`apiKeyHelper` (no
  OAuth/keychain), which would break most Claude Code subscription users.
  `--safe-mode` disables the two named inheritance vectors (CLAUDE.md,
  output styles) plus hooks/plugins/custom agents, while leaving auth/model
  selection/tools/permissions normal.
- **`validate_narrative()` as the load-bearing backstop, not a nicety:**
  subagent context isolation is a behavioral guarantee, confirmed
  empirically this session but not something checkable statically. The
  advisor flagged this explicitly — if a subagent path ever does leak
  session context, this function is what actually stops garbage from
  reaching the renderer.
- **Word-count collapse threshold set low (20%), not the initially-drafted
  40%:** the narrative-chapter-focused prompt legitimately drops tables,
  code fences, and Sources/References sections, and compresses lists — a
  40% floor would false-positive on legitimately terse rewrites. 20% still
  catches "150 words for a 3000-word doc."
- **Contamination denylist kept small and explicitly incomplete:** targets
  the exact observed failure (`★`, `Insight ─`, "approve the plan", "The
  plan is written") at near-zero cost, documented in-code as a
  supplementary check, not the primary defense (structural checks are).
- **`claude-sonnet-5` as the new default model id** (user's explicit choice
  via AskUserQuestion) for the two secondary/fallback L1 paths — the
  primary path (subagent dispatch) doesn't take a model flag at all, since
  it uses the session's own model.
- **Loud `VIRTUAL_ENV` precondition over silent `sys.prefix` inference**
  (Finding 4, per plan review): `uv run --no-project python` can resolve a
  uv-managed interpreter that isn't a pip-installable venv, so silent
  inference risks setting `VIRTUAL_ENV` somewhere `uv pip install` still
  can't use.
- **Version bump to 2.0.0 (major), not minor:** removing the default L1
  auto-rewrite is a breaking change to existing callers — a bare
  `synth-audio.sh` invocation that previously worked (via the old inline
  `claude --print`) now fails loudly without a `--skip-layer 1` narrative
  or the new opt-in flag.

## Plan Reference

- Plan: `~/.claude/plans/you-are-in-a-cheeky-turing.md`
- Planned: Findings 1–4 from the field report, Finding 2 prioritized with
  an explicit remove-vs-gate decision surfaced for review; Finding 5 (ID3
  lyrics) added by the user mid-review, before plan approval, and folded
  into the same plan file.
- Executed: full plan as approved, with all five findings implemented and
  verified by actually running the code (not just claimed) — stub backends
  for argv inspection, real `pipeline.py` runs for the L1 gate and
  `validate_narrative()` paths, real `inject_chapters.py` self-tests with
  ephemeral `mutagen`/`pyyaml` via `uv run --with`, and a live subagent
  dispatch from within this session as the primary behavioral proof for
  Finding 2.

## Next Steps

- [ ] Commit all changes and open a PR (Copilot review enabled on
      `eins78/agent-skills`) — do not self-merge, per instruction.
- [ ] No full end-to-end Kokoro render was possible in this sandbox
      (`kokoro`/`misaki`/mutagen aren't installed — by design, the skill
      doesn't install backend software). Everything up to and including
      L1 gating, `validate_narrative()`, L2/L3, and ID3 chapter+lyrics
      injection was verified directly; actual Kokoro-82M speech synthesis
      was not exercised this session.
- [ ] Run the review/deliver loop on the PR (per instruction, handled by
      Max, not this session).

## Repository State

- Branch: `worktree-podcast-tts-fixes`
- Not yet committed at the time this sessionlog was written — commit and
  PR creation follow immediately after.
