#!/usr/bin/env bash
# Regression test for the `md2pdf-print.sh` recipe.
#
# Asserts:
#   1. Wrapper produces a PDF without erroring.
#   2. PDF is A4-sized.
#   3. Page count is reasonable (>= 1).
#   4. Japanese text from the fixture survives the pdf round-trip.
#   5. Emoji text from the fixture survives the pdf round-trip.
#
# Skips cleanly (exit 0) if Chrome / pandoc / pdfinfo / pdftotext are absent —
# this is a macOS-first recipe and CI may not have all four tools.
#
# Usage: tests/test-md2pdf-print.sh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILL_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
WRAPPER="$SKILL_DIR/scripts/md2pdf-print.sh"
FIXTURE="$SCRIPT_DIR/fixtures/print-test.md"
CHROME_DEFAULT="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
CHROME="${CHROME:-$CHROME_DEFAULT}"

skip() { echo "SKIP: $1"; exit 0; }
fail() { echo "FAIL: $1" >&2; exit 1; }
pass() { echo "PASS: $1"; }

# Preconditions
[[ -x "$WRAPPER" ]] || fail "wrapper not executable: $WRAPPER"
[[ -f "$FIXTURE" ]] || fail "fixture missing: $FIXTURE"
command -v pandoc >/dev/null || skip "pandoc not installed"
command -v pdfinfo >/dev/null || skip "pdfinfo not installed (brew install poppler)"
command -v pdftotext >/dev/null || skip "pdftotext not installed (brew install poppler)"
[[ -x "$CHROME" ]] || skip "Chrome not at $CHROME (set CHROME=... to override)"

OUT="$(mktemp -t md2pdf-test).pdf"
trap 'rm -f "$OUT"' EXIT

# 1. Wrapper runs without error
"$WRAPPER" "$FIXTURE" "$OUT" >/dev/null || fail "wrapper exited non-zero"
[[ -s "$OUT" ]] || fail "wrapper produced empty PDF"
pass "wrapper produced PDF ($(wc -c < "$OUT") bytes)"

# 2. A4 page size — pdfinfo reports A4 as 595 x 842 pt (allow 1pt slop)
PAGE_SIZE="$(pdfinfo "$OUT" | grep '^Page size:' | awk '{print $3, $5}')"
if [[ "$PAGE_SIZE" =~ ^59[45](\.[0-9]+)?\ 84[12](\.[0-9]+)?$ ]]; then
  pass "page size is A4 ($PAGE_SIZE pt)"
else
  fail "page size not A4: got '$PAGE_SIZE'"
fi

# 3. Page count >= 1
PAGES="$(pdfinfo "$OUT" | awk '/^Pages:/ {print $2}')"
if (( PAGES >= 1 )); then
  pass "page count: $PAGES"
else
  fail "page count looks wrong: $PAGES"
fi

# 4 + 5. Glyph survival via pdftotext
TEXT="$(pdftotext "$OUT" - 2>/dev/null)"
echo "$TEXT" | grep -q '香川県高松市浜ノ町' || fail "Japanese string missing from extracted text"
pass "Japanese preserved (香川県高松市浜ノ町)"
echo "$TEXT" | grep -q '🎟' || fail "emoji 🎟 missing from extracted text"
pass "emoji preserved (🎟)"

echo
echo "All checks passed."
