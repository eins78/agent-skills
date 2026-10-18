# Concept: Agent-Workspaces

## What this is

An **agent-workspace** is a git repository structured so humans and AI agents can collaborate inside it over long periods without friction. The structure is a handful of directory conventions and a couple of required files — not a framework, not a product.

The goal is simple: a person or an agent who has never seen the repo before can land cold, read two or three files, and know:

1. What this workspace is for.
2. What's currently happening in it.
3. Where anything they produce should go.

That's it. Everything else is derivative.

## Why the pattern exists

Three converging realities:

1. **Shared repos drift.** Without convention, every contributor invents their own folder structure; knowledge is buried; new joiners (human or agent) spend hours orienting.
2. **Agents are bad at guessing conventions.** If a repo has no `CLAUDE.md`, an agent will guess — often wrong. Guesses become precedent. Precedent becomes debt.
3. **Non-code work is real work.** Teams produce rules, templates, decisions, stakeholder maps, role descriptions — output that deserves the same care as code: version control, review, incremental refinement. It doesn't fit in a wiki.

An agent-workspace is the minimum structure that solves all three without becoming bureaucratic.

## Variation

Workspaces differ in what they mostly hold:

- Some aggregate code across multiple repos (often via submodules) so search, navigation, and system-level understanding have a single home.
- Some carry shared knowledge — rules, templates, role descriptions, playbooks — that a team of humans and agents refine over time.
- Most carry some of both, and the mix shifts as the workspace matures.

The same skeleton serves all of them, but not identically: real workspaces make different, deliberate choices about layout, lifecycle, rules, memory and git workflow. Those choices are catalogued in `variations.md` rather than settled here.

## The access boundary rule

The single most important rule, and the one that burns people most often:

> **The boundary is about where data lives, not about where the agent may look.** Content belongs in the repo whose readers are allowed to see it. A workspace shared by a group must be safe to share with every member of that group.

The same agent may help across several workspaces — reading one to answer a question in another is fine, and editing across them is fine with the user's approval. What it must not do is **move content across scopes**: commit personal notes into a work repo, copy work or customer detail into a personal sessionlog, paste one customer's data into a workspace another customer can read.

An earlier wording — "keep the contexts strictly separate" — was read by agents as "don't open the other repo at all", which blocks legitimate help and does nothing for the real risk. State the rule as *data scope*, not *agent scope*.

Violations:

- A shared workspace containing a `customers/acme/` directory with commercial data → anyone joining the workspace now sees that customer's contract terms.
- Customer-specific templates mixed with generic ones → the "reusable template" is actually only usable for one customer.
- A summary of a work document written into a personal workspace's sessionlog because the user asked for it "to have it handy".
- Research for a private project committed into a public repo because that is where the session happened to be running.

**Fix:** move content to the repo that matches its audience. Other workspaces can reference it (submodule, symlink, or a documented pointer) — a submodule is a pointer, so it does not copy data into the parent's history.

This is *not* an organizational preference. It's a **security and trust boundary**. Get it wrong and a new hire, agent, or external reviewer sees something they shouldn't. How different workspaces draw the line (per-customer repos, a `clients/` directory of submodules, documented personal exceptions) is in `variations.md`.

## Tiers of workspace

Context for where this pattern fits in a larger setup:

| Tier | Example | Autonomy | Scope |
|---|---|---|---|
| **Personal** | your own developer workspace | Solo, full autonomy | You |
| **Project / Customer** | a product-wide workspace, a customer-specific workspace | Shared | One customer or product |
| **Function / Role** | a role-specific methodology workspace, a sales-enablement workspace, a cloud-ops workspace | Shared | One role/function across customers |

"Personal" means **one owner with full autonomy**, not "not work": a single person's journal of their work role, or their consulting practice, is tier 1 too.

