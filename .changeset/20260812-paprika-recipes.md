---
"@eins78/agent-skills": minor
---

Add **`paprika-recipes`** — read and create recipes in Paprika Recipe Manager 3 on macOS.

Paprika has no AppleScript dictionary and no URL scheme, so the skill uses its only two scripted surfaces: the local SQLite database for reading, and the app's own file import for writing. No cloud API, no account password. Two zero-runtime-dependency `.mjs` helpers plus reference docs.

The point of it is turning **any** text source into a real recipe — a page the web clipper failed on, prose, a PDF, a photo of a cookbook page. The clipper handles URLs well and nothing else.

**Write the native `.paprikarecipe` / `.paprikarecipes` format.** It carries 24 fields to `.yml`'s 15, is the only one that can update an existing recipe or carry a photo, and the only one that can be imported without a human clicking. The `yaml` subcommand is kept for hand-authoring and one-way conversion scripts — comparison in `references/import-formats.md`.

Two behaviours that can cost you data. Both bite before anyone opens a reference, so they are here; the detail is in `references/recipe-format.md`.

- **Photos replace, they never merge.** An import file with no embedded image sets the recipe's photo to null *and deletes the JPEG from disk*, which makes the obvious read-edit-reimport round-trip a silent data-loss path. `build` re-embeds the existing photo by default, and **refuses to write a file** when the JPEG is not on disk.
- **An import is a publish, not a local write.** It reaches Paprika Cloud and the user's other devices within a minute. There is no dry run and no local-only mode, so test with one throwaway recipe and never bulk-write.

<!--
bumps:
  skills:
    paprika-recipes: minor
-->
