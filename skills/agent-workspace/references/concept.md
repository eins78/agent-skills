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

The pattern doesn't care. The same skeleton serves all of them. If clear sub-patterns emerge with real use, this document may later distinguish them. Until then: one concept, many contents.

## The access boundary rule

The single most important rule, and the one that burns people most often:

> **Customer-specific content belongs in the customer workspace. A workspace shared by a group must be safe to share with every member of that group.**

Violations:

- A shared workspace containing a `customers/acme/` directory with commercial data → anyone joining the workspace now sees that customer's contract terms.
- Customer-specific templates mixed with generic ones → the "reusable template" is actually only usable for one customer.
- Meeting notes referencing unrelated customers in a shared workspace.

**Fix:** move customer content to per-customer workspace repos. Shared workspaces can reference them (read-only submodule, symlink, or just a documented pointer), but the access boundary is enforced at the repo level.

This is *not* an organizational preference. It's a **security and trust boundary**. Get it wrong and a new hire, agent, or external reviewer sees something they shouldn't.

## Tiers of workspace

Context for where this pattern fits in a larger setup:

| Tier | Example | Autonomy | Scope |
|---|---|---|---|
| **Personal** | your own developer workspace | Solo, full autonomy | You |
| **Project / Customer** | a product-wide workspace, a customer-specific workspace | Shared | One customer or product |
| **Function / Role** | a role-specific methodology workspace, a sales-enablement workspace, a cloud-ops workspace | Shared | One role/function across customers |

An agent-workspace is most valuable at tiers 2 and 3. Personal workspaces benefit from the structure but don't need all of it.

## What makes a workspace "agent-ready"

Minimum bar:

- [ ] `CLAUDE.md` at root, covering: what this is, glossary, routing, rules, NOT-to-do.
- [ ] `README.md` at root, scannable in under 2 minutes.
- [ ] `docs/stories/` with a template and at least one real story.
- [ ] `docs/sessionlogs/` receiving entries.
- [ ] English for structural names (frontmatter keys, directory names) so skills are portable.
- [ ] A decision about customer content: excluded, symlinked, or submoduled — explicit, not accidental.

Nice to have:

- [ ] `docs/rules/` split out from `CLAUDE.md` when rules get long.
- [ ] `docs/templates/` for recurring artifact types.
- [ ] `.claude/skills/` for workspace-local skills incubating toward a shared repo.
- [ ] `.claude/agents/` for dispatched specialist agents.
- [ ] Dual Claude Code + Cursor compatibility tested.

## Anti-patterns

| Anti-pattern | Why it hurts |
|---|---|
| CLAUDE.md as a flat list of links | No routing, no glossary — agent can't orient |
| Session logs in git commits only | Decisions lost in commit noise; hard to read sequentially |
| Skills scattered in random directories | Agents can't discover them; incubation path unclear |
| Customer content in a shared workspace | Access boundary violation (see above) |
| Structural elements in non-English | Breaks portability of shared skills; frontmatter keys especially |
| "SPEC" as the only source of truth | Spec drifts from reality; extract the pattern from working implementations, not the other way around |

## What this skill is not

- Not a setup script. It's a pattern + protocol. The scaffolding is manual-but-guided.
- Not opinionated about your tools. Works with Claude Code, Cursor, any AI tool that respects `CLAUDE.md`-style rules files.
- Not a replacement for project-specific conventions. This is a *floor*, not a ceiling. Your `CLAUDE.md` should still encode what's specific to your domain.
