---
name: text-to-audio
description: >-
  Use when you need to convert a text document to an audio file via a local TTS
  pipeline. Outputs MP3. Handles narrative rewrite, text normalization, prosody
  prep, and audio render. Backend is configurable. Triggers: text to speech,
  narrate document, make audio from text, synthesize speech, TTS, MP3 from
  document, convert to podcast, audio version of document.
globs: []
compatibility: claude-code, cursor
license: MIT
metadata:
  author: eins78
  repo: https://github.com/eins78/agent-skills
  version: "1.0.0-beta.1"
---

# text-to-audio

Converts a text document to an MP3 audio file via a local TTS pipeline. The skill ships a wrapper script (`synth-audio.sh`) with a clean `text → audio-file` interface. The current backend is Kokoro-82M; swapping backends is a config change.

> **Does NOT install any TTS backend.** See [Backend Dependencies](#backend-dependencies).

## Quick Start

```bash
${CLAUDE_SKILL_DIR}/scripts/synth-audio.sh input.md output.mp3
```

Copy and configure backend settings (optional):

```bash
cp ${CLAUDE_SKILL_DIR}/templates/synth-backend.yaml.example ./synth-backend.yaml
# Edit synth-backend.yaml to match your setup
```

## Backend Config (`synth-backend.yaml`)

Place `synth-backend.yaml` in your project root to override CLI defaults:

```yaml
backend: kokoro        # current: kokoro | future: orpheus | ...

kokoro:
  voice: am_puck       # validated voice (R5, 5-round iteration)
  speed: 0.92          # validated speed — see Kokoro backend section
  phoneme_dict: ./phoneme-dict.yaml   # optional IPA overrides
  stress_hints: ./stress.yaml         # optional emphasis overrides
```

See `${CLAUDE_SKILL_DIR}/templates/synth-backend.yaml.example` for annotated defaults.

## Kokoro Backend

When `--backend kokoro` (default), the pipeline runs four layers:
**L1** narrative rewrite (LLM) → **L2** normalization → **L3** prosody prep → **render**

### Voice and Speed

- **Voice:** `am_puck` (validated across 5 rounds of iteration)
- **Speed:** `0.92×` — empirical: at 0.95+ the `/s/→/k/` transition in compound nouns like "Six key concepts" slurs to "Zik's"; 0.92 is the last clean value

### Phoneme Dictionary (L3a)

Place `phoneme-dict.yaml` in your project root for project-specific proper nouns:

```yaml
terms:
  MyProduct:
    ipa: "mˈaɪ pɹˈɒdʌkt"
    notes: "Default G2P stresses wrong syllable"
```

**MUST use `[word](/IPA/)` Markdown-link form.** Bare `/IPA/` is not reliably parsed — in Round 4 misaki voiced IPA characters as literal names ("slash D stress I slash"). The backend applies the link form automatically from your dict entries.

⚠️ **Do NOT add entries where default G2P is already correct.** misaki will voice the word twice ("Letta Letta"). Test with `--verify` before committing new entries.

See `${CLAUDE_SKILL_DIR}/templates/phoneme-dict.yaml.example` for format and warnings.

### Stress Hints (L3b)

Place `stress.yaml` in your project root:

```yaml
emphasize:
  - not
  - only
  - critical

deemphasize: []
```

⚠️ **`deemphasize` MUST stay empty.** Round 4 regression: ~650 `(-1)` wraps on articles, pronouns, and linking verbs produced a "timid, reserved" cadence that listeners flagged in review. Known-unsafe: articles (the, a, an), pronouns (I, you, it, they, we), be-forms (is, are, was, were), filler adverbs (just, really, very, quite). Do NOT re-add.

See `${CLAUDE_SKILL_DIR}/templates/stress.yaml.example` for safe examples with commentary.

### Em-Dash Chunking (L3c)

Kokoro only creates chunk boundaries at `.`, `!`, `?`. An em-dash does not force a breath pause. The pipeline converts `X — Y` to `X. — Y` — adding a pause while preserving the em-dash's intonation curve (removing the dash entirely produced flat, mechanical prosody).

### List Prosody (L1 prompt rules)

The narrative rewrite enforces a spoken-list structure:
- Announce list length up front ("Here are six requirements.")
- Period-terminate every item
- Ordinal words (First, Second… Tenth) — not numerals
- Sub-opener topic sentence for items >40 words
- Anchor + capstone for nested sub-lists ("So that is the first tier. Next, the second tier…")

## Whisper Self-Check (`--verify`)

```bash
${CLAUDE_SKILL_DIR}/scripts/synth-audio.sh input.md output.mp3 --verify
```

After render, transcribes the MP3 with Whisper and reports IPA regressions, missing ordinal patterns, and unexpected artefacts. Requires `mlx-whisper` (Apple Silicon; `uv pip install mlx-whisper`).

## Backend Dependencies

The skill does NOT install or configure backend software. Caller must provide:

- **Kokoro-82M:** `uv pip install kokoro` (hexgrad/kokoro)
- **Python 3.11+** with `uv`
- **ffmpeg:** `brew install ffmpeg`
- **mutagen:** `uv pip install mutagen` (for ID3 chapter injection)
- **mlx-whisper** (optional, for `--verify`): `uv pip install mlx-whisper`

## Known Kokoro Limitations

- **Phoneme doubling:** Adding a phoneme-dict entry where G2P is already correct renders the word twice. Drop the entry; test with `--verify`.
- **Whisper vocabulary gaps:** Novel compounds (atproto → "AppProto"). Gloss in prose on first mention.
- **Chunker edge cases:** `etc.`, `e.g.` may survive L2 normalization. Spot-check the Kokoro text output.
