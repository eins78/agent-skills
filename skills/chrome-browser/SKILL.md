---
name: chrome-browser
description: Use when setting up a dedicated Chrome browser for Playwright MCP with session persistence, or when encountering Cloudflare challenges during browser automation. Covers CDP setup, launchd auto-start, and persistent login sessions.
license: MIT
metadata:
  author: eins78
  repo: https://github.com/eins78/skills
  version: "1.1.0"
---

# Dedicated Chrome Browser

A dedicated headed Chrome for Testing (CfT) instance with CDP for Playwright MCP. Persistent profile (cookies/logins survive restarts), launchd-managed, multi-session safe. Distinct "TEST" badge icon in the Dock.

## Why

- Chrome's single-instance lock prevents CDP when the default profile is in use — **dedicated user-data-dir required**
- Chrome for Testing has its own `CFBundleIdentifier` — shows as a **separate app** in Dock/Cmd+Tab with a distinctive icon
- Headed so the user can log into sites manually; Playwright shares the session
- launchd auto-starts on login, restarts on crash

## Architecture

```
Chrome for Testing (CfT, ~/.local/Applications/)
  └── CDP on port 9222 + ergonomic flags
      └── ~/.cache/chrome-cdp-profile (persistent, isolated from daily Chrome)
          ├── Claude session 1 → Playwright MCP → CDP
          ├── Claude session 2 → Playwright MCP → CDP
          └── User can log into sites manually (headed)
```

## Quick Reference

```bash
# Check CDP
curl -s http://127.0.0.1:9222/json/version

# Configure Playwright MCP (user-scope, one-time)
claude mcp add -s user playwright -- npx @playwright/mcp --cdp-endpoint http://127.0.0.1:9222

# Manual launch (if not using launchd)
${CLAUDE_SKILL_DIR}/scripts/launch-chrome-cdp.sh

# Install / update Chrome for Testing
${CLAUDE_SKILL_DIR}/scripts/install-cft.sh          # latest stable
${CLAUDE_SKILL_DIR}/scripts/install-cft.sh 147      # specific milestone
```

## Key Decisions

| Decision | Rationale |
|----------|-----------|
| Chrome for Testing | Distinct Dock icon ("TEST" badge), own `CFBundleIdentifier`, no auto-update surprises |
| `~/.local/Applications/` install path | User-writable, stable path independent of puppeteer cache |
| Isolated profile (`~/.cache/chrome-cdp-profile`) | Avoids single-instance lock, doesn't interfere with daily browsing |
| Headed (not headless) | User can log into sites manually, cookies persist for automation |
| launchd KeepAlive on crash only | Restart on crash, but intentional quit stays quit |
| `--no-first-run --no-default-browser-check` | Zero-friction automated sessions |
| `--disable-features=Translate --disable-breakpad` | No translation popups, no crash reports |
| User-scope MCP (`-s user`) | Available across all projects |

## Troubleshooting

- **Cloudflare challenges:** If a site shows a Cloudflare challenge/waiting page, just wait — the browser MCP can usually handle it. We are very rarely actually blocked.
- **CDP not responding:** Run `${CLAUDE_SKILL_DIR}/scripts/launch-chrome-cdp.sh` to start or check status.
- **Profile conflicts:** If Chrome complains about profile lock, check for zombie Chrome processes: `ps aux | grep chrome-cdp-profile`
- **CfT update:** Run `${CLAUDE_SKILL_DIR}/scripts/install-cft.sh` to download and install the latest stable version.

## Setup

See [INSTALL.md](INSTALL.md) for the full setup checklist, including the launch script and launchd plist.

## Self-Improvement

If you encounter a setup step that fails, a Chrome/Playwright behavior change, or missing guidance in this skill, don't just work around it — fix the skill:

1. **Create a PR** from a fresh worktree of `https://github.com/eins78/skills` on a new branch, fixing the issue directly
2. **Or file an issue** on `https://github.com/eins78/skills` with: what failed, the actual behavior, and the suggested fix

Never silently work around a skill gap. The fix benefits all future sessions.
