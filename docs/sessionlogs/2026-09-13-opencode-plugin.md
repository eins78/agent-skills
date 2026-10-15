# opencode plugin: `@eins78/opencode-skills` — skills + dossier hooks in opencode's native tool

**Date:** 2026-09-13
**Source:** opencode session (GLM Sonnet via OpenRouter preset), dispatched from `home-workspace` with an approved plan (`.opencode/plans/2026-09-13-agent-skills-opencode-plugin.md`).

## Summary

Every skill in this repo is now available in **opencode** via one npm plugin:
`"plugin": ["@eins78/opencode-skills"]` in `opencode.json`. The plugin registers
the bundled `skills/` directory with opencode's *first-party* skill loader
(`config.skills.paths`) and ports the two dossier hook wirings to opencode's
plugin hooks. It is published to npm by the release pipeline alongside the
existing Claude Code marketplace distribution, which is unchanged.

## Why this shape

- **Native skills, not a parallel system.** opencode's skill loader scans
  `config.skills.paths` for `**/SKILL.md`. A published plugin
  (`opencode-skill-autodiscovery@2.0.0`) proved the `config`-hook mutation
  works in production, and `joshuadavidthomas/opencode-agent-skills` put itself
  in maintenance mode for exactly the reason not to build a parallel tool
  system. Skills stay lazy-loaded and deduped by name; bundling all 15 costs
  nothing.
- **Separate npm package, not the root package.** The root `package.json` has a
  `postinstall` that runs the skills CLI against the repo — opencode installs
  npm plugins with bun into its cache, and that script must never fire there.
  The plugin package has zero runtime deps and no install-side lifecycle
  scripts.
- **Hook scripts stay canonical.** `.claude-plugin/hooks/*.sh` are the tested
  source of truth. The plugin feeds them the exact stdin-JSON payload Claude
  Code would (`{"tool_input": {...}}`) and translates the exit-code contract:
  exit 2 on `tool.execute.after` (write/edit) appends stderr to the tool output
  (advisory, same visibility as Claude's exit-2 stderr); exit 2 on
  `tool.execute.before` (bash) throws, denying the call like Claude's exit-2
  deny. The scripts are rsynced into the package at `prepack` because npm
  `files` cannot reach outside the package directory.
- **Hook error discipline.** opencode runs hooks with `Effect.promise` — a
  rejection fails the whole tool call. The after-hook therefore never throws
  (gate failures become tool-output text; hook failures become log lines). Hook
  subprocesses are killed after 10s so a hung gate can never stall every tool
  call. `engines.opencode` is declared so a future major opencode refuses the
  plugin loudly instead of misloading it.

## Verification (all green)

1. **Gate A (mechanism):** sandboxed opencode (XDG dirs redirected, external
   skill scans disabled) — plugin registering a marker skill via `config` hook:
   `init count=2`; without the plugin `count=1`.
2. **Gate B1 (packaging):** `npm pack` tarball unpacked, loaded via local
   plugin path in the same sandbox: `init count=16` (builtin + 15 skills).
3. **Gate B2 (glue, bun):** 8 checks against the packaged plugin — bad ballot
   name appends the audit text; good ballot / non-DOSSIER / `templates/` paths
   silent; `bash` ignored by the after-hook; unreviewed-dossier `git commit`
   blocked with the REVIEW GATE message; non-commit commands silent; config
   hook registers exactly the packaged skills dir.
4. **Gate B3 (real model):** opencode run with `@preset/glm-sonnet` wrote
   `DOSSIER-e2e-BALLOT.md` (a malformed ballot name); the ballot-filename gate
   error appeared in the tool output inside the real session.
5. `pnpm run validate` (now includes the opencode name-rule pass), `pnpm test`,
   `tsc --noEmit` in `opencode-plugin/`, `shellcheck` on all shipped scripts.

## Publishing

`create-release.sh` publishes `@eins78/opencode-skills` after the GitHub
Release step: `NPM_TOKEN` (CI secret) or ambient `npm login` authorizes it;
without auth it skips with a warning (re-runnable manually). `sync-versions.sh`
now also bumps the plugin's `package.json` from the root version. Requires the
`eins78` npm account to exist with publish rights to the `@eins78` scope.

## Install

```jsonc
// ~/.config/opencode/opencode.json
{ "plugin": ["@eins78/opencode-skills"] }
```

Unpinned plugin specs resolve `@latest` at every opencode startup. If a skill
name also exists in `~/.claude/skills/`, the plugin's npm-fresh copy wins
(opencode resolves duplicate skill names last-scan-wins, and plugin paths are
scanned after the standard locations).