#!/usr/bin/env bash
# Render markdown to a compact A4 print PDF via pandoc + headless Chrome.
# Usage: md2pdf-print.sh INPUT.md [OUTPUT.pdf]
set -euo pipefail
SRC="${1:?usage: md2pdf-print.sh INPUT.md [OUTPUT.pdf]}"
OUT="${2:-${SRC%.md}.pdf}"
SKILL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CSS="$SKILL_DIR/themes/marked-print.css"
CHROME="${CHROME:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"

# Single tempdir holds the intermediate HTML and Chrome's stderr log so the
# trap actually cleans up everything (mktemp -t .html appended to a string
# leaks the original mktemp file).
WORKDIR="$(mktemp -d -t md2pdf)"
TMP_HTML="$WORKDIR/input.html"
CHROME_LOG="$WORKDIR/chrome.log"
trap 'rm -rf "$WORKDIR"' EXIT

pandoc "$SRC" -s --embed-resources --css="$CSS" -o "$TMP_HTML"

# Capture Chrome's stderr instead of dumping it to /dev/null — silent failures
# (Chrome non-zero exit, or success-with-empty-PDF) are otherwise undebuggable.
if ! "$CHROME" --headless=new --disable-gpu --no-pdf-header-footer \
    --print-to-pdf="$OUT" --virtual-time-budget=5000 \
    "file://$TMP_HTML" 2>"$CHROME_LOG"; then
  echo "md2pdf-print: chrome failed (exit nonzero):" >&2
  cat "$CHROME_LOG" >&2
  exit 1
fi

if [[ ! -s "$OUT" ]]; then
  echo "md2pdf-print: chrome exited 0 but produced empty PDF:" >&2
  cat "$CHROME_LOG" >&2
  exit 1
fi

echo "wrote $OUT"
