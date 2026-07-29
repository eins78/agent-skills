#!/usr/bin/env bash
# archive-source.sh — capture one cited web source for offline verification.
#
# Captures exactly the page at <url> (depth 0 — never recurses), writes it into
# <sources-dir>, and appends a row to <sources-dir>/index.md mapping the file
# back to its citation ID, original URL, and access date.
#
# Optimised for VERIFYING A CLAIM LATER, not for reproducing a website. Text
# fidelity outranks pixel fidelity; nothing here mirrors, crawls, or follows
# outlinks.
#
# Tool ladder — best available wins, degrades silently:
#   monolith  (optional)  single self-contained HTML, assets inlined as data URIs
#   curl      (always)    raw HTML — the floor; Apple-/distro-shipped everywhere
#   pandoc    (optional)  additional .md text extraction, layered on either tier
#
# `wget` is deliberately NOT in the ladder: its --quota "will never affect
# downloading a single file" (GNU Wget manual), so it cannot enforce the size
# ceiling below. curl --max-filesize can. See the research dossier at
# research/2026-07-26-source-archival/ for the full evaluation.
#
# NEVER fails a dossier. An unreachable host, a 403, a TLS error or an
# over-cap response all produce an index row with a status and reason, and
# exit 0. A missing archiver is not an error.
#
# Usage:
#   archive-source.sh <url> <citation-id> <sources-dir> [options]
#
# Options:
#   --no-wayback     Skip the Wayback availability lookup (see PRIVACY below).
#   --wayback-save   Submit the URL to the Internet Archive's Save Page Now.
#                    OUTWARD-FACING AND PUBLIC — see PRIVACY below.
#   -h, --help       Show usage.
#
# Examples:
#   archive-source.sh https://example.com/docs S1 research/2026-07-26-topic/sources
#   archive-source.sh https://example.com/docs S1 ./sources --no-wayback
#
# PRIVACY:
#   By default this performs ONE read-only lookup against
#   archive.org/wayback/available to record any pre-existing public snapshot.
#   That query publishes nothing, but it does disclose the URL to the Internet
#   Archive. Use --no-wayback to skip it entirely.
#
#   --wayback-save is different in kind: it SUBMITS the URL to a permanent
#   public archive. Never pass it by default. Doing so across a dossier
#   publishes the author's reading list one URL at a time.
#
# Exit codes: 0 = row recorded (captured, or recorded unavailable); 2 = bad args.

set -euo pipefail

# ---- Caps. Depth is always 0; there is no recursion knob by design. ----
readonly MAX_BYTES=5000000        # 5 MB per source (curl aborts mid-stream)
readonly TIMEOUT=20               # seconds per source
readonly MAX_REDIRS=5
readonly THIN_TEXT_CHARS=1000     # below this much extracted text => thin-capture
readonly MAX_SOURCES=100          # per dossier
readonly MAX_TOTAL_BYTES=104857600 # 100 MB per dossier

readonly INDEX_HEADER='| ID | URL | Accessed | File | Tool | SHA-256 | Bytes | Status | Wayback |'
readonly INDEX_RULE='|---|---|---|---|---|---|---|---|---|'

show_help() {
  sed -n '2,/^# Exit codes:/p' "$0" | sed 's/^# \{0,1\}//'
}

if [[ "${1:-}" == "--help" || "${1:-}" == "-h" ]]; then
  show_help
  exit 0
fi

