#!/usr/bin/env bash
# bump-skill-versions.sh — parse changeset Skills: lines, bump SKILL.md versions
# Must run BEFORE `changeset version` (which deletes changeset files)
# Called by: pnpm run version
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
CHANGESET_DIR="$REPO_ROOT/.changeset"

source "$(dirname "$0")/lib.sh"

echo "Scanning changesets for skill version bumps..."

# Collect skill bumps from all pending changesets
# Format: SKILL_NAME:BUMP_TYPE (one per line)
all_bumps=""

for cs_file in "$CHANGESET_DIR"/*.md; do
  [ ! -f "$cs_file" ] && continue
  basename_file="$(basename "$cs_file")"
  # Skip non-changeset files
  [[ "$basename_file" == "README.md" ]] && continue
  [[ "$basename_file" == "_template" ]] && continue

  # Extract Skills: line (e.g., "Skills: lab-notes (minor), bye (patch)")
  skills_line=$(grep -E '^Skills:' "$cs_file" 2>/dev/null || true)
  [ -z "$skills_line" ] && continue

  # Remove "Skills: " prefix
  entries="${skills_line#Skills: }"

  # Split on comma and parse each "skill-name (bump-type)" pair
  IFS=',' read -ra PAIRS <<< "$entries"
  for pair in "${PAIRS[@]}"; do
    pair="$(echo "$pair" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')"
    skill="$(echo "$pair" | sed 's/[[:space:]]*(.*//;s/[[:space:]]*$//')"
    bump="$(echo "$pair" | sed -n 's/.*(\([^)]*\)).*/\1/p')"

    if [ -z "$skill" ] || [ -z "$bump" ]; then
      echo "  WARN: could not parse '$pair' in $basename_file"
      continue
    fi

    all_bumps="${all_bumps}${skill}:${bump}"$'\n'
  done
done

# Deduplicate: if same skill appears multiple times, keep highest bump
declare -A SKILL_BUMPS
while IFS= read -r line; do
  [ -z "$line" ] && continue
  skill="${line%%:*}"
  bump="${line##*:}"
  existing="${SKILL_BUMPS[$skill]:-}"
  if [ -z "$existing" ]; then
    SKILL_BUMPS[$skill]="$bump"
  else
    existing_pri=$(bump_priority "$existing")
    new_pri=$(bump_priority "$bump")
    if [ "$new_pri" -gt "$existing_pri" ]; then
      SKILL_BUMPS[$skill]="$bump"
    fi
  fi
done <<< "$all_bumps"

if [ ${#SKILL_BUMPS[@]} -eq 0 ]; then
  echo "  No skill version bumps found in changesets."
  exit 0
fi

# Apply version bumps
errors=0
for skill in "${!SKILL_BUMPS[@]}"; do
  bump="${SKILL_BUMPS[$skill]}"
  skill_md="$REPO_ROOT/skills/$skill/SKILL.md"

  if [ ! -f "$skill_md" ]; then
    echo "  WARN: skill directory 'skills/$skill' not found — skipping"
    continue
  fi

  current=$(extract_version "$skill_md")
  if [ -z "$current" ]; then
    echo "  WARN: no metadata.version in $skill/SKILL.md — skipping"
    continue
  fi

  new_version=$(increment_semver "$current" "$bump")
  replace_version_in_frontmatter "$skill_md" "$current" "$new_version"
  echo "  ✓ $skill: $current → $new_version ($bump)"
done

[ $errors -gt 0 ] && exit 1
echo "Done bumping skill versions."
