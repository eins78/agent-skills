#!/usr/bin/env bash
# ballot-filename.sh — enforce per-reviewer ballot naming convention.
#
# Accepts:  DOSSIER-<slug>-BALLOT-<reviewer>.md  (e.g. DOSSIER-A11y-BALLOT-Max.md)
# Rejects:  DOSSIER-<slug>-BALLOT.md             (single-file, two-checkbox format)
#
# Rationale: the single-file format forces each reviewer to scroll past the
# other's column and is cramped on phone/iPad. Per-reviewer files match the
# Quatico sales-hub convention and scale cleanly.
#
# Usage: dossier-ballot-filename.sh <path-or-filename>
# Exit codes: 0 = accepted; 1 = rejected; 2 = bad args.

set -euo pipefail

path="${1:-}"
if [[ -z "$path" ]]; then
  echo "usage: $(basename "$0") <path-or-filename>" >&2
  exit 2
fi

name=$(basename "$path")

# Not a ballot → nothing to check.
if [[ "$name" != *BALLOT* ]]; then
  exit 0
fi

# Strict: DOSSIER-*-BALLOT-<reviewer>.md, reviewer non-empty.
# Reviewer segment permits letters, digits, underscore, and hyphen
# (hyphen supports names like "Max-Albrecht" or "Anne-Marie").
if [[ "$name" =~ ^DOSSIER-.+-BALLOT-[A-Za-z0-9_-]+\.md$ ]]; then
  exit 0
fi

echo "ERROR: ballot filename '$name' does not match DOSSIER-<slug>-BALLOT-<reviewer>.md" >&2
echo "  Example: DOSSIER-A11y-Extension-Chrome-Store-BALLOT-Max.md" >&2
echo "  Rationale: per-reviewer files instead of single-file two-column ballots" >&2
exit 1
