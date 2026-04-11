#!/usr/bin/env bash
# sync-versions.sh — propagate version from package.json to plugin metadata files
# Called automatically by `pnpm version` after `changeset version`
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
VERSION=$(jq -r '.version' "$REPO_ROOT/package.json")

echo "Syncing version $VERSION to plugin metadata files..."

sync_file() {
  local file="$1"
  local filter="$2"
  local tmp="${file}.tmp"
  jq --arg v "$VERSION" "$filter" "$file" > "$tmp" && mv "$tmp" "$file"
  echo "  ✓ $file"
}

sync_file "$REPO_ROOT/.claude-plugin/plugin.json"      '.version = $v'
sync_file "$REPO_ROOT/.cursor-plugin/plugin.json"       '.version = $v'

echo "Done. Plugin metadata files now at version $VERSION"

# Regenerate marketplace.json with per-skill entries (owns the entire .plugins array)
echo ""
bash "$(dirname "$0")/generate-skill-manifests.sh"
