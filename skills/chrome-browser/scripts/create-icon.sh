#!/usr/bin/env bash
set -euo pipefail

# Create an .icns icon for Chrome-CDP.app.
#
# Modes:
#   1. From a custom PNG:  create-icon.sh /path/to/icon.png
#   2. Recolor Canary:     create-icon.sh --from-canary [--hue N]
#
# The --from-canary mode takes the Chrome Canary icon, hue-rotates it
# using ImageMagick, and converts to .icns. Requires: brew install imagemagick
#
# --hue N: ImageMagick -modulate hue value (default: 86 = terracotta/Claude brand color).
#          100 = no change, <100 = shift toward red, >100 = shift toward green/blue.

APP_BUNDLE="$HOME/.local/Applications/Chrome-CDP.app"
ICON_DST="${APP_BUNDLE}/Contents/Resources/app.icns"
CANARY_ICON="/Applications/Google Chrome Canary.app/Contents/Resources/app.icns"
CHROME_ICON="/Applications/Google Chrome.app/Contents/Resources/app.icns"

# Defaults for --from-canary recolor (terra6: dusty terracotta, Claude brand)
HUE=86
BRIGHTNESS=105
SATURATION=60

usage() {
  cat <<'EOF'
Usage:
  create-icon.sh <image-file>          Convert a PNG/JPEG to .icns
  create-icon.sh --from-canary         Recolor Canary icon (default: terracotta)
  create-icon.sh --from-canary --hue N Custom hue rotation (ImageMagick -modulate)

Presets:
  --hue 86   Terracotta / Claude brand (default)
  --hue 20   Purple
  --hue 90   Warm orange
  --hue 100  Original Canary yellow (no change)

Requires: sips, iconutil (built-in macOS)
Recolor mode also requires: magick (brew install imagemagick)
EOF
  exit 1
}

# Parse arguments
FROM_CANARY=false
SOURCE_IMAGE=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --from-canary) FROM_CANARY=true; shift ;;
    --hue) HUE="$2"; shift 2 ;;
    --brightness) BRIGHTNESS="$2"; shift 2 ;;
    --saturation) SATURATION="$2"; shift 2 ;;
    -h|--help) usage ;;
    *)
      if [[ -z "${SOURCE_IMAGE}" ]]; then
        SOURCE_IMAGE="$1"
      else
        echo "Error: unexpected argument '$1'" >&2; usage
      fi
      shift ;;
  esac
done

if [[ "${FROM_CANARY}" == false && -z "${SOURCE_IMAGE}" ]]; then
  usage
fi

WORK_DIR="$(mktemp -d)"
trap 'rm -rf "${WORK_DIR}"' EXIT

if [[ "${FROM_CANARY}" == true ]]; then
  # Find source icon (prefer Canary, fall back to Chrome)
  if [[ -f "${CANARY_ICON}" ]]; then
    SRC_ICNS="${CANARY_ICON}"
    echo "Using Chrome Canary icon as base"
  elif [[ -f "${CHROME_ICON}" ]]; then
    SRC_ICNS="${CHROME_ICON}"
    echo "Canary not found, using Chrome icon as base"
  else
    echo "Error: neither Chrome Canary nor Chrome found in /Applications/" >&2
    exit 1
  fi

  if ! command -v magick &>/dev/null; then
    echo "Error: ImageMagick required for recoloring. Install: brew install imagemagick" >&2
    exit 1
  fi

  # Extract the largest PNG from the .icns
  iconutil -c iconset "${SRC_ICNS}" -o "${WORK_DIR}/source.iconset"
  # Find the largest available icon
  LARGEST="$(ls -S "${WORK_DIR}/source.iconset/"*.png | head -1)"
  echo "Recoloring with -modulate ${BRIGHTNESS},${SATURATION},${HUE}"
  magick "${LARGEST}" -modulate "${BRIGHTNESS},${SATURATION},${HUE}" "${WORK_DIR}/source_1024.png"
else
  # Custom image provided — convert to PNG if needed
  sips -s format png "${SOURCE_IMAGE}" --out "${WORK_DIR}/source_1024.png" &>/dev/null
fi

# Get source dimensions
SRC_SIZE="$(sips -g pixelWidth "${WORK_DIR}/source_1024.png" | awk '/pixelWidth/{print $2}')"
echo "Source image: ${SRC_SIZE}x${SRC_SIZE}px"

# Generate iconset with all required sizes
ICONSET="${WORK_DIR}/app.iconset"
mkdir -p "${ICONSET}"

declare -a SIZES=(16 32 64 128 256 512 1024)
declare -A FILENAMES=(
  [16]="icon_16x16.png"
  [32]="icon_16x16@2x.png icon_32x32.png"
  [64]="icon_32x32@2x.png"
  [128]="icon_128x128.png"
  [256]="icon_128x128@2x.png icon_256x256.png"
  [512]="icon_256x256@2x.png icon_512x512.png"
  [1024]="icon_512x512@2x.png"
)

for size in "${SIZES[@]}"; do
  if (( size > SRC_SIZE )); then
    echo "Warning: source image smaller than ${size}px, skipping larger sizes"
    break
  fi
  sips -z "${size}" "${size}" "${WORK_DIR}/source_1024.png" --out "${WORK_DIR}/resized_${size}.png" &>/dev/null
  for fname in ${FILENAMES[$size]}; do
    cp "${WORK_DIR}/resized_${size}.png" "${ICONSET}/${fname}"
  done
done

# Convert iconset to icns
iconutil -c icns "${ICONSET}" -o "${WORK_DIR}/app.icns"
echo "Generated .icns ($(du -h "${WORK_DIR}/app.icns" | cut -f1 | xargs))"

# Install into app bundle
mkdir -p "$(dirname "${ICON_DST}")"
cp "${WORK_DIR}/app.icns" "${ICON_DST}"
echo "Installed icon to ${ICON_DST}"

# Refresh LaunchServices cache
touch "${APP_BUNDLE}"
if command -v lsregister &>/dev/null; then
  lsregister -f "${APP_BUNDLE}" 2>/dev/null || true
else
  /System/Library/Frameworks/CoreServices.framework/Versions/A/Frameworks/LaunchServices.framework/Versions/A/Support/lsregister -f "${APP_BUNDLE}" 2>/dev/null || true
fi
echo "Done — icon updated. You may need to restart the Dock: killall Dock"
