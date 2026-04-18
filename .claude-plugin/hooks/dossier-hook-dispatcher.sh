#!/usr/bin/env bash
# dossier-hook-dispatcher.sh — runs all dossier audit scripts against a file
# path extracted from a Claude Code PostToolUse event. Called by plugin.json
# hook wiring on Write|Edit.
#
# Reads JSON from stdin; extracts .tool_input.file_path. If the path matches
# DOSSIER-*.md, runs each audit script and aggregates exit codes. Exit 2 on
# any failure (PostToolUse convention: exit 2 pipes stderr back to Claude).
#
# Non-dossier paths, template files, and non-.md files exit 0 silently.

set -euo pipefail

here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

payload=$(cat)
file_path=$(printf '%s' "$payload" | jq -r '.tool_input.file_path // empty')

if [[ -z "$file_path" ]]; then
  exit 0
fi

# Template files are placeholders; hooks would fail on placeholder values.
if [[ "$file_path" == */templates/* ]]; then
  exit 0
fi

name=$(basename "$file_path")

# Only audit DOSSIER-*.md paths (this covers main dossiers + ballots).
if [[ "$name" != DOSSIER-*.md ]]; then
  exit 0
fi
if [[ ! -f "$file_path" ]]; then
  exit 0
fi

failures=""

# Ballot files only get the filename check; full dossier audit does not apply.
if [[ "$name" == *BALLOT* ]]; then
  if ! output=$("$here/dossier-ballot-filename.sh" "$file_path" 2>&1); then
    failures+="$output"$'\n'
  fi
else
  if ! output=$("$here/dossier-citation-audit.sh" "$file_path" 2>&1); then
    failures+="$output"$'\n'
  fi
  if ! output=$("$here/dossier-forbidden-words.sh" "$file_path" 2>&1); then
    failures+="$output"$'\n'
  fi
  if ! output=$("$here/dossier-section-order.sh" "$file_path" 2>&1); then
    failures+="$output"$'\n'
  fi
fi

if [[ -n "$failures" ]]; then
  printf '%s' "$failures" >&2
  echo "" >&2
  echo "Dossier audit failures above. Fix before calling DELIVER complete." >&2
  exit 2
fi

exit 0
