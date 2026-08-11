#!/usr/bin/env node
// @ts-check
/**
 * Build Paprika interchange files and hand them to the Mac app for import.
 *
 * A .paprikarecipe is gzipped JSON. A .paprikarecipes is a ZIP of those.
 * Both facts were verified against Paprika's own export, not assumed.
 *
 * This is the supported way to create recipes. Never write to Paprika.sqlite
 * directly — ZSTATUS/ZSYNCHASH/ZISSYNCED are bookkeeping the app owns, and a
 * hand-written row risks corrupting cloud sync.
 *
 * Zero npm dependencies — gzip comes from node:zlib, ZIP from the system `zip`.
 */

import { execFileSync } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { basename, join, resolve } from 'node:path'
import { gunzipSync, gzipSync } from 'node:zlib'

const APP_NAME = 'Paprika Recipe Manager 3'

/**
 * Every key Paprika writes in its own export files, with its empty value.
 * Emitting the full set keeps our files shaped like the app's own.
 */
const RECIPE_TEMPLATE = {
  name: '',
  ingredients: '',
  directions: '',
  notes: '',
  description: '',
  servings: '',
  prep_time: '',
  cook_time: '',
  total_time: '',
  difficulty: '',
  nutritional_info: '',
  rating: 0,
  source: '',
  source_url: '',
  image_url: '',
  categories: /** @type {string[]} */ ([]),
  photos: /** @type {unknown[]} */ ([]),
  created: '',
  photo: /** @type {string | null} */ (null),
  photo_large: /** @type {string | null} */ (null),
  photo_data: /** @type {string | null} */ (null),
}

/**
 * Identity fields, dropped unless the caller opts in with --keep-ids.
 *
 * Verified by test: the importer honors a supplied "uid". Importing a file
 * whose uid matches an existing recipe UPDATES that recipe in place — the app
 * reports "1 recipes updated", the row count does not change, and the supplied
 * fields replace the stored ones. That makes --keep-ids the way to edit a
 * recipe programmatically, and also the way to clobber one by accident.
 *
 * Two related behaviours, both observed:
 *   - "created" is ignored on insert (the app stamps its own time) and
 *     preserved on update.
 *   - categories MERGE on update rather than replace, so an import can add a
 *     category to a recipe but cannot remove one.
 */
const APP_ASSIGNED_FIELDS = ['uid', 'hash', 'photo_hash']

/** Fields carried by paprika-db.mjs output that are not part of the format. */
const DB_ONLY_FIELDS = ['photo_path', 'on_favorites', 'scale', 'pk', 'in_trash']

/**
 * @param {string} message
 * @returns {never}
 */
function fail(message) {
  console.error(`error: ${message}`)
  process.exit(1)
}

