#!/usr/bin/env bash
# Build DelphiTools locally from source
# Usage: bash build-local.sh [TARGET_DIR]
#
# Clones the DelphiTools repository, installs dependencies, and builds
# the static site. The output is in TARGET_DIR/out/ (default: ./delphitools/out/).

set -euo pipefail

TARGET_DIR="${1:-./delphitools}"

if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
  echo "Usage: bash build-local.sh [TARGET_DIR]"
  echo ""
  echo "Clones DelphiTools, installs deps, and builds the static site."
  echo "Output is in TARGET_DIR/out/"
  echo ""
  echo "Arguments:"
  echo "  TARGET_DIR  Directory to clone into (default: ./delphitools)"
  echo ""
  echo "Requirements: Node.js 20+ or Bun"
  exit 0
fi

echo "==> Cloning DelphiTools into $TARGET_DIR..."
if [ -d "$TARGET_DIR" ]; then
  echo "    Directory exists, pulling latest..."
  cd "$TARGET_DIR" && git pull origin main
else
  git clone https://github.com/1612elphi/delphitools.git "$TARGET_DIR"
  cd "$TARGET_DIR"
fi

echo "==> Installing dependencies..."
if command -v bun &>/dev/null; then
  bun install
else
  npm install
fi

echo "==> Building static site..."
if command -v bun &>/dev/null; then
  bun run build
else
  npm run build
fi

echo "==> Done! Static site is in $TARGET_DIR/out/"
echo "    Serve with: npx serve $TARGET_DIR/out"
