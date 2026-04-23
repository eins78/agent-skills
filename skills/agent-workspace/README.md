# agent-workspace

A skill and pattern for **shared git repositories designed for human + AI collaboration**. Gives workspaces a predictable skeleton so agents can land cold, orient, and contribute without breaking the grain of ongoing work.

> **Status:** alpha (`0.1.0-alpha.1`). Extracted from several working shared-team workspaces and still being generalized. Feedback welcome.

## What's an agent-workspace?

A git repo with enough convention that both humans and AI agents can navigate it by reflex:

- `CLAUDE.md` at the root — AI routing guide ("when X → go to Y").
- `README.md` — human scannable overview.
- `docs/stories/` — multi-session work items tracked as folders.
- `docs/sessionlogs/` — dated per-topic notes from agent and meeting sessions.
- `docs/rules/` — imported into `CLAUDE.md` for workspace-specific agent behavior.
- `.claude/skills/` and `.claude/agents/` — workspace-local, incubating before promotion.

Workspaces vary in what they hold — some aggregate code across repos, some carry shared knowledge (rules, templates, playbooks), most carry both. The same skeleton applies regardless. See `references/concept.md` for rationale and `references/bootstrapping.md` for how to set one up.

## When to use

- You're setting up a shared repo that several people (and agents) will work in over time.
- You already have an ad-hoc shared repo and want to convert it to the pattern.
- You landed in an existing agent-workspace and want to understand what conventions apply.

## Contents

- [`SKILL.md`](SKILL.md) — agent protocol: how to orient, locate, contribute.
- [`references/concept.md`](references/concept.md) — full explanation: what, why, variation, access boundaries.
- [`references/bootstrapping.md`](references/bootstrapping.md) — interview protocol for producing `CLAUDE.md` + `README.md` for a new workspace.
- [`references/structure.md`](references/structure.md) — canonical directory layout and "where does this go" lookup table.
- [`templates/CLAUDE.md`](templates/CLAUDE.md) — scaffold CLAUDE.md for a new workspace.
- [`templates/README.md`](templates/README.md) — scaffold README.md for a new workspace.

## Related patterns

- **Stories & sessionlogs** — pairs well with a `story-tracking` skill (see your org's skills repo or build your own).
- **Plot** — [eins78/plot](https://github.com/eins78/plot) for the git-native plan/implementation workflow inside a workspace.
- **Skills marketplace** — workspace-local skills that graduate live in a shared skills repo (this one, or an org equivalent).

## License

MIT.
