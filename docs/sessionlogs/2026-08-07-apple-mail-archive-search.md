# apple-mail: archive search over `.emlx` (issue #69, PR #74)

**Date:** 2026-08-07 – 08 (logged 2026-08-15)
**Source:** Claude Code (Opus 5)
**Session:** No compactions — full history in context · ~79k output tokens · two tasks: implement, then rebase

## Summary

Fixed issue #69: the `apple-mail` skill's documented search paths returned nothing on a large multi-account Mail store. Added a "Searching large archives" section (ripgrep over `.emlx`), `scripts/emlx.py`, and `tests/test-emlx.sh`. Shipped as PR #74, later rebased onto #70 and merged by Max as part of 4.2.0.

The PR description carries the measurements and the corrections to the issue's recipes. This log exists for what is not in the shipped artifacts: two measurement mistakes that produced confident wrong answers, a self-inflicted data loss, and the fate of the changeset after merge.

## 1. Bash silently ate the NUL byte, and the result looked authoritative

The issue's `rg` recipe omits `-a`, so the question was whether ripgrep's binary heuristic — stop at the first NUL — could skip past a match. To measure how many `.emlx` files contain a NUL:

```bash
LC_ALL=C grep -qU $'\x00' "$f"     # → matched 3000 of 3000 files
```

Every file, which would have meant the recipe was badly broken. It is not: **bash cannot pass a NUL byte as an argument**, so `$'\x00'` collapses to the empty string and the command degrades to `grep -q ''`, which matches everything. An earlier variant (`rg --count-matches $'\x00'`) failed the same way and returned all 116,384 files.

Re-run in Python, the real answer is **0 of 3000** — `.emlx` bodies are 7-bit safe because attachments are base64. No `-a` needed, and the shipped recipe is unchanged from the issue's on this point.

Two things made it catchable: the answer was implausibly round (100%), and the two independent-looking commands agreed *too* well — both were failing the same way for the same reason, which reads as corroboration. Same shape as the `git grep` false clean in [2026-08-07-kindle-codification.md](./2026-08-07-kindle-codification.md) §1: a check that cannot see its subject reports success. **Any shell test that hinges on a control byte should be written in Python, or given a known-positive canary first.**

## 2. A failing check that was wrong about a correct script

The triage script sorts by parsed date. Verifying it:

```bash
sort -c dates.txt   # → FAIL: not sorted
```

The script was right; the check was wrong. It emitted local ISO timestamps with mixed UTC offsets (`+01:00`, `+02:00`) across a twenty-year archive, and those do not compare lexicographically even when the underlying instants are ordered. Re-verified by parsing back to datetimes: 0 out-of-order pairs in 5,447.

Worth logging because the fix was not "correct the check". Anyone piping that column into `sort` would have hit the same wrong answer, so `emlx.py` now emits UTC (`…Z`) — correct *and* lexicographically sortable. A bad test found a real usability defect next to the thing it was wrong about.

## 3. `git checkout --` to revert one line reverted the whole file

`bump-skill-versions.sh` was dry-run to confirm it parsed the `bumps:` block. It did, and it also wrote `1.1.0` into three SKILL.md files. Reverting with:

```bash
git checkout -- skills/apple-mail/SKILL.md   # ...and pandoc, dossier
```

restored the version line and destroyed the ~118 lines of new section written minutes earlier. Caught immediately (`rg -c 'Searching large archives'` → no match) and re-applied from context, which was intact only because the work was recent and uncompacted.

The second time the same script ran — during the rebase, where the file also held hand-merged conflict resolution that existed nowhere else — the revert was a surgical `Edit` of the single version line. **`git checkout --` is not "undo the last command"; it is "discard everything not committed."** After running any tool that rewrites tracked files, revert with a targeted edit, or commit first so a real undo exists.

## 4. The fix contained the bug it was fixing

Issue #69's core insight is that `mdfind` returns 0 because `~/Library/Mail` is unindexed, and 0 reads as "no such mail" but means "no index". The proposed replacement was `rg -il --no-messages …`.

Without Full Disk Access, that command **also returns a silent 0** — `--no-messages` suppresses the permission errors that would otherwise reveal it. Verified by `chmod 000` on a directory containing a known match: with the flag, zero results and exit 0.

So the recipe opens with a readability precheck (`rg --files … | wc -l`) rather than a prose warning, per CLAUDE.md's "Gates Over Rules". Both diagnostics are documented — `mdutil -s /` reporting indexing enabled while `mdls -name kMDItemTextContent` returns `(null)` is what distinguishes "no index" from "no mail" in seconds.

## 5. Measurement contradicted the issue on one point

Issue #69 suggested `*.partial.emlx` "may lack the body you're looking for". Measured on the authoring machine, partials have **intact text bodies with a longer median than full messages**. The real mechanism is per-part: an undownloaded part keeps its headers and carries `X-Apple-Content-Length` with an empty payload — 647 such stubs across 1,500 partials, and **zero** in 1,500 full messages, all of them attachments. Documented as measured, surfaced as a `NOT-DOWNLOADED` flag.