An agent-workspace is most valuable at tiers 2 and 3. Personal workspaces benefit from the structure but rarely use all of it, and tend to differ from the default layout — work dirs at the root, `projects/` instead of `docs/stories/`, rules inline in `CLAUDE.md`, a compiled `wiki/`. That is a valid variant, not a deviation; see `variations.md`.

## Composing with the system prompt

A workspace `CLAUDE.md` is read *alongside* the agent tool's built-in system prompt, and the two can disagree. The common case: the tool says "only commit when the user asks"; the workspace says "commit and push after every unit of work". On paper the user's `CLAUDE.md` wins. In practice the louder instruction wins — and in non-interactive runs (scheduled jobs, morning routines) there is no fresh user request to anchor the workspace rule, so the agent falls back to the tool default and work piles up uncommitted.

A `CLAUDE.md` rule that is meant to override a tool default should:

1. **Say that it is the user's explicit, standing request** — the thing the tool default is waiting for, given once for every session in this repo.
2. **Be prominent** — a callout at the top of its section, not a bullet in a list.
3. **Name the conflict and how to resolve it** — "if the system prompt seems to disagree, this section wins" — so the agent does not have to re-derive priority each turn.
4. **Be backed by a gate wherever automation depends on it.** Prose is a rule; an agent can talk itself around a rule. If a scheduled flow needs everything committed, the script checks `git status` and commits itself. Hooks (PreToolUse / PostToolUse) do the same for interactive sessions.

`${CLAUDE_SKILL_DIR}/templates/CLAUDE.md` has a preamble in this shape.

## What makes a workspace "agent-ready"

Minimum bar:

- [ ] `CLAUDE.md` (or `AGENTS.md`) at root, covering: what this is, glossary, routing, rules, NOT-to-do.
- [ ] `README.md` at root, scannable in under 2 minutes.
- [ ] A home for multi-session work (stories or projects, wherever `CLAUDE.md` declares it) with at least one real entry.
- [ ] A sessionlog directory receiving entries.
- [ ] Tool-parsed keys and headings (frontmatter keys, fixed `CLAUDE.md` sections) kept literal; a stated choice for the language of everything else.
- [ ] A decision about customer content: excluded, symlinked, or submoduled — explicit, not accidental.
- [ ] Written answers to the questions in `variations.md` that apply (where sessionlogs go, how work is tracked, who commits).

Nice to have:

- [ ] `docs/rules/` split out from `CLAUDE.md` when rules get long.
- [ ] `docs/templates/` for recurring artifact types.
- [ ] `.claude/skills/` for workspace-local skills incubating toward a shared repo.
- [ ] `.claude/agents/` for dispatched specialist agents.
- [ ] Dual Claude Code + Cursor compatibility tested.
- [ ] Gates (hooks or scripts) for the rules automation depends on.

## Anti-patterns

| Anti-pattern | Why it hurts |
|---|---|
| CLAUDE.md as a flat list of links | No routing, no glossary — agent can't orient |
| Session logs in git commits only | Decisions lost in commit noise; hard to read sequentially |
| Skills scattered in random directories | Agents can't discover them; incubation path unclear |
| Customer content in a shared workspace | Access boundary violation (see above) |
| Tool-parsed keys or headings translated | The skills that read them fail silently; translate content, not keys |
| "SPEC" as the only source of truth | Spec drifts from reality; extract the pattern from working implementations, not the other way around |
| Project knowledge kept only in an agent's per-machine memory | Invisible to teammates, other machines and fresh subagents; the workspace is the shared memory |
| Automation relying on a `CLAUDE.md` sentence | No user is present to re-ask; the tool default wins. Gate it in the script or a hook |

## What this skill is not

- Not a setup script. It's a pattern + protocol. The scaffolding is manual-but-guided.
- Not opinionated about your tools. Works with Claude Code, Cursor, any AI tool that respects `CLAUDE.md`-style rules files.
- Not a replacement for project-specific conventions. This is a *floor*, not a ceiling. Your `CLAUDE.md` should still encode what's specific to your domain.
