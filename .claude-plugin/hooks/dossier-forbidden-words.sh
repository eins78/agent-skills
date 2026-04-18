#!/usr/bin/env bash
# dossier-forbidden-words.sh — fail if a dossier's declared framing mode has
# any of its forbidden words in the body (case-insensitive).
#
# Framing mode is read from, in order:
#   1. First arg after filename: $2 (e.g. `oss`, `commercial`, `hiring`, `vendor`, `personal`)
#   2. YAML frontmatter field `framing-mode: <value>`
#   3. HTML comment anywhere in the file: `<!-- dossier-framing-mode: <value> -->`
#
# Lines containing `<!-- allow-forbidden -->` are skipped (intended meta-denial).
# The wordlists here MUST stay in sync with `skills/dossier/references/framing-modes.md`.
#
# Usage: dossier-forbidden-words.sh <dossier.md> [mode]
# Exit codes: 0 = clean or no mode declared; 1 = violation; 2 = bad args.

set -euo pipefail

file="${1:-}"
mode_arg="${2:-}"

if [[ -z "$file" ]]; then
  echo "usage: $(basename "$0") <dossier.md> [mode]" >&2
  exit 2
fi
if [[ ! -f "$file" ]]; then
  echo "ERROR: not a file: $file" >&2
  exit 2
fi

# Resolve mode.
mode="$mode_arg"
if [[ -z "$mode" ]]; then
  mode=$(awk '/^---$/{b++; next} b==1 && /^framing-mode:/{sub(/^framing-mode:[[:space:]]*/,""); gsub(/"/,""); print; exit} b>=2{exit}' "$file")
fi
if [[ -z "$mode" ]]; then
  mode=$(grep -oE '<!--[[:space:]]*dossier-framing-mode:[[:space:]]*[a-z]+[[:space:]]*-->' "$file" | head -1 | sed -E 's/.*dossier-framing-mode:[[:space:]]*([a-z]+).*/\1/' || true)
fi
if [[ -z "$mode" ]]; then
  # No framing declared → skip (SKILL.md §0 enforces declaration separately).
  exit 0
fi

# Template placeholder (e.g. `{oss | commercial | ...}`) → skip; this is not a
# real dossier. The placeholder gets replaced when an agent instantiates.
if [[ "$mode" == *'{'* || "$mode" == *'|'* ]]; then
  exit 0
fi

# Per-mode wordlists. Lowercase; grep is case-insensitive.
declare -a words=()
case "$mode" in
  oss)
    words=(lead-gen paddle stripe mor "compliance officer" vat pricing monetiz revenue donation)
    ;;
  commercial)
    words=(charity "pro bono" donation "volunteer basis" freemium-forever)
    ;;
  hiring)
    # Salary specifics without explicit approval — caller adds exemption comment.
    words=(salary compensation equity bonus)
    ;;
  vendor)
    words=("free tier" "community edition" "open core")
    ;;
  personal)
    # No forbidden words by default for personal dossiers.
    words=()
    ;;
  *)
    echo "ERROR: unknown framing mode '$mode' (expected: oss|commercial|hiring|vendor|personal)" >&2
    exit 2
    ;;
esac

if [[ ${#words[@]} -eq 0 ]]; then
  exit 0
fi

# Strip lines with exemption marker before scanning.
filtered=$(grep -v '<!--[[:space:]]*allow-forbidden' "$file" || true)

violations=""
for word in "${words[@]}"; do
  hits=$(printf '%s\n' "$filtered" | grep -inE "$word" || true)
  if [[ -n "$hits" ]]; then
    violations+="  [$word]:"$'\n'
    violations+=$(printf '%s\n' "$hits" | sed 's/^/    /')$'\n'
  fi
done

if [[ -n "$violations" ]]; then
  echo "ERROR: forbidden words for framing mode '$mode' in $file:" >&2
  printf '%s' "$violations" >&2
  echo "  (to allow a specific line, append '<!-- allow-forbidden -->' to it)" >&2
  exit 1
fi

exit 0
