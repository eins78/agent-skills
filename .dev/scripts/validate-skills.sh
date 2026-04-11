#!/usr/bin/env bash
# validate-skills.sh — validate SKILL.md frontmatter for all skills
# Checks: name matches dir, version present, README exists, license present
# Called by: pnpm run validate, CI pipeline
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"

source "$(dirname "$0")/lib.sh"

echo "Validating skill metadata..."

errors=0
warnings=0

for skill_dir in "$REPO_ROOT"/skills/*/; do
  [ ! -d "$skill_dir" ] && continue
  skill="$(basename "$skill_dir")"
  skill_md="$skill_dir/SKILL.md"

  # SKILL.md must exist
  if [ ! -f "$skill_md" ]; then
    echo "  ERROR: $skill/ missing SKILL.md"
    errors=$((errors + 1))
    continue
  fi

  # name must match directory
  name=$(extract_frontmatter_field "$skill_md" "name")
  if [ "$name" != "$skill" ]; then
    echo "  ERROR: $skill/SKILL.md name '$name' does not match directory '$skill'"
    errors=$((errors + 1))
  fi

  # metadata.version must be present
  version=$(extract_version "$skill_md")
  if [ -z "$version" ]; then
    echo "  ERROR: $skill/SKILL.md missing metadata.version"
    errors=$((errors + 1))
  fi

  # README.md must exist
  if [ ! -f "$skill_dir/README.md" ]; then
    echo "  WARN: $skill/ missing README.md"
    warnings=$((warnings + 1))
  fi

  # license should be present
  license=$(extract_frontmatter_field "$skill_md" "license")
  if [ -z "$license" ]; then
    echo "  WARN: $skill/SKILL.md missing license field"
    warnings=$((warnings + 1))
  fi
done

echo ""
if [ $errors -gt 0 ]; then
  echo "Validation failed: $errors error(s), $warnings warning(s)"
  exit 1
fi

echo "All skills valid ($warnings warning(s))"
