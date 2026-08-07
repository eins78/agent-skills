# Kindle/EPUB pipeline codified into two skills (PR #71)

**Date:** 2026-08-07
**Source:** Claude Code (Opus 5), delegated session
**Session:** No compactions · ~20 min active · single task, spec supplied up front

## Summary

Implemented an already-approved plan: the Kindle/EPUB delivery experiment of 2026-08-06 became `skills/send-to-kindle/` (new, 0.1.0), a Markdown → Kindle EPUB recipe plus bundled script in `skills/pandoc/`, and a one-line cross-reference in `skills/dossier/`. Shipped as PR #71 — open, CI green, not merged.

The spec was detailed and pre-decided, so there is little design rationale to preserve; the PR description and the two commit messages carry it. This log exists for three things that live outside those artifacts: a side effect on the machine's global skills, a secrets gate that nearly passed vacuously, and the unfinished half of a two-repo change.

## 1. The secrets gate almost passed without checking anything

The hard constraint was that no device serials, email addresses, or keychain account names reach either skill. The check run was:

```bash
git grep -nEi 'G000T6|GN433W|kindle-ingress|@icloud\.com|@178\.is|naomi' -- skills/
```

It returned clean. It was clean **because `git grep` only searches tracked files**, and `skills/send-to-kindle/` was entirely untracked at that moment — the one directory the check existed to inspect. The false clean was caught only because a sanity check (`grep -c 'kindle.com'` against a file known to contain the string) came back empty from `git grep` too, which made no sense.

Re-run as plain `grep -rnEi … skills/`, it found the two real hits (see §2).

A pre-commit secrets scan that skips new files is a gate that does not gate — precisely the failure mode `CLAUDE.md`'s "Gates Over Rules" section warns about, since the agent can honestly report "I ran the check." Worth a hook if this repo ever formalizes one: any secrets scan must either use `git grep --untracked` or plain `grep -r`, and should be given a known-positive canary to prove it can see the files it claims to have cleared.

## 2. `KINDLE_TO` / `KINDLE_FROM`: flagged, rationalized past, then removed

The narrowing in the approved plan was explicit: no env vars, no configuration contract for sending, and reintroducing them as future-proofing would be "smuggling back a decision Max just declined."

The first draft of `skills/send-to-kindle/README.md` named both variables — inside a sentence stating they deliberately do not exist. That was flagged mid-write ("a stranger reading the README could copy those names as a suggested convention… borderline"), reasoned to be acceptable because it deters future reintroduction, committed, and then pre-defended in the PR body.

It was wrong for a plain reason: naming both variables and describing their shape *is* the spec with a `not` in front, and it is the first thing a `grep KINDLE_` on the PR surfaces. Removed in `c8792f2`; the deterrent reasoning stays, worded without any token a reader could copy. Same commit trimmed a Known Gaps entry that had re-opened the AppleScript-vs-SMTP transport question, closed upstream as moot.

The generalizable bit: *self-flagging a concern and then arguing yourself out of it in the same breath* is a stronger signal than the argument that follows it. The pre-emptive defence written into the PR body was the tell.

## 3. Global skills were overwritten from this worktree

`node_modules` was missing, so `pnpm install` ran — which fired the repo's own `postinstall` (`skills add . --global --skill '*' --agent claude-code`). That **copied this worktree's skills into `~/.claude/skills/`**, all stamped 21:34.

Consequences until PR #71 merges:

- The machine's global `pandoc` is the unmerged version (has `md2kindle-epub.sh`).
- `send-to-kindle` is installed globally and live, from an unmerged branch.

Harmless once merged. Remedy either way: `pnpm install` from the main checkout.

Not a mistake exactly — `pnpm install` is the ordinary way to get a working tree — but it is a change outside the declared "this repo only" scope, produced by a `postinstall` that writes to `$HOME`. Worth knowing before running `pnpm install` in any worktree of this repo.

## 4. The other half of this change is not done

The plan spans two repos. Only this one was in scope:

- **Done here:** the two skills, the dossier pointer, root README row, one changeset.
- **Still pending in home-workspace (Max handles it after merge):** `git rm scripts/md2kindle-epub.sh`, update the dossier's usage block and `context/data.yaml:561`. The sessionlog, the 2026-08-06 digest, and `wiki/backlog.yaml` are to be left alone deliberately — the backlog entry cites the old path as evidence for the clippings-parser deferral, and rewriting it to match a later refactor would corrupt the record it exists to hold.

Because that removal has not happened, `scripts/md2kindle-epub.sh` currently exists in both places. The approved decision was **move** (DEC-006); Max overrode it to copy-then-clean-up-himself. So the duplication is intentional and temporary, not drift — but it is drift the day the cleanup is forgotten.

## Smaller notes

- The script is byte-identical to the home original (`diff` clean, comment block included) and `shellcheck`-clean at default severity, so the "verbatim vs fix what shellcheck flags" tension never fired.
- Its trailing comment points at `research/2026-08-06-kindle-delivery/`, a path that does not exist in this repo. Kept verbatim as instructed; the README provenance line resolves it by stating outright that the directory is private and not part of the repository.
- `evals/` is not a per-skill convention — only `ballot` and `dossier` have eval suites — so `send-to-kindle` correctly ships without one.
- `send-to-kindle` is hand-set to `0.1.0` and omitted from the changeset's `bumps:` block, per the known `increment_semver` behaviour: listing it would bump `0.1.0` → `0.1.1` on release.

## Pending

- [ ] Max: review and merge PR #71
- [ ] Max: home-workspace cleanup (§4)
- [ ] Optional: re-run `pnpm install` from the main checkout to restore global skills (§3)
