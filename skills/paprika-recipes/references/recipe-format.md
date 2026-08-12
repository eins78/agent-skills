# Paprika interchange format & local schema

Everything here was read from a real Paprika 3.8.4 install and a real export,
not from vendor documentation. Where something is untested, it says so.

## `.paprikarecipe` — one recipe

A **gzipped JSON object**. Not a container, not a wrapper — gunzip it and you
have the recipe.

```bash
gunzip -c "Miso Soup.paprikarecipe" | jq .
```

## `.paprikarecipes` — many recipes

A **ZIP archive** whose entries are `.paprikarecipe` files, named
`<recipe name>.paprikarecipe`. Observed in a real 219-recipe export: 34 MB,
deflate, no directory nesting.

```bash
unzip -l export.paprikarecipes
unzip -p export.paprikarecipes "Miso Soup.paprikarecipe" | gunzip | jq .
```

## Fields

Full key set, taken from an actual export entry. Every key is present in
Paprika's own files even when empty, so `paprika-recipe.mjs` emits all of them.

| Field | Type | Notes |
|---|---|---|
| `name` | string | **The only required field.** |
| `ingredients` | string | Newline-delimited, one item per line. Not an array. Section headers are just lines (`For the Dashi (makes a scant 4 cups)`). |
| `directions` | string | Newline-delimited. Paprika's own web-clipped recipes use blank lines between steps. |
| `notes` | string | Free text. Commonly used for substitutions and results (`Replace the butter with 60 g vegan block.`). |
| `description` | string | Usually empty in clipped recipes. |
| `servings` | string | Free text, not a number — observed `2 servings`, `Servings: 4`, `Serving : 4 people`. |
| `prep_time` `cook_time` `total_time` | string | Free text — `15 mins`, `5 mins`. |
| `difficulty` | string | Free text, usually empty. |
| `nutritional_info` | string | Free text blob, ` · `-separated in clipped recipes. |
| `rating` | number | 0–5. 0 means unrated. |
| `source` | string | Usually a bare hostname (`justonecookbook.com`). |
| `source_url` | string | Full URL. |
| `image_url` | string | Remote image the clipper found. Not required for a local photo. |
| `categories` | string[] | **Plain category names**, not ids. An unknown name creates a category, which then **outlives the recipe** (verified — see below). |
| `photos` | array | Additional photos. Empty in every entry inspected; `ZRECIPEPHOTO` is likewise empty locally. Structure untested. |
| `created` | string | `"YYYY-MM-DD HH:MM:SS"`. **Ignored by the importer** — see below. |
| `uid` | string | UUID. Sync identity. See "uid behaviour". |
| `hash` | string | SHA-256-looking digest the app maintains. Let the app compute it. |
| `photo_hash` | string | **Uppercase SHA-256 of the JPEG bytes** — verified: supply nothing and the app computes exactly this value. Never send it yourself. |
| `photo` | string \| null | Filename, e.g. `D18B3A72-…-47E18471A.jpg`. **Required whenever `photo_data` is set** — see below. |
| `photo_large` | string \| null | Null in every export entry inspected. |
| `photo_data` | string \| null | **base64 JPEG**, embedded directly in the JSON. This is how a photo travels in an interchange file. 206 of 219 entries in a real export carried one. |

### The `.yml` import format

Paprika also imports a **plain-text YAML file**, documented by the vendor at
<http://www.paprikaapp.com/help/ios/> ("YAML Format"). It is far simpler to
produce than `.paprikarecipe` — no gzip, no ZIP — and it is the same format on
iOS and macOS (the Mac binary carries a `YamlImporter` class).

Documented fields — **`name`, `ingredients` and `directions` are the only
required ones**, and the order does not matter:

```
name  servings  source  source_url  prep_time  cook_time  on_favorites
categories  nutritional_info  difficulty  rating  notes  photo
ingredients  directions
```

⚠️ This is a **subset** of the JSON interchange format above. `total_time`,
`description`, `image_url`, `uid`, `hash` and `photo_hash` are **not** in it.
`paprika-recipe.mjs yaml` warns about every field it drops rather than letting
one vanish quietly.

Several recipes go in one file as a YAML list (`- name: …` per entry).

**Emit JSON, not hand-written YAML.** The vendor warns the format "is quite
strict with regards to whitespace and indentation" — that warning applies to
the block style in their examples, where a mis-indented line under a `|` block
silently changes the text. YAML is a superset of JSON, so `JSON.stringify`
output *is* valid YAML, and it removes the whole class of problem: no
indentation, no pipe blocks, no quoting rules, and newlines inside
`ingredients`/`directions` become `\n` escapes instead of significant leading
whitespace. Several recipes become a JSON array, which is exactly the YAML list
their multi-recipe example shows.

