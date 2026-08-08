#!/usr/bin/env bash
# Usage: md2kindle-epub.sh -o output.epub input.md [input2.md ...] [--title "Title"] [--raw-checkboxes]
#
# Converts markdown (dossier/ballot output, or any other markdown doc) to an
# EPUB suitable for Send-to-Kindle delivery: reflowable text, adjustable
# font size, and a working table of contents (built from heading levels;
# --split-level=2 keeps individual chapter files small).
#
# GFM task-list checkboxes ("- [ ] foo") are left as literal "[ ]" / "[x]"
# text by default (task_lists extension disabled on the reader) rather than
# pandoc's native <input type="checkbox"> task-list HTML. Plain text is
# guaranteed to survive Amazon's server-side EPUB->KFX conversion; whether
# KFX preserves HTML form elements is untested against a real device. Note
# that pre-converting to Unicode glyphs (☐/☑) does NOT dodge this: pandoc
# recognizes those glyphs as task-list markers unconditionally, independent
# of the task_lists extension flag, and still emits <input> for them.
# Pass --raw-checkboxes to re-enable task_lists and get native <input>
# checkboxes instead (try this if literal brackets look worse on-device).
#
# Background + test results: research/2026-08-06-kindle-delivery/

set -euo pipefail

usage() {
  echo "Usage: $0 -o output.epub input.md [input2.md ...] [--title \"Title\"] [--raw-checkboxes]" >&2
  exit 1
}

output=""
title=""
raw_checkboxes=0
inputs=()

while [ $# -gt 0 ]; do
  case "$1" in
    -o) output="$2"; shift 2 ;;
    --title) title="$2"; shift 2 ;;
    --raw-checkboxes) raw_checkboxes=1; shift ;;
    -h|--help) usage ;;
    *) inputs+=("$1"); shift ;;
  esac
done

[ -n "$output" ] || usage
[ "${#inputs[@]}" -gt 0 ] || usage

from_format="markdown"
[ "$raw_checkboxes" -eq 0 ] && from_format="markdown-task_lists"

# A title is NOT optional. dc:title is a REQUIRED element of the EPUB package
# metadata, and pandoc emits none when no title is set — producing a file that
# fails epubcheck and that Send-to-Kindle rejects. Amazon reports that rejection
# as the generic "E999 - Send to Kindle Internal Error", which names no defect
# and reads as transient, so the real cause is easy to miss: on 2026-08-08 a
# title-less build bounced twice, 3.5 hours apart, while every titled build from
# the same generator went through.
#
# So derive one rather than leaving it unset. First H1 of the first input, else
# the output filename de-slugified. Both beat silently shipping an invalid file.
if [ -z "$title" ]; then
  title=$(grep -m1 '^# ' "${inputs[0]}" 2>/dev/null | sed 's/^# *//; s/[[:space:]]*$//' || true)
fi
if [ -z "$title" ]; then
  title=$(basename "$output" .epub | tr '_-' '  ')
fi
echo "Title: $title" >&2

pandoc_args=(-f "$from_format" --toc --toc-depth=3 --split-level=2 -M lang=en-US -o "$output")
pandoc_args+=(-M "title=$title")

pandoc "${pandoc_args[@]}" "${inputs[@]}"

echo "Wrote $output"
