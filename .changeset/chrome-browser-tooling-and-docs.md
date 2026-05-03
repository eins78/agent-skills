---
"@eins78/agent-skills": minor
---

chrome-browser: v1.3.0 — surface tool-selection rules (`browser_tabs` not `page.close()`, sequential calls, local-CDP verification), page-handling gotchas (`innerText` for SPAs, batch crawling inside `browser_run_code`, no `require('fs')`, Cloudflare patience, rate-limit guidance), an expanded "running but hung" troubleshooting checklist, and a stable `~/.local/bin/launch-chrome-cdp` symlink installed by `install-cft.sh` so cold sessions don't have to guess paths. Two pre-existing shellcheck warnings (SC2115, SC2054) also fixed.

<!--
bumps:
  skills:
    chrome-browser: minor
-->