| Property | Status |
|---|---|
| Vendor documents `.yml` as a supported import type | Verified — vendor help page |
| Required fields are `name`, `ingredients`, `directions` | Verified — vendor help page |
| macOS build has a YAML importer, not just iOS | Verified — `YamlImporter` class in the app binary |
| `.yml` is **not** a declared document type on macOS | Verified — absent from `CFBundleDocumentTypes`, so it is chosen via the importer's format picker rather than opened from Finder |
| JSON output parses as YAML, as a list of mappings, with newlines and Unicode intact | Verified — round-tripped through a standard YAML parser |
| Paprika's own importer accepts the JSON-style file end to end | **Verified** — 2026-08-12, see below |
| `on_favorites` takes effect | **No** — see below |

### The `.yml` import, verified end to end

Settled 2026-08-12 with one throwaway recipe exercising 14 of the 15 documented
fields. Imported on **iOS** (Settings → Import), then read back from the macOS
database after sync.

The format picker is labelled **`YAML (yml, yaml)`** on iOS, and the confirmation
sheet reads `Format: YAML (yml)`. (The macOS picker was not seen; `YamlImporter`
is in the Mac binary, but the label there is unconfirmed.)

**13 of the 14 fields came back byte-identical** — including every construct that
breaks hand-written block YAML, which is the whole argument for emitting JSON:

| Construct in the payload | Survived |
|---|---|
| A colon inside a value (`2 g salt: fine sea salt`) | ✅ |
| Line starting with `-` | ✅ |
| Line starting with `#` | ✅ |
| A literal `---` document-marker line | ✅ |
| Tab, two-space indent, trailing spaces, blank line | ✅ |
| Both quote styles and a bare apostrophe | ✅ |
| `éàüß`, 日本語, `½`, `°C`, emoji | ✅ |
| Multi-line `nutritional_info` | ✅ |
| Two existing categories (no new category created) | ✅ |

**The one failure — `on_favorites`.** A file carrying `on_favorites: true`
imported cleanly with everything else intact, but the recipe was **not**
favorited (`ZONFAVORITES = 0`). The vendor's own example writes the YAML 1.1
bareword `on_favorites: yes`, and **JSON cannot express a bareword** — a quoted
`"yes"` is a string, not a boolean. So this is the single documented field where
the JSON-as-YAML approach cannot reproduce the vendor's example, and the only
known crack in "JSON has no whitespace or quoting pitfalls".

Whether the importer would accept a quoted `"yes"`, or ignores the field
entirely, is **untested** — distinguishing them needs a second import. The `yaml`
command warns when the field is set rather than letting it look applied. Set the
favorite in the app instead.

`photo` is the 15th field and is unreachable here by construction: the format
carries only a filename with no channel for image bytes, which is case E in the
photo-behaviour table below — a filename alone preserves nothing.

### Recipe links — `[recipe:Name]`

A text field may contain `[recipe:Exact Recipe Name]`, which Paprika renders as
a tappable link to that recipe. It is **plain text inside the existing column**
— there is no join table, no id, and no separate field.

```
1 tbsp [recipe:Spice Rub]
Vegan Ricotta ([recipe:Cashew Ricotta])
Serve with:
[recipe:Chili / Garlic Oil]
```

| Property | Status |
|---|---|
| Resolves by **name**, not uid | Verified — the token contains only a name |
| Name may contain spaces, `/`, punctuation | Verified (`Chili / Garlic Oil`) |
| Survives `.paprikarecipe` gzip round trip | Verified — `get` → `build` → `inspect` |
| Survives Paprika's own `.paprikarecipes` export | Verified — present verbatim in export entries |
| Stored verbatim on import (`ingredients`, `directions`) | Verified — re-read from the DB after import |
| Unknown target is safe to import | Verified — import succeeded, no error, no crash |
| Renders as a link in `ingredients` | Verified in the Paprika **iOS** app; not separately checked on macOS |
| Renders as a link in `notes` | **Verified** 2026-08-12 — imported via `.yml`, rendered on iOS as a live blue link reading `Shio-Koji (Base)` |
| Renders as a link in `directions` | **Untested** — stored fine |
| How an unknown target renders (literal text vs dead link) | **Untested** |

Since `notes` renders links, the reverse-linking convention (a component's notes
linking back to the dishes that use it) is a real navigation aid rather than
decorative text.

