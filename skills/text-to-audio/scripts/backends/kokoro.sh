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
#   - mutagen: uv pip install mutagen
#   - mlx-whisper (optional, for --verify): uv pip install mlx-whisper

set -euo pipefail

LIB_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/lib" && pwd)"

# ---------- defaults ----------
VOICE="am_puck"
SPEED="0.92"
SKILL_DIR=""
SKIP_LAYER=0
VERIFY=0
INPUT_FILE=""
OUTPUT_FILE=""

# ---------- arg parsing ----------
while [[ $# -gt 0 ]]; do
    case "$1" in
        --input)      INPUT_FILE="$2";  shift 2 ;;
        --output)     OUTPUT_FILE="$2"; shift 2 ;;
        --voice)      [[ -n "$2" ]] && VOICE="$2";   shift 2 ;;
        --speed)      [[ -n "$2" ]] && SPEED="$2";   shift 2 ;;
        --skill-dir)  SKILL_DIR="$2";   shift 2 ;;
        --skip-layer) SKIP_LAYER="$2";  shift 2 ;;
        --verify)     VERIFY=1;         shift   ;;
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
uv run --no-project python "${LIB_DIR}/pipeline.py" \
    "$INPUT_ABS" \
    "$WORK_DIR" \
    --skip-layer "$SKIP_LAYER" \
    --llm-model "claude-sonnet-4-6" \
    --prompt "${LIB_DIR}/../prompts/narrative-chapter-focused.md"

# ---------- render: kokoro_round5.py ----------
echo "[kokoro] rendering audio..."
SLUG="$(basename "${OUTPUT_FILE%.mp3}")"
uv run --no-project python "${LIB_DIR}/kokoro_round5.py" \
    "$WORK_DIR" \
    --voice "$VOICE" \
    --speed "$SPEED" \
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
