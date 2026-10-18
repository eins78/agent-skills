#!/usr/bin/env bash
# create-release.sh — post-merge: create git tags and GitHub Release
# Called by: changesets/action publish step (after version PR merges)
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"

source "$(dirname "$0")/lib.sh"

VERSION=$(jq -r '.version' "$REPO_ROOT/package.json")
echo "Creating release for v${VERSION}..."

# Create overall version tag
if git rev-parse "v${VERSION}" >/dev/null 2>&1; then
  echo "  Tag v${VERSION} already exists — skipping"
else
  git tag "v${VERSION}"
  echo "  ✓ Tagged v${VERSION}"
fi

# Create per-skill tags for skills whose version tag doesn't exist yet
for skill_dir in "$REPO_ROOT"/skills/*/; do
  [ ! -d "$skill_dir" ] && continue
  skill="$(basename "$skill_dir")"
  skill_md="$skill_dir/SKILL.md"
  [ ! -f "$skill_md" ] && continue

  skill_version=$(extract_version "$skill_md")
  [ -z "$skill_version" ] && continue

  tag_name="${skill}@${skill_version}"
  if git rev-parse "$tag_name" >/dev/null 2>&1; then
    continue  # tag already exists
  fi

  git tag "$tag_name"
  echo "  ✓ Tagged $tag_name"
done

# Push all tags
git push --tags
echo "  ✓ Pushed tags"

# Extract changelog section for this version
changelog_file="$REPO_ROOT/CHANGELOG.md"
if [ -f "$changelog_file" ]; then
  # Extract content between "## X.Y.Z" and the next "## " header (or EOF)
  release_notes=$(awk -v ver="$VERSION" '
    $0 ~ "^## " ver { found=1; next }
    found && /^## / { exit }
    found { print }
  ' "$changelog_file")
else
  release_notes="Release v${VERSION}"
fi

# Create GitHub Release
if command -v gh >/dev/null 2>&1; then
  tmp_notes=$(mktemp)
  echo "$release_notes" > "$tmp_notes"
  gh release create "v${VERSION}" \
    --title "v${VERSION}" \
    --notes-file "$tmp_notes" \
    --latest
  rm -f "$tmp_notes"
  echo "  ✓ Created GitHub Release v${VERSION}"
else
  echo "  WARN: gh CLI not available — skipping GitHub Release creation"
  echo "  Run manually: gh release create v${VERSION} --title 'v${VERSION}' --notes-file CHANGELOG.md"
fi

# Publish @eins78/opencode-skills to npm.
#
# Auth: NPM_TOKEN (CI secret, written to a temp .npmrc) or ambient npm login
# (local release). Both absent → skip with a warning rather than fail the
# release; the tarball content is identical every release, so a missed publish
# can be re-run manually with `cd opencode-plugin && npm publish`.
PLUGIN_DIR="$REPO_ROOT/opencode-plugin"
if [ ! -d "$PLUGIN_DIR" ]; then
  echo "  WARN: $PLUGIN_DIR missing — skipping npm publish"
elif ! command -v npm >/dev/null 2>&1; then
  echo "  WARN: npm not available — skipping @eins78/opencode-skills publish"
else
  npmrc_tmp=""
  if [ -n "${NPM_TOKEN:-}" ]; then
    npmrc_tmp="$PLUGIN_DIR/.npmrc"
    printf '//registry.npmjs.org/:_authToken=%s\n' "$NPM_TOKEN" > "$npmrc_tmp"
    trap 'rm -f "$npmrc_tmp"' EXIT
  fi
  if npm whoami >/dev/null 2>&1; then
    PLUGIN_VERSION=$(jq -r '.version' "$PLUGIN_DIR/package.json")
    if npm view "@eins78/opencode-skills@${PLUGIN_VERSION}" >/dev/null 2>&1; then
      echo "  @eins78/opencode-skills@${PLUGIN_VERSION} already on npm — skipping"
    else
      (cd "$PLUGIN_DIR" && npm publish)
      echo "  ✓ Published @eins78/opencode-skills@${PLUGIN_VERSION}"
    fi
  else
    echo "  WARN: no npm auth (NPM_TOKEN or npm login) — skipping @eins78/opencode-skills publish"
  fi
  rm -f "$npmrc_tmp" 2>/dev/null || true
fi

echo "Done."