**Open observation, deliberately not written up as a rule.** In the same
screenshots, Paprika rendered some lines **bold**: `For the base:`,
`For the topping:` and `7. Trailing spaces on this line:` all end with a colon,
which suggests "a line ending in a colon becomes a heading". But
`Line 10 link token: [recipe:Shio-Koji (Base)]` also rendered bold and does *not*
end with a colon, while `Line 2 has a colon: and text after it` did *not* render
bold — which rules out the simpler "bold everything before the first colon".
Neither rule fits all four observations, so the mechanism is unknown. What *is*
established: the stored text is byte-identical to the input, so whatever the rule
is, it is applied at render time and nothing is stored to mark it.

Because the target is matched by name, **renaming a linked recipe breaks the
link silently** — nothing validates it. Check the target exists before writing
one.

Links are one-directional: a token in a dish creates no reverse pointer on the
component. To make a component/dish set navigable from either end, write the
reverse links explicitly in the component's `notes`:

```
Used with:
[recipe:Roast Carrots with Spice Rub]
[recipe:Grilled Aubergine with Spice Rub]
```

Note this puts links in `notes`, whose rendering is untested (see the table
above), and adds another name that a rename can break.

Fields present in the local database but *not* in the interchange format:
`scale` (Paprika's serving multiplier), `on_favorites`, `in_trash`.

## Verified import behaviour

Tested against the live library on 2026-08-11 with throwaway recipes.

- **A single `.paprikarecipe` imports fine.** The ZIP form is not required.
- **`.paprikarecipes` bundles import too**, through the same sheets — a
  two-entry bundle produced *"2 recipes updated."* in one pass.
- The app **auto-detects the format** — its sheet reads
  `Format: Paprika (paprikarecipe)`. No format picker appeared on the `open` path.
- **Import is not headless.** A modal sheet attaches to window 1:
  `Import Recipes` / *"Are you sure you want to import the recipes contained in
  this file?"* / buttons `Cancel` and `Import`. Then a second sheet:
  `Import Complete` / *"Successfully imported 1 recipes."* / `OK`.
- **`uid` is honored.** A supplied UUID lands verbatim.
- **A matching `uid` updates in place.** Re-importing with an existing uid left
  the row count unchanged and the app reported *"1 recipes updated."* instead of
  "imported". This is the programmatic-edit path.
- **`created` is ignored on insert.** A supplied `2019-03-04 05:06:07` came back
  as the import moment. On update the original `created` is preserved.
- **Categories merge on update**, they do not replace. An update supplying only
  `["ZZZ Test Category"]` left the previously-attached `Dessert` in place — so
  an import can add a category but cannot remove one.
- **A category created by an import outlives the recipe.** Categories are
  independent rows in `ZRECIPECATEGORY`, joined to recipes through
  `Z_12CATEGORIES` — not a property of the recipe. Observed: `ZZZ Test Category`
  (`Z_PK 33`), introduced by a single test import, remains after the fact and
  has to be removed by hand in the app. A bulk import with inconsistent or
  misspelled names permanently pollutes the category list on every device.
- **The import reaches other devices.** Verified 2026-08-11 23:29: recipes
  created through this path were opened in the Paprika **iOS app on an iPhone
  over 5G, away from this Mac**, with title, star rating, categories, source,
  prep time, servings, ingredients, directions and notes all intact. A local
  import is a publish.
- The imported row lands with `ZSTATUS='unmodified'`, `ZISSYNCED=1` and an
  app-computed `ZSYNCHASH`, i.e. already handed to cloud sync.

### Photo handling — five tests, one of them fatal

Run on 2026-08-11 against one throwaway recipe, each step observed in the
database and on disk.

| Test | File contained | Result |
|---|---|---|
| A | `photo_data` + `photo` filename + `photo_hash` | ✅ photo landed; JPEG written to `Photos/<uid>/<filename>` |
| B | `photo_data` (same bytes) + new `photo`, **no** `photo_hash` | no change — the app dedupes by content |
| C | `photo_data` (**different** image) + new `photo`, **no** `photo_hash` | ✅ replaced; app computed `ZPHOTOHASH` = SHA-256 of the new bytes |
| D | all photo keys **omitted** | ❌ **photo wiped**, `ZPHOTO` → null, JPEG deleted from disk |
| E | `photo` filename kept, **no** `photo_data` | ❌ **photo wiped** — the filename alone preserves nothing |
| ✗ | `photo_data` with `photo: null` | ☠️ **the app terminates mid-import** |

Three conclusions, all load-bearing:

1. **`photo_data` with a null or absent `photo` filename kills Paprika.** The
   process is gone and nothing is imported. There is no in-app error, so it
   looks at first like "the import silently did nothing" — but macOS **does**
   write a crash report to `~/Library/Logs/DiagnosticReports`: `SIGABRT` raised
   by `uncaught_exception_handler` on an `NSManagedObjectContext` queue, i.e.
   an uncaught exception during the Core Data import. Reproduced twice, one
   report each. Check there before concluding the import was a no-op.
2. **An import replaces photo state; it never merges.** Tests D and E show that
   anything short of re-supplying `photo_data` deletes the existing photo *and*
   its file. This is the opposite of how categories behave, and it makes the
   read-edit-reimport round-trip lossy unless the image is carried along.
3. **`photo_hash` is computed by the app** (test C), so callers should omit it.
   Sending a stale hash alongside a new image is the one way to make it lie.

`paprika-recipe.mjs build` encodes all three: it re-embeds the photo found at
the input's `photo_path`, always writes a filename next to `photo_data`, and
drops a carried-over `photo_hash` when `--photo` supplies a different image.
If a recipe names a photo whose JPEG is missing locally — the normal state
while a fresh library is still pulling photos from Paprika Cloud — `build`
fails rather than emitting a file that would delete it.

**Untested:** whether an explicitly empty string clears a *text* field that
currently has a value; the `photos` array structure; imports of the other
formats the app offers.

## Local database

`~/Library/Group Containers/72KVKW69K8.com.hindsightlabs.paprika.mac.v3/Data/Database/Paprika.sqlite`

Core Data, WAL mode. Table `ZRECIPE` maps nearly 1:1 to the fields above:

```
ZUID ZNAME ZINGREDIENTS ZDIRECTIONS ZNOTES ZDESCRIPTIONTEXT
ZSERVINGS ZPREPTIME ZCOOKTIME ZTOTALTIME ZDIFFICULTY ZNUTRITIONALINFO
ZRATING ZSOURCE ZSOURCEURL ZIMAGEURL ZSCALE ZCREATED
ZPHOTO ZPHOTOLARGE ZPHOTOHASH ZINTRASH ZONFAVORITES ZSTATUS ZISSYNCED ZSYNCHASH
```

Three things that bite:

1. **`ZCREATED` is a Core Data timestamp** — seconds since 2001-01-01, not the
   Unix epoch. Add `978307200` before treating it as epoch seconds.
2. **`ZINTRASH <> 0` rows are deleted recipes** and must be filtered out.
   Observed: 16 of 259 rows in one library.
3. **Categories live behind a generated join table.**

```sql
SELECT r.ZNAME, group_concat(c.ZNAME, '|')
FROM ZRECIPE r
JOIN Z_12CATEGORIES j ON j.Z_12RECIPES = r.Z_PK
JOIN ZRECIPECATEGORY c ON c.Z_PK = j.Z_13CATEGORIES
WHERE r.ZINTRASH = 0
GROUP BY r.Z_PK;
```

The `Z_12`/`Z_13` numbers are Core Data entity ids. They are stable for a given
schema version but are not guaranteed across Paprika updates — if the join
returns nothing after an app update, check `.schema` for a renamed join table.

Other tables: `ZRECIPECATEGORY`, `ZGROCERYLIST`, `ZGROCERYITEM`, `ZMEAL`,
`ZMEALTYPE`, `ZMENU`, `ZMENUITEM`, `ZPANTRYITEM`, `ZBOOKMARK`, `ZSYNCSTATUS`,
`ZRECIPEPHOTO`. Only recipes and categories are covered by this skill.

## Photos on disk

```
…/Data/Photos/<recipe ZUID>/<ZPHOTO filename>
```

Verified: a recipe with uid `00A0AC68-…` and `ZPHOTO = AE175116-….jpg` has its
JPEG at `Photos/00A0AC68-…/AE175116-….jpg`. Not every recipe has a local photo
file — one library showed 132 photo files for 243 recipes while still syncing.

## Snapshotting the database

The live DB is WAL-mode with the app running. Measured on 2026-08-11:

| Method | Result |
|---|---|
| `sqlite3 -readonly "$DB" "VACUUM INTO '<dest>'"` | ✅ works; emits `journal_mode=delete`, reopens read-only |
| `sqlite3 -readonly "$DB" ".backup '<dest>'"` | file is written, but keeps `journal_mode=wal` |
| `cp Paprika.sqlite <dest>` | copies, but keeps `journal_mode=wal` |

The trap is on the read-back, not the copy: **any snapshot that keeps
`journal_mode=wal` cannot be opened with `sqlite3 -readonly`** — it fails with
`unable to open database file (14)`, because SQLite must create a `-shm`
sidecar it is not allowed to write. `VACUUM INTO` sidesteps this.

A plain `cp` can also miss uncheckpointed WAL content. That did **not**
reproduce in testing — Paprika had checkpointed, and the copy matched the live
count exactly — but it is a real property of WAL, and `VACUUM INTO` removes the
question. If you must copy by hand, copy `.sqlite`, `.sqlite-wal` and
`.sqlite-shm` together.
