---
"@eins78/agent-skills": minor
---

**`opencode-plugin`** — new `@eins78/opencode-skills` npm plugin: every skill in this repo becomes available in opencode through its native `skill` tool, and the dossier hooks run there too.

One config line in `opencode.json` — `"plugin": ["@eins78/opencode-skills"]` — registers the bundled `skills/` directory with opencode's first-party skill loader (no skills-CLI copy step, updates ride npm). The plugin also ports the Claude Code hook wiring: `PostToolUse` (Write|Edit) dossier audit runs advisory on write/edit, and the `PreToolUse` (Bash) review gate blocks unreviewed-dossier commits, using the same hook scripts with the same exit-code contract. Zero runtime dependencies; `engines.opencode` declares compatibility. CI now typechecks the plugin; `create-release.sh` publishes it alongside each release.