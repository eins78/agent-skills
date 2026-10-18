# Bootstrapping a New Agent-Workspace

Interview-driven protocol for producing a first-pass `CLAUDE.md` + `README.md` + directory skeleton for a new (or newly-converted) agent-workspace.

## Entry prompt (for a human to paste)

```
I want to set up this repo as an agent-workspace.

Load the agent-workspace skill and read concept.md, structure.md and
variations.md from its references/ folder (in the skill's own directory, not
this repo). Then interview me — with a structured question tool if you have
one, otherwise one question at a time. Cover: what this workspace is for, what it holds, who reads it, what
exists vs what's missing, what must stay out, and my answers to the
"where workspaces differ" questions.

Ask non-obvious questions. Don't ask anything you can get by reading the repo.
Stop when you can draft CLAUDE.md and README.md confidently. Then draft them.
```

## Interview flow

```
1. PURPOSE      — What is this workspace for? Who uses it?
     ↓
2. SCOPE        — What belongs here? What explicitly does NOT?
     ↓
3. CONTENT      — What does this workspace hold? Map the main content areas.
     ↓
4. CHOICES      — Answer the variations.md questions that apply:
                  work dirs at root or under docs/, stories or projects,
                  where action items live, rules inline or imported,
                  who commits (and where), where agent memory goes.
     ↓
5. GLOSSARY     — Every acronym, every in-group term, every confusing name
     ↓
6. GAPS         — What's already here? What's missing from the skeleton?
     ↓
7. DOCUMENT     — Write CLAUDE.md, README.md, create skeleton dirs
```

## Question strategy

**Don't ask what you can read.** Skip these:

- "What languages do you use?" → grep/read package files.
- "How many repos?" → count them.
- "What's in this directory?" → look.

**Do ask what the repo can't tell you:**

- "What breaks if this service goes down?"
- "Why are these two concerns in separate repos?"
- "What acronym does your team use that nobody outside the team knows?"
- "Who's allowed to read this workspace? Who isn't?"
- "What's the most confusing thing for a new joiner?"
- "What content have you deliberately *kept out* of this workspace, and why?"
- "What has gone wrong here before? Which rules exist because of an incident?"

**Follow up on vague answers:**

| Vague | Probe |
|---|---|
| "It's a standard setup" | "What would surprise someone coming from a standard setup?" |
| "We mostly use X" | "What are the exceptions, and what drove them?" |
| "You probably got it" | "Let me state my current understanding — tell me what's wrong." |

## Stop conditions

You're ready to draft when you can answer:

- [ ] Can I write a 3-sentence paragraph describing what this workspace is for?
- [ ] Can I name 3-5 concrete scenarios and say which file/directory they map to?
- [ ] Do I know every acronym or jargon term used, with definitions I could hand to a newcomer?
- [ ] Do I know what's **NOT** supposed to be here and where it belongs instead?
- [ ] Can I describe the main content areas — architectures, roles, artifact categories, whatever applies — without hand-waving?
- [ ] Do I have an answer, or a deliberate "not yet", for each `variations.md` question that applies?

If any box is unchecked, ask more questions.

## Deliverables checklist

After the interview, produce:

- [ ] `CLAUDE.md` — see the `${CLAUDE_SKILL_DIR}/templates/CLAUDE.md` scaffold, including the "Workspace Choices" section and, if agents should commit on their own, the standing-request preamble.
- [ ] `README.md` — see the `${CLAUDE_SKILL_DIR}/templates/README.md` scaffold.
- [ ] The directories chosen in step 4 (CHOICES) — defaults: `docs/stories/` with a `README.md` index, `docs/sessionlogs/`, `docs/rules/` (skip if rules stay inline), `docs/templates/` with a story or project template.
- [ ] `.claude/skills/` and `.claude/agents/` with `.gitkeep`.
- [ ] A **first story** documenting the bootstrapping itself — meta, but useful: future contributors see why the workspace exists and what decisions shaped it.
- [ ] A **first sessionlog** (today's date) summarizing this bootstrap.

## Migrating an existing repo

Most workspaces are not greenfield: they grew out of a chat project, a notes repo, or a team folder. Before the interview, audit what's there:

1. **Inventory.** List top-level directories and the file types in each. Read the existing `CLAUDE.md` / `README.md` if any — they encode decisions, often made after incidents.
2. **Classify content by audience:** general (fine for every reader), scoped to one customer/person/team, internal-only. Anything whose audience is narrower than the repo's readers is an access-boundary problem — list it, don't move it yet.
3. **Map, don't rename.** For each existing directory, note which skeleton role it plays (work tracking, sessionlogs, rules, reference). Keep existing names where they work — renaming breaks links and habits, and `CLAUDE.md` can declare any path. The `variations.md` options exist because migrated workspaces kept their shape.
4. **Agree the moves** with the user: what stays, what moves to another repo, what gets deleted. Content leaving because of scope goes to its own repo first, then is removed here. Published history cannot be scrubbed, so check before the first push.
5. **Move with `git mv`** so history follows, then fix inbound links.
6. **Log the migration** as the workspace's first sessionlog.

Then run the interview above for what the audit could not answer.

## Drafting guidance

### CLAUDE.md quality bar

| Section | Good | Bad |
|---|---|---|
| Opening | "Shared Product Owner methodology (rules, templates, role personas) for POs across the team. Customer-specific content lives in per-customer workspaces and is out of scope here." | "This is the PO workspace." |
| Glossary | "**OIS**: Order Intake Service — receives partner orders over SFTP, validates them, writes to the orders DB." | "**OIS**: Order Intake Service." |
| Routing | "Fix UI bugs → `apps/frontend/src/components/`" | "UI code is in the frontend." |
| NOT rules | "**NOT** for customer data. **NOT** for personal notes. See pointers below." | (missing) |

### README.md quality bar

- Scannable in under 2 minutes.
- Any diagram small — 7 boxes or fewer.
- Tables for repo / directory structure, not prose.
- Link to `CLAUDE.md` for agent routing.
- Link to story index.

## Common first-draft errors

Check your draft against these before declaring done:

| Error | Example | Fix |
|---|---|---|
| Routing without a trigger | "Docs are in `docs/`" | "Changing a deploy step → `docs/rules/deploy.md`" |
| Undefined scope | No "NOT for" section | Name what stays out and where it lives instead |
| Circular definition | "The ingester ingests" | Explain inputs, outputs, format |
| Overlooked acronym | Used "CAP" without defining | Grep for all-caps tokens, define each |
| Generic rule ("follow best practices") | "Write good commit messages" | "Commits use `docs:`, `feature:`, `fix:` prefixes" |

## After drafting

1. Read CLAUDE.md and README.md back to the user — they often catch errors fastest when they hear their own domain described back to them.
2. Check the result against the red flags in `SKILL.md`, especially the access boundary — migrations are where content from the wrong scope slips in.
3. If the workspace's git workflow (step 4, CHOICES) lets agents commit, commit the skeleton and don't push yet. Otherwise leave the files uncommitted for the user. Either way, let the user review first.
4. Open the first story (the bootstrap story) so the workspace has live content from minute one.

## Note on spec-vs-practice

Don't over-invest in the spec before you have real workspaces using it. This pattern was extracted from a small number of working workspaces — a personal one, a team one and a consulting one — and they disagree on several points (see `variations.md`). If you're tempted to generalize further, build another workspace first and see whether the generalization is necessary.
