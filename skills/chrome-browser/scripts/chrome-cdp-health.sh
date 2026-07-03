#!/usr/bin/env bash
set -euo pipefail

# Check whether Chrome CDP is reachable on the local debugging port.
#
# Exit codes:
#   0 — CDP responding on 127.0.0.1:9222 with a local webSocketDebuggerUrl
#   1 — CDP not responding (Chrome not running, or wrong port)
#   2 — CDP responding but webSocketDebuggerUrl points elsewhere (misconfigured)

PORT=9222
URL="http://127.0.0.1:${PORT}/json/version"

response="$(curl -fsS --max-time 2 "${URL}" 2>/dev/null)" || {
  echo "CDP unreachable on 127.0.0.1:${PORT} — run launch-chrome-cdp" >&2
  exit 1
}

# Extract webSocketDebuggerUrl. Prefer python3 (handles JSON escaping properly);
# fall back to grep/sed so the script works without python3 installed.
ws_url=""
if command -v python3 >/dev/null 2>&1; then
  ws_url="$(printf '%s' "${response}" | python3 -c 'import json,sys; print(json.load(sys.stdin).get("webSocketDebuggerUrl",""))' 2>/dev/null || true)"
fi
if [[ -z "${ws_url}" ]]; then
  ws_url="$(printf '%s' "${response}" | grep -o '"webSocketDebuggerUrl":"[^"]*"' | sed 's/"webSocketDebuggerUrl":"\(.*\)"/\1/')"
fi

if [[ -z "${ws_url}" ]]; then
  echo "CDP responded on 127.0.0.1:${PORT} but no webSocketDebuggerUrl in payload — unexpected response." >&2
  exit 2
fi

if [[ "${ws_url}" != ws://127.0.0.1:${PORT}/* ]]; then
  echo "CDP responding but webSocketDebuggerUrl is not local: ${ws_url}" >&2
  echo "Playwright MCP --cdp-endpoint is likely misconfigured." >&2
  exit 2
fi

printf '%s\n' "${response}"
