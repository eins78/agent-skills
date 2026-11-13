#!/usr/bin/env bash
# sync-shared-lib.sh — keep ai-review's copy of the council library equal to the original.
#
# ai-council-review/scripts/lib is the canonical library. ai-review ships
# byte-for-byte copies of the files it uses, so that it works when installed
# alone (a skill installed on its own has no sibling skill directory).
# The council wins: on any difference the council's file overwrites the copy.
#
# Usage:
#   sync-shared-lib.sh          copy the canonical files over the copies
#   sync-shared-lib.sh --check  exit 1 and list every copy that differs or is missing
# Called by: validate-skills.sh (--check), pnpm run sync:lib
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
CANON="$REPO_ROOT/skills/ai-council-review/scripts/lib"
COPY="$REPO_ROOT/skills/ai-review/scripts/lib"

# The files ai-review uses. Add a name here when review.mjs starts importing another one.
SHARED=(config.mjs openrouter.mjs budget.mjs input.mjs prompts.mjs schema.mjs)

mode="${1:-sync}"
drift=0

for f in "${SHARED[@]}"; do
  if [ ! -f "$CANON/$f" ]; then
    echo "ERROR: canonical file missing: skills/ai-council-review/scripts/lib/$f" >&2
    exit 1
  fi
  if [ "$mode" = "--check" ]; then
    if [ ! -f "$COPY/$f" ] || ! cmp -s "$CANON/$f" "$COPY/$f"; then
      echo "  DRIFT: skills/ai-review/scripts/lib/$f differs from the council's copy" >&2
      drift=1
    fi
  else
    mkdir -p "$COPY"
    cp "$CANON/$f" "$COPY/$f"
    echo "  synced $f"
  fi
done

# No stray files in the copy directory: everything there must be on the list.
if [ -d "$COPY" ]; then
  for path in "$COPY"/*; do
    [ -e "$path" ] || continue
    name="$(basename "$path")"
    found=0
    for f in "${SHARED[@]}"; do [ "$f" = "$name" ] && found=1; done
    if [ "$found" -eq 0 ]; then
      echo "  DRIFT: skills/ai-review/scripts/lib/$name is not in the shared list" >&2
      drift=1
    fi
  done
fi

if [ "$mode" = "--check" ]; then
  if [ "$drift" -ne 0 ]; then
    echo "Shared library out of sync. Edit skills/ai-council-review/scripts/lib, then run: bash .dev/scripts/sync-shared-lib.sh" >&2
    exit 1
  fi
  echo "Shared library in sync (${#SHARED[@]} files)."
fi
