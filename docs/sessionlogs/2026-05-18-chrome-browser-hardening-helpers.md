# chrome-browser v1.4.0 — tool-selection hardening, recovery helpers, upgrade path

**Date:** 2026-05-18
**Source:** Claude Code
**Session:** Reconstructed from 1 compaction

## Summary

Hardened the `chrome-browser` skill against recurring failure modes observed across many sessions: agents silently switching to lookalike MCPs (`chrome-devtools`, `claude-in-chrome`), driving Chrome via raw HTTP/WebSocket, or falling back to other browsers. Shipped three diagnostic/recovery helper scripts and an upgrade path for existing installs.

## Key Accomplishments

- New "Tool Selection" + "On activation" preflight sections in SKILL.md explicitly naming forbidden lookalike MCPs.
- Three new helper scripts on PATH: `chrome-cdp-health`, `chrome-cdp-restart`, `chrome-cdp-tabs`. Diagnostic and recovery only — deliberately NOT action helpers (see Decisions).
- Hardcoded launchd label `is.ars.chrome-cdp` (renamed plist from `com.example.chrome-cdp.plist`) so troubleshooting commands work without per-machine substitution.
- `install-cft.sh --symlinks-only` flag for upgrading existing CfT installs without re-downloading.
- INSTALL.md "Upgrading from v1.3" block — existing users must unload + remove the old plist before loading the new one, otherwise both LaunchAgents race for port 9222.

## Changes Made

- Created: `skills/chrome-browser/scripts/chrome-cdp-{health,restart,tabs}.sh`
- Created: `.changeset/chrome-browser-tool-selection-hardening.md`
- Modified: `skills/chrome-browser/{SKILL,INSTALL,README}.md`, `scripts/install-cft.sh`
- Renamed: `com.example.chrome-cdp.plist` → `is.ars.chrome-cdp.plist`

## Decisions

- **Prose-only, not a hook gate.** A PreToolUse gate blocking `mcp__playwright__browser_*` would also break the user's separate work-flow Playwright usage. Hardened the skill instructions instead, accepting that prose-only is rule-not-gate per the repo's "gates over rules" principle.
- **Ship diagnostic helpers, NOT action helpers.** `health`, `restart`, `tabs` are orthogonal to Playwright — they answer questions Playwright can't (is CDP alive? is the launchd job loaded?). Shipping action helpers (`goto`, `click`, `eval`) would re-create the exact tool-selection problem we're solving: a sibling tool surface for agents to flee to when Playwright errors transiently.
- **Rejected: bundling a custom MCP server with the plugin.** Technically supported via `.claude-plugin/.mcp.json`, but would double the tool surface and conflict with the host environment's Playwright plugin (especially in Cursor). Would recreate the exact problem under a different name.
- **Hardcoded label, not configurable.** Letting users customize `Label` means troubleshooting prose has to say "your-label-here". Picking `is.ars.chrome-cdp` and making prose concrete is more valuable than per-user flexibility.
- **`chrome-cdp-tabs` filters `type=="page"` by default.** CDP `/json` also returns service workers + background pages. Default to the user's mental model ("tabs"), expose everything via `--all`.
- **`chrome-cdp-health` extracts `webSocketDebuggerUrl` via python3 with `grep`/`sed` fallback.** macOS ships python3, but if it's ever missing the script should still distinguish "missing field" (exit 2 with informative message) from "wrong host" (the original exit-2 case).

## Empirical Basis

Episodic-memory search surfaced two concrete prior incidents that drove specific defenses:

- 2026-01-18 (home-workspace): agent confused `claude-in-chrome` MCP with Playwright MCP, silently failed `browser_tabs`, fell back to navigating `example.com`. → motivates explicit forbidden-MCP list.
- 2026-05-02 (FunG worktree): agent bypassed Playwright entirely and ran `curl http://127.0.0.1:9222/json` to enumerate tabs. → motivates the "never drive via raw HTTP/WebSocket" rule and the sanctioned `chrome-cdp-tabs` helper.

Corpus stats from a cross-machine audit (~109 sessions, ~1754 hits): zero Safari/Firefox fallback — failures cluster in the first ~30–60s after skill activation, hence the on-activation preflight.

## Known Gaps / Follow-ups

- [ ] **Cursor MCP config path:** Cursor loads MCPs from a different config than Claude Code CLI and may not honor plugin `.mcp.json` at all. INSTALL.md does not yet address this. Worth a "Cursor-specific" subsection if usage there grows.
- [ ] **Playwright MCP namespace caveat documented** (`mcp__playwright__*` vs `mcp__plugin_<plugin>_playwright__*`) but no automated probe — preflight relies on the agent recognizing either form.

## Next Steps

- [ ] Push commit, open PR, walk through Changesets release flow.
- [ ] After release, retest on Cursor environment to confirm the prose-only hardening + helpers reduce the failure modes that triggered this work.
