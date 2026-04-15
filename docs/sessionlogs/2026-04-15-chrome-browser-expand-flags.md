# Chrome Browser: Expand and Consolidate Automation Flags

**Date:** 2026-04-15
**Source:** Claude Code

## Summary

Expanded Chrome automation flags from 7 to 18 in the `chrome-browser` skill. Added password check suppression, AI mode badge removal, background activity reduction, and keychain bypass.

## Key Accomplishments

- Researched Chrome feature flags by scanning the CfT v147 framework binary (`strings` on the Mach-O)
- Identified `AiModeOmniboxEntryPoint` and `OmniboxAiModeEntryPointVariations` for AI badge suppression
- Identified `CustomizeChromeSidePanel` for Customize button (intentionally kept enabled)
- Tested all 18 flags on a throwaway instance (port 9333) before applying
- Decoded the orange theme color: `browser.theme.user_color2: -32768` = `#FF8000` (ARGB), set manually via profile
- Applied flags to live launchd agent and verified on running Chrome process
- Created PR eins78/agent-skills#35

## Changes Made

- Modified: `skills/chrome-browser/scripts/launch-chrome-cdp.sh` — expanded `CHROME_FLAGS` array with categorized comments
- Modified: `skills/chrome-browser/com.example.chrome-cdp.plist` — matching flags in template plist
- Modified: `skills/chrome-browser/SKILL.md` — version 1.1.0 → 1.2.0, updated Key Decisions table

## Decisions

- **Don't disable CustomizeChromeSidePanel:** User wants the Customize Chrome button to set theme colors
- **Orange theme is profile-level:** Stored as `browser.theme.user_color2` in Preferences JSON, set manually once, persists across restarts — not a command-line concern
- **12 disabled features in single flag:** Comma-separated `--disable-features` keeps process args clean and is forward-compatible (Chrome ignores unknown names)

## Next Steps

- [ ] Merge PR eins78/agent-skills#35 (includes earlier CfT migration commits from `feature/chrome-cdp-app-bundle`)
- [ ] After merge, bump plugin version in metadata files and release

## Repository State

- Committed: `ea0e54c` — chrome-browser: expand and consolidate automation flags
- Branch: `feature/chrome-cdp-app-bundle`
- PR: https://github.com/eins78/agent-skills/pull/35

## Plan Reference

- Planned: expand and consolidate Chrome automation flags in skill
- Executed: all planned skill changes applied, tested, committed, pushed, PR created
