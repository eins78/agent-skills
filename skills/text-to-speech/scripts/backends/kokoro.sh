#!/usr/bin/env bash
# kokoro.sh — Kokoro-82M backend for synth-audio.sh
#
# Orchestrates the full L1→L3c→render pipeline using bundled Python libs.
# Called by synth-audio.sh — do not invoke directly.
#
# Requires (caller's environment):
#   - Python 3.11+ with uv
#   - kokoro package: uv pip install kokoro
#   - ffmpeg: brew install ffmpeg
#   - espeak-ng: brew install espeak-ng — misaki's G2P depends on
#     espeakng_loader's bundled dylib, whose data-path resolution is not
#     reliably correct on every install (see the probe-first preflight
#     below); Homebrew espeak-ng is the fallback when the bundled path
#     doesn't work, not a hard requirement on machines where it does
#   - mutagen: uv pip install mutagen
#   - mlx-whisper (optional, for --verify): uv pip install mlx-whisper
#   - VIRTUAL_ENV must be set (see precondition below) — misaki auto-installs
#     the en-core-web-sm spaCy model via `uv pip install` on first use, which
#     needs an active venv to install into

set -euo pipefail

LIB_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/lib" && pwd)"

# ---------- F4: VIRTUAL_ENV precondition ----------
# misaki (Kokoro's G2P dependency) auto-installs the en-core-web-sm spaCy
# model via `uv pip install` on first use. Under `uv run --no-project` with
# no active VIRTUAL_ENV, that install fails with "No virtual environment
# found" (exit 2, no traceback) — a confusing failure far from its real
# cause. A loud precondition here beats silently inferring a venv path:
# `uv run --no-project python` can resolve a uv-managed interpreter that
# isn't a pip-installable venv, so inference risks setting VIRTUAL_ENV
# somewhere `uv pip install` still can't use.
if [[ -z "${VIRTUAL_ENV:-}" ]]; then
    echo "error: VIRTUAL_ENV is not set." >&2
    echo "  misaki (Kokoro's G2P dependency) auto-installs the en-core-web-sm" >&2
    echo "  spaCy model via 'uv pip install' on first use, which requires an" >&2
    echo "  active virtual environment to install into. Fix:" >&2
    echo "    export VIRTUAL_ENV=/path/to/your/venv" >&2
    echo "  then re-run synth-audio.sh." >&2
    exit 1
fi

# ---------- defaults ----------
VOICE="am_puck"
SPEED="0.92"
SKIP_LAYER=0
VERIFY=0
ALLOW_INLINE_LLM_REWRITE=0
NO_LYRICS=0
INPUT_FILE=""
OUTPUT_FILE=""

# ---------- arg parsing ----------
while [[ $# -gt 0 ]]; do
    case "$1" in
        --input)      INPUT_FILE="$2";  shift 2 ;;
        --output)     OUTPUT_FILE="$2"; shift 2 ;;
        --voice)      [[ -n "$2" ]] && VOICE="$2";   shift 2 ;;
        --speed)      [[ -n "$2" ]] && SPEED="$2";   shift 2 ;;
        --skill-dir)  shift 2 ;;  # accepted but unused — backend computes own path
        --skip-layer) SKIP_LAYER="$2";  shift 2 ;;
        --verify)     VERIFY=1;         shift   ;;
        --allow-inline-llm-rewrite) ALLOW_INLINE_LLM_REWRITE=1; shift ;;
        --no-lyrics)  NO_LYRICS=1;      shift ;;
        *) echo "error: unknown option: $1" >&2; exit 1 ;;
    esac
done

if [[ -z "$INPUT_FILE" || -z "$OUTPUT_FILE" ]]; then
    echo "error: --input and --output required" >&2; exit 1
fi

WORK_DIR="${OUTPUT_FILE%.mp3}.workdir"
mkdir -p "$WORK_DIR"

INPUT_ABS="$(cd "$(dirname "$INPUT_FILE")" && pwd)/$(basename "$INPUT_FILE")"
OUTPUT_ABS="$(cd "$(dirname "$OUTPUT_FILE")" && pwd)/$(basename "$OUTPUT_FILE")"

echo "[kokoro] input:    $INPUT_ABS"
echo "[kokoro] output:   $OUTPUT_ABS"
echo "[kokoro] workdir:  $WORK_DIR"
echo "[kokoro] voice:    $VOICE  speed: $SPEED  skip-layer: $SKIP_LAYER"

# ---------- L1→L3c: pipeline.py ----------
echo "[kokoro] running pipeline (L1→L3c)..."
INLINE_LLM_FLAG=""
[[ "$ALLOW_INLINE_LLM_REWRITE" == "1" ]] && INLINE_LLM_FLAG="--allow-inline-llm-rewrite"
uv run --no-project python "${LIB_DIR}/pipeline.py" \
    "$INPUT_ABS" \
    "$WORK_DIR" \
    --skip-layer "$SKIP_LAYER" \
    --llm-model "claude-sonnet-5" \
    --prompt "${LIB_DIR}/../prompts/narrative-chapter-focused.md" \
    ${INLINE_LLM_FLAG}

