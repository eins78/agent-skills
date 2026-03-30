# chrome-browser: Chrome for Testing + distinct Dock icon

**Date:** 2026-03-30
**Branch:** `feature/chrome-cdp-app-bundle` (PR #24)
**Source:** Claude Code

## Summary

Added a distinct Dock icon and ergonomic flags to the Chrome CDP automation instance. Started with a custom `.app` wrapper bundle approach (recoloring Chrome Canary's icon), discovered that `exec` makes wrapper icons invisible to macOS, then pivoted to Chrome for Testing which solves the icon problem natively.

## Key Accomplishments

- Chrome CDP now runs as **Chrome for Testing** (CfT) v147, with its own `CFBundleIdentifier` and distinctive "TEST" badge icon in the Dock
- Added ergonomic flags: `--no-default-browser-check`, `--no-first-run`, `--disable-features=Translate`, `--disable-breakpad`
- New `install-cft.sh` script downloads CfT via `@puppeteer/browsers`
- Moved scripts to `scripts/` subdirectory (matching other skills)
- Bumped skill to v1.1.0, plugin to v2.1.0
- Live system updated: launchd plist, CfT installed, CDP verified

## Decisions

- **Chrome for Testing over .app wrapper**: The wrapper approach failed because `exec` replaces the shell process with Chrome's binary, and macOS identifies running apps by the binary's bundle path — not the wrapper's. CfT has its own bundle ID (`com.google.chrome.for.testing`) so macOS treats it as a genuinely separate app. No hacks needed.
- **No auto-update is acceptable**: CfT is version-pinned by design. The user controls updates by re-running `install-cft.sh`. This is a feature for automation stability.
- **`~/.local/Applications/` install path**: User-writable, stable, independent of the puppeteer cache at `~/.cache/puppeteer/`.
- **Bot detection equivalent**: CfT uses the identical Blink engine as regular Chrome. Detection is about `navigator.webdriver` and CDP signals, not the binary flavor.

## Approaches Tried and Abandoned

1. **Custom .app wrapper bundle with `exec`**: Created `Chrome-CDP.app` with custom Info.plist and icon. Worked structurally but Dock always showed Chrome's icon because `exec` replaces the wrapper process.
2. **`__CFBundleIdentifier` env var hack**: Set the env var before `exec` hoping Chrome would adopt the wrapper's identity. Chrome ignores it.
3. **Canary icon recoloring**: Used ImageMagick `-modulate` to hue-rotate Chrome Canary's icon. Produced nice terracotta (terra6: `-modulate 105,60,86`) and purple variants. Fun experiment but moot after switching to CfT.

## Changes Made

- New: `skills/chrome-browser/scripts/install-cft.sh`
- Modified: `skills/chrome-browser/scripts/launch-chrome-cdp.sh` (moved from root, prefers CfT)
- Modified: `skills/chrome-browser/SKILL.md`, `INSTALL.md`, `README.md`, `com.example.chrome-cdp.plist`
- Removed: `create-app-bundle.sh`, `create-icon.sh` (no longer needed)
- Version bumps: skill 1.0.0→1.1.0, plugin 2.0.0→2.1.0

## Live System State (lima)

- CfT v147.0.7727.24 at `~/.local/Applications/Google Chrome for Testing.app/`
- launchd plist at `~/Library/LaunchAgents/com.ma.chrome-cdp.plist` points to CfT binary
- CDP on port 9222, Google login persists across restarts
- Old Chrome-CDP.app wrapper still at `~/.local/Applications/` (can be removed)
