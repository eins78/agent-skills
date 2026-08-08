---
"@eins78/agent-skills": minor
---

**`pandoc`** — `md2kindle-epub.sh` no longer emits EPUBs without a title.

`dc:title` is a **required** element of the EPUB package metadata, but the script treated `--title` as optional and set no metadata when it was omitted. Pandoc then produced a spec-invalid book, silently. Send-to-Kindle rejects such a file and reports it as a generic internal error that names no defect, so the cause is easy to miss — a title-less build bounced twice, 3.5 hours apart, while every titled build from the same generator was accepted. The script now derives a title from the first H1 of the first input, falling back to the de-slugified output filename, and echoes which it used.

**`send-to-kindle`** — adds delivery verification and documents the `E999` failure mode.

- **New section: "Confirming delivery — sending is not delivering."** Kindle ingress validation is asynchronous: Amazon accepts the SMTP transaction, validates afterwards, and reports failure by email ~30–60s later. Every signal available at send time — the client reporting "sent", the outbox draining to 0, the subject appearing in the sent mailbox — proves only that the mail *left*. A table maps each to what it actually establishes, ending at the one real signal: no bounce after a few minutes. Scripted senders sharpen the trap, since an AppleScript `send` returns on *queue* and a script checking immediately after reports success unconditionally.
- **`E999 - Send to Kindle Internal Error` documented as a rejection to investigate, not a hiccup to retry.** The wording reads as transient; in the observed case it was a real spec violation. The prescribed response is to run `epubcheck` first, fix any REQUIRED-element violation, rebuild, and resend.
- **Two findings that only the validator surfaces.** Error *count* does not predict rejection — accepted files in the same batch also failed `epubcheck`, with broken internal links and undefined fragment identifiers, and Amazon took them anyway. And surface plausibility misleads: the twice-failing file was the smallest and structurally simplest of the batch and passed `unzip -t`. Triage by REQUIRED-ness, not by error count or by eyeballing.
- **The two silences distinguished.** "Nothing arrived, no bounce" is an allowlist problem (Amazon drops unapproved senders wordlessly). "Nothing arrived, plus a bounce" means the sender is approved and the rejection happened downstream. Opposite responses; a bounce is mildly good news about your configuration.
