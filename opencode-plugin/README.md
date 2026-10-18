# @eins78/opencode-skills

opencode plugin carrying the [eins78/agent-skills](https://github.com/eins78/agent-skills) collection: every skill in the repo becomes available through opencode's **native** `skill` tool, plus the dossier hooks.

## Install

Add to `opencode.json` (global: `~/.config/opencode/opencode.json`):

```json
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": ["@eins78/opencode-skills"]
}
```

Restart opencode. Unpinned plugin specs resolve `@latest` at every startup, so the skills update with the npm package.

## What it does

1. **Skills (native).** The `config` hook appends the bundled `skills/` directory to `config.skills.paths`. opencode's first-party skill loader scans that path for `**/SKILL.md` — skills appear in the native `skill` tool exactly like locally installed ones, lazy-loaded, deduped by name. No parallel skill system, no per-skill context cost. If a skill with the same name exists in `~/.claude/skills/` etc., the plugin's (npm-fresh) copy wins — opencode resolves duplicates last-scan-wins and this plugin's paths are scanned after the standard locations.

2. **Hooks — Claude Code parity.** The repo's Claude Code plugin wires two mechanical dossier gates; this plugin runs the *same scripts* with the same stdin-JSON payload Claude Code would feed them:

   | Claude Code wiring | opencode hook | Behavior |
   |---|---|---|
   | `PostToolUse` matcher `Write\|Edit` → `dossier-hook-dispatcher.sh` (runs `ballot-filename.sh` + `sources-index-consistency.sh` on `DOSSIER-*.md` files) | `tool.execute.after` on `write`/`edit` | Advisory: gate failures are appended to the tool output the model reads. Never throws — a hook failure only logs. |
   | `PreToolUse` matcher `Bash` → `dossier-commit-gate.sh` (runs `review-artifact-present.sh` on staged `DOSSIER-*.md` before `git commit`) | `tool.execute.before` on `bash` | Blocking: throws on gate failure, denying the commit — same as Claude's exit-2 deny. |

   Exit-code contract (same as Claude Code): `0` = allow/silent, `2` = block (before) or surface (after), anything else = logged, non-blocking. Hook scripts run with a 10s timeout so a hung gate can never stall tool calls.

## Design notes

- **Zero runtime dependencies.** The published artifact is `index.ts` (compiled by opencode's Bun runtime) plus the synced `skills/` and `hooks/` directories. `@opencode-ai/plugin` is imported for types only.
- **The hook scripts are the source of truth.** They live canonically in `.claude-plugin/hooks/` and are rsynced into this package at `prepack` (alongside `skills/`, since npm `files` cannot reach outside the package directory). Changes to the scripts or skills are picked up on the next release with no plugin-code changes.
- **No lifecycle scripts on install.** `prepack` runs maintainer-side only; opencode's bun install of the package is side-effect free.
- **Version** is synced from the repo-root `package.json` by `.dev/scripts/sync-versions.sh`.

## Development

```bash
cd opencode-plugin
pnpm install          # devDeps only: types + @opencode-ai/plugin for typecheck
pnpm typecheck        # tsc --noEmit
bash prepack.sh       # sync skills/ + hooks/ for local testing
npm pack              # build the publishable tarball (prepack runs automatically)
```

Local testing against a real opencode: point a sandbox config at the packaged layout (`"plugin": ["<path-to-unpacked>/index.ts"]`) or install the tarball. See the repo docs for the verification checklist.

## License

MIT