# eins78/agent-skills

Collection of [Agent Skills](https://agentskills.io/) for Claude Code and compatible AI coding agents.

> **Looking for Plot?** The git-native planning workflow has moved to its own repo: **[eins78/plot](https://github.com/eins78/plot)**

## Skills

| Skill | Description |
|-------|-------------|
| [ai-review](skills/ai-review/) | Get AI code review from a second model (Gemini/OpenAI) mid-session via CLI |
| [apple-mail](skills/apple-mail/) | Read email via Apple Mail.app and AppleScript (read-only) |
| [apple-notes](skills/apple-notes/) | Read Apple Notes via AppleScript (read-only) |
| [ballot](skills/ballot/) | Durable decision artefact for async decisions — reviewed over chat, on a PR, on a train, after the session ends. Must/Should/Could tiers, empty checkboxes, reconciliation in sessionlog. Single async decider or multi-reviewer panel; pairs with `dossier` or stands alone (ADRs, PR review, hiring, vendor, household) |
| [bye](skills/bye/) | Session wrap-up — reconstructs history, creates sessionlog, commits, summarizes next steps |
| [chrome-browser](skills/chrome-browser/) | Dedicated Chrome with CDP for Playwright MCP — persistent sessions, launchd-managed, Cloudflare tips |
| [dossier](skills/dossier/) | Structured research — ranked recommendations, cited sources, parallel subagents, optional decision ballots |
| [lab-notes](skills/lab-notes/) | Experiment management — hypothesis, append-only running log, verdict. Rigorous + Lite modes. |
| [pandoc](skills/pandoc/) | Document format conversion — 60+ formats via pandoc instead of ad-hoc scripts |
| [private-podcast-feed](skills/private-podcast-feed/) | Private MP3+RSS feed for self-subscription — itunes:block, token URLs, ID3 chapters, Overcast ping |
| [text-to-audio](skills/text-to-audio/) | Convert a text document to an audio MP3 file via a local TTS pipeline (backend-configurable) |
| [tmux-control](skills/tmux-control/) | Reliable tmux patterns — targeting, send-keys, capture-pane, wait-for sync, monitoring |
| [tracer-bullets](skills/tracer-bullets/) | Thin vertical slice before widening — reduce uncertainty by building end-to-end first |
| [typescript-strict-patterns](skills/typescript-strict-patterns/) | TypeScript patterns — tsconfig, ESLint strict, Zod, discriminated unions, branded types |

## Installation

### As a Claude Code / Cursor plugin (recommended — auto-updates)

Register the marketplace and install:

```
/plugin marketplace add eins78/agent-skills
/plugin install eins78-skills@eins78-marketplace
```

Skills auto-update when you run `/plugin update`.

### Via skills CLI

```bash
pnpx skills add https://github.com/eins78/agent-skills.git --global --agent claude-code --all --yes
```

### Single skill (via plugin marketplace)

Individual skills are listed in the marketplace and can be installed by name:

```
/plugin install bye@eins78-marketplace
```

### Manual (single skill)

```bash
# Symlink a single skill
ln -s ~/CODE/agent-skills/skills/typescript-strict-patterns ~/.claude/skills/typescript-strict-patterns

# Or copy it
cp -r ~/CODE/agent-skills/skills/typescript-strict-patterns ~/.claude/skills/
```

Skills are picked up automatically by Claude Code based on their `globs` frontmatter.

## Format

Each skill follows the [Agent Skills](https://agentskills.io/) spec — a `SKILL.md` file with YAML frontmatter (`name`, `description`, `globs`) and markdown instructions.

## Creating Skills

### Quick Start

```
my-skill/
├── SKILL.md          # Required: frontmatter + instructions
├── README.md         # Required: development notes, design decisions, testing history
└── REFERENCE.md      # Optional: detailed reference material (>100 lines)
```

### SKILL.md Template

```yaml
---
name: my-skill-name     # lowercase, hyphens, max 64 chars, must match directory
description: What it does and when to use it. Include trigger keywords. (max 1024 chars)
# Optional fields per agentskills.io spec:
compatibility: claude-code, cursor
license: MIT
metadata:
  source: https://github.com/your-org/your-repo
  version: "1.0.0"
---

# My Skill Name

[Instructions here — keep under 500 lines]

See [REFERENCE.md](REFERENCE.md) for details.
```

**Note:** Reference files over 100 lines should include a table of contents.

### Key Principles

1. **Be concise** — Only add what Claude doesn't already know
2. **Progressive disclosure** — Overview in SKILL.md, details in referenced files
3. **Third person** — "Processes files" not "I help you process files"
4. **One level deep** — Reference files directly from SKILL.md, avoid nesting
5. **Use checklists** — Multi-step workflows benefit from copy-paste checklists
6. **Test across models** — Haiku may need more guidance than Opus

### Skill Composition

Skills can reference other skills by name in their instructions:

```markdown
## Committing Your Fix

When ready to commit, use the **commit-notation** skill:
- Bugfixes use `B` intention
- Risk level depends on test coverage
```

Claude loads both skills when context matches. No formal import system — just mention by name.

### Official Resources

**Specification & Docs:**

- [Agent Skills Specification](https://agentskills.io) — Open standard format
- [Best Practices](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices) — Anthropic's authoring guide
- [Claude Code Skills](https://code.claude.com/docs/en/skills) — Claude Code integration

**Example Skills & Tools:**

- [Anthropic Skills Repository](https://github.com/anthropics/skills) — Official example skills
- [skill-creator](https://github.com/anthropics/skills/tree/main/skills/skill-creator) — Scaffolding tool for new skills

## Development

### Adding a changeset

When making changes, add a changeset to describe your change:

```bash
pnpm changeset
```

Edit the created file to set the bump type (`patch`, `minor`, or `major`), describe the change, and add a `<!-- bumps: -->` block naming the affected skills:

```markdown
<!--
bumps:
  skills:
    skill-name: minor
-->
```

### Releasing

Releases are automated via GitHub Actions. When a PR with changesets merges to `main`:

1. The Action creates a "Version Packages" PR with version bumps and CHANGELOG updates
2. Merging the version PR creates git tags and a GitHub Release

**Manual release (fallback):**

```bash
GITHUB_TOKEN=$(gh auth token) pnpm run version   # bumps skill + plugin versions, writes changelog, syncs metadata
pnpm run release   # runs version, commits, tags — then push with: git push --follow-tags
```

### Validation

```bash
pnpm test          # skills parse correctly
pnpm run validate  # SKILL.md frontmatter checks (name, version, license)
```

## License

MIT
