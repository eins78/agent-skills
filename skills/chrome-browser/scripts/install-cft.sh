#!/usr/bin/env bash
set -euo pipefail

# Download and install Chrome for Testing (CfT) to ~/.local/Applications/.
# CfT has its own bundle ID (com.google.chrome.for.testing) and a distinctive
# icon with a "TEST" badge, so it appears as a separate app in the Dock.
#
# Requires: npx (Node.js) — only when downloading; --symlinks-only does not need it.
# Usage:
#   install-cft.sh                  Install latest stable + refresh helper symlinks
#   install-cft.sh 147              Install specific milestone + refresh symlinks
#   install-cft.sh 147.0.7727.24    Install exact version + refresh symlinks
#   install-cft.sh --symlinks-only  Refresh helper symlinks only (no download)

INSTALL_DIR="$HOME/.local/Applications"
BIN_DIR="$HOME/.local/bin"
APP_NAME="Google Chrome for Testing.app"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Helpers to symlink onto $PATH. Each pair is "<source-script>:<bin-name>".
HELPERS=(
  "launch-chrome-cdp.sh:launch-chrome-cdp"
  "chrome-cdp-health.sh:chrome-cdp-health"
  "chrome-cdp-restart.sh:chrome-cdp-restart"
  "chrome-cdp-tabs.sh:chrome-cdp-tabs"
)

install_helper_symlinks() {
  mkdir -p "${BIN_DIR}"
  for entry in "${HELPERS[@]}"; do
    local src="${SCRIPT_DIR}/${entry%%:*}"
    local dest="${BIN_DIR}/${entry##*:}"
    if [[ -x "${src}" ]]; then
      ln -sf "${src}" "${dest}"
      echo "  ${dest} -> ${src}"
    else
      echo "  Warning: ${src} not found or not executable — symlink not created." >&2
    fi
  done

  if ! echo ":${PATH}:" | grep -q ":${BIN_DIR}:"; then
    echo ""
    echo "Note: ${BIN_DIR} is not on \$PATH. Add it to your shell rc to use the helpers directly."
  fi
}

# Parse args
SYMLINKS_ONLY=false
VERSION="stable"
case "${1:-}" in
  --symlinks-only)
    SYMLINKS_ONLY=true
    ;;
  -h|--help)
    sed -n '/^# Download/,/^$/p' "${BASH_SOURCE[0]}" | sed 's/^#$//;s/^# //;/^$/d'
    exit 0
    ;;
  -*)
    echo "Unknown flag: $1" >&2
    echo "Usage: install-cft.sh [VERSION | --symlinks-only | -h | --help]" >&2
    exit 2
    ;;
  *)
    VERSION="${1:-stable}"
    ;;
esac

if [[ "${SYMLINKS_ONLY}" == true ]]; then
  echo "Refreshing helper symlinks only (no CfT download)..."
  install_helper_symlinks
  exit 0
fi

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
  rm -rf "${INSTALL_DIR:?}/${APP_NAME}"
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

# Create / refresh helper symlinks so cold sessions can find them on $PATH.
install_helper_symlinks

echo ""
echo "Next: install the launchd plist (see INSTALL.md), or run 'launch-chrome-cdp' for a one-shot session."