/** @returns {string} local time as "YYYY-MM-DD HH:MM:SS" */
function nowStamp() {
  const d = new Date()
  const p = (/** @type {number} */ n) => String(n).padStart(2, '0')
  return (
    `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ` +
    `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
  )
}

/**
 * Read recipe JSON from a file path, or from stdin when given "-".
 * @param {string} source
 * @returns {any}
 */
function readJson(source) {
  const raw =
    source === '-' ? readFileSync(0, 'utf8') : readFileSync(resolve(source), 'utf8')
  try {
    return JSON.parse(raw)
  } catch (err) {
    fail(`${source}: not valid JSON — ${/** @type {Error} */ (err).message}`)
  }
}

/**
 * Validate and normalize one recipe into the exact interchange shape.
 * @param {any} input
 * @param {{ keepIds?: boolean, photo?: string, noPhoto?: boolean }} [options]
 */
function normalize(input, options = {}) {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    fail('recipe must be a JSON object')
  }
  if (!input.name || typeof input.name !== 'string' || !input.name.trim()) {
    fail('recipe requires a non-empty "name"')
  }
  if (!input.ingredients && !input.directions) {
    console.error(`warning: "${input.name}" has neither ingredients nor directions`)
  }

  /** @type {Record<string, unknown>} */
  const recipe = { ...RECIPE_TEMPLATE }
  for (const key of Object.keys(RECIPE_TEMPLATE)) {
    if (input[key] !== undefined && input[key] !== null) recipe[key] = input[key]
  }

  if (options.keepIds) {
    for (const key of APP_ASSIGNED_FIELDS) {
      if (input[key]) recipe[key] = input[key]
    }
  }

  const unknown = Object.keys(input).filter(
    (k) =>
      !(k in RECIPE_TEMPLATE) &&
      !APP_ASSIGNED_FIELDS.includes(k) &&
      !DB_ONLY_FIELDS.includes(k),
  )
  if (unknown.length > 0) {
    console.error(`warning: dropping unrecognized field(s): ${unknown.join(', ')}`)
  }

  // Cosmetic only: the importer ignores "created" and stamps its own time.
  // Emitted anyway so our files match the shape of Paprika's own exports.
  if (!recipe.created) recipe.created = nowStamp()
  recipe.rating = Number(recipe.rating) || 0
  if (!Array.isArray(recipe.categories)) fail('"categories" must be an array of names')
  recipe.categories = recipe.categories.map(String)

  applyPhoto(recipe, input, options)

  // "name" is guaranteed non-empty by the check at the top of this function.
  return /** @type {Record<string, unknown> & { name: string }} */ (recipe)
}

/**
 * Set the three photo fields consistently.
 *
 * Three behaviours measured against Paprika 3.8.4 dictate this logic:
 *
 *   1. photo_data with a null/absent "photo" filename TERMINATES the app
 *      mid-import — no crash report, no recipe written. The filename is not
 *      decoration; it is where the decoded JPEG gets written on disk.
 *   2. An import REPLACES photo state rather than merging it. A file without
 *      photo_data clears the recipe's photo and deletes the JPEG from disk,
 *      so a round-trip edit that simply omits the photo destroys it.
 *   3. photo_hash is computed by the app (uppercase SHA-256 of the JPEG);
 *      callers never need to supply it.
 *
 * Hence the default: carry the existing photo forward (paprika-db.mjs `get`
 * hands us its path in photo_path), and only drop it when asked explicitly.
 *
 * @param {Record<string, unknown>} recipe
 * @param {any} input
 * @param {{ photo?: string, noPhoto?: boolean }} options
 */
function applyPhoto(recipe, input, options) {
  const clear = () => {
    recipe.photo = null
    recipe.photo_large = null
    recipe.photo_data = null
  }

  if (options.noPhoto) {
    if (input.photo) {
      console.error('warning: --no-photo — importing this file REMOVES the existing photo')
    }
    clear()
    return
  }

  /** @type {string | null} */
  let imagePath = null
  if (options.photo) {
    imagePath = resolve(options.photo)
    if (!existsSync(imagePath)) fail(`photo not found: ${imagePath}`)
  } else if (typeof input.photo_path === 'string' && existsSync(input.photo_path)) {
    imagePath = input.photo_path
  } else if (typeof recipe.photo_data === 'string' && recipe.photo_data) {
    // Caller supplied base64 by hand. Guarantee a filename so (1) can't happen.
    if (typeof recipe.photo !== 'string' || !recipe.photo) {
      recipe.photo = `${randomUUID().toUpperCase()}.jpg`
    }
    recipe.photo_large = null
    return
  }

  if (!imagePath) {
    // A gate, not a warning. Building this file anyway would produce something
    // whose import silently deletes the photo, and a stderr line is exactly the
    // kind of advice that gets scrolled past. The common way to land here is a
    // recipe whose photo has not been downloaded from Paprika Cloud yet — most
    // likely right after a fresh install, when the library is still syncing.
    if (input.photo) {
      fail(
        `"${input.name}" refers to photo ${input.photo}, but no local JPEG was found ` +
          `(paprika-db.mjs reported photo_path: null).\n` +
          `  Importing a file built from this would DELETE the recipe's photo.\n` +
          `  Open the recipe in ${APP_NAME} so the photo downloads, then retry —\n` +
          `  or pass --no-photo if removing the photo is what you actually want.`,
      )
    }
    clear()
    return
  }

  recipe.photo_data = readFileSync(imagePath).toString('base64')
  // Reuse the stored filename on a round-trip; mint one for a new image,
  // because the app needs a name to write the JPEG under.
  recipe.photo =
    !options.photo && typeof input.photo === 'string' && input.photo
      ? input.photo
      : `${randomUUID().toUpperCase()}.jpg`
  recipe.photo_large = null
  // A carried-over hash would describe the old image; the app recomputes it.
  if (options.photo) delete recipe.photo_hash
}

/**
 * Filesystem-safe filename derived from a recipe name, matching the naming
 * Paprika uses in its own exports.
 * @param {string} name
 */
const safeName = (name) => name.replace(/[/\\:]/g, '-').trim() || 'recipe'

/**
 * Split argv into flags and positionals.
 *
 * Value-taking options must be declared, otherwise their value looks like a
 * positional — which silently made `bundle a.json --out x.paprikarecipes` try
 * to read the output path as an input recipe.
 *
 * @param {string[]} args
 * @param {string[]} valueFlags options that consume the following argument
 * @returns {{ positional: string[], flags: Record<string, string | true> }}
 */
