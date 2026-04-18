#!/usr/bin/env bash
# ballot-cover-archaeology.sh — fail if a ballot's cover block contains
# development archaeology (change notes, timestamps, "previous version").
#
# The cover block is defined as everything from the start of the file up
# to the first H3 heading (### ). The per-reviewer ballot template places
# `### DEC-001` as the first H3, so the cover is the content above.
#
# Forbidden patterns in the cover block (case-insensitive):
#   - updated YYYY-MM-DD
#   - changes since
#   - previous version
#   - ballot updated
#
# Rationale: archaeology belongs in the commit log and sessionlog. A
# reviewer reading a ballot wants to know who they are, what peers they
# are crossing-referencing, and where the full dossier lives — nothing else.
# A "ballot updated 2026-04-18" paragraph signals "still in flux" at exactly
# the moment the reviewer should be committing.
#
# Usage: ballot-cover-archaeology.sh <ballot-path>
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

name=$(basename "$file")
if [[ "$name" != *BALLOT* ]]; then
  exit 0
fi

# Extract the cover block: everything before the first H3 heading.
cover=$(awk '/^### /{exit} {print}' "$file")

# Guard: if there is no H3 at all, inspect a conservative first 30 lines
# rather than the whole file. This handles draft ballots with no DECs yet.
if ! grep -q '^### ' "$file"; then
  cover=$(head -n 30 "$file")
fi

# Patterns to forbid (case-insensitive). Use a single grep -iE for speed.
pattern='updated[^a-z]*[0-9]{4}-[0-9]{2}-[0-9]{2}|changes since|previous version|ballot updated'

if hits=$(grep -inE "$pattern" <<< "$cover"); then
  echo "ERROR: cover-block archaeology in $file:" >&2
  printf '%s\n' "$hits" | sed 's/^/  /' >&2
  echo "  The cover block (before the first '### ') must contain only:" >&2
  echo "  reviewer, role, peer-ballot link, full-dossier link." >&2
  echo "  See skills/ballot/SKILL.md §Conventions and references/ballot-conventions.md." >&2
  exit 1
fi

exit 0
