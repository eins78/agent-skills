# text-to-speech — Development Documentation

## Purpose

Converts a text document to an MP3 audio file via a local TTS pipeline. Ships a
wrapper script (`synth-audio.sh`) with a clean `text → audio-file` CLI interface.
The current backend is Kokoro-82M; future backends swap in via config.

**Tier:** Publishable — reusable across projects.

## Installation / Dependencies

- **Kokoro-82M:** `uv pip install kokoro` (hexgrad/kokoro, Apache-2.0)
- **Python 3.11+** with `uv` (`brew install uv`)
- **ffmpeg:** `brew install ffmpeg`
- **espeak-ng:** `brew install espeak-ng` — hard dependency of `misaki`'s
  G2P. The bundled `espeakng_loader` dylib has a compiled-in CI build data
  path that doesn't exist on user machines and hard-aborts before Python
  can flush stdout. `kokoro.sh` runs an idempotent preflight (macOS) that
  symlinks the loader's dylibs to your Homebrew `espeak-ng` build
  (`$(brew --prefix espeak-ng)`) automatically — but the brew package
  itself must be installed first. Manual fallback, if the preflight can't
  find your loader's site-packages dir:
  ```bash
  SP=<venv>/lib/python3.12/site-packages/espeakng_loader
  for d in libespeak-ng.dylib libespeak-ng.1.dylib libespeak-ng.1.52.0.dylib; do
    ln -sf "$(brew --prefix espeak-ng)/lib/libespeak-ng.dylib" "$SP/$d"
  done
  ```
- **`VIRTUAL_ENV` must be set** in the calling environment before invoking
  `synth-audio.sh`. `misaki` auto-installs the `en-core-web-sm` spaCy model
  via `uv pip install` on first use; under `uv run --no-project` with no
  active `VIRTUAL_ENV` that install fails with "No virtual environment
  found" (exit 2, no traceback). `kokoro.sh` checks this upfront and fails
  loudly with the fix instead of letting the render fail deep inside misaki.
- **mutagen:** `uv pip install mutagen` (ID3 chapter + lyrics injection)
- **mlx-whisper** (optional, for `--verify`): `uv pip install mlx-whisper`

The skill does NOT install these — caller's responsibility.

## Usage

**v2.0.0 breaking change:** the L1 narrative rewrite no longer runs
automatically. A bare invocation with no existing `narrative.txt` now fails
loudly (see SKILL.md's "L1 Narrative Rewrite" section) instead of silently
shelling out to `claude --print`, which — run from inside an active Claude
Code session — could inherit the session's output style/CLAUDE.md and leak
meta-commentary into the rendered audio. The normal flow is now: the driving
agent dispatches an isolated subagent to write `narrative.txt`, then calls
`synth-audio.sh` with `--skip-layer 1`.

```bash
# Normal flow: narrative.txt already written by a dispatched subagent
./scripts/synth-audio.sh input.md output.mp3 --skip-layer 1

# With config file
cp ./templates/synth-backend.yaml.example ./synth-backend.yaml
./scripts/synth-audio.sh input.md output.mp3 --skip-layer 1

# With Whisper self-check
./scripts/synth-audio.sh input.md output.mp3 --skip-layer 1 --verify

# Standalone/headless fallback: isolated inline `claude --print --safe-mode`
# for L1 when no driving agent is present to dispatch a subagent
./scripts/synth-audio.sh input.md output.mp3 --allow-inline-llm-rewrite

# Skip embedding narrative.txt as an ID3 USLT lyrics frame (default: on)
./scripts/synth-audio.sh input.md output.mp3 --skip-layer 1 --no-lyrics
```

The script creates a `<output>.workdir/` directory for intermediates
(narrative.txt, normalized.txt, kokoro.txt, chapters.json). Regardless of
how `narrative.txt` was produced, `pipeline.py` runs `validate_narrative()`
on it before continuing — hard-failing on missing chapter markers, a
collapsed word count vs. the source, or known contamination patterns —
rather than rendering audio from a bad narrative.

## Origin / Provenance

Extracted from `eins78/home-workspace` experiments/tts-shootout/,
commits 1df3d9b–fd167b1 (Rounds 4–5, 2026-04).

Five rounds of iteration validated:
- Voice `am_puck` @ speed `0.92×` as the best Kokoro-82M output
- Phoneme-dict `[word](/IPA/)` form requirement (bare IPA causes artefacts)
- `deemphasize: []` constraint (R4: ~650 wraps produced "timid" cadence)
- Em-dash → `. —` chunking (prevents breathless run-on segments)
- List prosody prompt rules (announce count, ordinal words, sub-openers)

## Bundled Scripts (backends/lib/)

| File | Purpose |
|------|---------|
| `pipeline.py` | Main orchestrator: L1 (expects pre-written narrative.txt by default; `--allow-inline-llm-rewrite` for an isolated `claude --print --safe-mode` fallback) → `validate_narrative()` → L2 (normalize) → L3a/b/c (prosody prep) |
| `normalize.py` | L2: dates, versions, abbreviations, symbols |
| `kokoro_punct.py` | L3c: em-dash chunking, parenthetical → em-dash, ellipsis |
| `kokoro_round5.py` | Kokoro render: chapter-aware synthesis + ffmpeg MP3 conversion + narrative.txt → USLT lyrics |
| `inject_chapters.py` | ID3 CHAP/CTOC frame injection + optional USLT lyrics frame, via mutagen |
| `whisper_transcribe.py` | Whisper-based transcription for `--verify` (Apple MLX) |
| `chunk_and_rewrite.py` | Standalone/headless H2-chunked L1 rewrite for documents >5000 words (`--safe-mode` isolated); prefer subagent dispatch when a driving agent is present — see SKILL.md |

## Changelog Notes

**v2.0.0 (Finding 2 redesign):** L1's `claude --print` shelled out from
inside `pipeline.py`/`chunk_and_rewrite.py`, which — run from inside an
active Claude Code session — could inherit that session's output style /
CLAUDE.md and leak meta-commentary into the rewrite (observed: a literal
`★ Insight` block rendered into audio). Moved L1 orchestration up into
SKILL.md so the driving agent dispatches an isolated subagent instead; the
inline `claude --print` path is now opt-in (`--allow-inline-llm-rewrite`,
`--safe-mode`-isolated) for headless/standalone use. Added
`validate_narrative()` in `pipeline.py` as a source-agnostic backstop
(chapter-marker presence, word-count-collapse, and known-contamination
checks). Updated the stale `claude-sonnet-4-6` default to `claude-sonnet-5`
across `pipeline.py`, `chunk_and_rewrite.py`, and `kokoro.sh`. Also fixed
the `--verify` always-on bug in `synth-audio.sh`, added an espeak-ng
preflight + `VIRTUAL_ENV` precondition in `kokoro.sh`, and added ID3 USLT
lyrics embedding (narrative.txt travels inside the rendered MP3 for
debugging). See `docs/sessionlogs/` for the full session record.

## Future Improvements

- **Orpheus, Chatterbox backends:** Swap in via `--backend orpheus` when those
  pipelines stabilize. `kokoro.sh` design anticipates this.
- **`chunk-and-rewrite` split candidate:** `chunk_and_rewrite.py` (H2-split for
  >5k-word docs) is generally useful. Extract as a standalone skill if needed.
- **`whisper-ear-check` split candidate:** The `--verify` Whisper loop is useful
  beyond TTS. Extract if it grows beyond a single script.