# Validate arity before shifting: `shift 3` fails atomically with fewer than
# three args, leaving them to fall through to the option loop as "unknown
# option: https://…" instead of the usage line.
if [[ $# -lt 3 ]]; then
  echo "usage: $(basename "$0") <url> <citation-id> <sources-dir> [--no-wayback] [--wayback-save]" >&2
  exit 2
fi

url="$1"
cid="$2"
dir="$3"
shift 3

want_wayback=1
want_spn=0
while [[ $# -gt 0 ]]; do
  case "$1" in
    --no-wayback)   want_wayback=0 ;;
    --wayback-save) want_spn=1 ;;
    *) echo "unknown option: $1" >&2; exit 2 ;;
  esac
  shift
done

if [[ -z "$url" || -z "$cid" || -z "$dir" ]]; then
  echo "usage: $(basename "$0") <url> <citation-id> <sources-dir> [--no-wayback] [--wayback-save]" >&2
  exit 2
fi
if [[ "$url" != http://* && "$url" != https://* ]]; then
  echo "ERROR: url must start with http:// or https:// (got: $url)" >&2
  exit 2
fi

mkdir -p "$dir"
index="$dir/index.md"

# ---- Portable helpers -------------------------------------------------------

# sha256: macOS ships `shasum`, most Linux ships `sha256sum`. No jq anywhere in
# this script — jq is not present on a bare machine.
sha256() {
  if command -v sha256sum >/dev/null 2>&1; then
    sha256sum "$1" | awk '{print $1}'
  elif command -v shasum >/dev/null 2>&1; then
    shasum -a 256 "$1" | awk '{print $1}'
  else
    echo "-"
  fi
}

filesize() { wc -c < "$1" | tr -d ' '; }

# Length of human-readable text in an HTML file, using awk only.
#
# Splits on "<" so each record is TAG ">" TEXT, skipping script/style bodies.
# Deliberately not pandoc-based: pandoc is optional, and a measure that changes
# behaviour depending on what is installed is worse than a cruder consistent
# one. Validated against real pages — a JS shell (x.com) scores ~469 while every
# server-rendered page tested scored >4000. See the research dossier.
text_chars() {
  awk '
    BEGIN { RS = "<"; skip = 0; out = "" }
    {
      gt = index($0, ">")
      name = (gt > 1) ? substr($0, 1, gt - 1) : $0
      lname = tolower(name)
      if (lname ~ /^script/ || lname ~ /^style/) skip = 1
      else if (lname ~ /^\/script/ || lname ~ /^\/style/) skip = 0
      if (skip) next
      if (gt > 0) out = out " " substr($0, gt + 1)
    }
    END {
      gsub(/&[a-zA-Z#0-9]+;/, " ", out)
      gsub(/[ \t\r\n]+/, " ", out)
      sub(/^ /, "", out); sub(/ $/, "", out)
      print length(out)
    }
  ' "$1" 2>/dev/null || echo 0
}

# Escape a value for a markdown table cell: pipes would break the row, and the
# consistency gate parses this table with awk -F'|'.
cell() { printf '%s' "$1" | tr '\n' ' ' | sed 's/|/%7C/g'; }

slugify() {
  printf '%s' "$1" \
    | sed -e 's#^https\{0,1\}://##' -e 's/[?#].*$//' \
    | tr '/' '-' | tr -cs 'A-Za-z0-9._-' '-' \
    | sed -e 's/^-*//' -e 's/-*$//' -e 's/--*/-/g' \
    | cut -c1-60
}

# ---- Scaffold index + .gitignore on first use -------------------------------

if [[ ! -f "$index" ]]; then
  {
    echo "# Source Archive"
    echo
    echo "Local captures of sources cited by the dossier in this folder, for"
    echo "offline verification after link rot. Depth-0 captures — the cited page"
    echo "only, never a site mirror."
    echo
    echo "\`Accessed\` is the UTC date the capture was taken. \`SHA-256\` is over the"
    echo "captured file, so a later re-fetch can be compared against what was cited."
    echo
    echo "Status values: \`ok\`, \`thin-capture\` (page is likely JS-rendered — the"
    echo "capture is a shell; re-capture manually with a browser or single-file-cli),"
    echo "\`capped\` (exceeded the size ceiling; not stored), \`unavailable\` (fetch failed)."
    echo
    echo "$INDEX_HEADER"
    echo "$INDEX_RULE"
  } > "$index"
fi

if [[ ! -f "$dir/.gitignore" ]]; then
  {
    echo "# Captured page bodies. index.md and .md text extractions are committed;"
    echo "# raw .html bodies are third-party content — see the skill's"
    echo "# references/source-archival.md for the commit-vs-ignore rule."
    echo "#"
    echo "# PUBLIC repo: uncomment the next line to keep third-party HTML out of git."
    echo "# *.html"
  } > "$dir/.gitignore"
fi

# ---- Per-dossier caps -------------------------------------------------------

row_count=$(awk -F'|' 'NF>3 && $2 ~ /[A-Za-z0-9]/ && $2 !~ /^ *ID *$/ && $0 !~ /^\|-/ {n++} END{print n+0}' "$index")
if [[ "$row_count" -ge "$MAX_SOURCES" ]]; then
  echo "WARNING: $dir already holds $row_count sources (cap $MAX_SOURCES). Skipping $cid." >&2
  exit 0
fi

dir_bytes=$(find "$dir" -type f -exec wc -c {} + 2>/dev/null | tail -1 | awk '{print $1+0}')
if [[ "${dir_bytes:-0}" -ge "$MAX_TOTAL_BYTES" ]]; then
  echo "WARNING: $dir is at $dir_bytes bytes (cap $MAX_TOTAL_BYTES). Skipping $cid." >&2
  exit 0
fi

# ---- Capture ----------------------------------------------------------------

accessed=$(date -u +%Y-%m-%d)
slug=$(slugify "$url")
[[ -n "$slug" ]] || slug="source"
base="${cid}-${slug}"
html="$dir/${base}.html"

tool=""
status=""
note=""

if command -v monolith >/dev/null 2>&1; then
  # monolith documents no size limit, so bound it externally and size-check
  # after the fact rather than during.
  tool="monolith"
  if ! monolith -t "$TIMEOUT" -o "$html" "$url" >/dev/null 2>&1; then
    rm -f "$html"
    tool=""   # fall through to curl
  elif [[ -f "$html" ]] && [[ "$(filesize "$html")" -gt "$MAX_BYTES" ]]; then
    rm -f "$html"
    tool=""
    note="monolith output over cap"
  fi
fi

if [[ -z "$tool" ]]; then
  tool="curl"
  set +e
  curl -sSL \
    --max-time "$TIMEOUT" \
    --max-filesize "$MAX_BYTES" \
    --max-redirs "$MAX_REDIRS" \
    --user-agent "dossier-archive/1 (+offline verification copy)" \
    -o "$html" "$url" 2>/dev/null
  rc=$?
  set -e
  if [[ $rc -eq 56 ]]; then
    # curl enforces --max-filesize MID-STREAM and leaves the truncated bytes on
    # disk. Storing that would silently archive half a page.
    rm -f "$html"
    status="capped"
    note="exceeded ${MAX_BYTES}B"
  elif [[ $rc -ne 0 ]]; then
    rm -f "$html"
    status="unavailable"
    note="curl exit $rc"
  fi
fi

# ---- Derive row fields ------------------------------------------------------

if [[ -z "$status" && -f "$html" ]]; then
  chars=$(text_chars "$html")
  if [[ "${chars:-0}" -lt "$THIN_TEXT_CHARS" ]]; then
    status="thin-capture"
    note="${chars} chars of text — likely JS-rendered"
  else
    status="ok"
  fi
fi
[[ -n "$status" ]] || status="unavailable"

if [[ -f "$html" ]]; then
  bytes=$(filesize "$html")
  hash=$(sha256 "$html")
  file_cell="[${base}.html](${base}.html)"
  # Text extraction is a plain HTML->markdown conversion, NOT readability-based
  # boilerplate removal — nav and footer text survive. Adequate for verifying a
  # quote; do not describe it as readability extraction.
  #
  # Skipped for thin captures: extracting text from a JS shell yields noise.
  if command -v pandoc >/dev/null 2>&1 && [[ "$status" == "ok" ]]; then
    md="$dir/${base}.md"
    # gfm-raw_html drops layout <div>/<table> noise and is dramatically smaller
    # on semantic pages (measured: 209 KB -> 9.7 KB on MDN). But on table-layout
    # sites the whole page IS raw html, and stripping it leaves almost nothing
    # (measured: 8 bytes on Hacker News) — so sanity-check and retry without it.
    pandoc -f html -t gfm-raw_html --wrap=none -o "$md" "$html" 2>/dev/null || rm -f "$md"
    if [[ ! -s "$md" ]] || [[ "$(filesize "$md")" -lt $(( ${chars:-0} / 4 )) ]]; then
      pandoc -f html -t gfm --wrap=none -o "$md" "$html" 2>/dev/null || rm -f "$md"
    fi
    # The .md earns its place only by being the smaller, quotable artifact.
    if [[ -s "$md" ]] && [[ "$(filesize "$md")" -lt "$bytes" ]]; then
      file_cell="${file_cell}, [${base}.md](${base}.md)"
    else
      rm -f "$md"
    fi
  fi
else
  bytes="0"
  hash="-"
  file_cell="—"
fi

# ---- Wayback: read side by default, write side only on explicit request -----

wayback="—"
if [[ "$want_wayback" -eq 1 ]]; then
  # Read-only availability query. Publishes nothing. Parsed with sed, not jq.
  resp=$(curl -sS --max-time 10 \
    "https://archive.org/wayback/available?url=$(printf '%s' "$url" | sed 's#^https\{0,1\}://##')" \
    2>/dev/null || true)
  snap=$(printf '%s' "$resp" | sed -n 's/.*"url": *"\(http[^"]*web\/[^"]*\)".*/\1/p' | head -1)
  [[ -n "$snap" ]] && wayback="[snapshot](${snap})"
fi

if [[ "$want_spn" -eq 1 ]]; then
  # OUTWARD-FACING: this submits the URL to a permanent PUBLIC archive.
  # Reached only because --wayback-save was passed explicitly.
  echo "NOTE: submitting $url to the Internet Archive (public, permanent)." >&2
  curl -sS --max-time 60 -o /dev/null "https://web.archive.org/save/$url" 2>/dev/null || true
fi

# ---- Append the row ---------------------------------------------------------

[[ -n "$note" ]] && status="${status} (${note})"

printf '| %s | %s | %s | %s | %s | %s | %s | %s | %s |\n' \
  "$(cell "$cid")" \
  "[$(cell "$url")]($(cell "$url"))" \
  "$accessed" \
  "$file_cell" \
  "$tool" \
  "${hash:0:16}" \
  "$bytes" \
  "$(cell "$status")" \
  "$wayback" \
  >> "$index"

echo "archived $cid → $status (${tool}, ${bytes}B)"
exit 0
