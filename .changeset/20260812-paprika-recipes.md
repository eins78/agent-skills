---
"@eins78/agent-skills": minor
---

Add `paprika-recipes` skill — read and create recipes in Paprika Recipe Manager 3 on macOS.

Paprika 3 exposes **no AppleScript dictionary and no URL scheme**, so the skill uses the only two scripted surfaces the app actually has: the local Core Data SQLite database for reading, and the app's own `.paprikarecipe` / `.paprikarecipes` import format for writing. The cloud API is deliberately excluded — the local app covers both directions, and using it would mean handling the user's account password.

Two zero-dependency `.mjs` helpers (`paprika-db.mjs`, `paprika-recipe.mjs`) plus a `references/recipe-format.md` documenting the interchange format, the Core Data schema, and the import behaviour that was established by testing rather than assumed.

The headline capability is turning **any** text source into a real recipe — a page the web clipper failed on, prose, a PDF, a photo of a cookbook page — since the clipper handles URLs well and nothing else at all.

Four behaviours that are easy to get wrong and are documented as hazards:

- **Photos replace, they never merge.** An import file with no embedded image sets the recipe's photo to null *and deletes the JPEG from disk* — so the obvious read-edit-reimport round-trip is a silent data-loss path. `build` re-embeds the existing photo by default, and **refuses outright** (non-zero exit, no file written) when a recipe names a photo whose JPEG is not on disk, which is the normal state of a library still syncing photos down from the cloud. That is a gate, not a warning.
- **`photo_data` with a null `photo` filename terminates the app** mid-import — no crash report, no error dialog, so it presents as "the import silently did nothing". The script cannot emit that shape.
- **An unknown category name creates a category, and it outlives the recipe.** Categories are independent rows joined to recipes, so deleting the recipe that introduced one leaves it behind on every synced device. Reuse existing names.
- **An import is a publish, not a local write** — it reaches Paprika Cloud and the user's other devices within a minute, verified on a second device. There is no dry run and no local-only mode, which is what makes "one throwaway, never bulk-write" load-bearing.

<!--
bumps:
  skills:
    paprika-recipes: minor
-->
