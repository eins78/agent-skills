#!/usr/bin/env bash
# dossier-dated-claim-scan.sh — list every dated claim in a dossier so the
# author can re-verify each against a primary source accessed today.
#
# This is a RULE + PARTIAL GATE: the script surfaces dates but does not verify
# them. Exit 0 is always returned after listing; the agent still has to check.
# The gate character is that the listing forces a decision per dated claim.
#
# Patterns scanned:
#   - ISO dates: 2026-04-18
#   - "closes [N] Month YYYY" (e.g. "closes 30 April 2026")
#   - "Month DD, YYYY"
#   - "release[d] in <year>", "launch[ed] in <year>"
#
# Usage: dossier-dated-claim-scan.sh <dossier.md>
# Exit codes: 0 = listing produced (or no dates found); 2 = bad args.

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

patterns=(
  '[0-9]{4}-[0-9]{2}-[0-9]{2}'
  'closes?[[:space:]]+[0-9]{1,2}[[:space:]]+[A-Z][a-z]+[[:space:]]+20[0-9]{2}'
  '(January|February|March|April|May|June|July|August|September|October|November|December)[[:space:]]+[0-9]{1,2},?[[:space:]]+20[0-9]{2}'
  '(released?|launched?|shipped?|published)[[:space:]]+in[[:space:]]+20[0-9]{2}'
)

found=0
echo "Dated-claim scan for $file:"
echo "  Re-verify each against a primary source accessed today."
echo ""

for pattern in "${patterns[@]}"; do
  hits=$(grep -niE "$pattern" "$file" || true)
  if [[ -n "$hits" ]]; then
    found=1
    printf '%s\n' "$hits" | sed 's/^/  /'
  fi
done

if [[ "$found" == 0 ]]; then
  echo "  (no dated claims matched)"
fi

exit 0
