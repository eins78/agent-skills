# Bootstrapping a New Agent-Workspace

Interview-driven protocol for producing a first-pass `CLAUDE.md` + `README.md` + directory skeleton for a new (or newly-converted) agent-workspace.

## Entry prompt (for a human to paste)

```
I want to set up this repo as an agent-workspace.

Read the agent-workspace skill (references/concept.md and references/structure.md)
and then interview me using the AskUserQuestion tool. Cover: what this workspace
is for, what it mostly holds (code across repos, shared knowledge, or both),
who the users are, what exists vs what's missing, and what "customer content"
rule applies.

Ask non-obvious questions. Don't ask anything you can get by reading the repo.
Stop when you can draft CLAUDE.md and README.md confidently. Then draft them.
```

## Interview flow

```
1. PURPOSE      — What is this workspace for? Who uses it?
     ↓
2. SCOPE        — What belongs here? What explicitly does NOT?
     ↓
3. CONTENT      — What does this workspace mostly hold?
                  (code across repos, shared knowledge, or both)
                  Map the main content areas.
     ↓
4. GLOSSARY     — Every acronym, every in-group term, every confusing name
     ↓
5. GAPS         — What's already here? What's missing from the skeleton?
     ↓
6. DOCUMENT     — Write CLAUDE.md, README.md, create skeleton dirs
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

If any box is unchecked, ask more questions.

## Deliverables checklist

After the interview, produce:

- [ ] `CLAUDE.md` — see `templates/CLAUDE.md` scaffold.
- [ ] `README.md` — see `templates/README.md` scaffold.
- [ ] `docs/stories/` with `README.md` index and a copy of the story template.
- [ ] `docs/sessionlogs/` with a `.gitkeep` (first sessionlog will be this bootstrap session itself).
- [ ] `docs/rules/` with `.gitkeep` (or a first rule extracted from the interview).
- [ ] `docs/templates/STORY-template.md` from the story-tracking skill.
- [ ] `.claude/skills/` and `.claude/agents/` with `.gitkeep`.
- [ ] A **first story** documenting the bootstrapping itself — meta, but useful: future contributors see why the workspace exists and what decisions shaped it.
- [ ] A **first sessionlog** (today's date) summarizing this bootstrap.

## Drafting guidance

### CLAUDE.md quality bar

| Section | Good | Bad |
|---|---|---|
| Opening | "Shared Product Owner methodology (rules, templates, role personas) for POs across the team. Customer-specific content lives in per-customer workspaces and is out of scope here." | "This is the PO workspace." |
| Glossary | "**PDR**: Product Data Repository — ingests weather files via FTP, stores in S3." | "**PDR**: Product Data Repository." |
| Routing | "Fix UI bugs → `apps/frontend/src/components/`" | "UI code is in the frontend." |
| NOT rules | "**NOT** for customer data. **NOT** for personal notes. See pointers below." | (missing) |

### README.md quality bar

- Scannable in under 2 minutes.
- 3-5 components max in any diagram.
- Tables for repo / directory structure, not prose.
- Link to `CLAUDE.md` for agent routing.
- Link to story index.

## Common first-draft errors

Check your draft against these before declaring done:

| Error | Example | Fix |
|---|---|---|
| Passive voice obscuring ownership | "Files are served from S3" | "Nginx serves files from S3" |
| Missing intermediaries | Forgot the cache between API and DB | Redraw with every hop explicit |
| Circular definition | "The ingester ingests" | Explain inputs, outputs, format |
| Overlooked acronym | Used "CAP" without defining | Grep for all-caps tokens, define each |
| Generic rule ("follow best practices") | "Write good commit messages" | "Commits use `docs:`, `feature:`, `fix:` prefixes" |

## After drafting

1. Read CLAUDE.md and README.md back to the user — they often catch errors fastest when they hear their own domain described back to them.
2. Commit the skeleton. Don't push yet — let the user review.
3. Open the first story (the bootstrap story) so the workspace has live content from minute one.

## Note on spec-vs-practice

Don't over-invest in the spec before you have real workspaces using it. This pattern was extracted from several working shared workspaces — the abstractions earned their place by solving concrete problems. If you're tempted to generalize further, build another workspace first and see whether the generalization is necessary.
