#!/usr/bin/env bash
# dossier-framing-declared.sh — fail if a DOSSIER-*.md (non-template,
# non-ballot) has no `framing-mode:` declaration.
#
# The forbidden-word gate resolves mode from either YAML frontmatter
# (`framing-mode: <mode>`) or an HTML comment (`<!-- dossier-framing-mode: <mode> -->`).
# If neither exists, the forbidden-word gate exits 0 silently — a dossier
# with no declaration bypasses all vocabulary enforcement. This hook closes
# that gap: declaration itself is now a gate, not a rule.
#
# Context: closes the declaration-vs-consequence split documented in
# docs/pitches/2026-04-18-pitch-A-assessment.md §3.2.
#
# Usage: dossier-framing-declared.sh <dossier-path>
# Exit codes: 0 = declared (or not applicable); 1 = missing declaration; 2 = bad args.

set -euo pipefail

file="${1:-}"
if [[ -z "$file" ]]; then
  echo "usage: $(basename "$0") <dossier-path>" >&2
  exit 2
fi
if [[ ! -f "$file" ]]; then
  echo "ERROR: not a file: $file" >&2
  exit 2
fi

name=$(basename "$file")

# Only applies to main dossiers — skip ballots and anything not DOSSIER-*.md.
if [[ "$name" != DOSSIER-*.md ]]; then
  exit 0
fi
if [[ "$name" == *BALLOT* ]]; then
  exit 0
fi

# Check YAML frontmatter first.
if awk '/^---$/{b++; next} b==1 && /^framing-mode:/{found=1; exit} b>=2{exit} END{exit !found}' "$file"; then
  exit 0
fi

# Fallback: HTML-comment form.
if grep -qE '<!--[[:space:]]*dossier-framing-mode:[[:space:]]*[a-z]+[[:space:]]*-->' "$file"; then
  exit 0
fi

echo "ERROR: no framing-mode declared in $file" >&2
echo "  Add to YAML frontmatter:   framing-mode: oss|commercial|hiring|vendor|personal" >&2
echo "  Or as an HTML comment:     <!-- dossier-framing-mode: oss -->" >&2
echo "  See skills/dossier/references/framing-modes.md for mode definitions." >&2
exit 1
