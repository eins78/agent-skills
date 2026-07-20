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

- [x] Commit all changes and open a PR (Copilot review enabled on
      `eins78/agent-skills`) — do not self-merge, per instruction. **PR #65
      opened.**
- [x] Close the real-render verification gap on mac-zrh (see follow-up
      section below) — done, with two additional bugs found and fixed.
- [ ] Run the review/deliver loop on the PR (per instruction, handled by
      Max, not this session).

## Follow-up: real end-to-end render on mac-zrh + F3 refinement

After PR #65 was opened, Max approved and asked for two follow-ups: (1)
close the real-audio-verification gap the sandbox couldn't close, using
mac-zrh's actual Kokoro install; (2) make F3's preflight probe-first
instead of assuming the bundled espeak-ng data path is always broken.

### Real render

Built a proper `uv venv --python 3.12`, installed
`kokoro numpy soundfile pyyaml mutagen` into it (reusing the existing
`~/.cache/huggingface/hub` model cache — no re-download). Ran the actual
workflow end to end: dispatched a real L1 rewrite subagent (writing
`narrative.txt` directly, per the SKILL.md workflow) → `synth-audio.sh
--skip-layer 1` → real Kokoro-82M render on this machine's MPS backend.

Verified on the produced MP3:
- **(a) Audio renders:** 40.2s duration (`ffprobe`), non-silent
  (`ffmpeg -af volumedetect`: mean −23.6dB, max −2.4dB — real speech, not
  digital silence), full-file decode with `ffmpeg -f null -` exits clean
  (no truncation/corruption).
- **(b) USLT lyrics frame:** present, and — after the regex fix below —
  text-matches the marker-stripped `narrative.txt` exactly.
- **(c) ID3 CHAP/CTOC chapters:** present and correctly timed.

### Two additional bugs found and fixed by doing the real render

Running the actual pipeline (not mocked/isolated tests) surfaced two
pre-existing bugs neither the original field report nor the sandbox
verification could have caught:

1. **`kokoro_round5.py` `synth_full()`: zero-duration first chapter.** The
   narrative-chapter-focused.md convention (and the exact test narrative a
   real subagent produced, both in this follow-up and earlier in the
   session) puts the H1-title marker immediately before the first H2
   marker with no body between them. `synth_full()` appended a
   `chapters_ms` entry for *every* part with a title, before checking
   whether that part had any body — so the empty title-only part got a
   chapter entry pinned at the same `cumulative_samples` position as the
   next real chapter, producing two chapters at `start_ms=0`, which
   `inject_chapters.py`'s own duration-must-be-positive check correctly
   rejected (`ValueError: chapter 0 has non-positive duration: 0..0`).
   **Fix:** moved the `if not body: continue` check before the
   `chapters_ms.append(...)`, so a part with no audio can't anchor a
   chapter. The document title marker is now correctly dropped as a
   distinct navigable chapter when it has no content of its own (matches
   how a podcast player would want it — a zero-duration chapter isn't
   useful either way).
2. **`inject_chapters.py` `_CHAPTER_MARKER_RE`: back-to-back markers mashed
   together in lyrics.** The regex (copied from `pipeline.py`'s detection
   regex, which only needed `match.start()`/`group(1)` and so never
   noticed) used `\s*$`/`^\s*`, and Python's `\s` matches `\n`. For two
   adjacent markers separated only by a blank line, the greedy `\s*$` ate
   the blank line and the next marker's own newline, so after
   substitution the two titles landed with zero separator:
   `"The Habit of Small WinsWhy Momentum Matters"`. My original self-test
   didn't catch this because it only asserted round-trip consistency
   against `strip_chapter_markers`'s own output, not against a
   hand-verified expected string. **Fix:** changed the regex to
   `[ \t]*` on the outer edges (horizontal whitespace only, scoped to the
   marker's own line) while keeping `\s*` inside the brackets around the
   title text. Re-verified via a strengthened self-test that hand-writes
   the expected output for a back-to-back-markers case, and via the real
   render (lyrics now read back with correct paragraph breaks).

Both fixes were exercised for real: the render failed with the first bug,
was fixed, re-ran clean; the lyrics text was visibly wrong with the second
bug, was fixed, and the final MP3's USLT frame now matches
marker-stripped `narrative.txt` exactly (confirmed via a diff against a
hand-computed expected string, not just "it didn't crash").

### F3 refinement: probe first, don't assume

Live evidence this session that the bundled espeak-ng data path is **not**
reliably broken: with byte-identical `espeakng_loader` dylib + data
(verified via `shasum`) between two venvs, one built at
`~/tts-tmp-verify/.venv` (short path) worked with zero symlinking, while an
earlier attempt at a venv nested deep under this session's scratchpad
directory failed with the exact CI-path error from the original field
report. Root cause not fully pinned down (plausibly a fixed-size path
buffer inside older espeak-ng C code, given the failing path was
~178 chars vs. ~116 for the working one — but not confirmed), and it
doesn't need to be: the fix is to probe empirically rather than assume
either way.

`kokoro.sh`'s F3 preflight now runs the actual runtime code path
(`misaki.espeak`'s import-time init + one real `EspeakFallback` phonemize
call) in a subprocess. If it succeeds, the preflight does nothing and
prints nothing — no spurious "espeak-ng not found via Homebrew" warning on
a machine where nothing is wrong (this was the bug the old
always-assume-broken version had). Only if the probe fails does it fall
back to symlinking a Homebrew `espeak-ng` build (or emitting the
actionable error if none is found), preserving the never-clobber-a-real-file
guard from before. The real render above is live proof: it ran with zero
espeak-ng-related output on this machine.

## Repository State

- Branch: `worktree-podcast-tts-fixes`
- Initial commit: `38fb377` - text-to-speech: remove nested claude --print,
  dispatch a subagent for L1
- PR: https://github.com/eins78/agent-skills/pull/65 (open, not merged)
- Follow-up commit (real-render verification + 3 additional fixes: F3
  probe-first, chapter-timing bug, lyrics-regex bug) pushed to the same PR
  branch after this sessionlog update.
