---
"@eins78/agent-skills": minor
---

**`apple-notes`** — a note's body is not its contents. Adds attachment listing, and the rule that stops a failed search becoming a false conclusion.

Attachments are separate rows in the Notes database, so a body read cannot see them — which makes it possible to search a note, find nothing, and conclude the document was never there. New `scripts/list-attachments.sh` lists every attachment with its type, title and identifying text, and `--paths` resolves the file on disk.

<!--
bumps:
  skills:
    apple-notes: minor
-->
