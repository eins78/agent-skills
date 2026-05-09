#!/usr/bin/env bash
# Render markdown to a compact A4 print PDF via pandoc + headless Chrome.
# Usage: md2pdf-print.sh INPUT.md [OUTPUT.pdf]
set -euo pipefail
SRC="${1:?usage: md2pdf-print.sh INPUT.md [OUTPUT.pdf]}"
OUT="${2:-${SRC%.md}.pdf}"
SKILL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CSS="$SKILL_DIR/themes/marked-print.css"
CHROME="${CHROME:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
TMP_HTML="$(mktemp -t md2pdf).html"
trap 'rm -f "$TMP_HTML"' EXIT
pandoc "$SRC" -s --embed-resources --css="$CSS" -o "$TMP_HTML"
"$CHROME" --headless=new --disable-gpu --no-pdf-header-footer \
  --print-to-pdf="$OUT" --virtual-time-budget=5000 \
  "file://$TMP_HTML" 2>/dev/null
echo "wrote $OUT"
