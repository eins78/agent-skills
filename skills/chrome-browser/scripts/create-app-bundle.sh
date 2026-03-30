#!/usr/bin/env bash
set -euo pipefail

# Create Chrome-CDP.app — a macOS .app wrapper bundle that launches Chrome
# with CDP flags and appears as a separate application in the Dock.
#
# Idempotent — safe to re-run. Overwrites Info.plist and the launcher script
# but preserves any existing icon in Contents/Resources/.
#
# After running, use create-icon.sh to install a custom icon.

APP_DIR="$HOME/.local/Applications/Chrome-CDP.app"
CONTENTS="${APP_DIR}/Contents"
MACOS="${CONTENTS}/MacOS"
RESOURCES="${CONTENTS}/Resources"
CHROME_BIN="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

PORT=9222
USER_DATA_DIR="\$HOME/.cache/chrome-cdp-profile"

if [[ ! -x "${CHROME_BIN}" ]]; then
  echo "Error: Chrome not found at ${CHROME_BIN}" >&2
  exit 1
fi

echo "Creating Chrome-CDP.app at ${APP_DIR}..."
mkdir -p "${MACOS}" "${RESOURCES}"

# --- Info.plist ---
cat > "${CONTENTS}/Info.plist" <<'PLIST'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleIdentifier</key>
    <string>com.chrome-cdp.wrapper</string>

    <key>CFBundleDisplayName</key>
    <string>Chrome CDP</string>

    <key>CFBundleName</key>
    <string>Chrome CDP</string>

    <key>CFBundleExecutable</key>
    <string>chrome-cdp</string>

    <key>CFBundleIconFile</key>
    <string>app.icns</string>

    <key>CFBundlePackageType</key>
    <string>APPL</string>

    <key>CFBundleVersion</key>
    <string>1.0</string>

    <key>CFBundleShortVersionString</key>
    <string>1.0</string>
</dict>
</plist>
PLIST

# --- Launcher script ---
# Uses exec so launchd tracks the real Chrome PID.
# All flags are managed here — single source of truth.
cat > "${MACOS}/chrome-cdp" <<LAUNCHER
#!/usr/bin/env bash
exec "${CHROME_BIN}" \\
  --remote-debugging-port=${PORT} \\
  --user-data-dir="${USER_DATA_DIR}" \\
  --no-default-browser-check \\
  --no-first-run \\
  --disable-features=Translate \\
  --disable-breakpad \\
  "\$@"
LAUNCHER
chmod +x "${MACOS}/chrome-cdp"

# --- Refresh LaunchServices ---
touch "${APP_DIR}"
if [[ -x /System/Library/Frameworks/CoreServices.framework/Versions/A/Frameworks/LaunchServices.framework/Versions/A/Support/lsregister ]]; then
  /System/Library/Frameworks/CoreServices.framework/Versions/A/Frameworks/LaunchServices.framework/Versions/A/Support/lsregister -f "${APP_DIR}" 2>/dev/null || true
fi

echo "Chrome-CDP.app created at ${APP_DIR}"
echo ""
echo "Next steps:"
if [[ ! -f "${RESOURCES}/app.icns" ]]; then
  echo "  1. Install a custom icon:  create-icon.sh --from-canary"
fi
echo "  2. Update launchd plist to point to: ${MACOS}/chrome-cdp"
echo "  3. Reload: launchctl unload ~/Library/LaunchAgents/com.*.chrome-cdp.plist"
echo "             launchctl load   ~/Library/LaunchAgents/com.*.chrome-cdp.plist"
