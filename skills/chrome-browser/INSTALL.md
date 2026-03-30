# Chrome Browser Setup

Full setup checklist for the dedicated Chrome CDP browser.

## Prerequisites

- macOS with Google Chrome at `/Applications/Google Chrome.app`
- `npx` available (for `@playwright/mcp`)
- For icon recoloring: ImageMagick (`brew install imagemagick`)

## 1. Create the app bundle

```bash
# Creates Chrome-CDP.app wrapper at ~/.local/Applications/
${CLAUDE_SKILL_DIR}/scripts/create-app-bundle.sh
```

This creates a `.app` bundle with its own `CFBundleIdentifier` so macOS treats it as a separate application in the Dock and Cmd+Tab.

## 2. Install a custom icon (optional)

```bash
# Recolor Chrome Canary icon to terracotta (Claude brand color)
${CLAUDE_SKILL_DIR}/scripts/create-icon.sh --from-canary

# Or use a different hue (purple, orange, etc.)
${CLAUDE_SKILL_DIR}/scripts/create-icon.sh --from-canary --hue 20   # purple
${CLAUDE_SKILL_DIR}/scripts/create-icon.sh --from-canary --hue 90   # warm orange

# Or use any custom PNG
${CLAUDE_SKILL_DIR}/scripts/create-icon.sh /path/to/icon-1024x1024.png
```

## 3. Create a launchd plist

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

## 4. Configure Playwright MCP

```bash
claude mcp add -s user playwright -- npx @playwright/mcp --cdp-endpoint http://127.0.0.1:9222
```

Restart Claude Code to pick up the new MCP server.

## 5. Verify

```bash
# CDP responding
curl -s http://127.0.0.1:9222/json/version | python3 -m json.tool

# launchd agent loaded
launchctl list | grep chrome-cdp

# App bundle exists with icon
ls -la ~/.local/Applications/Chrome-CDP.app/Contents/Resources/app.icns

# After restarting Claude Code, test Playwright MCP tools:
# browser_navigate, browser_snapshot, browser_tabs should all work
```

## Post-setup

- **Disable old browser extensions** (e.g. claude-in-chrome) in Claude Code settings to avoid conflicts
- **Log into sites** in the dedicated Chrome window — cookies persist across restarts
- **Verify after reboot** — `launchctl list | grep chrome-cdp` and `curl -s http://127.0.0.1:9222/json/version`
- **Icon not showing?** — Run `killall Dock` to refresh the Dock icon cache
