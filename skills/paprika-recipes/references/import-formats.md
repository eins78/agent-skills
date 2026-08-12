# Import formats: native vs `.yml`

Paprika accepts recipes in two documented formats. This file records what each
one can do, what it measurably cannot, and why the skill defaults to one of them.

**Verdict: when the agent writes files, use the native format.** `.yml` is
documented here for completeness and for two legitimate uses named at the bottom.

| | Native | `.yml` |
|---|---|---|
| Files | `.paprikarecipe` (gzipped JSON), `.paprikarecipes` (ZIP of those) | plain text |
| Fields carried | **24** | **15** |
| Can update an existing recipe | ✅ via `uid` | ❌ create-only |
| Can carry a photo | ✅ via `photo_data` | ❌ |
| Routable by `open` | ✅ declared UTI | ❌ menu action only |
| Automatable | ✅ implemented, 2 checked clicks | ❌ not implemented, ~5 steps |
| Human-readable | ❌ gzipped binary | ✅ (with a caveat below) |

## The `.yml` format itself

Vendor-documented at <http://www.paprikaapp.com/help/ios/> ("YAML Format"), and
supported on both platforms. Only `name`, `ingredients` and `directions` are
required; field order does not matter.

```
name  servings  source  source_url  prep_time  cook_time  on_favorites
categories  nutritional_info  difficulty  rating  notes  photo
ingredients  directions
```

Several recipes go in one file as a YAML list (`- name: …` per entry).

**Emit JSON, not hand-written YAML.** The vendor warns the format "is quite
strict with regards to whitespace and indentation" — that applies to the block
style in their examples, where a mis-indented line under a `|` block silently
changes the text rather than failing. YAML is a superset of JSON, so
`JSON.stringify` output *is* valid YAML and the whole class of problem
disappears: no indentation, no pipe blocks, no quoting rules. Several recipes
become a JSON array, which is exactly the YAML list their example shows.

### Where to import it

Not reachable via `open` or Finder — the app claims only its own two UTIs, so
nothing associates a `.yml` with Paprika. The menu path supplies the format hint
the UTI would otherwise carry.

| Platform | Path | Observed labels |
|---|---|---|
| macOS | **File → Import** | confirmed working 2026-08-12 |
| iOS | **Settings → Import** | picker `YAML (yml, yaml)`; confirm sheet `Format: YAML (yml)` |

## What `.yml` cannot carry

Computed from the source, not recalled — 24 native fields against 15 YAML ones:

**Native-only (10):** `description`, `total_time`, `image_url`, `photos`,
`created`, `photo_large`, `photo_data`, `uid`, `hash`, `photo_hash`

**YAML-only (1):** `on_favorites` — **and it does not work.**

That one exclusive field was tested and had no effect.

**What was observed, and nothing more:**

- The file contained `"on_favorites": true`.
- That is a **valid YAML boolean**. JSON `true` is a boolean in YAML 1.2 and in
  YAML 1.1 alike; 1.1 additionally accepts `yes`/`no`/`on`/`off`, which is a
  superset and does not make `true` any less correct.
- The import **succeeded**, with every other field byte-identical.
- The recipe did **not** arrive favourited: `ZONFAVORITES = 0`, and the heart in
  the iOS UI is an unfilled outline.

So the parser accepted the value and the importer did not honour it.
**The cause is unknown.** Do not infer one from the vendor's example — the field
is documented and the value we sent was correctly typed.

Three checks would narrow it. All are **open questions, not findings**:

1. Does the importer recognise the key at all? Importing the same recipe written
   `on_favorites: yes` — the vendor's own spelling — would show whether the
   spelling matters or the field is simply ignored.
2. Does macOS behave the same as iOS? Only the iOS result was observed here.
3. Does Paprika's own exporter emit this field, and under this name? It is
   **absent from the JSON interchange format** — `paprika-db.mjs` supplies it
   from the `ZONFAVORITES` column, not from any Paprika-authored file — so the
   documented YAML name has never been seen round-tripping through the app.

The `yaml` command warns when the field is set, so it is not silently assumed to
have applied.

**So in practice `.yml` is a strict subset**: it carries nothing native does not,
and drops ten things native has. Two of those are capabilities, not cosmetics:

