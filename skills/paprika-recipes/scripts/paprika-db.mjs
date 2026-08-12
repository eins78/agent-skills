#!/usr/bin/env node
// @ts-check
/**
 * Read Paprika Recipe Manager 3's local library (macOS).
 *
 * Read-only by design: every query runs through `sqlite3 -readonly`, and the
 * snapshot command uses VACUUM INTO, which never writes to the source file.
 *
 * Output is the same flat JSON shape Paprika uses in its own .paprikarecipe
 * interchange files, so `get` output can be fed straight to paprika-recipe.mjs.
 *
 * Zero npm dependencies — shells out to the system `sqlite3`.
 */

import { execFileSync } from 'node:child_process'
import { existsSync, readdirSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

const GROUP_CONTAINER = join(
  homedir(),
  'Library/Group Containers/72KVKW69K8.com.hindsightlabs.paprika.mac.v3/Data',
)

const DB_PATH = process.env.PAPRIKA_DB || join(GROUP_CONTAINER, 'Database/Paprika.sqlite')
const PHOTOS_DIR = process.env.PAPRIKA_PHOTOS || join(GROUP_CONTAINER, 'Photos')

/** Core Data reference date (2001-01-01) as a Unix epoch offset, in seconds. */
const CORE_DATA_EPOCH_OFFSET = 978_307_200

/**
 * Run a query against the Paprika DB and return parsed rows.
 * @param {string} sql
 * @returns {any[]}
 */
function query(sql) {
  if (!existsSync(DB_PATH)) {
    fail(`Paprika database not found at ${DB_PATH}\nIs Paprika Recipe Manager 3 installed?`)
  }
  let out
  try {
    out = execFileSync('sqlite3', ['-readonly', '-json', DB_PATH, sql], {
      encoding: 'utf8',
      maxBuffer: 256 * 1024 * 1024,
    })
  } catch (err) {
    const stderr = /** @type {any} */ (err).stderr || ''
    fail(`sqlite3 failed: ${String(stderr).trim() || /** @type {Error} */ (err).message}`)
  }
  return out.trim() ? JSON.parse(out) : []
}

/**
 * @param {string} message
 * @returns {never}
 */
function fail(message) {
  console.error(`error: ${message}`)
  process.exit(1)
}

/**
 * SQL string literal escaping (single quotes doubled).
 * @param {string} value
 */
const q = (value) => `'${value.replace(/'/g, "''")}'`

/**
 * Core Data timestamp -> "YYYY-MM-DD HH:MM:SS" in local time, the format
 * Paprika writes in its own export files.
 * @param {number | null} seconds
 * @returns {string}
 */
function formatCreated(seconds) {
  if (seconds == null) return ''
  const d = new Date((seconds + CORE_DATA_EPOCH_OFFSET) * 1000)
  const p = (/** @type {number} */ n) => String(n).padStart(2, '0')
  return (
    `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ` +
    `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
  )
}

/**
 * Categories for a set of recipe primary keys.
 * Z_12CATEGORIES is Core Data's generated join table:
 *   Z_12RECIPES -> ZRECIPE.Z_PK, Z_13CATEGORIES -> ZRECIPECATEGORY.Z_PK
 * @param {number[]} pks
 * @returns {Map<number, string[]>}
 */
function categoriesFor(pks) {
  const map = new Map()
  if (pks.length === 0) return map
  const rows = query(`
    SELECT j.Z_12RECIPES AS pk, c.ZNAME AS name
    FROM Z_12CATEGORIES j
    JOIN ZRECIPECATEGORY c ON c.Z_PK = j.Z_13CATEGORIES
    WHERE j.Z_12RECIPES IN (${pks.join(',')})
    ORDER BY c.ZNAME
  `)
  for (const row of rows) {
    if (!map.has(row.pk)) map.set(row.pk, [])
    map.get(row.pk).push(row.name)
  }
  return map
}

/**
 * Resolve a recipe's main photo to an absolute path, if the file is on disk.
 * Layout is Photos/<recipe uid>/<photo filename>.
 * @param {string} uid
 * @param {string} filename
 * @returns {string | null}
 */
function photoPath(uid, filename) {
  if (!uid || !filename) return null
  const path = join(PHOTOS_DIR, uid, filename)
  return existsSync(path) ? path : null
}

const RECIPE_COLUMNS = `
  Z_PK AS pk,
  ZUID AS uid,
  ZNAME AS name,
  ZINGREDIENTS AS ingredients,
  ZDIRECTIONS AS directions,
  ZNOTES AS notes,
  ZDESCRIPTIONTEXT AS description,
  ZSERVINGS AS servings,
  ZPREPTIME AS prep_time,
  ZCOOKTIME AS cook_time,
  ZTOTALTIME AS total_time,
  ZDIFFICULTY AS difficulty,
  ZNUTRITIONALINFO AS nutritional_info,
  ZRATING AS rating,
  ZSOURCE AS source,
  ZSOURCEURL AS source_url,
  ZIMAGEURL AS image_url,
  ZSCALE AS scale,
  ZCREATED AS created_raw,
  ZPHOTO AS photo,
  ZPHOTOLARGE AS photo_large,
  ZPHOTOHASH AS photo_hash,
  ZONFAVORITES AS on_favorites,
  ZINTRASH AS in_trash
`

/**
 * Shape a raw ZRECIPE row into interchange JSON.
 * @param {any} row
 * @param {string[]} categories
 */
function toRecipe(row, categories) {
  return {
    uid: row.uid,
    name: row.name,
    ingredients: row.ingredients || '',
    directions: row.directions || '',
    notes: row.notes || '',
    description: row.description || '',
    servings: row.servings || '',
    prep_time: row.prep_time || '',
    cook_time: row.cook_time || '',
    total_time: row.total_time || '',
    difficulty: row.difficulty || '',
    nutritional_info: row.nutritional_info || '',
    rating: row.rating ?? 0,
    source: row.source || '',
    source_url: row.source_url || '',
    image_url: row.image_url || '',
    scale: row.scale || '',
    created: formatCreated(row.created_raw),
    categories,
    photo: row.photo || '',
    photo_large: row.photo_large || '',
    photo_hash: row.photo_hash || '',
    photo_path: photoPath(row.uid, row.photo),
    on_favorites: Boolean(row.on_favorites),
  }
}

/**
 * WHERE clause fragment excluding trashed recipes unless asked otherwise.
 * @param {boolean} includeTrash
 */
const trashFilter = (includeTrash) => (includeTrash ? '1=1' : 'ZINTRASH = 0')

// ---------------------------------------------------------------- commands

/** @param {string[]} args */
function cmdList(args) {
  const includeTrash = args.includes('--include-trash')
  const full = args.includes('--full')
  const searchIdx = args.indexOf('--search')
  const search = searchIdx >= 0 ? args[searchIdx + 1] : null
  const limitIdx = args.indexOf('--limit')
  const limit = limitIdx >= 0 ? Number(args[limitIdx + 1]) : null

  let where = trashFilter(includeTrash)
  if (search) where += ` AND ZNAME LIKE ${q(`%${search}%`)}`

  const rows = query(`
    SELECT ${RECIPE_COLUMNS} FROM ZRECIPE
    WHERE ${where}
    ORDER BY ZNAME COLLATE NOCASE
    ${limit ? `LIMIT ${limit}` : ''}
  `)
  const cats = categoriesFor(rows.map((r) => r.pk))
  const recipes = rows.map((r) => toRecipe(r, cats.get(r.pk) || []))

  if (full) {
    print(recipes)
    return
  }
  print(
    recipes.map((r) => ({
      uid: r.uid,
      name: r.name,
      categories: r.categories,
      rating: r.rating,
      source: r.source,
    })),
  )
}

/** @param {string[]} args */
function cmdGet(args) {
  const needle = args.find((a) => !a.startsWith('--'))
  if (!needle) fail('usage: paprika-db.mjs get <uid | exact name | name fragment>')

  const rows = query(`
    SELECT ${RECIPE_COLUMNS} FROM ZRECIPE
    WHERE ZINTRASH = 0
      AND (ZUID = ${q(needle)} OR ZNAME = ${q(needle)} OR ZNAME LIKE ${q(`%${needle}%`)})
    ORDER BY (ZUID = ${q(needle)}) DESC, (ZNAME = ${q(needle)}) DESC, ZNAME COLLATE NOCASE
  `)
  if (rows.length === 0) fail(`no recipe matching ${JSON.stringify(needle)}`)
  if (rows.length > 1 && rows[0].uid !== needle && rows[0].name !== needle) {
    console.error(`note: ${rows.length} matches, returning the first:`)
    for (const r of rows.slice(0, 10)) console.error(`  - ${r.name}`)
  }
  const cats = categoriesFor([rows[0].pk])
  print(toRecipe(rows[0], cats.get(rows[0].pk) || []))
}

function cmdCategories() {
  const rows = query(`
    SELECT c.ZNAME AS name, c.ZUID AS uid, COUNT(j.Z_12RECIPES) AS recipe_count
    FROM ZRECIPECATEGORY c
    LEFT JOIN Z_12CATEGORIES j ON j.Z_13CATEGORIES = c.Z_PK
    GROUP BY c.Z_PK
    ORDER BY c.ZNAME COLLATE NOCASE
  `)
  print(rows)
}

function cmdCount() {
  const [row] = query(`
    SELECT
      COUNT(*) AS total,
      SUM(CASE WHEN ZINTRASH = 0 THEN 1 ELSE 0 END) AS active,
      SUM(CASE WHEN ZINTRASH <> 0 THEN 1 ELSE 0 END) AS trashed
    FROM ZRECIPE
  `)
  const sync = query('SELECT ZNAME AS name, ZREVISION AS revision FROM ZSYNCSTATUS ORDER BY ZNAME')
  print({ ...row, sync_revisions: sync })
}

/** @param {string[]} args */
function cmdSnapshot(args) {
  const dest = args.find((a) => !a.startsWith('--'))
  if (!dest) fail('usage: paprika-db.mjs snapshot <destination.sqlite>')
  if (existsSync(dest)) fail(`refusing to overwrite existing file: ${dest}`)

  // VACUUM INTO is the only method verified to produce a snapshot that both
  // includes uncheckpointed WAL content AND can be reopened with -readonly.
  // A plain cp (or .backup) preserves journal_mode=wal, and SQLite then cannot
  // open the copy read-only because it needs to create a -shm sidecar.
  execFileSync('sqlite3', ['-readonly', DB_PATH, `VACUUM INTO ${q(dest)}`], { encoding: 'utf8' })
  const [row] = query(`SELECT COUNT(*) AS n FROM ZRECIPE`)
  console.error(`snapshot written: ${dest} (source has ${row.n} recipe rows)`)
  print({ snapshot: dest, source_recipe_rows: row.n })
}

/** @param {string[]} args */
function cmdPhoto(args) {
  const needle = args.find((a) => !a.startsWith('--'))
  if (!needle) fail('usage: paprika-db.mjs photo <uid | name>')
  const rows = query(`
    SELECT ZUID AS uid, ZNAME AS name, ZPHOTO AS photo, ZPHOTOLARGE AS photo_large
    FROM ZRECIPE
    WHERE ZINTRASH = 0 AND (ZUID = ${q(needle)} OR ZNAME LIKE ${q(`%${needle}%`)})
    LIMIT 1
  `)
  if (rows.length === 0) fail(`no recipe matching ${JSON.stringify(needle)}`)
  const { uid, name, photo, photo_large } = rows[0]
  const dir = join(PHOTOS_DIR, uid)
  print({
    uid,
    name,
    photo_dir: existsSync(dir) ? dir : null,
    photo: photoPath(uid, photo),
    photo_large: photoPath(uid, photo_large),
    files_on_disk: existsSync(dir) ? readdirSync(dir) : [],
  })
}

/** @param {unknown} value */
function print(value) {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`)
}

const USAGE = `paprika-db.mjs — read Paprika Recipe Manager 3's local library (read-only)

  list [--search TERM] [--limit N] [--full] [--include-trash]
                              Recipe summaries; --full emits complete records
  get <uid | name>            One recipe as interchange JSON
  categories                  All categories with recipe counts
  count                       Recipe totals + sync revisions (sync-settled check)
  photo <uid | name>          Resolve a recipe's photo files on disk
  snapshot <dest.sqlite>      Point-in-time copy via VACUUM INTO (never writes source)

Env: PAPRIKA_DB, PAPRIKA_PHOTOS override the default container paths.
Safe to run while Paprika is open. Never writes to the live database.`

const [command, ...args] = process.argv.slice(2)
switch (command) {
  case 'list':
    cmdList(args)
    break
  case 'get':
    cmdGet(args)
    break
  case 'categories':
    cmdCategories()
    break
  case 'count':
    cmdCount()
    break
  case 'photo':
    cmdPhoto(args)
    break
  case 'snapshot':
    cmdSnapshot(args)
    break
  default:
    console.error(USAGE)
    process.exit(command ? 1 : 0)
}
