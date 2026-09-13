#!/usr/bin/env bash
# prepack.sh — assemble the self-contained npm tarball.
#
# npm does not allow `files` entries outside the package directory, so the
# canonical copies (repo-root skills/ and .claude-plugin/hooks/) are synced
# in here at pack time. Both are gitignored; the repo copies remain the
# source of truth and the synced copies exist only inside the tarball.
#
# Runs on `npm pack` / `npm publish` (maintainer side). No lifecycle scripts
# run on the adopter side — opencode's bun install of this package must stay
# side-effect free.

set -euo pipefail

here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
root="$(cd "$here/.." && pwd)"

rsync -a --delete "$root/skills/" "$here/skills/"
rsync -a --delete "$root/.claude-plugin/hooks/" "$here/hooks/"
cp "$root/LICENSE" "$here/LICENSE"

echo "prepack: synced $(find "$here/skills" -name SKILL.md | wc -l | tr -d ' ') skills, $(find "$here/hooks" -type f | wc -l | tr -d ' ') hooks"