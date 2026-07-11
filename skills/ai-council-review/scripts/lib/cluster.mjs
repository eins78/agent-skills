// @ts-check
/**
 * Conservative pre-clustering of findings across council members.
 *
 * Deliberately UNDER-merges: only near-certain duplicates are clustered here
 * (same file + overlapping line ranges, or near-identical titles). Fuzzy
 * semantic merging is the synthesizer's job (references/synthesis.md) — a
 * mechanical pass that over-merges would silently erase dissent, which is
 * exactly the signal this skill exists to preserve.
 */

/**
 * @typedef {object} ClusterMember
 * @property {string} model
 * @property {number} findingIndex index into that model's findings array
 * @property {import("./schema.mjs").Finding} finding
 */

/**
 * @typedef {object} Cluster
 * @property {string} id
 * @property {ClusterMember[]} members
 * @property {string[]} models      distinct models in this cluster
 * @property {string} maxSeverity
 * @property {string[]} categories
 * @property {string[]} files
 */

const SEVERITY_RANK = { blocker: 3, major: 2, minor: 1, nit: 0 };
const LINE_SLACK = 5;

/** @param {string} p */
function normalizePath(p) {
  return p.replace(/^\.\//, "").replace(/^[ab]\//, "");
}

/** @param {string} title */
function titleTokens(title) {
  return new Set(
    title
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((t) => t.length > 2),
  );
}

/** @param {Set<string>} a @param {Set<string>} b */
function jaccard(a, b) {
  if (a.size === 0 || b.size === 0) return 0;
  let intersection = 0;
  for (const t of a) if (b.has(t)) intersection++;
  return intersection / (a.size + b.size - intersection);
}

/**
 * @param {ClusterMember} a
 * @param {ClusterMember} b
 * @returns {boolean} true if the two findings are near-certain duplicates
 */
function isDuplicate(a, b) {
  const fa = a.finding;
  const fb = b.finding;
  const fileA = fa.location?.file ? normalizePath(fa.location.file) : undefined;
  const fileB = fb.location?.file ? normalizePath(fb.location.file) : undefined;

  if (fileA && fileB) {
    if (fileA !== fileB) return false;
    const la = fa.location?.lines;
    const lb = fb.location?.lines;
    if (la && lb) {
      // overlapping line ranges with slack
      return la[0] - LINE_SLACK <= lb[1] && lb[0] - LINE_SLACK <= la[1];
    }
    // same file, at least one side without lines: require title similarity
    return jaccard(titleTokens(fa.title), titleTokens(fb.title)) > 0.5;
  }
  if (fileA || fileB) return false; // one located, one not: keep apart

  // both location-less (plan/doc reviews): titles must clearly match
  return jaccard(titleTokens(fa.title), titleTokens(fb.title)) > 0.5;
}

/**
 * Cluster findings from all successful reviews.
 *
 * @param {{model: string, review: import("./schema.mjs").Review}[]} reviews
 * @returns {Cluster[]} sorted by (severity desc, agreement desc)
 */
export function clusterFindings(reviews) {
  /** @type {ClusterMember[]} */
  const all = [];
  for (const { model, review } of reviews) {
    review.findings.forEach((finding, findingIndex) => {
      all.push({ model, findingIndex, finding });
    });
  }

  /** @type {ClusterMember[][]} */
  const groups = [];
  for (const member of all) {
    const home = groups.find((g) => g.some((m) => isDuplicate(m, member)));
    if (home) home.push(member);
    else groups.push([member]);
  }

  const clusters = groups.map((members, i) => {
    const severities = members.map((m) => m.finding.severity);
    const maxSeverity = severities.reduce((top, s) =>
      (SEVERITY_RANK[s] ?? 0) > (SEVERITY_RANK[top] ?? 0) ? s : top,
    );
    return /** @type {Cluster} */ ({
      id: `c${String(i + 1).padStart(3, "0")}`,
      members,
      models: [...new Set(members.map((m) => m.model))],
      maxSeverity,
      categories: [...new Set(members.map((m) => m.finding.category))],
      files: [
        ...new Set(
          members
            .map((m) => m.finding.location?.file)
            .filter(/** @returns {f is string} */ (f) => typeof f === "string")
            .map(normalizePath),
        ),
      ],
    });
  });

  clusters.sort((a, b) => {
    const sev = (SEVERITY_RANK[/** @type {keyof typeof SEVERITY_RANK} */ (b.maxSeverity)] ?? 0) -
      (SEVERITY_RANK[/** @type {keyof typeof SEVERITY_RANK} */ (a.maxSeverity)] ?? 0);
    if (sev !== 0) return sev;
    return b.models.length - a.models.length;
  });
  return clusters;
}