- **No `uid` → create-only.** There is no identity field, so the format cannot
  address an existing recipe. Read-edit-write round-trips are impossible; every
  import creates a new recipe. Native updates in place when the `uid` matches.
- **No `photo_data` → no images.** YAML's `photo` is a bare filename, which is
  case E in the photo-behaviour table in `recipe-format.md`: *the filename alone
  preserves nothing.*

## Readability — real, but smaller than it sounds

`.yml` is inspectable where a gzipped `.paprikarecipe` is not, and that is a
genuine advantage. But emitting JSON costs most of the diffability people expect
from "plain text": multi-line fields collapse to one long physical line with
escaped newlines. A representative 14-field test file was **19 physical lines**,
with `ingredients`, `directions` and `notes` at 184, 285 and 393 characters
carrying 8–9 `\n` escapes each. A one-word edit to a direction shows up as one
enormous changed line.

So: better than binary, not line-diffable the way hand-written block YAML would
be — and hand-written block YAML is what the vendor warns against.

## Importing — why native is automatable and `.yml` is not

| | Native | `.yml` |
|---|---|---|
| Routing | `open -a` — **no UI**, the UTI selects the importer | none possible |
| UI steps | **2 clicks** | ~5 (menu → format → file panel → confirm → done) |
| Identifier strings relied on | **3** — sheet text `Import Recipes`, buttons `Import`, `OK` | **~7**, adding `File`, `Import…`, and the format label |
| Weakest element | a sheet that names itself in its own static text | an `NSOpenPanel`, driven by keystrokes (⇧⌘G + path) with no target to verify first |
| Failure mode | unexpected dialog → `--confirm` refuses to click and reports it | wrong format → *"No recipes were imported…"*, discovered only afterwards |

The qualitative point behind the numbers: the native automation is **checked** —
it reads the sheet's own static text and only clicks a button literally named
`Import` on a sheet identifying as `Import Recipes`. A file chooser offers
nothing equivalent to read; you type a path and hope.

Fragility across app updates follows the same shape. Native breaks only if the
vendor renames a sheet or a button — user-visible strings with little reason to
change. `.yml` additionally breaks if the menu is reordered, the panel flow
changes, or the format label is renamed — and that label is a cosmetic entry in a
list of ~20 importers, exactly the kind of string that does change.

> ⚠️ **Caveat, stated rather than buried:** the macOS element tree was **not
> enumerated**. The ~5 steps are inferred from the app's own strings
> (`Choose Format`, `Please choose the file format.`) and from the observed iOS
> flow. Both verified imports were performed by hand. Enumerating the real
> element hierarchy is a read-only check that would firm this up.

## The hybrid that does not work

The obvious idea — author in `.yml`, convert to native for import — fails
structurally, and it is worth recording so nobody re-derives it.

Converting `.yml` → native means **parsing YAML**. Node has no built-in YAML
parser, and this skill ships **zero runtime dependencies** by design so adopters
can run it on plain Node after installing the plugin. Adding a parser breaks that
constraint for every adopter.

The apparent escape hatch is that our own emitted files are JSON-shaped, so
`JSON.parse` reads them without a dependency. But that defeats itself: it only
handles files *we* produced, and for those the YAML step added nothing — it was
JSON the whole way. **The single case where YAML's readability actually pays — a
human hand-writing block YAML with `|` blocks — is exactly the case
`JSON.parse` cannot read.**

## When `.yml` is the right choice

Two legitimate uses. Both accept the same two costs, stated here so they are not
rediscovered the hard way: **no round-trip or update (there is no `uid`), and the
import is manual.**

1. **A human hand-authoring a recipe** in a text editor and importing it
   themselves. This is the case the format exists for, and the only one where its
   readability is the deciding factor.

2. **Conversion scripts from other structured data.** When something already
   holds recipe-shaped data — an export from another app, a spreadsheet, a JSON
   API — emitting YAML is often easier than producing the native gzipped format,
   because the target *is* JSON and needs no gzip, no ZIP and no photo handling.
   A one-way bulk conversion is a reasonable fit.

   The honest tension: such a script is **create-only and cannot be re-run to
   update**. Run it twice and you get duplicates, not corrections, because there
   is no `uid` to match on. If the conversion needs to be idempotent, or to carry
   images, emit native instead — `build`/`bundle` take the same JSON object and
   are one `gzipSync` away.

For everything the agent generates itself, use native.
