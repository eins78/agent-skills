#!/usr/bin/env bash
set -euo pipefail

# Restart the launchd-managed Chrome CDP browser when the process is alive but
# CDP itself is hung (the "running but stuck" case), or when Playwright errors
# repeatedly while CDP otherwise responds.
#
# Wraps `launchctl kickstart -k` with the hardcoded service label so callers
# don't have to remember it.
#
# Exit codes:
#   0 — kickstart issued; CDP came back within timeout
#   1 — launchd job not loaded (run setup; see INSTALL.md)
#   2 — kickstart issued but CDP did not return within timeout

LABEL="is.ars.chrome-cdp"
PORT=9222
TIMEOUT_SECONDS=15

if ! launchctl print "gui/$(id -u)/${LABEL}" >/dev/null 2>&1; then
  echo "launchd job '${LABEL}' is not loaded." >&2
  echo "Either run 'launch-chrome-cdp' (one-shot) or follow INSTALL.md to load the plist." >&2
  exit 1
fi

echo "Restarting ${LABEL}..."
launchctl kickstart -k "gui/$(id -u)/${LABEL}"

deadline=$(( $(date +%s) + TIMEOUT_SECONDS ))
while (( $(date +%s) < deadline )); do
  if curl -fsS --max-time 1 "http://127.0.0.1:${PORT}/json/version" >/dev/null 2>&1; then
    echo "CDP back on 127.0.0.1:${PORT}"
    exit 0
  fi
  sleep 0.5
done

echo "CDP did not return within ${TIMEOUT_SECONDS}s after kickstart." >&2
echo "Check the launchd logs configured in the plist (default: /tmp/chrome-cdp.stderr.log)." >&2
exit 2
