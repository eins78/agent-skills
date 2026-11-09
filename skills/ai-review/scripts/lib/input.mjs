// @ts-check
/**
 * Input gathering: what gets reviewed, plus auto-context.
 * Ports the proven UX of ai-review's review.sh (diff modes, file mode,
 * auto-context assembly) and adds --pr via the gh CLI.
 */

import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join, relative, resolve } from "node:path";
import { gitToplevel, UsageError } from "./config.mjs";
import { estimateTokens } from "./budget.mjs";

export { UsageError };

const CONTEXT_FILE_CAP_BYTES = 10 * 1024;
const TREE_MAX_ENTRIES = 200;

/** Path patterns dropped first when the payload exceeds the council's context. */
const GENERATED_PATTERNS = [
  /(^|\/)pnpm-lock\.yaml$/, /\.lock$/, /(^|\/)package-lock\.json$/,
  /(^|\/)dist\//, /(^|\/)build\//, /\.min\.(js|css)$/, /\.snap$/, /(^|\/)node_modules\//,
];

/**
 * @param {string} cmd
 * @param {string[]} args
 * @param {string} cwd
 */
function run(cmd, args, cwd) {
  return execFileSync(cmd, args, {
    cwd,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
    stdio: ["ignore", "pipe", "pipe"],
  });
}

/**
 * @typedef {object} GatherResult
 * @property {string} code        the material under review
 * @property {string} description human-readable description of what was gathered
 * @property {string} context     auto-context block ("" when disabled)
 */

/**
 * @param {object} opts
 * @param {Record<string, string|boolean|undefined>} opts.flags
 * @param {string[]} opts.positionals file paths, when in file mode
 * @param {string} opts.cwd
 * @param {NodeJS.ProcessEnv} opts.env
 * @returns {GatherResult}
 */
export function gatherInput({ flags, positionals, cwd, env }) {
  /** @type {string} */
  let code;
  /** @type {string} */
  let description;
  /** Files that ARE the review subject — excluded from auto-context. */
  /** @type {string[]} */
  const reviewedPaths = [];

  if (flags.pr !== undefined) {
    const pr = String(flags.pr);
    let meta = "";
    try {
      const view = JSON.parse(run("gh", ["pr", "view", pr, "--json", "title,body,baseRefName"], cwd));
      meta = `PR #${pr}: ${view.title}\nBase: ${view.baseRefName}\n\n${view.body ?? ""}`.trim();
      code = `${meta}\n\n--- PR DIFF ---\n${run("gh", ["pr", "diff", pr], cwd)}`;
    } catch (err) {
      throw new UsageError(
        `Could not gather PR #${pr} via the gh CLI (${/** @type {Error} */ (err).message.split("\n")[0]}). ` +
          `Fetch the diff yourself and re-run with --input-file <path>.`,
      );
    }
    description = `PR #${pr} (diff + title/body)`;
  } else if (flags["input-file"] !== undefined) {
    const file = String(flags["input-file"]);
    code = file === "-" ? readFileSync(0, "utf8") : readFileSync(file, "utf8");
    if (file !== "-") reviewedPaths.push(resolve(cwd, file));
    description = `input file ${file}`;
  } else if (positionals.length > 0) {
    const repoRoot = gitToplevel(cwd) ?? cwd;
    for (const f of positionals) reviewedPaths.push(resolve(cwd, f));
    code = positionals
      .map((f) => {
        const abs = resolve(cwd, f);
        const rel = relative(repoRoot, abs);
        return `--- FILE: ${rel} ---\n${readFileSync(abs, "utf8")}`;
      })
      .join("\n\n");
    description = `${positionals.length} file(s): ${positionals.join(", ")}`;
  } else if (flags.staged) {
    code = run("git", ["diff", "--cached"], cwd);
    description = "staged changes (git diff --cached)";
  } else if (flags.branch !== undefined) {
    const base = typeof flags.branch === "string" && flags.branch !== ""
      ? flags.branch
      : env.REVIEW_BASE_BRANCH || "main";
    code = run("git", ["diff", `${base}...HEAD`], cwd);
    description = `branch diff (git diff ${base}...HEAD)`;
  } else {
    code = run("git", ["diff"], cwd);
    description = "unstaged changes (git diff)";
  }

  if (code.trim() === "") {
    throw new UsageError(`Nothing to review: ${description} is empty.`);
  }

  const context = flags["no-context"] ? "" : buildAutoContext({ flags, cwd, reviewedPaths });
  return { code, description, context };
}

/**
 * Auto-context: implementation plan + project instructions + file tree.
 * Mirrors review.sh's ordering and caps.
 * @param {object} opts
 * @param {Record<string, string|boolean|undefined>} opts.flags
 * @param {string} opts.cwd
 * @param {string[]} [opts.reviewedPaths] absolute paths under review — never duplicated into context
 */
