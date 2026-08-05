---
"@eins78/agent-skills": minor
---

`apple-mail`: document attachment extraction and two `tell`-block gotchas

Adds `List attachments` / `Save attachments` commands and a gotchas section
covering `POSIX file` failing inside a `tell application "Mail"` block (-1728)
and the set of ordinary variable names that collide with Mail's terminology.

<!--
bumps:
  skills:
    apple-mail: minor
-->
