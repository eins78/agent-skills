---
"@eins78/agent-skills": major
---

`text-to-speech`: remove default nested `claude --print` from the L1 narrative rewrite — dispatch a subagent instead (Finding 2), plus three field-report fixes and ID3 lyrics embedding.

Field report from a fresh-machine run of the podcast/TTS pipeline surfaced
five issues; four were fixes, one a requested feature.

- **BREAKING — L1 narrative rewrite no longer runs automatically.**
  `pipeline.py`/`chunk_and_rewrite.py` used to shell out to `claude --print`
  directly. Run from inside an active Claude Code session, that nested call
  inherits the session's output style / project `CLAUDE.md` and can leak
  meta-commentary into the rewrite instead of prose (observed: a literal
  `★ Insight` block rendered into audio). SKILL.md now instructs the driving
  agent to dispatch an isolated rewrite subagent (Task/Agent tool), write
  `narrative.txt`, then call `synth-audio.sh --skip-layer 1`. A bare
  invocation with no existing `narrative.txt` now fails loudly by default
  instead of silently falling back to the old behavior; standalone/headless
  callers with no driving agent opt in via `--allow-inline-llm-rewrite`
  (isolated with `claude --print --safe-mode`). Verified empirically this
  session: a subagent dispatched from within an explanatory-output-style
  session — the exact failure condition — returned clean prose with no
  leaked commentary.
- Added `validate_narrative()` in `pipeline.py` as a source-agnostic
  backstop (applies regardless of whether narrative.txt came from a
  subagent, a human, or the inline fallback): hard-fails on missing chapter
  markers when the source has headings, a collapsed word count vs. the
  source, or known contamination patterns.
- Updated the stale `claude-sonnet-4-6` default to `claude-sonnet-5` in
  `pipeline.py`, `chunk_and_rewrite.py`, and `kokoro.sh`.
- Fixed `synth-audio.sh` always passing `--verify` to the backend regardless
  of whether the flag was given (`${VERIFY:+--verify}` treated the default
  `VERIFY=0` as non-empty; now gated on value).
- `kokoro.sh` now runs an idempotent espeak-ng data-path preflight (macOS):
  Kokoro's bundled `espeakng_loader` dylib has a compiled-in CI build path
  that hard-aborts on user machines; the preflight symlinks it to a Homebrew
  `espeak-ng` build (`$(brew --prefix espeak-ng)`) automatically. Documented
  `brew install espeak-ng` as a hard dependency.
- `kokoro.sh` now requires `VIRTUAL_ENV` to be set and fails loudly with the
  fix instead of letting misaki's background `en-core-web-sm` auto-install
  fail deep with an unhelpful "No virtual environment found".
- New: the rendered MP3's ID3 `USLT` frame now embeds the final
  `narrative.txt` (chapter markers stripped to plain title lines) by
  default — the spoken text travels inside the file for comparison against
  the source without a separate artefact. `--no-lyrics` opts out.

<!--
bumps:
  skills:
    text-to-speech: major
-->
