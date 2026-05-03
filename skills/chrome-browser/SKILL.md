---
name: chrome-browser
description: Use when setting up a dedicated Chrome browser for Playwright MCP with session persistence, or when encountering Cloudflare challenges during browser automation. Covers CDP setup, launchd auto-start, and persistent login sessions.
license: MIT
metadata:
  author: eins78
  repo: https://github.com/eins78/skills
  version: "1.3.0"
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

# Manual launch — prefer the PATH symlink (created by install-cft.sh)
launch-chrome-cdp                                    # ~/.local/bin/launch-chrome-cdp

# Install / update Chrome for Testing (also (re)creates the launcher symlink)
${CLAUDE_SKILL_DIR}/scripts/install-cft.sh          # latest stable
${CLAUDE_SKILL_DIR}/scripts/install-cft.sh 147      # specific milestone
```

### Finding the scripts when `${CLAUDE_SKILL_DIR}` isn't set

Cold sessions or one-shot bash calls may not have `${CLAUDE_SKILL_DIR}`. After `install-cft.sh` has run once, the canonical entry point is on `$PATH`:

```bash
launch-chrome-cdp     # symlink in ~/.local/bin → skills/chrome-browser/scripts/launch-chrome-cdp.sh
```

If that's missing, locate the skill directory directly. **Do NOT guess** paths like `~/.cache/launch-chrome-cdp.sh`, and **do NOT fall back** to launching `/Applications/Google Chrome.app` manually — you'd bypass Chrome for Testing and the curated flag set:

```bash
SKILL_DIR="$(dirname "$(find ~/.claude/skills ~/.claude/plugins ~/CODE \
  -path '*/chrome-browser/scripts/launch-chrome-cdp.sh' 2>/dev/null | head -1)")"
"${SKILL_DIR}/launch-chrome-cdp.sh"
```

## Using the browser via Playwright MCP

- **Close tabs:** use the `browser_tabs` tool (close action). Playwright `page.close()` does NOT work over CDP — it fails silently.
- **One tab at a time:** close each tab when done. If 10+ tabs accumulate, close all and start fresh.
- **Sequential, not parallel:** browser tool calls in parallel race the same Chrome instance. Wait for the previous call to settle before issuing the next.
- **Verify you're talking to the local CDP:** `curl -s http://127.0.0.1:9222/json/version | jq .webSocketDebuggerUrl` should return a `ws://127.0.0.1:9222/...` URL. If it points at another host, the MCP config has been pointed at a remote CDP — fix it before doing anything else.

## Working with pages

- **React / SPA text extraction:** use `innerText`, not `textContent`. React's virtual DOM may leave text nodes empty while `innerText` reflects rendered visual output.
- **Batch crawling:** `page.goto()` works inside `browser_run_code` for multi-page work without an MCP round-trip per page. Add 1–2 s between navigations to avoid rate limiting.
- **No filesystem inside `browser_run_code`:** `require('fs')` is unavailable in the Playwright MCP sandbox. Return data as the function's return value, or POST it to a local HTTP server.
- **Cloudflare:** if a site shows a challenge / waiting page, just wait — the browser MCP usually handles it. Real blocks are rare. Don't retry in a tight loop, and don't open a second tab to the same site.
- **Rate limits:** sites like Galaxus / Digitec block after ~100+ rapid requests. Crawl slowly (1–2 s/page); expect a ~5 min cool-off after a block.

## Key Decisions

| Decision | Rationale |
|----------|-----------|
| Chrome for Testing | Distinct Dock icon ("TEST" badge), own `CFBundleIdentifier`, no auto-update surprises |
| `~/.local/Applications/` install path | User-writable, stable path independent of puppeteer cache |
| Isolated profile (`~/.cache/chrome-cdp-profile`) | Avoids single-instance lock, doesn't interfere with daily browsing |
| Headed (not headless) | User can log into sites manually, cookies persist for automation |
| launchd KeepAlive on crash only | Restart on crash, but intentional quit stays quit |
| `--no-first-run --no-default-browser-check` | Zero-friction automated sessions |
| `--disable-infobars` + UI suppression flags | Suppress infobars, search engine choice, hang monitor, popup blocking, form repost dialogs |
| `--disable-features=Translate,...` | Disable translation, password check, autofill, media routing, AI mode, tab organization, optimization hints |
| `--password-store=basic --use-mock-keychain` | Bypass macOS keychain — no unlock prompts during automation |
| Background reduction flags | Disable background networking, phishing detection, component updates, sync, metrics upload |
| User-scope MCP (`-s user`) | Available across all projects |

## Troubleshooting

**CDP unreachable** (`curl -s http://127.0.0.1:9222/json/version` is empty or errors):

1. `launchctl list | grep chrome-cdp` — is the launchd agent loaded?
2. `pgrep -f chrome-cdp-profile` — is a Chrome process actually running?
3. **Process exists but CDP is dead** (the "running but hung" case): `pkill -f chrome-cdp-profile`, wait 2 s, then `launch-chrome-cdp` (or `${CLAUDE_SKILL_DIR}/scripts/launch-chrome-cdp.sh`).
4. **Launchd shows non-zero exit** in `launchctl list`: check the stdout/stderr paths defined in your plist.

**CDP reaches the wrong machine:**

```bash
curl -s http://127.0.0.1:9222/json/version | jq .webSocketDebuggerUrl
```

The URL must start with `ws://127.0.0.1:9222/`. If it points at a different host, the Playwright MCP `--cdp-endpoint` is wrong — re-run the `claude mcp add` line in Quick Reference.

**Profile lock errors:** zombie Chrome holding `~/.cache/chrome-cdp-profile`. `pkill -f chrome-cdp-profile`, wait 2 s, relaunch.

**Cloudflare challenges:** wait, don't retry. Real blocks are very rare; they need a fresh IP, not another browser restart.

**CfT update:** run `${CLAUDE_SKILL_DIR}/scripts/install-cft.sh` to download/install the latest stable version (it also refreshes the `launch-chrome-cdp` symlink).

## Setup

See [INSTALL.md](INSTALL.md) for the full setup checklist, including the launch script and launchd plist.

## Self-Improvement

If you encounter a setup step that fails, a Chrome/Playwright behavior change, or missing guidance in this skill, don't just work around it — fix the skill:

1. **Create a PR** from a fresh worktree of `https://github.com/eins78/skills` on a new branch, fixing the issue directly
2. **Or file an issue** on `https://github.com/eins78/skills` with: what failed, the actual behavior, and the suggested fix

Never silently work around a skill gap. The fix benefits all future sessions.
