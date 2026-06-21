# {{Workspace Name}}

{{One paragraph: what this is, who uses it, why it exists. Aim for scannable.}}

## Getting Started

```bash
git clone {{--recurse-submodules if the workspace aggregates code repos}} {{repo-url}}
cd {{workspace}}
{{bootstrap command, if any}}
```

## What's In Here

{{Simple ASCII diagram or bullet list — 5-7 top-level items max}}

```
workspace/
├── CLAUDE.md          # AI routing guide
├── docs/
│   ├── stories/       # Work tracking
│   ├── sessionlogs/   # Session notes
│   ├── rules/         # Agent behavior rules
│   └── templates/     # Reusable artifact templates
└── .claude/
    ├── skills/        # Workspace-local skills
    └── agents/        # Workspace-local agents
```

## What This Workspace Holds

{{Delete sections below that don't apply. Most workspaces use some combination.}}

### Repositories

| Repo | Description |
|---|---|
| {{name}} | {{one line}} |

### Knowledge Areas

| Area | Contents |
|---|---|
| `docs/rules/` | {{e.g. agent behavior rules, commit conventions}} |
| `docs/templates/` | {{e.g. artifact templates, role personas}} |
| `context/` | {{e.g. role knowledge, stakeholder maps}} |

## Working in This Workspace

⚠️ {{Any constraints: read-only submodules, approval gates, customer access restrictions, etc.}}

- Story tracking → see `docs/stories/README.md`
- Session logs → add yours to `docs/sessionlogs/`
- AI routing guide → [CLAUDE.md](./CLAUDE.md)

## Related Workspaces

- `{{other-workspace}}` — {{what lives there instead}}

## License / Access

{{License if OSS, access policy if internal}}