function parseArgs(args, valueFlags = []) {
  /** @type {string[]} */
  const positional = []
  /** @type {Record<string, string | true>} */
  const flags = {}
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i]
    if (!arg.startsWith('--')) {
      positional.push(arg)
      continue
    }
    const name = arg.slice(2)
    if (valueFlags.includes(name)) {
      const value = args[i + 1]
      if (value === undefined) fail(`--${name} needs a value`)
      flags[name] = value
      i += 1
    } else {
      flags[name] = true
    }
  }
  return { positional, flags }
}

/** @param {string[]} args */
function cmdBuild(args) {
  const { positional, flags } = parseArgs(args, ['out', 'photo'])
  const source = positional[0]
  if (!source) {
    fail(
      'usage: paprika-recipe.mjs build <recipe.json | -> [--out FILE] [--photo IMAGE] [--no-photo]',
    )
  }

  const recipe = normalize(readJson(source), {
    keepIds: flags['keep-ids'] === true,
    photo: typeof flags.photo === 'string' ? flags.photo : undefined,
    noPhoto: flags['no-photo'] === true,
  })

  const out =
    typeof flags.out === 'string'
      ? resolve(flags.out)
      : join(process.cwd(), `${safeName(recipe.name)}.paprikarecipe`)

  writeFileSync(out, gzipSync(Buffer.from(JSON.stringify(recipe), 'utf8')))
  console.error(`built: ${out}`)
  process.stdout.write(`${out}\n`)
}

/** @param {string[]} args */
function cmdBundle(args) {
  const { positional: sources, flags } = parseArgs(args, ['out'])
  if (sources.length === 0) {
    fail('usage: paprika-recipe.mjs bundle <a.json> [b.json ...] --out FILE.paprikarecipes')
  }
  if (typeof flags.out !== 'string') fail('bundle requires --out FILE.paprikarecipes')
  const out = resolve(flags.out)

  const staging = mkdtempSync(join(tmpdir(), 'paprika-bundle-'))
  try {
    const entries = sources.map((source) => {
      const recipe = normalize(readJson(source), {
        keepIds: flags['keep-ids'] === true,
        noPhoto: flags['no-photo'] === true,
      })
      const entry = `${safeName(recipe.name)}.paprikarecipe`
      writeFileSync(join(staging, entry), gzipSync(Buffer.from(JSON.stringify(recipe), 'utf8')))
      return entry
    })
    // System `zip` rather than a hand-rolled writer: it is present on macOS and
    // keeps this script dependency-free. -j flattens, -X drops extra attributes.
    execFileSync('zip', ['-q', '-j', '-X', out, ...entries.map((e) => join(staging, e))])
    console.error(`built: ${out} (${entries.length} recipes)`)
    process.stdout.write(`${out}\n`)
  } finally {
    rmSync(staging, { recursive: true, force: true })
  }
}

/**
 * Run an AppleScript snippet, returning its output.
 * @param {string} script
 * @returns {string}
 */
function osascript(script) {
  return execFileSync('osascript', ['-e', script], { encoding: 'utf8', timeout: 20_000 }).trim()
}

/**
 * Click through the two import sheets Paprika shows.
 *
 * Deliberately checked rather than blind: the confirm sheet is only clicked
 * when its own text says "Import Recipes", and only via the button literally
 * named "Import". Anything else is left alone for a human to look at.
 *
 * Requires Automation permission for the controlling terminal (System Settings
 * -> Privacy & Security -> Automation). macOS asks once, and the user must approve
 * it himself; until then osascript fails with error -1743.
 */
function confirmImportSheet() {
  const readSheet = `tell application "System Events" to tell process "${APP_NAME}"
    if (count of windows) is 0 then return "no-window"
    if (count of sheets of window 1) is 0 then return "no-sheet"
    set out to ""
    repeat with t in (every static text of sheet 1 of window 1)
      set out to out & (value of t) & " ~ "
    end repeat
    return out
  end tell`

  for (let attempt = 0; attempt < 15; attempt += 1) {
    let text
    try {
      text = osascript(readSheet)
    } catch (err) {
      const message = String(/** @type {any} */ (err).stderr || '')
      if (message.includes('-1743')) {
        fail(
          'Automation permission denied. Approve the macOS dialog for this terminal\n' +
            '(System Settings -> Privacy & Security -> Automation), or click Import by hand.',
        )
      }
      fail(`could not read Paprika's dialog: ${message.trim()}`)
    }

    if (text.includes('Import Recipes')) {
      osascript(
        `tell application "System Events" to tell process "${APP_NAME}" to click button "Import" of sheet 1 of window 1`,
      )
      console.error('confirmed: clicked Import')
    } else if (text.includes('Import Complete') || text.includes('Import Failed')) {
      console.error(`app reported: ${text.replace(/ ~ $/, '')}`)
      osascript(
        `tell application "System Events" to tell process "${APP_NAME}" to click button "OK" of sheet 1 of window 1`,
      )
      return
    } else if (text === 'no-sheet' || text === 'no-window') {
      // The sheet may not be up yet; keep waiting.
    } else {
      console.error(`unexpected dialog, leaving it alone: ${text}`)
      return
    }
    execFileSync('sleep', ['1'])
  }
  console.error('warning: gave up waiting on the import dialogs — check the app')
}

