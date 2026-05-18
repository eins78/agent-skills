# Chrome Browser Setup

Full setup checklist for the dedicated Chrome CDP browser using Chrome for Testing (CfT).

## Prerequisites

- macOS
- `npx` available (Node.js — for downloading CfT and `@playwright/mcp`)

## 1. Install Chrome for Testing

```bash
# Download and install latest stable CfT
${CLAUDE_SKILL_DIR}/scripts/install-cft.sh

# Or a specific version
${CLAUDE_SKILL_DIR}/scripts/install-cft.sh 147

# Or skip the download and just refresh helper symlinks (when upgrading the skill on a machine
# that already has CfT installed)
${CLAUDE_SKILL_DIR}/scripts/install-cft.sh --symlinks-only
```

CfT installs to `~/.local/Applications/Google Chrome for Testing.app`. It has its own bundle ID (`com.google.chrome.for.testing`) and a distinctive "TEST" badge icon — macOS treats it as a separate app in the Dock.

The script also installs four helper symlinks into `~/.local/bin/` (→ `scripts/*.sh`): `launch-chrome-cdp`, `chrome-cdp-health`, `chrome-cdp-restart`, `chrome-cdp-tabs`. If `~/.local/bin` is on your `$PATH`, future sessions can call them directly without knowing the skill's installation path.

## 2. Install the launchd plist

The plist label is hardcoded as `is.ars.chrome-cdp` so the skill's troubleshooting commands work without machine-specific lookups. Copy it as-is and only adjust `ProgramArguments` paths.

> **Upgrading from v1.3 or earlier?** The old plist used label `com.example.chrome-cdp`. Unload and remove it before loading the new one — otherwise both LaunchAgents race for port 9222 and neither starts cleanly:
>
> ```bash
> launchctl unload ~/Library/LaunchAgents/com.example.chrome-cdp.plist 2>/dev/null || true
> rm -f ~/Library/LaunchAgents/com.example.chrome-cdp.plist
> ```

```bash
# Copy plist into LaunchAgents, substituting $HOME for the /Users/USERNAME placeholders
sed "s|/Users/USERNAME|$HOME|g" \
  ${CLAUDE_SKILL_DIR}/is.ars.chrome-cdp.plist \
  > ~/Library/LaunchAgents/is.ars.chrome-cdp.plist

# Load the agent (auto-starts on login from now on)
launchctl load ~/Library/LaunchAgents/is.ars.chrome-cdp.plist
```

## 3. Configure Playwright MCP

```bash
claude mcp add -s user playwright -- npx @playwright/mcp --cdp-endpoint http://127.0.0.1:9222
```

Restart Claude Code to pick up the new MCP server.

## 4. Verify

```bash
# CDP responding (exit 0 = alive on local endpoint)
chrome-cdp-health

# launchd agent loaded
launchctl list | grep chrome-cdp

# CfT installed
ls ~/.local/Applications/Google\ Chrome\ for\ Testing.app/

# Helpers on PATH (installed by install-cft.sh)
which launch-chrome-cdp chrome-cdp-health chrome-cdp-restart chrome-cdp-tabs

# After restarting Claude Code, test Playwright MCP tools:
# browser_navigate, browser_snapshot, browser_tabs should all work
```

## Post-setup

- **Disable lookalike browser MCPs** (e.g. `claude-in-chrome` — deprecated, replaced by this skill; or `chrome-devtools` if loaded) in your Claude Code MCP config to avoid tool-selection confusion
- **Log into sites** in the dedicated Chrome window — cookies persist across restarts
- **Verify after reboot** — `launchctl list | grep chrome-cdp` and `curl -s http://127.0.0.1:9222/json/version`
- **Update CfT** — re-run `install-cft.sh` when you want a newer Chrome version
