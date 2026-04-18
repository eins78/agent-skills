#!/usr/bin/env bash
# ballot-anti-option.sh — fail on ballot options that admit they are bad
# without a justification comment.
#
# An anti-option is a checkbox row containing one of:
#   "not recommended" | "for completeness" | "obviously wrong" | "maintenance trap"
#
# If such a row exists, the next 3 lines must contain a <!-- justify: ... -->
# comment. If not, fail. Rationale: anti-options cost reviewer ticking time
# without changing outcomes — either cut the option or explain why it must stay.
#
# Usage: ballot-anti-option.sh <ballot-path>
# Exit codes: 0 = clean; 1 = violation; 2 = bad args.

set -euo pipefail

file="${1:-}"
if [[ -z "$file" ]]; then
  echo "usage: $(basename "$0") <ballot-path>" >&2
  exit 2
fi
if [[ ! -f "$file" ]]; then
  echo "ERROR: not a file: $file" >&2
  exit 2
fi

# Only run on ballot files.
name=$(basename "$file")
if [[ "$name" != *BALLOT* ]]; then
  exit 0
fi

# Find lines that look like an option row with an anti-option phrase.
# Option rows start with `- [ ]` or `- [x]` (allow both; pre-ticked is a
# separate concern).
pattern='^- \[[ xX]\].*(not recommended|for completeness|obviously wrong|maintenance trap)'

violations=""
while IFS= read -r line_num; do
  [[ -z "$line_num" ]] && continue
  # Inspect the next 3 lines for a justify comment.
  window=$(awk -v n="$line_num" 'NR>=n && NR<=n+3' "$file")
  if ! grep -q '<!--[[:space:]]*justify:' <<< "$window"; then
    offending=$(sed -n "${line_num}p" "$file")
    violations+="  line $line_num: $offending"$'\n'
  fi
done < <(grep -nE -i "$pattern" "$file" | cut -d: -f1 || true)

if [[ -n "$violations" ]]; then
  echo "ERROR: anti-options in $file without <!-- justify: ... --> comment:" >&2
  printf '%s' "$violations" >&2
  echo "  Either add '<!-- justify: <one-line reason> -->' within 3 lines after," >&2
  echo "  or delete the option. See skills/ballot/SKILL.md §Conventions." >&2
  exit 1
fi

exit 0
