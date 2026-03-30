#!/usr/bin/env bash
set -euo pipefail

# Download and install Chrome for Testing (CfT) to ~/.local/Applications/.
# CfT has its own bundle ID (com.google.chrome.for.testing) and a distinctive
# icon with a "TEST" badge, so it appears as a separate app in the Dock.
#
# Requires: npx (Node.js)
# Usage:
#   install-cft.sh              Install latest stable
#   install-cft.sh 147          Install specific milestone
#   install-cft.sh 147.0.7727.24  Install exact version

INSTALL_DIR="$HOME/.local/Applications"
APP_NAME="Google Chrome for Testing.app"
VERSION="${1:-stable}"

if ! command -v npx &>/dev/null; then
  echo "Error: npx not found. Install Node.js first." >&2
  exit 1
fi

WORK_DIR="$(mktemp -d)"
trap 'rm -rf "${WORK_DIR}"' EXIT

echo "Downloading Chrome for Testing (${VERSION})..."
RESULT="$(npx @puppeteer/browsers install "chrome@${VERSION}" --path "${WORK_DIR}" 2>&1)"
echo "${RESULT}"

# Find the downloaded .app
APP_PATH="$(find "${WORK_DIR}" -name "${APP_NAME}" -maxdepth 5 | head -1)"
if [[ -z "${APP_PATH}" || ! -d "${APP_PATH}" ]]; then
  echo "Error: Chrome for Testing .app not found after download" >&2
  exit 1
fi

# Extract installed version from binary
CfT_VERSION="$("${APP_PATH}/Contents/MacOS/Google Chrome for Testing" --version 2>/dev/null | awk '{print $NF}')" || CfT_VERSION="unknown"

# Install to stable location
mkdir -p "${INSTALL_DIR}"
if [[ -d "${INSTALL_DIR}/${APP_NAME}" ]]; then
  echo "Replacing existing CfT installation..."
  rm -rf "${INSTALL_DIR}/${APP_NAME}"
fi
cp -R "${APP_PATH}" "${INSTALL_DIR}/"

# Clear quarantine flag (download via npx, not browser)
xattr -cr "${INSTALL_DIR}/${APP_NAME}" 2>/dev/null || true

echo ""
echo "Chrome for Testing ${CfT_VERSION} installed to:"
echo "  ${INSTALL_DIR}/${APP_NAME}"
echo ""
echo "Binary: ${INSTALL_DIR}/${APP_NAME}/Contents/MacOS/Google Chrome for Testing"
echo ""
echo "Next: update your launchd plist and reload, or run launch-chrome-cdp.sh"