/** @param {string[]} args */
function cmdImport(args) {
  const file = args.find((a) => !a.startsWith('--'))
  if (!file) fail('usage: paprika-recipe.mjs import <file.paprikarecipe[s]> [--confirm]')
  const path = resolve(file)
  if (!existsSync(path)) fail(`file not found: ${path}`)

  execFileSync('open', ['-a', APP_NAME, path])
  console.error(`handed to ${APP_NAME}: ${path}`)

  if (args.includes('--confirm')) {
    confirmImportSheet()
  } else {
    console.error(
      'Paprika now shows a modal "Import Recipes" sheet. Click Import, or re-run with --confirm.',
    )
  }
  console.error('Verify with: paprika-db.mjs list --search "<recipe name>"')
}

/** @param {string[]} args */
function cmdInspect(args) {
  const file = args.find((a) => !a.startsWith('--'))
  if (!file) fail('usage: paprika-recipe.mjs inspect <file.paprikarecipe[s]> [--raw]')
  const path = resolve(file)
  if (!existsSync(path)) fail(`file not found: ${path}`)
  // An embedded photo is ~55k base64 characters. Summarize it by default so
  // inspecting a file stays readable; --raw is there for the rare real need.
  const raw = args.includes('--raw')

  if (path.endsWith('.paprikarecipes')) {
    const names = execFileSync('unzip', ['-Z1', path], { encoding: 'utf8' })
      .split('\n')
      .filter(Boolean)
    const recipes = names.map((name) => {
      const gz = execFileSync('unzip', ['-p', path, name], {
        encoding: 'buffer',
        maxBuffer: 256 * 1024 * 1024,
      })
      const parsed = JSON.parse(gunzipSync(gz).toString('utf8'))
      return raw ? parsed : summarize(parsed)
    })
    print({ entries: names.length, recipes })
    return
  }
  const parsed = JSON.parse(gunzipSync(readFileSync(path)).toString('utf8'))
  print(raw ? parsed : summarize(parsed))
}

/**
 * Trim base64 photo payloads so inspect output stays readable.
 * @param {any} recipe
 */
function summarize(recipe) {
  const { photo_data, ...rest } = recipe
  return { ...rest, photo_data: photo_data ? `<${photo_data.length} base64 chars>` : null }
}

/** @param {unknown} value */
function print(value) {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`)
}

const USAGE = `paprika-recipe.mjs — create Paprika recipes via the app's own import format

  build <recipe.json | -> [--out FILE] [--photo IMAGE] [--no-photo] [--keep-ids]
                          Write one .paprikarecipe (gzipped JSON)
  bundle <a.json> [b.json ...] --out FILE.paprikarecipes
                          Write a ZIP of several recipes
  import <file>           Hand the file to ${APP_NAME}
  inspect <file> [--raw]  Read a .paprikarecipe or .paprikarecipes back as JSON
                          (embedded photos summarized unless --raw)

Import is not headless: the app shows a modal sheet ("Import Recipes" /
Cancel / Import) and then a completion sheet. See SKILL.md for the confirm step.

"uid", "hash" and "photo_hash" are dropped unless --keep-ids. Importing a file
whose uid matches an existing recipe UPDATES that recipe in place instead of
adding one — the way to edit a recipe, and the way to clobber one by accident.
"created" is ignored on insert (the app stamps its own time) and kept on update.

Photos are REPLACED by an import, never merged: a file with no embedded image
clears the recipe's photo and deletes the JPEG from disk. So build re-embeds
the current photo automatically when the input carries "photo_path" (which
paprika-db.mjs get provides). --photo IMAGE swaps in a different image;
--no-photo deliberately removes the existing one.

Required field: name. Everything else is optional and defaults to empty.
Ingredients and directions are newline-delimited plain text, one item per line.
Category names that don't exist yet are created by the import.`

const [command, ...args] = process.argv.slice(2)
switch (command) {
  case 'build':
    cmdBuild(args)
    break
  case 'bundle':
    cmdBundle(args)
    break
  case 'import':
    cmdImport(args)
    break
  case 'inspect':
    cmdInspect(args)
    break
  default:
    console.error(USAGE)
    process.exit(command ? 1 : 0)
}