# ---------- F3: espeak-ng data-path preflight (macOS) ----------
# The espeakng_loader package (a misaki/Kokoro dependency) ships a
# libespeak-ng.dylib whose data-path resolution is not always reliable —
# it can hard-abort before Python can flush stdout on some installs (a
# CI-build path baked in, or otherwise). But it is NOT reliably broken:
# the same dylib works fine on some machines/installs and fails on others
# (observed on this project: identical espeakng_loader build, byte-identical
# dylib+data — works from a normally-located venv, fails from a venv nested
# under a long path). Don't assume; probe. Run the actual runtime code path
# (misaki.espeak's import-time init + a real phonemize call) in a
# subprocess — if it fails/aborts, only THEN fix it by symlinking the
# loader's dylibs to a system espeak-ng build (brew), whose data path is
# independently valid. If it already works, do nothing and stay silent —
# no spurious warnings on a machine where nothing is wrong.
if [[ "$(uname)" == "Darwin" ]]; then
    if uv run --no-project python -c "
import types
from misaki.espeak import EspeakFallback
g2p = EspeakFallback(british=False)
ps, _ = g2p(types.SimpleNamespace(text='hello'))
assert ps
" >/dev/null 2>&1; then
        : # bundled espeak-ng data path already works here — nothing to do
    else
        LOADER_DIR="$(uv run --no-project python -c \
            'import espeakng_loader, os; print(os.path.dirname(espeakng_loader.__file__))' \
            2>/dev/null || true)"
        if [[ -n "$LOADER_DIR" && -d "$LOADER_DIR" ]]; then
            BREW_ESPEAK_PREFIX="$(brew --prefix espeak-ng 2>/dev/null || true)"
            BREW_ESPEAK_LIB="${BREW_ESPEAK_PREFIX}/lib/libespeak-ng.dylib"
            if [[ -n "$BREW_ESPEAK_PREFIX" && -f "$BREW_ESPEAK_LIB" ]]; then
                for dylib in libespeak-ng.dylib libespeak-ng.1.dylib libespeak-ng.1.52.0.dylib; do
                    target="${LOADER_DIR}/${dylib}"
                    # only touch it if it's already a symlink (or absent) —
                    # never clobber a real file placed there on purpose
                    if [[ ! -e "$target" || -L "$target" ]]; then
                        ln -sf "$BREW_ESPEAK_LIB" "$target"
                    fi
                done
                echo "[kokoro] espeak-ng: bundled data path failed its probe — linked loader dylibs to $BREW_ESPEAK_LIB"
            else
                echo "[kokoro] error: bundled espeak-ng data path failed its probe, and no" >&2
                echo "[kokoro]   Homebrew espeak-ng was found to fall back to — run: brew install espeak-ng" >&2
            fi
        fi
    fi
fi

# ---------- render: kokoro_round5.py ----------
echo "[kokoro] rendering audio..."
SLUG="$(basename "${OUTPUT_FILE%.mp3}")"
NO_LYRICS_FLAG=""
[[ "$NO_LYRICS" == "1" ]] && NO_LYRICS_FLAG="--no-lyrics"
uv run --no-project python "${LIB_DIR}/kokoro_round5.py" \
    "$WORK_DIR" \
    --voice "$VOICE" \
    --speed "$SPEED" \
    ${NO_LYRICS_FLAG} \
    "${SLUG}:${WORK_DIR}"

# kokoro_round5.py writes to <out_dir>/kokoro-<voice>-<slug>.mp3
RENDERED="${WORK_DIR}/kokoro-${VOICE}-${SLUG}.mp3"
if [[ ! -f "$RENDERED" ]]; then
    echo "error: render produced no output at $RENDERED" >&2; exit 1
fi
mv "$RENDERED" "$OUTPUT_ABS"
echo "[kokoro] wrote $OUTPUT_ABS"

# ---------- optional Whisper self-check ----------
if [[ "$VERIFY" -eq 1 ]]; then
    echo "[kokoro] running Whisper self-check..."
    TRANSCRIPT_PREFIX="${WORK_DIR}/whisper"
    uv run --no-project python "${LIB_DIR}/whisper_transcribe.py" \
        "$OUTPUT_ABS" \
        "$TRANSCRIPT_PREFIX"
    echo "[kokoro] transcript: ${TRANSCRIPT_PREFIX}.txt"
    echo "[kokoro] plain text: ${TRANSCRIPT_PREFIX}-plain.txt"
fi

echo "[kokoro] done."
