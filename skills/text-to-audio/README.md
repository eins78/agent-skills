# text-to-audio — Development Documentation

## Purpose

Converts a text document to an MP3 audio file via a local TTS pipeline. Ships a
wrapper script (`synth-audio.sh`) with a clean `text → audio-file` CLI interface.
The current backend is Kokoro-82M; future backends swap in via config.

**Tier:** Publishable — reusable across projects.

## Installation / Dependencies

- **Kokoro-82M:** `uv pip install kokoro` (hexgrad/kokoro, Apache-2.0)
- **Python 3.11+** with `uv` (`brew install uv`)
- **ffmpeg:** `brew install ffmpeg`
- **mutagen:** `uv pip install mutagen` (ID3 chapter injection)
- **mlx-whisper** (optional, for `--verify`): `uv pip install mlx-whisper`

The skill does NOT install these — caller's responsibility.

## Usage

```bash
# Minimal
./scripts/synth-audio.sh input.md output.mp3

# With config file
cp ./templates/synth-backend.yaml.example ./synth-backend.yaml
./scripts/synth-audio.sh input.md output.mp3

# With Whisper self-check
./scripts/synth-audio.sh input.md output.mp3 --verify

# Skip L1 rewrite (reuse existing narrative.txt in workdir)
./scripts/synth-audio.sh input.md output.mp3 --skip-layer 1
```

The script creates a `<output>.workdir/` directory for intermediates
(narrative.txt, normalized.txt, kokoro.txt, chapters.json).

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
| `pipeline.py` | Main orchestrator: L1 (LLM rewrite) → L2 (normalize) → L3a/b/c (prosody prep) |
| `normalize.py` | L2: dates, versions, abbreviations, symbols |
| `kokoro_punct.py` | L3c: em-dash chunking, parenthetical → em-dash, ellipsis |
| `kokoro_round5.py` | Kokoro render: chapter-aware synthesis + ffmpeg MP3 conversion |
| `inject_chapters.py` | ID3 CHAP/CTOC frame injection via mutagen |
| `whisper_transcribe.py` | Whisper-based transcription for `--verify` (Apple MLX) |
| `chunk_and_rewrite.py` | H2-chunked L1 rewrite for documents >5000 words |

## Future Improvements

- **Orpheus, Chatterbox backends:** Swap in via `--backend orpheus` when those
  pipelines stabilize. `kokoro.sh` design anticipates this.
- **`chunk-and-rewrite` split candidate:** `chunk_and_rewrite.py` (H2-split for
  >5k-word docs) is generally useful. Extract as a standalone skill if needed.
- **`whisper-ear-check` split candidate:** The `--verify` Whisper loop is useful
  beyond TTS. Extract if it grows beyond a single script.
