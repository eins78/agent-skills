#!/usr/bin/env bash
# dossier-section-order.sh — enforce glossary-first / sources-last template rule.
#
# Rules:
#   R1. A section titled Glossary, Key Concepts, or Terminology MUST appear
#       BEFORE any section titled Executive Summary or Management Summary.
#   R2. A section titled Sources MUST be the LAST H2 section.
#
# Rationale: glossary is read-support (needed before terms appear); sources
# are trust-support (consulted when a claim is questioned). The asymmetry is
# deliberate — do not move glossary to the back by analogy with sources.
#
# Usage: dossier-section-order.sh <dossier.md>
# Exit codes: 0 = order OK; 1 = violation; 2 = bad args.

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

# Get ordered list of H2 headings (line numbers preserved).
headings=$(grep -nE '^##[[:space:]]' "$file" || true)
if [[ -z "$headings" ]]; then
  exit 0
fi

glossary_line=$(printf '%s\n' "$headings" | grep -iE '##[[:space:]]+(glossary|key concepts|terminology)' | head -1 | cut -d: -f1 || true)
summary_line=$(printf '%s\n' "$headings" | grep -iE '##[[:space:]]+(executive summary|management summary)' | head -1 | cut -d: -f1 || true)
sources_line=$(printf '%s\n' "$headings" | grep -iE '##[[:space:]]+sources' | tail -1 | cut -d: -f1 || true)
last_h2_line=$(printf '%s\n' "$headings" | tail -1 | cut -d: -f1)

violations=0

# R1: Glossary before Executive Summary.
if [[ -n "$glossary_line" && -n "$summary_line" ]]; then
  if (( glossary_line > summary_line )); then
    echo "ERROR: Glossary/Key Concepts appears at line $glossary_line, AFTER Executive/Management Summary at line $summary_line" >&2
    echo "  Rule: glossary is read-support — must precede content that uses its terms" >&2
    violations=$((violations + 1))
  fi
fi

# R2: Sources is the last H2 section.
if [[ -n "$sources_line" ]]; then
  if [[ "$sources_line" != "$last_h2_line" ]]; then
    echo "ERROR: Sources at line $sources_line is not the last H2 section (last is at line $last_h2_line)" >&2
    echo "  Rule: sources are trust-support — consulted last, placed last" >&2
    violations=$((violations + 1))
  fi
fi

if (( violations > 0 )); then
  exit 1
fi
exit 0
