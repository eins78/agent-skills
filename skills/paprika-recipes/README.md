# paprika-recipes — Development Documentation

## Purpose

Read and create recipes in **Paprika Recipe Manager 3** on macOS, so an agent
can turn any text source — a web page the clipper failed on, prose, a PDF, a
photo of a cookbook page — into a real recipe in the user's library.

**Tier: publishable.** The container path, the Core Data schema and the
`.paprikarecipe` / `.paprikarecipes` interchange format are properties of
Paprika 3 itself, identical for every Mac App Store user. Nothing in the skill
is account-specific and no credential is involved.

## Origin

Written 2026-08 against a live Paprika 3.8.4 install and a real 219-recipe
export. There is no vendor API documentation behind any of it — every claim in
`references/recipe-format.md` was read off a running app, a real database or a
real export file, and anything that could not be verified is marked as such.

## Scripts

Both are `.mjs` + JSDoc + `// @ts-check` with **zero npm runtime dependencies**:
adopters install the plugin and run the script on plain Node, with no toolchain
of their own.

### `scripts/paprika-db.mjs` — read

Shells out to the system `sqlite3` (`-readonly -json`) rather than taking a
native SQLite binding as a dependency. Subcommands: `list`, `get`,
`categories`, `count`, `photo`, `snapshot`.

Env overrides: `PAPRIKA_DB`, `PAPRIKA_PHOTOS` — useful for pointing at a
snapshot instead of the live database.

### `scripts/paprika-recipe.mjs` — create

Gzip via Node's built-in `node:zlib`; ZIP by shelling out to the system `zip`
rather than hand-rolling a ZIP writer. Subcommands: `build`, `bundle`, `yaml`,
`import`, `inspect`.

`yaml` emits the vendor's `.yml` import format **as JSON**, since YAML is a
superset of JSON — which sidesteps the vendor's own warning that the format "is
quite strict with regards to whitespace and indentation". It filters to the 15
documented YAML fields and warns about anything dropped.

**It is not the default.** Anything the skill generates should use `build` /
`bundle`: the native format carries 24 fields to `.yml`'s 15, is the only one
that can update a recipe or carry a photo, and is the only one that can be
imported without a human clicking. `yaml` is kept for hand-authoring and for
one-way conversion scripts from other structured data. Full comparison and
evidence: `references/import-formats.md`.

`import --confirm` drives the app's modal sheets via System Events. It reads
the sheet's static text first and only clicks a button named `Import` on a
sheet that identifies itself as `Import Recipes` — an unexpected dialog is left
alone rather than clicked blind.

## Dependencies

- Node 18+ (uses `node:zlib`, `node:fs`, `node:crypto`, `node:child_process`)
- System `sqlite3`, `zip`, `unzip`, `open`, `osascript` — all stock macOS
- Paprika Recipe Manager 3 installed
- macOS **Automation** permission for the controlling terminal, for `--confirm`
  only. The user must approve the system dialog; failure surfaces as `-1743`.

No npm packages at runtime. `typescript` and `@types/node` are devDependencies
of this repo, used only for type checking.

## Testing

Type check (no build step, no emit):

```bash
pnpm exec tsc -p skills/paprika-recipes
```

Read path, non-destructive:

```bash
S=skills/paprika-recipes/scripts
node $S/paprika-db.mjs count
node $S/paprika-db.mjs list | jq -r '.[0].name'
node $S/paprika-db.mjs get "<some recipe>" | jq '.name, .categories, .photo_path'
node $S/paprika-db.mjs get "<some recipe>" > /tmp/r.json
node $S/paprika-recipe.mjs build /tmp/r.json --out /tmp/r.paprikarecipe
node $S/paprika-recipe.mjs inspect /tmp/r.paprikarecipe | jq 'keys'
```

**Do not import `/tmp/r.paprikarecipe`.** `build` without `--keep-ids` strips
the uid, so importing it would add a *duplicate* recipe rather than update the
existing one. It exists here only to check the round-trip shape.

Write path — **touches the real library**. Gate it:

1. Confirm sync has settled: `paprika-db.mjs count` returns identical totals
   *and* `sync_revisions` twice, ≥60 s apart.
2. `paprika-db.mjs snapshot /tmp/backup.sqlite` first.
3. Use one obviously-named throwaway recipe (`ZZZ Test …`), then tell the user
   it exists. Never bulk-write while testing.
4. Do not invent a category name for a test. An unknown name creates a real
   category that survives deleting the recipe and syncs to every device, so the
   user has to clean it up by hand. (This skill's own testing created a
   `ZZZ Test Category` before that was understood.)

Note that an import is **not local** — it publishes to Paprika Cloud and on to
the user's other devices, verified on iOS. There is no dry run.

## Design decisions

- **Import over direct DB writes.** `ZSTATUS`/`ZISSYNCED`/`ZSYNCHASH` are sync
  bookkeeping the app owns; a hand-written row risks corrupting the library.
  The import path is supported, verified, and no slower.
- **Cloud API deliberately excluded.** `POST /api/v1/account/login/` and
  `GET /api/v1/sync/recipes/` are real (the latter returns 401 unauthenticated),
  with auth being account email + password → token. It was left out because the
  local app covers both read and create, and including it would mean handling
  the user's Paprika password. No credential is requested, stored or used.
