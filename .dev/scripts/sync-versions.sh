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

# Strip self-attribution from CHANGELOG ("Thanks @owner!" is noise when you're the sole author)
changelog="$REPO_ROOT/CHANGELOG.md"
if [ -f "$changelog" ]; then
  owner=$(jq -r '.changelog[1].repo // ""' "$REPO_ROOT/.changeset/config.json" | cut -d/ -f1)
  if [ -n "$owner" ]; then
    sed "s/ Thanks \[@${owner}\](https:\/\/github\.com\/${owner})!//g" "$changelog" > "${changelog}.tmp" && mv "${changelog}.tmp" "$changelog"
    echo "  ✓ Stripped self-attribution from CHANGELOG.md"
  fi
fi

# Strip the <!-- bumps: --> blocks from CHANGELOG.
#
# The block is load-bearing in .changeset/*.md — bump-skill-versions.sh parses it
# to set each skill's metadata.version — but it is tooling metadata, not a release
# note. changeset-github copies the changeset summary verbatim, so without this it
# renders into CHANGELOG.md, and create-release.sh feeds that section straight to
# `gh release create --notes-file`, publishing it. Stripped here rather than via a
# custom changelog formatter: this script already post-processes the generated
# CHANGELOG (see the self-attribution strip above), so it is the established seam,
# and a formatter that fails to resolve would break `changeset version` outright.
if [ -f "$changelog" ]; then
  awk '
    # Buffer a blank line so a removed block does not leave a double gap.
    /^[[:space:]]*$/ && !in_comment { pending_blank = 1; next }
    /^[[:space:]]*<!--[[:space:]]*$/ { in_comment = 1; buf = $0 ORS; next }
    in_comment {
      buf = buf $0 ORS
      if ($0 ~ /bumps:/) is_bumps = 1
      if ($0 ~ /^[[:space:]]*-->[[:space:]]*$/) {
        if (!is_bumps) { if (pending_blank) { print ""; pending_blank = 0 } printf "%s", buf }
        in_comment = 0; is_bumps = 0; buf = ""
      }
      next
    }
    { if (pending_blank) { print ""; pending_blank = 0 } print }
    END { if (pending_blank) print "" }
  ' "$changelog" > "${changelog}.tmp" && mv "${changelog}.tmp" "$changelog"
  echo "  ✓ Stripped bumps blocks from CHANGELOG.md"
fi

# Regenerate marketplace.json with per-skill entries (owns the entire .plugins array)
echo ""
bash "$(dirname "$0")/generate-skill-manifests.sh"
