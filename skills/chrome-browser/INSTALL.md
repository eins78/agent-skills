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
```

CfT installs to `~/.local/Applications/Google Chrome for Testing.app`. It has its own bundle ID (`com.google.chrome.for.testing`) and a distinctive "TEST" badge icon — macOS treats it as a separate app in the Dock.

The script also creates a stable launcher entry point at `~/.local/bin/launch-chrome-cdp` (symlink → `scripts/launch-chrome-cdp.sh`). If `~/.local/bin` is on your `$PATH`, future sessions can simply call `launch-chrome-cdp` without knowing the skill's installation path.

## 2. Create a launchd plist

Use `com.example.chrome-cdp.plist` as a template. Customize:

- **Label** — change `com.example.chrome-cdp` to something unique (e.g. `com.yourname.chrome-cdp`)
- **ProgramArguments** — replace `/Users/USERNAME/` with your actual home directory

Install:

```bash
# Copy customized plist to LaunchAgents
cp com.yourname.chrome-cdp.plist ~/Library/LaunchAgents/

# Load the agent (auto-starts on login from now on)
launchctl load ~/Library/LaunchAgents/com.yourname.chrome-cdp.plist
```

## 3. Configure Playwright MCP

```bash
claude mcp add -s user playwright -- npx @playwright/mcp --cdp-endpoint http://127.0.0.1:9222
```

Restart Claude Code to pick up the new MCP server.

## 4. Verify

```bash
# CDP responding
curl -s http://127.0.0.1:9222/json/version | python3 -m json.tool

# launchd agent loaded
launchctl list | grep chrome-cdp

# CfT installed
ls ~/.local/Applications/Google\ Chrome\ for\ Testing.app/

# Launcher symlink on PATH
which launch-chrome-cdp     # → ~/.local/bin/launch-chrome-cdp
readlink "$(which launch-chrome-cdp)"  # points into the skill scripts/ directory

# After restarting Claude Code, test Playwright MCP tools:
# browser_navigate, browser_snapshot, browser_tabs should all work
```

## Post-setup

- **Disable old browser extensions** (e.g. claude-in-chrome) in Claude Code settings to avoid conflicts
- **Log into sites** in the dedicated Chrome window — cookies persist across restarts
- **Verify after reboot** — `launchctl list | grep chrome-cdp` and `curl -s http://127.0.0.1:9222/json/version`
- **Update CfT** — re-run `install-cft.sh` when you want a newer Chrome version
