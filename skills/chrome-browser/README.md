# Chrome Browser Skill

Developer documentation for the dedicated Chrome browser automation skill.

## Purpose

Reusable setup guide for a dedicated Chrome for Testing (CfT) instance with CDP for Playwright MCP browser automation. Persistent sessions, launchd-managed, multi-session safe. CfT provides a distinct Dock icon out of the box.

## Tier

**Publishable** — works on any macOS machine with Node.js (npx).

## Origin

Developed for qubert-config ([sessionlog](https://github.com/eins78/qubert-config/blob/main/docs/sessionlogs/2026-02-25-browser-automation-playwright-cdp.md)), then replicated on lima (home-workspace). Both setups validated and working.

## Key Insight

Chrome enforces a single-instance lock per user-data-dir. When the user's daily Chrome is running, CDP can't bind to the default profile. The solution is a **dedicated `~/.cache/chrome-cdp-profile`** with Chrome for Testing — which also has its own `CFBundleIdentifier` (`com.google.chrome.for.testing`), giving it a distinct icon in the Dock without any hacks.

## Skill Structure

```
chrome-browser/
├── SKILL.md                      # Lean overview, architecture, decisions
├── README.md                     # This file
├── INSTALL.md                    # Full setup checklist
├── com.example.chrome-cdp.plist  # Template launchd plist
└── scripts/
    ├── launch-chrome-cdp.sh      # Idempotent launch script (prefers CfT, falls back to Chrome)
    └── install-cft.sh            # Downloads and installs Chrome for Testing
```

## Validated On

| Machine | Date | Status |
|---------|------|--------|
| qubert | 2026-02-25 | Working (launchd, multi-session tested) |
| lima | 2026-03-07 | Working (launchd, Playwright MCP verified) |
| lima | 2026-03-30 | v1.1.0: Chrome for Testing + ergonomic flags |

## Dependencies

- macOS (launchd)
- `npx` available (for downloading CfT and `@playwright/mcp`)
- Regular Chrome at `/Applications/Google Chrome.app` (optional fallback)

## Limitations

- **macOS only** — launchd plist won't work on Linux (use systemd equivalent)
- **Chrome-specific** — could be adapted for Edge (Chromium-based) but not Firefox/Safari
- **Headed** — requires a display session (not suitable for headless servers without modification)
- **No auto-update** — CfT is version-pinned by design; re-run `install-cft.sh` to update

## Future Improvements

- Linux systemd unit file variant
- `--shared-browser-context` flag evaluation for tab-level login sharing
- Automated smoke test script (navigate + snapshot)
