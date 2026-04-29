#!/usr/bin/env bash
# synth-audio.sh — text document → audio file
#
# Usage: synth-audio.sh [OPTIONS] <input-file> <output.mp3>
#
# Options:
#   --backend   kokoro (default) | <future-backend-id>
#   --config    path to synth-backend.yaml (default: ./synth-backend.yaml)
#   --voice     backend-specific voice ID (kokoro default: am_puck)
#   --speed     backend-specific speed    (kokoro default: 0.92)
#   --skip-layer N  reuse existing pipeline intermediate from layer N (1..3)
#   --verify    run Whisper self-check after render
#   --help      show this message

set -euo pipefail

SKILL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# ---------- defaults ----------
BACKEND="kokoro"
CONFIG_FILE="./synth-backend.yaml"
VOICE=""
SPEED=""
SKIP_LAYER=0
VERIFY=0
INPUT_FILE=""
OUTPUT_FILE=""

# ---------- arg parsing ----------
while [[ $# -gt 0 ]]; do
    case "$1" in
        --backend)  BACKEND="$2";     shift 2 ;;
        --config)   CONFIG_FILE="$2"; shift 2 ;;
        --voice)    VOICE="$2";       shift 2 ;;
        --speed)    SPEED="$2";       shift 2 ;;
        --skip-layer) SKIP_LAYER="$2"; shift 2 ;;
        --verify)   VERIFY=1;         shift   ;;
        --help|-h)
            sed -n '2,12p' "${BASH_SOURCE[0]}" | sed 's/^# //'
            exit 0
            ;;
        -*)
            echo "error: unknown option: $1" >&2; exit 1 ;;
        *)
            if [[ -z "$INPUT_FILE" ]]; then
                INPUT_FILE="$1"
            elif [[ -z "$OUTPUT_FILE" ]]; then
                OUTPUT_FILE="$1"
            else
                echo "error: unexpected argument: $1" >&2; exit 1
            fi
            shift ;;
    esac
done

if [[ -z "$INPUT_FILE" || -z "$OUTPUT_FILE" ]]; then
    echo "error: input and output files required" >&2
    echo "usage: synth-audio.sh [OPTIONS] <input-file> <output.mp3>" >&2
    exit 1
fi

if [[ ! -f "$INPUT_FILE" ]]; then
    echo "error: input file not found: $INPUT_FILE" >&2
    exit 1
fi

# ---------- load config overrides ----------
if [[ -f "$CONFIG_FILE" ]]; then
    if command -v yq &>/dev/null; then
        cfg_backend=$(yq '.backend // ""'          "$CONFIG_FILE" 2>/dev/null || true)
        cfg_voice=$(  yq ".${BACKEND}.voice // \"\"" "$CONFIG_FILE" 2>/dev/null || true)
        cfg_speed=$(  yq ".${BACKEND}.speed // \"\"" "$CONFIG_FILE" 2>/dev/null || true)
        [[ -n "$cfg_backend" && "$cfg_backend" != "null" ]] && BACKEND="$cfg_backend"
        [[ -z "$VOICE" && -n "$cfg_voice" && "$cfg_voice" != "null" ]] && VOICE="$cfg_voice"
        [[ -z "$SPEED" && -n "$cfg_speed" && "$cfg_speed" != "null" ]] && SPEED="$cfg_speed"
    else
        echo "[synth-audio] warning: yq not found — skipping $CONFIG_FILE" >&2
    fi
fi

# ---------- dispatch ----------
BACKEND_SCRIPT="${SKILL_DIR}/scripts/backends/${BACKEND}.sh"
if [[ ! -f "$BACKEND_SCRIPT" ]]; then
    echo "error: no backend script found for '${BACKEND}' at ${BACKEND_SCRIPT}" >&2
    exit 1
fi

exec "$BACKEND_SCRIPT" \
    --input    "$INPUT_FILE" \
    --output   "$OUTPUT_FILE" \
    --voice    "${VOICE}" \
    --speed    "${SPEED}" \
    --skill-dir "${SKILL_DIR}" \
    --skip-layer "${SKIP_LAYER}" \
    ${VERIFY:+--verify}
