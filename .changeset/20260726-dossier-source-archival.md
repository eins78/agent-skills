---
"@eins78/agent-skills": minor
---

`dossier`: capture cited sources for offline verification. Until now the skill
archived nothing — every citation was a bare URL, while the reviewer checklist
named "URLs that 404 when spot-checked" as a red flag in two separate items
without prescribing any remedy. GATHER now captures each source as its URL is
collected, into a `sources/` folder beside the dossier with an `index.md`
mapping every file back to its citation ID, original URL, access date, and
content hash.

Tool selection is evidence-based, not assumed — see the cited dossier at
`research/2026-07-26-source-archival/`. The headline finding is that `wget`,
the obvious first guess, is the wrong tool twice over: its `--quota` provably
cannot cap a single-file download (GNU manual: *"quota will never affect
downloading a single file"*, reproduced locally) and it is not installed on
stock macOS, where `curl` is the Apple-shipped binary. The ladder is therefore
`monolith` → `curl` (the floor, never absent) with `pandoc` layered on top for
text extraction. `wget --mirror` is rejected outright rather than capped:
recursion is the gigabyte failure mode, and verification needs the cited page,
not the site. `ArchiveBox`, `httrack`, `single-file-cli` and `percollate` are
evaluated and declined as dependencies for portability reasons.

Nothing is required beyond `curl` and `awk`, both shipped by every relevant OS.
`monolith` and `pandoc` are detected at runtime; their absence degrades quality,
never function. Capture never fails a dossier — an unreachable host, a 403, or
an over-cap response becomes an index row recording what happened. Bounds are
explicit: depth 0 with no recursion knob, 5 MB and 20 s per source, 100 sources
and 100 MB per dossier.

Two limitations are surfaced rather than hidden. JS-rendered pages cannot be
captured without a browser, so captures are probed with a portable awk
text-length measure (validated against real pages: a JS shell scores ~469
characters where every server-rendered page tested scored above 4,000) and
flagged `thin-capture`, pointing at `single-file-cli` as the manual remedy.
And **Save Page Now is opt-in only** — it submits a URL to a permanent public
archive, so defaulting it on would publish the author's reading list one source
at a time. The read-only availability lookup, which publishes nothing, is the
default instead.

Also adds the `sources-index-consistency` gate (every index row resolves to a
file, every captured file has a row; silent when there is no archive) and
review-checklist item 10.

<!--
bumps:
  skills:
    dossier: minor
-->
