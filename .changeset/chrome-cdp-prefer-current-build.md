---
"@eins78/agent-skills": minor
---

**`chrome-browser`** — the launcher now uses Chrome stable when Chrome for Testing is a major version behind it.

CfT is still preferred for its distinct Dock icon, but a CfT build left behind
stable presents a browser fingerprint that bot-detection vendors reject, so sign-in
pages refuse to proceed while the same login works in Safari. Override with
`CHROME_CDP_PREFER=testing` or `CHROME_CDP_PREFER=stable`.

<!--
bumps:
  skills:
    chrome-browser: minor
-->
