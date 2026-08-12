---
"@eins78/agent-skills": minor
---

**`pandoc`** — `md2kindle-epub.sh` no longer emits EPUBs without a title.

`dc:title` is required EPUB metadata, but `--title` was optional and its absence produced a spec-invalid book silently. The script now derives a title from the first H1 of the first input, falling back to the output filename.

**`send-to-kindle`** — adds delivery verification and documents the `E999` failure mode. Kindle ingress validates asynchronously, so every signal available at send time proves only that the mail left; the one real signal is no bounce after a few minutes.