- **`sqlite3 -readonly` rather than opening the DB read-write.** Reading works
  fine with Paprika running; there is no reason to hold a writable handle.
- **`VACUUM INTO` for snapshots.** Measured: it is the only method producing a
  copy that both captures WAL content and reopens with `-readonly`. `.backup`
  and `cp` keep `journal_mode=wal`, and SQLite then refuses a read-only open
  because it cannot create the `-shm` sidecar.
- **`get` emits interchange JSON, not raw columns.** One vocabulary for reading
  and writing means round-tripping and editing need no translation layer.
- **Category names, not ids, in the format** — matching what Paprika's own
  exports do. Consequence documented in SKILL.md: unknown names get created.
- **Checked GUI automation, not blind clicking.** `--confirm` verifies the
  dialog's own text before acting.
- **`build` carries the existing photo forward by default.** Imports replace
  photo state rather than merging it, so the obvious round-trip (`get` → edit →
  `build --keep-ids` → `import`) would otherwise delete the recipe's photo and
  its file on disk. Removing a photo is therefore explicit (`--no-photo`), and
  the image travels via the input's `photo_path` so no base64 ever passes
  through the caller's JSON.
- **That protection is a gate, not a warning** (per this repo's "Gates Over
  Rules"). When a recipe names a photo whose JPEG is not on disk — the state of
  a library still syncing photos down from Paprika Cloud — `build` exits
  non-zero and writes nothing, instead of emitting a file that quietly destroys
  the photo on import. `--no-photo` is the explicit way through.
- **`inspect` summarizes `photo_data`.** An embedded photo is ~55k base64
  characters; dumping that into an agent's context is pure noise. `--raw` is
  the escape hatch.
- **Nothing here deletes user data.** The single `rmSync` in the code removes
  the script's own `mkdtempSync` staging directory after `bundle` writes its
  ZIP. No documented procedure in SKILL.md or README.md deletes anything.

## Composition

- `pandoc` — converting a PDF or DOCX source to text before structuring it
- `apple-notes` — reading a recipe stored in a note, as one example of the
  "any text source" path. The skill itself is not Notes-aware by design.

## Structure

```
paprika-recipes/
├── SKILL.md                     # user-facing instructions
├── README.md                    # this file
├── tsconfig.json                # dev-time type checking only
├── scripts/
│   ├── paprika-db.mjs           # read the local library
│   └── paprika-recipe.mjs       # build + import recipes
└── references/
    ├── recipe-format.md         # field reference, schema, verified behaviour
    └── import-formats.md        # native vs .yml — comparison, evidence, verdict
```

## Known gaps / future improvements

- **`.yml` import is not automated, deliberately.** The app declares only its own
  two UTIs, so `open` cannot route a `.yml`; it needs the Import screen and its
  format picker — roughly 5 UI steps against native's 2, including an
  `NSOpenPanel` that has to be driven by keystrokes with nothing to verify first.
  Judged not worth building for a strict subset of a format we can already import
  in two checked clicks. Reasoning, measurements and the unenumerated-element-tree
  caveat: `references/import-formats.md`.

- **`on_favorites` is documented for `.yml` but is not honoured on import.**
  Observed: `"on_favorites": true` — a valid YAML boolean — imported cleanly with
  every other field byte-identical, and the recipe was not favourited
  (`ZONFAVORITES = 0`). The parser accepted it; the importer did not act on it.
  **Cause unknown**, deliberately not guessed at. Three open checks that would
  narrow it are listed in `references/import-formats.md`. The command warns.

- **`photos` array structure is unknown.** Empty in every export entry
  inspected, and `ZRECIPEPHOTO` was likewise empty locally, so multi-photo
  recipes are untested. Single photos work via `photo_data` (verified end to
  end).
- **Text-field clearing is untested.** Whether an explicitly empty string clears
  an existing value on update was not determined. (Photo clearing *is* known —
  it happens by default.)
- **Paprika can be terminated by a malformed file.** `photo_data` with a null
  `photo` filename ends the process mid-import. macOS *does* write a crash
  report — an uncaught exception on an `NSManagedObjectContext` queue — but
  there is no in-app error, so it still presents as "the import did nothing". The
  script cannot emit that shape, but a hand-written file can. Worth reporting
  to Hindsight Labs; it is an unhandled nil, not a data problem.
- **Only JPEG photos are tested.** `--photo` base64s the bytes it is given and
  names the file `.jpg`. Convert first (`sips -s format jpeg in.png --out
  out.jpg`) rather than handing it a PNG.
- **Groceries, meals, menus and the pantry are out of scope.** Their tables
  (`ZGROCERYLIST`, `ZMEAL`, `ZMENU`, `ZPANTRYITEM`) are right there and could
  be added to `paprika-db.mjs` the same way.
- **Cloud API, if a headless path is ever needed.** The one thing local
  scripting cannot do is create a recipe from a host that isn't the Mac running
  Paprika, or with the screen locked (System Events needs a GUI session).
  Endpoints and auth shape are recorded above. If it is ever built, the
  credential belongs in the macOS keychain — never in a file.
- **Core Data join-table names (`Z_12CATEGORIES`) could change** across Paprika
  releases. If categories come back empty after an app update, check `.schema`.
- **No deletion.** Deliberate: nothing in this skill removes a recipe.
