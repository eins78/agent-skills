---
"@eins78/agent-skills": minor
---

Add `paprika-recipes` skill — read and create recipes in Paprika Recipe Manager 3 on macOS.

Paprika 3 exposes **no AppleScript dictionary and no URL scheme**, so the skill uses the only two scripted surfaces the app actually has: the local Core Data SQLite database for reading, and the app's own `.paprikarecipe` / `.paprikarecipes` import format for writing. The cloud API is deliberately excluded — the local app covers both directions, and using it would mean handling the user's account password.

Two zero-dependency `.mjs` helpers (`paprika-db.mjs`, `paprika-recipe.mjs`) plus a `references/recipe-format.md` documenting the interchange format, the Core Data schema, and the import behaviour that was established by testing rather than assumed.

**Recipe links are documented as part of the format.** A text field may contain `[recipe:Exact Recipe Name]`, which Paprika renders as a tappable link — plain text in the existing column, no join table and no id, which is why it survives the interchange format untouched. It resolves by name (so renaming a target breaks the link silently), an unknown target imports harmlessly, and rendering is verified for `ingredients` (observed in the iOS app; the stored format is identical on both platforms). This matters for the "one source, several recipes" decision: extracting a reusable component into its own recipe is cheap precisely because the dishes can link to it.

**Link both ways.** A link creates no reverse pointer, so the skill also has the component link back to its dishes in `notes` — otherwise opening the component (exactly what happens when deciding whether to make a batch) gives no route to the dishes it exists for. Documented with its two costs: `notes` rendering is unverified, and every back-link is another name a rename can silently break.

**The vendor also documents a plain-text `.yml` import format**, and the skill now supports it via `paprika-recipe.mjs yaml`. It needs only `name`, `ingredients` and `directions`, and skips gzip and ZIP entirely — but it carries fewer fields than the JSON format (no `total_time`, `description`, `image_url` or `uid`), so it cannot update an existing recipe or carry a photo. The command warns about every field it drops rather than letting one vanish quietly. The file is emitted as **JSON**, because YAML is a superset of JSON: the vendor warns their format "is quite strict with regards to whitespace and indentation", and that whole class of problem disappears when there is no indentation and no `|` blocks to get wrong. Several recipes become a JSON array, which is exactly the YAML list their multi-recipe example shows. End-to-end import through Paprika's own YAML importer is marked untested — the emitted file round-trips through a standard YAML parser, but verifying the app itself would mean creating recipes in a real library, so the reference says how to settle it in a minute rather than claiming it.

The headline capability is turning **any** text source into a real recipe — a page the web clipper failed on, prose, a PDF, a photo of a cookbook page — since the clipper handles URLs well and nothing else at all.

Four behaviours that are easy to get wrong and are documented as hazards:

- **Photos replace, they never merge.** An import file with no embedded image sets the recipe's photo to null *and deletes the JPEG from disk* — so the obvious read-edit-reimport round-trip is a silent data-loss path. `build` re-embeds the existing photo by default, and **refuses outright** (non-zero exit, no file written) when a recipe names a photo whose JPEG is not on disk, which is the normal state of a library still syncing photos down from the cloud. That is a gate, not a warning.
- **`photo_data` with a null `photo` filename terminates the app** mid-import. No error dialog, so it presents as "the import silently did nothing" — but macOS does write a crash report (`SIGABRT` from an uncaught exception on an `NSManagedObjectContext` queue), which is where to look first. The script cannot emit that shape.
- **An unknown category name creates a category, and it outlives the recipe.** Categories are independent rows joined to recipes, so deleting the recipe that introduced one leaves it behind on every synced device. Reuse existing names.
- **An import is a publish, not a local write** — it reaches Paprika Cloud and the user's other devices within a minute, verified on a second device. There is no dry run and no local-only mode, which is what makes "one throwaway, never bulk-write" load-bearing.

<!--
bumps:
  skills:
    paprika-recipes: minor
-->
