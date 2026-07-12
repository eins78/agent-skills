// @ts-check
/**
 * Outcome archive (see research/council-prior-art.md, P7).
 *
 * Synthesis produces per-finding verified/refuted/uncertain verdicts —
 * labeled ground truth about each member's precision that would otherwise
 * be discarded with the report. Recording it per run builds the only
 * dataset that can ever answer "does agreement correlate with correctness
 * for THIS council?" and support evidence-based roster tuning (the
 * calibration literature's full-panel result needs exactly this data).
 *
 * Archive: one JSON line per run in `<stateRoot>/outcomes.jsonl`, keyed by
 * model slug (labels are run-scoped and reshuffled every run — meaningless
 * across runs). A run can be recorded once; the run dir is the dedupe key.
 */

import { existsSync, readFileSync, appendFileSync, mkdirSync, realpathSync } from "node:fs";
import { join, resolve } from "node:path";

import { UsageError } from "./input.mjs";

/**
 * Normalize a run-dir path for dedupe: trailing slashes, relative paths, and
 * symlinked variants of the same directory must all compare equal, or the
 * same run double-records and skews every aggregate.
 * @param {string} p
 */
function normalizeRunDir(p) {
  const abs = resolve(p);
  try {
    return realpathSync(abs);
  } catch {
    return abs; // recorded dirs may have been deleted since — compare resolved
  }
}

/** @typedef {{verified: number, refuted: number, uncertain: number}} Tally */

const TALLY_KEYS = /** @type {const} */ (["verified", "refuted", "uncertain"]);

/** @param {string} stateDir */
const archivePath = (stateDir) => join(stateDir, "outcomes.jsonl");

/**
 * @param {string} stateDir
 * @returns {Array<{at: string, runDir: string, rubric?: string, models: Record<string, Tally>}>}
 */
function readArchive(stateDir) {
  const path = archivePath(stateDir);
  if (!existsSync(path)) return [];
  /** @type {Array<{at: string, runDir: string, rubric?: string, models: Record<string, Tally>}>} */
  const records = [];
  let skipped = 0;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    if (line.trim() === "") continue;
    // One corrupt line (crash mid-append, hand edit) must not brick the
    // archive — record's dedupe check reads it too, so a throw here would
    // block all future appends as well as `show`.
    try {
      records.push(JSON.parse(line));
    } catch {
      skipped++;
    }
  }
  if (skipped > 0) console.error(`Warning: skipped ${skipped} unparseable line(s) in ${path}.`);
  return records;
}

/**
 * Record one run's synthesis outcomes. Labels are translated to model slugs
 * via the run's roster-key.json; members without a tally (failed members,
 * or reviews that yielded no rankable findings) are simply absent.
 *
 * @param {object} opts
 * @param {string} opts.runDir run directory (contains roster-key.json + manifest.json)
 * @param {string} opts.stateDir the ai-council-review state root
 * @param {Record<string, Tally>} opts.verdictsByLabel e.g. {"member-A": {verified: 2, refuted: 1, uncertain: 0}}
 * @returns {{at: string, runDir: string, rubric?: string, models: Record<string, Tally>}}
 */
export function recordOutcomes({ runDir, stateDir, verdictsByLabel }) {
  runDir = normalizeRunDir(runDir);
  const keyPath = join(runDir, "roster-key.json");
  if (!existsSync(keyPath)) {
    throw new UsageError(`No roster-key.json in ${runDir} — is this a council run directory?`);
  }
  /** @type {Record<string, string>} */
  const rosterKey = JSON.parse(readFileSync(keyPath, "utf8"));
  /** @type {{rubric?: string, finishedAt?: string}} */
  let manifest = {};
  try {
    manifest = JSON.parse(readFileSync(join(runDir, "manifest.json"), "utf8"));
  } catch {
    // tolerated: the archive line just lacks rubric/finishedAt
  }

  if (readArchive(stateDir).some((r) => normalizeRunDir(r.runDir) === runDir)) {
    throw new UsageError(`Run already recorded in outcomes.jsonl: ${runDir}`);
  }

  const entries = Object.entries(verdictsByLabel ?? {});
  if (entries.length === 0) throw new UsageError("No verdicts given — expected {\"member-A\": {verified, refuted, uncertain}, ...}");

  /** @type {Record<string, Tally>} */
  const models = {};
  for (const [label, tally] of entries) {
    const model = rosterKey[label];
    if (!model) {
      throw new UsageError(`Unknown member label "${label}" — roster-key.json knows: ${Object.keys(rosterKey).join(", ")}`);
    }
    for (const k of TALLY_KEYS) {
      const v = tally?.[k];
      if (!Number.isInteger(v) || v < 0) {
        throw new UsageError(`${label}.${k} must be a non-negative integer (got ${String(v)})`);
      }
    }
    models[model] = { verified: tally.verified, refuted: tally.refuted, uncertain: tally.uncertain };
  }

  const record = {
    at: manifest.finishedAt ?? new Date().toISOString(),
    runDir,
    ...(manifest.rubric ? { rubric: manifest.rubric } : {}),
    models,
  };
  mkdirSync(stateDir, { recursive: true, mode: 0o700 });
  // If a crash left the last line unterminated, appending directly would glue
  // this record onto the corrupt fragment and silently lose it — start on a
  // fresh line in that case.
  const path = archivePath(stateDir);
  const needsNewline = existsSync(path) && !readFileSync(path, "utf8").endsWith("\n");
  appendFileSync(path, `${needsNewline ? "\n" : ""}${JSON.stringify(record)}\n`, { mode: 0o600 });
  return record;
}

/**
 * Aggregate the archive per model.
 *
 * @param {string} stateDir
 * @returns {Array<{model: string, runs: number, verified: number, refuted: number, uncertain: number, precision: number | null}>}
 *   precision = verified / (verified + refuted); null until that denominator is non-zero.
 */
export function aggregateOutcomes(stateDir) {
  /** @type {Map<string, {runs: number, verified: number, refuted: number, uncertain: number}>} */
  const byModel = new Map();
  for (const record of readArchive(stateDir)) {
    for (const [model, tally] of Object.entries(record.models ?? {})) {
      const agg = byModel.get(model) ?? { runs: 0, verified: 0, refuted: 0, uncertain: 0 };
      agg.runs += 1;
      for (const k of TALLY_KEYS) agg[k] += Number(tally?.[k] ?? 0);
      byModel.set(model, agg);
    }
  }
  return [...byModel.entries()]
    .map(([model, a]) => ({
      model,
      ...a,
      precision: a.verified + a.refuted > 0 ? a.verified / (a.verified + a.refuted) : null,
    }))
    .sort((a, b) => a.model.localeCompare(b.model));
}