The general point: the issue was a bug report, not tested skill content. Three of its snippets needed correction (the partials claim, the `grep`/`cut` triage loop that mishandles the 20% of folded and 24% of MIME-encoded subjects, and the `V10`-only path). Two claims it made were confirmed exactly. Shipping any of them unverified would have put a broken recipe in a skill.

## 6. The changeset was kept on good reasoning, then cut anyway

PR #73 had just dropped a changeset because `send-to-kindle` sat at an unreleased `0.1.0`. I checked whether `apple-mail` was in that position — it was not (released, tag `apple-mail@1.0.0`), the work was independent rather than a correction to unshipped content, and dropping it would have left the 1.1.0 changelog describing only #70's attachments. Kept, and a dry run confirmed two pending `apple-mail: minor` changesets collapse to one bump rather than stacking.

The *keep* decision held. The **length** did not. The changeset shipped with seven bullets; on 2026-08-12 `dcf8eae` cut the whole changelog 460 lines → 159, this entry included, down to a headline plus one paragraph — and the standard was then written into CLAUDE.md ("A headline line, plus at most one short paragraph… Cut, do not compress").

The convention post-dates the PR, so this was not a violation at the time. It is still the lesson: a changeset is a **release note** answering *does this affect me?*, not a design document. The measurements and rationale belong in `SKILL.md` / `README.md`, which is where someone hits them while working — and unlike a changelog entry, those can be corrected later.

## 7. Open judgement call — the frontmatter `description`

> **Resolved 2026-08-17 — PR #87, merged.** Max approved the change. The description was rewritten
> trigger-first, in the shape `apple-notes` uses: the situations covered — including finding
> old mail in a large or multi-account archive, and the attachment commands — then both
> mechanisms, then the `READ ONLY` qualifier, plus the note that the on-disk path works with
> Mail.app closed. Shipped as a **patch**: no content changed, only the metadata routing to
> it. The rest of this section records the reasoning as it stood when the call was still open.

**Was unresolved, and a one-line change if Max wants it.** `skills/apple-mail/SKILL.md` still declares:

```yaml
description: Read email via Apple Mail.app and AppleScript. …
```

After this PR one of the two documented paths uses **neither** Mail.app nor AppleScript — it reads `.emlx` files off disk with Mail.app closed. The body was updated to name both paths; the frontmatter was not.

Left alone deliberately: "Use when asked to check, search, or read emails" already covers triggering, so the stale half is a mechanism detail rather than a discovery problem. But PR #73 was Max narrowing a description for precision, so this is a field he cares about — flagging rather than deciding. Changing it affects skill activation everywhere, which is not a call to make silently at wrap-up.

That last judgement is the part that did not hold. The approved framing was that the skill **under-triggers** for archive searches — a `description` is the only text loaded before activation, so naming just one of two paths shapes which requests reach the body at all. Flagging rather than deciding was still right; calling the omission cosmetic was not. Neither reading was measured, and a cheap way to settle such a question would be worth having before the next one.

## Smaller notes

- **`pnpm test` still cannot run from a worktree**, for the reason in the kindle log §3: no `node_modules`, and `pnpm install` fires the `postinstall` that copies the worktree's unmerged skills into `~/.claude/skills`. Avoided this time. **CI closes the gap** — `.github/workflows/ci.yml` runs `pnpm install --frozen-lockfile` then `pnpm test` in a disposable container, and it passed. Locally, `pnpm run validate` is pure bash and safe.
- The rebase conflict with #70 was **structural, not semantic** — both PRs appended at the same anchor (immediately before `## Notes`), and no line was edited by both sides. Proven non-destructive by checking that every line #70 added is present verbatim afterwards, rather than by asserting it.
- Beyond ordering, four edits made the merged document argue in one direction: #70's `source of msg` Python fallback now points at the on-disk path, this section points back at **Save attachments** for the one thing a local grep cannot do, an under-claim of mine was corrected ("reserve AppleScript for live queries" is wrong once attachment extraction exists), and the skill's opening line now names both paths.
- `~/Library/Mail/V2/` coexists with `V10/` on this machine but is **empty**, so broadening the search path from `V10` to `~/Library/Mail` is reasoning about version-dir drift across macOS releases, not a tested recovery of legacy mail. Still unverified.
- #70's AppleScript attachment commands were preserved byte-for-byte but not re-run; they were verified by their author against a real mailbox.
- The test fixture is synthetic on purpose — it builds an `.emlx` with a MIME-encoded subject, a folded header, a quoted-printable body and a stubbed attachment part, so the parser is testable without touching anyone's mail. Not wired into `pnpm test`.
- Max merged PR #74 himself at 22:52Z while post-push verification was still running, which is why the GitHub API briefly reported `mergeable: UNKNOWN`.

## Pending

- [x] Max: decide the frontmatter `description` question (§7) — approved, implemented in PR #87, merged 2026-08-17
- [ ] Optional: verify the `V10` → `~/Library/Mail` broadening on a machine with a populated legacy store
