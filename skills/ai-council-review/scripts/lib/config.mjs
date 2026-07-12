// @ts-check
/**
 * Config resolution for ai-council-review.
 *
 * Precedence (highest wins):
 *   CLI flags > AI_COUNCIL_* env vars > repo .ai-council.json
 *   > ~/.config/ai-council-review/config.json > references/presets.json
 *
 * All layers are plain JSON so resolution needs zero dependencies. The fully
 * resolved config is snapshotted into each run's request-meta.json.
 */

import { readFileSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { homedir } from "node:os";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/** Absolute path to the skill root (parent of scripts/). */
export const SKILL_DIR = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");

/** Error type for bad usage/config/input — mapped to exit code 1 without a stack trace. */
export class UsageError extends Error {}

/**
 * @typedef {object} ResolvedConfig
 * @property {string[]} models   final council roster (slugs)
 * @property {string} preset     preset name the roster came from ("custom" for --models)
 * @property {number} budgetUsd  hard cap; WORST-CASE cost (all members exhausting max_tokens) above this refuses outright, even with --yes
 * @property {number} confirmThresholdUsd  estimate above this requires --yes
 * @property {number} timeoutMs  per-model request timeout
 * @property {number} outputTokensPerModel  working estimate for cost math
 * @property {number} maxOutputTokens  max_tokens per request; worst-case cost basis
 * @property {number} quorum     minimum successful members for a usable run
 * @property {string} baseUrl    OpenRouter API base URL
 * @property {string|undefined} outDir  explicit run-dir override
 * @property {{presets: Record<string, string[]>}} presetsFile parsed presets.json
 */

/** @returns {{presets: Record<string, string[]>, [k: string]: unknown}} */
export function loadPresetsFile() {
  const raw = readFileSync(join(SKILL_DIR, "references", "presets.json"), "utf8");
  return JSON.parse(raw);
}

/**
 * @param {string} file
 * @returns {Record<string, unknown>|undefined}
 */
function readJsonIfExists(file) {
  if (!existsSync(file)) return undefined;
  try {
    return JSON.parse(readFileSync(file, "utf8"));
  } catch (err) {
    throw new UsageError(`Invalid JSON in ${file}: ${/** @type {Error} */ (err).message}`);
  }
}

/** @param {string} cwd @returns {string|undefined} git toplevel, if inside a repo */
export function gitToplevel(cwd) {
  try {
    return execFileSync("git", ["rev-parse", "--show-toplevel"], {
      cwd,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return undefined;
  }
}

/**
 * Merge config layers and resolve the council roster.
 *
 * @param {object} opts
 * @param {Record<string, string|boolean|undefined>} opts.flags parsed CLI flags
 * @param {NodeJS.ProcessEnv} opts.env
 * @param {string} opts.cwd
 * @returns {ResolvedConfig}
 */
export function resolveConfig({ flags, env, cwd }) {
  const presetsFile = loadPresetsFile();

  const xdgConfig = env.XDG_CONFIG_HOME || join(homedir(), ".config");
  const userConfig = readJsonIfExists(join(xdgConfig, "ai-council-review", "config.json")) ?? {};

  const toplevel = gitToplevel(cwd);
  const repoConfigPath = toplevel ? join(toplevel, ".ai-council.json") : join(cwd, ".ai-council.json");
  const repoConfig = readJsonIfExists(repoConfigPath) ?? {};

  /** Pick the first defined value across layers for a scalar setting. */
  const pick = (/** @type {string} */ flagName, /** @type {string} */ envName, /** @type {string} */ key) => {
    if (flags[flagName] !== undefined) return flags[flagName];
    if (env[envName] !== undefined) return env[envName];
    if (repoConfig[key] !== undefined) return repoConfig[key];
    if (userConfig[key] !== undefined) return userConfig[key];
    return presetsFile[key];
  };

  const num = (/** @type {unknown} */ v, /** @type {string} */ what) => {
    const n = Number(v);
    if (!Number.isFinite(n) || n < 0) throw new UsageError(`Invalid ${what}: ${String(v)}`);
    return n;
  };

  // Roster: --models wins over --preset wins over configured/default preset.
  /** @type {string[]} */
  let models;
  /** @type {string} */
  let preset;
  const mergedPresets = {
    ...presetsFile.presets,
    .../** @type {Record<string, string[]>} */ (userConfig.presets ?? {}),
    .../** @type {Record<string, string[]>} */ (repoConfig.presets ?? {}),
  };
  const modelsFlag = flags.models ?? env.AI_COUNCIL_MODELS;
  if (modelsFlag) {
    models = String(modelsFlag).split(",").map((s) => s.trim()).filter(Boolean);
    preset = "custom";
  } else {
    preset = String(pick("preset", "AI_COUNCIL_PRESET", "preset") ?? "default");
    models = mergedPresets[preset];
    if (!models) {
      throw new UsageError(
        `Unknown preset "${preset}". Available: ${Object.keys(mergedPresets).join(", ")}`,
      );
    }
  }
  if (models.length === 0) throw new UsageError("Council roster is empty.");
  const dupes = models.filter((m, i) => models.indexOf(m) !== i);
  if (dupes.length > 0) {
    // Manifest entries and raw/reviews filenames are keyed by slug — a
    // duplicate would silently overwrite its twin and skew quorum counts.
    throw new UsageError(`Duplicate model slug(s) in council roster: ${[...new Set(dupes)].join(", ")}`);
  }

  return {
    models,
    preset,
    budgetUsd: num(pick("budget", "AI_COUNCIL_BUDGET_USD", "budgetUsd"), "budget"),
    confirmThresholdUsd: num(
      pick("confirm-threshold", "AI_COUNCIL_CONFIRM_THRESHOLD_USD", "confirmThresholdUsd"),
      "confirm threshold",
    ),
    timeoutMs: flags.timeout !== undefined
      ? num(flags.timeout, "timeout") * 1000
      : num(pick("timeout-ms", "COUNCIL_TIMEOUT_MS", "timeoutMs"), "timeout"),
    outputTokensPerModel: num(presetsFile.outputTokensPerModel ?? 3000, "outputTokensPerModel"),
    maxOutputTokens: num(pick("max-output-tokens", "AI_COUNCIL_MAX_OUTPUT_TOKENS", "maxOutputTokens") ?? 24000, "maxOutputTokens"),
    quorum: num(pick("quorum", "AI_COUNCIL_QUORUM", "quorum"), "quorum"),
    baseUrl: String(env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1"),
    outDir: flags.out !== undefined ? String(flags.out) : undefined,
    presetsFile: { presets: mergedPresets },
  };
}
