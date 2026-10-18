# agent-workspace

A skill and pattern for **shared git repositories designed for human + AI collaboration**. Gives workspaces a predictable skeleton so agents can land cold, orient, and contribute without breaking the grain of ongoing work.

> **Status:** alpha (`0.1.0-alpha.1`), and a **living document**. Published before every convention is settled, on purpose: where working workspaces disagree, the skill names the options and says when each fits ("teaching the controversy") instead of inventing one rule. Expect it to change as more workspaces use it.

## What's an agent-workspace?

A git repo with enough convention that both humans and AI agents can navigate it by reflex:

- `CLAUDE.md` at the root — AI routing guide ("when X → go to Y") and the workspace's answers to the open questions below.
- `README.md` — human scannable overview.
- A home for multi-session work — `stories/` or `projects/`.
- `sessionlogs/` — dated per-topic notes from agent and meeting sessions.
- Rules — inline in `CLAUDE.md` or in `docs/rules/`.
- `.claude/skills/` and `.claude/agents/` — workspace-local, incubating before promotion.

The default layout nests the work directories under `docs/`; many workspaces keep them at the root. See `references/concept.md` for rationale and `references/bootstrapping.md` for setting one up or migrating an existing repo.

## Where workspaces differ

The point of this alpha. [`references/variations.md`](references/variations.md) lists the questions that real workspaces answer differently — work dirs at root or under `docs/`; stories vs projects with folder lifecycle; central `TODO.md` or not; where session narrative lives; rules inline vs imported; a compiled `wiki/` or `context/` layer; one plan directory or several; who commits in nested repos; the agent's git workflow; agent memory vs workspace memory; raw logs; encrypted secrets in the repo; how the scope boundary is drawn; where research goes; `CLAUDE.md` vs `AGENTS.md`; sub-units as folders or their own repos; conventions inherited from an umbrella workspace; rollups and generated files; the language of structure; top-level taxonomy; what workspace agents are and how much they may do alone. Each entry gives the options and when they fit. Add an entry when you find another.

## When to use

- You're setting up a shared repo that several people (and agents) will work in over time.
- You already have an ad-hoc shared repo and want to convert it to the pattern.
- You landed in an existing agent-workspace and want to understand what conventions apply.

## Contents

- [`SKILL.md`](SKILL.md) — agent protocol: orient, locate, contribute; access boundary; red flags.
- [`references/concept.md`](references/concept.md) — what, why, access boundary, tiers, composing with the agent tool's system prompt.
- [`references/variations.md`](references/variations.md) — where workspaces differ, with options.
- [`references/bootstrapping.md`](references/bootstrapping.md) — migration audit and interview protocol for `CLAUDE.md` + `README.md`.
- [`references/structure.md`](references/structure.md) — default directory layout and "where does this go" lookup table.
- [`templates/CLAUDE.md`](templates/CLAUDE.md) — scaffold, including a "Workspace Choices" table and a standing-request git preamble.
- [`templates/README.md`](templates/README.md) — scaffold README.md for a new workspace.

## Related skills

- `dossier` and `ballot` (this repo) — research reports and async decisions that land inside a workspace's stories/projects.
- `lab-notes` (this repo) — experiments, for workspaces that keep them.
- `story-tracking` and Plot — [plot-pm/plot](https://github.com/plot-pm/plot), the plan → implement → deliver workflow.
- A session wrap-up skill such as `bye` ([quatico-solutions/agent-skills](https://github.com/quatico-solutions/agent-skills)).
- An MCP server for a workspace, exposing its status and sections to chat clients.

## Development notes

**Tier:** publishable, generic. No names, hosts, paths or customers from the originating workspaces — keep it that way. Machine- or org-specific conventions belong in each workspace's own `CLAUDE.md`, which the skill defers to.

**Provenance:** extracted from three working workspaces of one maintainer — a single-owner personal workspace, a team workspace that aggregates product and client repos, and a consulting workspace with operations runbooks — plus a critical review of the first draft against those three (April 2026). A second pass (October 2026) compared an organisation's umbrella workspace with ten of its client, function and tooling workspaces and added items 15–21. One access-restricted workspace was deliberately not read. They agree on the basics (CLAUDE.md routing, dated per-topic sessionlogs, workspace-local skills, the access boundary) and disagree on the items in `variations.md`.

**Testing:** pressure scenario against a small fixture workspace (single owner, `projects/` with folder lifecycle, a work workspace mounted as a submodule), three fresh Haiku agents per version, three requests: start tracking multi-week work; summarize a document from the mounted work repo into today's sessionlog; save a research report the workspace has no home for.

- Without the 2026-10 changes: 3/3 followed the workspace's own layout, **0/3** respected the scope boundary (all copied the work runbook into the personal sessionlog), and the research report landed in three different places.
- With the access-boundary rule tied to "content came from another repo": 3/3 left a pointer instead of copying, in both later rounds.
- The "ask before writing a path `CLAUDE.md` doesn't name" conditional was added after round two, when one agent invented a top-level `research/` directory. In round three no agent invented one; all placed the report in an existing home (a dated sessionlog or a project folder). None asked — acceptable when an existing home fits, but whether agents ask when nothing fits is untested.

**Known gaps:**

- Every MUST here is prose. The skill recommends gates (hooks, scripts) for rules automation depends on, but ships none of its own.
- `compatibility: cursor` is declared, not tested on a live Cursor install.
- Tier 2/3 (multi-person) workspaces are under-sampled: one team workspace informed the pattern; function/role workspaces were planned but not yet converted.
- No migration has been run end-to-end with the new `bootstrapping.md` audit section.
- The templates are thin compared with mature `CLAUDE.md` files (hundreds of lines); a filled-in example would help.

## License

MIT.
