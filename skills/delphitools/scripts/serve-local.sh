#!/usr/bin/env bash
# Serve a DelphiTools build locally
# Usage: bash serve-local.sh [DIRECTORY] [PORT]
#
# Serves the static site on localhost. Default directory: ./delphitools/out/

set -euo pipefail

DIR="${1:-./delphitools/out}"
PORT="${2:-3000}"

if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
  echo "Usage: bash serve-local.sh [DIRECTORY] [PORT]"
  echo ""
  echo "Serves a DelphiTools static build on localhost."
  echo ""
  echo "Arguments:"
  echo "  DIRECTORY  Path to the built site (default: ./delphitools/out)"
  echo "  PORT       Port to serve on (default: 3000)"
  echo ""
  echo "Build first with: bash build-local.sh"
  exit 0
fi

if [ ! -d "$DIR" ]; then
  echo "Error: Directory $DIR does not exist."
  echo "Run build-local.sh first, or specify the correct path."
  exit 1
fi

echo "==> Serving $DIR on http://localhost:$PORT"
if command -v npx &>/dev/null; then
  npx serve "$DIR" -l "$PORT"
elif command -v python3 &>/dev/null; then
  cd "$DIR" && python3 -m http.server "$PORT"
else
  echo "Error: Need npx (Node.js) or python3 to serve files."
  exit 1
fi
