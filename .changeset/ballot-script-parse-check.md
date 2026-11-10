---
"@eins78/agent-skills": patch
---

**`ballot`** — the artifact-mode steps add a parse check of the page's script before publishing.

One syntax error in the page's script, such as an unescaped `"` inside a question's text, stops the whole script and leaves the page without a title or cards. The checklist now compiles the script with a one-line Node command first, and the template's comment above `DECS` says how to quote.

<!--
bumps:
  skills:
    ballot: patch
-->
