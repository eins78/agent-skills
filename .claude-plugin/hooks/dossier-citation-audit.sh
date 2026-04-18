#!/usr/bin/env bash
# dossier-citation-audit.sh — fail if any [Xn] footnote ref in body has no
# corresponding definition in the §Sources section.
#
# Pattern matched: [A-Z]+[0-9]+ inside square brackets (e.g. [G6], [O12], [W3]).
# Markdown link text like [Github](url) is NOT matched — requires UPPERCASE+digits.
#
# Usage: dossier-citation-audit.sh <dossier.md>
# Exit codes: 0 = clean or no footnote refs used; 1 = orphan detected; 2 = bad args.

set -euo pipefail

file="${1:-}"
if [[ -z "$file" ]]; then
  echo "usage: $(basename "$0") <dossier.md>" >&2
  exit 2
fi
if [[ ! -f "$file" ]]; then
  echo "ERROR: not a file: $file" >&2
  exit 2
fi

# Split on "## Sources" (first occurrence, case-sensitive).
body=$(awk 'BEGIN{in_body=1} /^## Sources[[:space:]]*$/{in_body=0} in_body{print}' "$file")
sources=$(awk '/^## Sources[[:space:]]*$/{flag=1} flag{print}' "$file")

used=$(printf '%s\n' "$body" | grep -oE '\[[A-Z]+[0-9]+\]' | sort -u || true)
defined=$(printf '%s\n' "$sources" | grep -oE '\[[A-Z]+[0-9]+\]' | sort -u || true)

# No footnote-style citations at all → nothing to audit.
if [[ -z "$used" ]]; then
  exit 0
fi

if [[ -z "$sources" ]]; then
  echo "ERROR: $file uses [Xn] footnote refs but has no '## Sources' section" >&2
  exit 1
fi

orphans=$(comm -23 <(printf '%s\n' "$used") <(printf '%s\n' "$defined"))

if [[ -n "$orphans" ]]; then
  echo "ERROR: orphan citations in $file (used in body, not defined in Sources):" >&2
  printf '%s\n' "$orphans" | sed 's/^/  /' >&2
  exit 1
fi

exit 0
