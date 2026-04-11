#!/usr/bin/env bash
# generate-skill-manifests.sh — rebuild marketplace.json with per-skill entries
# Each skill gets its own marketplace entry for individual installation/discovery
# Called by: sync-versions.sh (part of pnpm run version)
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
MARKETPLACE="$REPO_ROOT/.claude-plugin/marketplace.json"

source "$(dirname "$0")/lib.sh"

PLUGIN_VERSION=$(jq -r '.version' "$REPO_ROOT/package.json")
AUTHOR_NAME=$(jq -r '.author.name // .author // "unknown"' "$REPO_ROOT/.claude-plugin/plugin.json")
AUTHOR_EMAIL=$(jq -r '.author.email // ""' "$REPO_ROOT/.claude-plugin/plugin.json")
COLLECTION_DESC=$(jq -r '.description' "$REPO_ROOT/.claude-plugin/plugin.json")

echo "Generating marketplace.json with per-skill entries..."

# Start building the plugins array as a JSON file
tmp_plugins=$(mktemp)

# Entry [0]: full collection (must remain at index 0 — sync-versions.sh references .plugins[0])
jq -n --arg v "$PLUGIN_VERSION" --arg d "$COLLECTION_DESC" \
  --arg an "$AUTHOR_NAME" --arg ae "$AUTHOR_EMAIL" \
  '[{
    name: "eins78-skills",
    description: $d,
    version: $v,
    source: "./",
    author: { name: $an, email: $ae }
  }]' > "$tmp_plugins"

# Add per-skill entries
for skill_dir in "$REPO_ROOT"/skills/*/; do
  [ ! -d "$skill_dir" ] && continue
  skill_md="$skill_dir/SKILL.md"
  [ ! -f "$skill_md" ] && continue

  dir_name="$(basename "$skill_dir")"
  name=$(extract_frontmatter_field "$skill_md" "name")
  [ -z "$name" ] && name="$dir_name"

  # Read description (handles multi-line >- format)
  desc=$(extract_description "$skill_md")
  [ -z "$desc" ] && desc="Skill: $name"

  version=$(extract_version "$skill_md")
  [ -z "$version" ] && version="0.0.0"

  # Truncate description to 200 chars for marketplace brevity
  if [ ${#desc} -gt 200 ]; then
    desc="${desc:0:197}..."
  fi

  # Use directory name for source path (always correct, even if frontmatter name diverges)
  jq --arg n "$name" --arg d "$desc" --arg v "$version" \
    --arg s "./skills/$dir_name" --arg an "$AUTHOR_NAME" --arg ae "$AUTHOR_EMAIL" \
    '. + [{
      name: $n,
      description: $d,
      version: $v,
      source: $s,
      author: { name: $an, email: $ae }
    }]' "$tmp_plugins" > "${tmp_plugins}.new" && mv "${tmp_plugins}.new" "$tmp_plugins"
done

# Write back to marketplace.json, preserving top-level fields
jq --slurpfile p "$tmp_plugins" '.plugins = $p[0]' "$MARKETPLACE" > "${MARKETPLACE}.tmp"
mv "${MARKETPLACE}.tmp" "$MARKETPLACE"

count=$(jq '.plugins | length' "$MARKETPLACE")
echo "  ✓ marketplace.json: $count entries (1 collection + $((count - 1)) skills)"

rm -f "$tmp_plugins"
