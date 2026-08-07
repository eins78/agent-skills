# send-to-kindle Skill — Development Documentation

## Purpose

Carries the service and device knowledge needed to get a document onto a
Kindle: which delivery routes still work, what format to produce, and the two
failure modes that produce no error message (silently-dropped mail from an
unapproved sender, and per-device addressing selected by a misleading display
name). It also records the one hard limit — highlights on personal documents
never reach the cloud.

The skill stops short of sending. It documents the manual email step in three
facts and ships no sender code.

**Tier:** Published (beta) — available in the
[eins78/agent-skills](https://github.com/eins78/agent-skills) plugin

## Design Decisions

### Separate from `pandoc`, not folded into it

`pandoc` owns file *production* (`scripts/md2kindle-epub.sh` makes the EPUB);
this skill owns *delivery*. The split is not tidiness — it is versioning.
Amazon's ingestion behaviour changed four times between 2022 and 2026 (MOBI
input dropped, EPUB input added, USB download of purchased books removed,
Word's button retired). Facts with that shelf life need their own version and
changelog. Folding them into `pandoc` would version-bump a document-conversion
skill every time Amazon moves something unrelated to pandoc.

### Generic knowledge only, by an explicit test

The dividing line applied throughout: *would a stranger installing this from
the marketplace change a **value** or the **logic**?* Values are personal and
stay out.

| Carried here | Deliberately absent |
|---|---|
| Routes and their 2026 status | Any `…@kindle.com` ingress address |
| Per-device addressing as a *rule* | Which devices exist, their serials, their names |
| The allowlist exists and drops mail silently | Which sender addresses are on it |
| Highlights are one-way | Any keychain account name |

Nothing personal is referenced *indirectly* either: there is deliberately no
configuration contract for sending — no env vars, no config file, no keychain
lookups. A configuration spec that no code reads would document an interface
that does not exist. If a sender is ever built, its contract gets designed
then, against real code.

### No sending, by decision not by omission

Documented in SKILL.md under "What this skill deliberately does not do" so a
future session does not read the gap as an oversight and helpfully fill it.

### Statuses are date-stamped in the body

Every route table says "as of 2026-08" in the heading rather than relying on
the git log. A skill installed from a marketplace has no git log.

### No globs

Nothing about a file's extension implies e-reader intent. Description triggers
carry the discovery load.

## File Structure

```
send-to-kindle/
├── SKILL.md       # Format choice, routes, the three send facts, size limits, highlights
└── README.md      # This file
```

No scripts, no references, no themes — see "No sending" above. The one script
in this pipeline (`md2kindle-epub.sh`) lives with the `pandoc` skill.

## Dependencies

None. This is a reference skill — no binaries, no services, no credentials.

The companion `pandoc` skill needs pandoc 3.x to produce the EPUB. The USB
route mentions Calibre for local AZW3 conversion, but that path is documented,
not automated.

## Testing

1. **Trigger test:** "how do I get this onto my Kindle?" → skill should load
2. **Trigger test (failure symptom):** "I emailed a file to my Kindle and it
   never arrived" → skill should load and surface the approved-sender rule
   before suggesting anything else
3. **Format test:** "make a PDF for my Kindle" → agent should push back toward
   EPUB and give the reflowable-vs-fixed reason
4. **Composition test:** "convert this markdown and send it to my Kindle" →
   agent should use the `pandoc` skill's `md2kindle-epub.sh` for the file and
   this skill for the delivery step, and should *not* invent a sender script
5. **Boundary test:** "automate sending this to my Kindle every morning" →
   agent should state that no sender exists and that building one is a
   decision, not a chore
6. **Highlights test:** "sync my Kindle highlights from that document to
   Readwise" → agent should identify this as structurally impossible for
   personal documents, not attempt a workaround

The delivery pipeline itself was verified end-to-end on 2026-08-06 (see
Provenance) — samples were mailed to a real device and rendered correctly.
That verification happened outside this repo and is not reproducible from it.

## Provenance

Every fact traces to a research dossier produced 2026-08-06 in the author's
private workspace, at `research/2026-08-06-kindle-delivery/`. **That directory
is not part of this repository** and is not publicly available; it is cited
here for the author's own audit trail.

Within it, the load-bearing sources were:

- Route statuses and the pre-2013 wireless cutoff: The Ebook Reader blog
  (2026-04-13, 2026-06-12) and Good e-Reader (2025), both quoting Amazon's own
  help pages
- EPUB accepted but converted server-side: TechRadar, plus Vellum's
  contemporaneous 2022 write-up of the EPUB-acceptance rollout
- Personal-document highlights excluded from the cloud Notebook: MobileRead
  forum consensus, corroborated by Readwise's own scope documentation
- Size ceilings: a single community guide (see Known Gaps)
- Per-device addressing and the silent-drop behaviour: confirmed in practice
  on 2026-08-06 when the samples were sent

**Evidence-quality caveat carried over from the dossier:** Amazon's own
`amazon.com/gp/help/...` pages returned HTTP 503 to every automated fetch
attempted during that research — direct curl, headless Chrome, and a reader
proxy alike. Amazon-sourced statements here are corroborated through search
snippets and independent trackers, not read directly from the vendor.

## Known Gaps

- **The ~50 MB email ceiling is community-sourced and unverified** against an
  official page. Flagged as such in SKILL.md rather than stated flatly. A
  30-second check on the Personal Document Settings page would settle it.
- **No sender automation** — deliberate, see Design Decisions. Building one
  would be a new capability with its own transport decision to make, not a
  chore left undone here.
- **No `My Clippings.txt` parser** — deliberately deferred. The format is a
  well-documented plain-text convention, so this is a small follow-up when
  there are real clippings to parse, not a research question.
- **Whether the device's format conversion preserves HTML `<input>` elements
  is untested.** The `pandoc` wrapper sidesteps it by emitting literal `[ ]`
  text; nobody has confirmed what happens if you don't.
- **Amazon-specific.** Kobo, reMarkable, and Pocketbook all have their own
  ingestion stories and none of them are covered here.
- No coverage of the Kindle's own document management (collections, deleting
  personal documents from the cloud, re-delivery to a second device).

## Future Improvements

- Re-verify the route table when a dated claim ages past ~12 months, or on the
  next observed breakage
- Fold in Kobo / reMarkable delivery if a second device type ever enters use,
  or rename the skill if it stops being Kindle-specific
- A `My Clippings.txt` parser, at the point where clippings actually exist
