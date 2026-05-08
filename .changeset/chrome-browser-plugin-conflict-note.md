---
"@eins78/agent-skills": patch
---

chrome-browser: document conflict with the official `claude-plugins-official/playwright` plugin

The official `playwright` plugin from Anthropic's marketplace registers `npx @playwright/mcp@latest` without `--cdp-endpoint`, which causes Playwright to spawn its own bundled Chromium instead of attaching to the CfT instance set up by this skill — defeating the persistent-session purpose entirely. Added a callout in INSTALL.md step 3 with two resolution paths (disable the plugin via `~/.claude/settings.json`, or patch the plugin's bundled `.mcp.json`) plus a verification command.

<!--
bumps:
  skills:
    chrome-browser: patch
-->
