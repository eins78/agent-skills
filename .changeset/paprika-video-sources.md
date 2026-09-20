---
"@eins78/agent-skills": patch
---

**`paprika-recipes`** — covers the case where a recipe exists only as narration in a video, plus recovery when `import --confirm` hangs.

Adds *When the recipe is only spoken*: a reel or short often has no recipe text anywhere, and the recipe is in the audio. The section stays on the recipe-management side of the line — it names no tools or flags, because fetching and transcribing a video is ordinary media work that differs per machine. What it does give is the judgement that makes a heard recipe trustworthy: read the caption first (the recipe is often just there), treat on-screen text as auto-subtitles rather than an ingredient card until checked, cross-check every amount against scales and packs visible in frame, write your own directions instead of pasting a transcript, expect subtitles burned into any photo you pull, and record in `notes` that the amounts were heard.

Also adds *When `--confirm` appears to hang*: don't pipe the import through `tail` (it prints only at EOF, hiding the progress lines), check for an already-open sheet before re-running `open` (a second call stacks another sheet), and verify every PID before killing, since `pgrep -f paprika-recipe.mjs` also matches the shell that ran it. The hang was not reproduced and no cause is claimed; it is recorded as an open question in the skill README.

<!--
bumps:
  skills:
    paprika-recipes: patch
-->
