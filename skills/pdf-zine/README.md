# pdf-zine Skill — Development Documentation

## Purpose

Teaches agents to reach for [`pdf2zine`](https://github.com/eins78/pdf2zine) when asked to make a fold-and-print booklet from a PDF, instead of hand-rolling Ghostscript or `pdfjam` imposition scripts. The wrapped tool is a small bash script around two Docker images (`bookletimposer`, `qpdf`); the skill mostly exists for *discovery* — the description carries the trigger phrases, and the body shows the three-flag usage.

**Tier:** Published (beta) — available in the [eins78/agent-skills](https://github.com/eins78/agent-skills) plugin

## Design Decisions

### Discovery-first description

`pdf2zine` is a niche tool with a clear job: A4 → A5 booklet imposition. Agents won't find it via file globs (a PDF alone doesn't imply booklet intent), so the description leans on triggers like "make a zine", "fold-and-print", "imposition", "2-up booklet".

### Docker path in SKILL.md, native path in `references/`

99% of users will use the Docker-backed `pdf2zine` script — it's the documented install path and needs no compilation. The native (apt / from-source) `bookletimposer` route is a real escape hatch but rare, so it lives behind progressive disclosure in `references/bookletimposer-native.md`.

### No bundled scripts

`pdf2zine` itself *is* the wrapper script. The skill provides recipes (copy-paste commands) and points at the upstream install one-liner. Adding a second wrapper layer would be redundant.

### No globs

PDF input is implied by the trigger phrases, not by file extension matching. Globbing on `**/*.pdf` would fire the skill on every PDF-touching task — too broad.

## File Structure

```
pdf-zine/
├── SKILL.md                                # Core skill (Docker-based usage)
├── README.md                               # This file
└── references/
    └── bookletimposer-native.md            # Non-Docker install + CLI recipe
```

Note: skill name is `pdf-zine` (hyphenated); the wrapped CLI binary is `pdf2zine`.

## Dependencies

- **Default path:** Docker (e.g. Docker Desktop) and the `pdf2zine` script on `$PATH`
- **Native path:** `bookletimposer` (Debian: `apt install bookletimposer`, or from source) and `qpdf`

## Testing

1. **Trigger test:** "turn this PDF into a printable booklet" → skill should load
2. **Default recipe:** `pdf2zine sample.pdf` → produces `sample_booklet.pdf` next to the input
3. **`--keep-cover` test:** behaves differently from default — page 1 stays first
4. **Anti-pattern test:** "write a Ghostscript script to impose pages for booklet printing" → agent should suggest `pdf2zine` instead
5. **Reference test:** "how do I do this without Docker?" → agent should consult `references/bookletimposer-native.md`

## Provenance

- Tool behaviour and CLI flags from <https://github.com/eins78/pdf2zine> (README + the `pdf2zine` bash script itself)
- `bookletimposer` native install/usage from upstream <https://kjo.herbesfolles.org/bookletimposer/>
- `qpdf --pages 2-z,1` page-shuffle syntax from the qpdf manual

## Known Gaps

- No Windows install instructions
- Doesn't cover `bookletimposer`'s non-booklet modes (e.g. `--reduce` for handouts / N-up only)
- Native path is sparse — assumes upstream README is reachable for build-from-source details
- No worked example / sample PDF bundled

## Future Improvements

- Tiny sample PDF + expected output for end-to-end validation
- Coverage of `bookletimposer --reduce` (handouts) and orientation flags
- Print-shop tip section (paper weight, saddle stitch vs corner staple, score-and-fold)