export function buildAutoContext({ flags, cwd, reviewedPaths = [] }) {
  const repoRoot = gitToplevel(cwd) ?? cwd;
  /** @type {string[]} */
  const parts = [];

  let planPath = findPlanFile(flags.plan, repoRoot);
  // Reviewing the plan itself (--rubric plan on the newest plan file) must
  // not re-include it as context — that silently doubles the payload.
  if (planPath && reviewedPaths.includes(resolve(cwd, planPath))) planPath = undefined;
  if (planPath) {
    parts.push(`--- IMPLEMENTATION PLAN (${relative(repoRoot, planPath) || planPath}) ---\n${capRead(planPath)}`);
  }

  for (const name of ["CLAUDE.md", "GEMINI.md", "AGENTS.md"]) {
    const p = join(repoRoot, name);
    if (existsSync(p)) {
      parts.push(`--- PROJECT INSTRUCTIONS (${name}) ---\n${capRead(p)}`);
      break;
    }
  }

  const tree = fileTree(repoRoot);
  if (tree) parts.push(`--- FILE TREE (depth 3, max ${TREE_MAX_ENTRIES}) ---\n${tree}`);

  if (typeof flags.context === "string" && flags.context.trim() !== "") {
    parts.push(`--- ADDITIONAL CONTEXT ---\n${flags.context}`);
  }
  return parts.join("\n\n");
}

/**
 * @param {string|boolean|undefined} planFlag
 * @param {string} repoRoot
 * @returns {string|undefined}
 */
function findPlanFile(planFlag, repoRoot) {
  if (typeof planFlag === "string" && planFlag !== "") {
    if (!existsSync(planFlag)) throw new UsageError(`Plan file not found: ${planFlag}`);
    return planFlag;
  }
  const rootPlan = join(repoRoot, "PLAN.md");
  if (existsSync(rootPlan)) return rootPlan;
  const plansDir = join(repoRoot, ".claude", "plans");
  if (existsSync(plansDir)) {
    const newest = readdirSync(plansDir)
      .filter((f) => f.endsWith(".md"))
      .map((f) => join(plansDir, f))
      .sort((a, b) => statSync(b).mtimeMs - statSync(a).mtimeMs)[0];
    if (newest) return newest;
  }
  return undefined;
}

/** @param {string} file */
function capRead(file) {
  const text = readFileSync(file, "utf8");
  return text.length > CONTEXT_FILE_CAP_BYTES
    ? `${text.slice(0, CONTEXT_FILE_CAP_BYTES)}\n[... truncated at 10KB]`
    : text;
}

/** @param {string} repoRoot */
function fileTree(repoRoot) {
  /** @type {string[]} */
  const entries = [];
  const walk = (/** @type {string} */ dir, /** @type {number} */ depth) => {
    if (depth > 3 || entries.length >= TREE_MAX_ENTRIES) return;
    /** @type {import("node:fs").Dirent[]} */
    let dirents;
    try {
      dirents = readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const d of dirents) {
      if (entries.length >= TREE_MAX_ENTRIES) return;
      if (d.name.startsWith(".") || d.name === "node_modules") continue;
      const p = join(dir, d.name);
      entries.push(relative(repoRoot, p) + (d.isDirectory() ? "/" : ""));
      if (d.isDirectory()) walk(p, depth + 1);
    }
  };
  walk(repoRoot, 1);
  return entries.join("\n");
}

/**
 * Trim ladder for payloads exceeding the council's smallest context window:
 * 1. drop generated/lock files from diff-style payloads,
 * 2. truncate the largest per-file sections, appending a TRUNCATED FILES
 *    notice so the council knows its blind spots,
 * 3. give up with narrowing advice (handled by the caller via `fits`).
 *
 * @param {string} payload
 * @param {number} maxTokens
 * @returns {{payload: string, fits: boolean, dropped: string[], truncated: string[]}}
 */
export function fitPayload(payload, maxTokens) {
  if (estimateTokens(payload) <= maxTokens) {
    return { payload, fits: true, dropped: [], truncated: [] };
  }

  // Split diff-style payloads into per-file sections on "diff --git" or "--- FILE:" markers.
  const sections = payload.split(/(?=^diff --git |^--- FILE: )/m);
  /** @type {string[]} */
  const dropped = [];
  let kept = sections.filter((s) => {
    const header = s.split("\n", 1)[0] ?? "";
    const m = header.match(/^diff --git a\/(\S+)|^--- FILE: (\S+)/);
    const file = m?.[1] ?? m?.[2];
    if (file && GENERATED_PATTERNS.some((re) => re.test(file))) {
      dropped.push(file);
      return false;
    }
    return true;
  });

  /** @type {string[]} */
  const truncated = [];
  const SECTION_CAP = 20_000; // chars; ~5k tokens per oversized file section
  while (estimateTokens(kept.join("")) > maxTokens) {
    const idx = kept.reduce((big, s, i) => (s.length > kept[big].length ? i : big), 0);
    if (kept[idx].length <= SECTION_CAP) break; // nothing big left to trim
    const header = kept[idx].split("\n", 1)[0] ?? `section ${idx}`;
    truncated.push(header.slice(0, 120));
    kept[idx] = `${kept[idx].slice(0, SECTION_CAP)}\n[... section truncated ...]`;
  }

  let result = kept.join("");
  if (dropped.length || truncated.length) {
    result +=
      `\n\n--- TRUNCATED FILES (payload exceeded the council's context window) ---\n` +
      (dropped.length ? `Dropped as generated: ${dropped.join(", ")}\n` : "") +
      (truncated.length ? `Truncated sections: ${truncated.join("; ")}\n` : "") +
      `Findings in these areas may be incomplete.`;
  }
  return { payload: result, fits: estimateTokens(result) <= maxTokens, dropped, truncated };
}
