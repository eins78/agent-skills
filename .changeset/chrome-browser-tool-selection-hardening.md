---
"@eins78/agent-skills": minor
---

chrome-browser: harden tool selection and cold-start behaviour, and ship recovery/diagnostic helpers as official scripts.

- Name the lookalike browser MCPs (`mcp__chrome-devtools__*`, `mcp__claude-in-chrome__*`) explicitly as forbidden so cold agents don't silently switch to them when Playwright errors transiently.
- Add an "On activation" preflight (CDP alive, Playwright MCP loaded) since the audit showed all real failures cluster in the first ~30–60 s after skill load.
- Forbid raw `curl`/CDP-WebSocket browser driving; clarify `browser_tabs` lists tabs (no action arg) as well as closing them.
- Document one-time session loss after Chrome for Testing version bumps.
- Hardcode the launchd label as `is.ars.chrome-cdp` (renamed plist `com.example.chrome-cdp.plist` → `is.ars.chrome-cdp.plist`) so troubleshooting commands work without machine-specific lookups. **Upgraders from v1.3 must unload and remove the old plist first** — see INSTALL.md §2.
- Ship three new helper scripts on PATH (symlinked by `install-cft.sh`):
  - `chrome-cdp-health` — liveness + endpoint check (exit 0/1/2).
  - `chrome-cdp-restart` — kickstart launchd-managed Chrome when Playwright keeps erroring but CDP is alive.
  - `chrome-cdp-tabs` — read-only tab listing; sanctioned alternative to ad-hoc `curl :9222/json` for out-of-band inspection. Action helpers (goto/click/eval) intentionally NOT shipped — those would compete with Playwright MCP and re-create the tool-selection problem.
- Add `install-cft.sh --symlinks-only` to refresh helper symlinks without re-downloading CfT (and `-h`/`--help`). Lets users on existing CfT installs adopt the new helpers without the heavy npx download.

<!--
bumps:
  skills:
    chrome-browser: minor
-->
