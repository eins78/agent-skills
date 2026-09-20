#!/usr/bin/env bash
set -euo pipefail

# Ensure Chrome is running with CDP (Chrome DevTools Protocol) on port 9222.
# Idempotent — safe to call repeatedly.
# Uses a dedicated user-data-dir so CDP can bind even if Chrome was already open.
# Prefers Chrome for Testing (distinct icon, no auto-update) *while it is not behind*
# installed Chrome stable; otherwise uses stable. See pick_binary() for why.
# Override with CHROME_CDP_PREFER=testing|stable.

PORT=9222
CDP_URL="http://127.0.0.1:${PORT}"
USER_DATA_DIR="$HOME/.cache/chrome-cdp-profile"
CFT_BIN="$HOME/.local/Applications/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing"
CHROME_BIN="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

# shellcheck disable=SC2054  # commas inside --disable-features=... value are intentional Chrome syntax
CHROME_FLAGS=(
  # Core CDP / Profile
  --remote-debugging-port="${PORT}"
  --user-data-dir="${USER_DATA_DIR}"

  # First-run / Default Browser
  --no-default-browser-check
  --no-first-run

  # UI Suppression
  --disable-infobars
  --disable-search-engine-choice-screen
  --disable-popup-blocking
  --disable-prompt-on-repost
  --disable-hang-monitor

  # Frame throttling — keep rendering when the display sleeps or the window is
  # occluded. macOS marks an occluded/asleep window hidden; Chrome then stops
  # firing requestAnimationFrame, and Playwright's actionability check (which
  # waits for two stable animation frames) can never pass. Measured on a VM:
  # display asleep went from 0 frames/2s to 80.
  --disable-backgrounding-occluded-windows
  --disable-renderer-backgrounding
  --disable-background-timer-throttling

  # Background Activity Reduction
  --disable-breakpad
  --disable-background-networking
  --disable-client-side-phishing-detection
  --disable-component-update
  --disable-sync
  --metrics-recording-only

  # Password / Keychain
  --password-store=basic
  --use-mock-keychain

  # Disabled Features
  --disable-features=Translate,TranslateUI,PasswordCheck,PasswordManagerOnboarding,AutofillServerCommunication,MediaRouter,DialMediaRouteProvider,OptimizationHints,GlobalMediaControls,TabOrganization,AiModeOmniboxEntryPoint,OmniboxAiModeEntryPointVariations
)

# Pretty-print /json/version, falling back to raw output. Never fails the script:
# a version-manager python3 shim can exist on PATH yet exit non-zero.
print_cdp_version() {
  local body
  body="$(curl -s "${CDP_URL}/json/version")"
  if command -v jq >/dev/null 2>&1 && printf '%s' "${body}" | jq . 2>/dev/null; then
    return 0
  fi
  printf '%s' "${body}" | python3 -m json.tool 2>/dev/null || printf '%s\n' "${body}"
}

if curl -s "${CDP_URL}/json/version" >/dev/null 2>&1; then
  echo "Chrome CDP already available on :${PORT}"
  print_cdp_version
  exit 0
fi

mkdir -p "${USER_DATA_DIR}"

# Which binary to launch.
#
# Chrome for Testing is preferred for its distinct Dock icon and its lack of
# auto-update — but that second property is a liability as well as a feature. A
# CfT build left behind stable presents a browser fingerprint no real user has,
# and bot-detection vendors reject it: the observed symptom is a login page that
# refuses to proceed with a generic "your browser is behaving strangely" notice
# while the SAME login succeeds in Safari or in Chrome stable on the same machine
# and the same network. Console tells: probes of newer web APIs abort, e.g. a
# built-in-AI API that is present but reports its model "unavailable".
#
# So: use CfT while it is current, and stable when CfT has fallen behind.
version_of() { "$1" --version 2>/dev/null | grep -oE '[0-9]+(\.[0-9]+)*' | head -1; }
major_of() { version_of "$1" | cut -d. -f1; }

pick_binary() {
  case "${CHROME_CDP_PREFER:-auto}" in
    testing) [[ -x "${CFT_BIN}" ]] && { printf '%s' "${CFT_BIN}"; return; } ;;
    stable)  [[ -x "${CHROME_BIN}" ]] && { printf '%s' "${CHROME_BIN}"; return; } ;;
  esac
  if [[ ! -x "${CFT_BIN}" ]]; then printf '%s' "${CHROME_BIN}"; return; fi
  if [[ ! -x "${CHROME_BIN}" ]]; then printf '%s' "${CFT_BIN}"; return; fi
  local cft_major stable_major
  cft_major="$(major_of "${CFT_BIN}")"
  stable_major="$(major_of "${CHROME_BIN}")"
  # Unreadable version: keep the historical preference rather than guess.
  if [[ -z "${cft_major}" || -z "${stable_major}" ]]; then printf '%s' "${CFT_BIN}"; return; fi
  if (( cft_major < stable_major )); then
    echo "Chrome for Testing is ${cft_major}, stable is ${stable_major} — using stable." >&2
    echo "A CfT build behind stable gets rejected by bot detection; run install-chrome-for-testing.sh" >&2
    echo "to update it, or set CHROME_CDP_PREFER=testing to override." >&2
    printf '%s' "${CHROME_BIN}"
  else
    printf '%s' "${CFT_BIN}"
  fi
}

BIN="$(pick_binary)"
echo "Launching $(basename "${BIN}") $(version_of "${BIN}") with --remote-debugging-port=${PORT}..."
"${BIN}" "${CHROME_FLAGS[@]}" &>/dev/null &
disown

# Wait for CDP to become available
for _ in {1..30}; do
  if curl -s "${CDP_URL}/json/version" >/dev/null 2>&1; then
    echo "Chrome CDP ready on :${PORT}"
    print_cdp_version
    exit 0
  fi
  sleep 0.5
done

echo "Error: Chrome started but CDP not responding on :${PORT}" >&2
exit 1
