---
"@eins78/agent-skills": minor
---

**`apple-notes`** — a note's body is not its contents. Adds attachment listing, and the rule that stops a failed search becoming a false conclusion.

Every script in this skill read note *bodies*. Attachments are separate rows in the Notes database, linked back to the note, so a body read — by AppleScript or any other route — cannot see them. The skill had no way to answer "what is attached to this note?", which made it possible to search a note, find nothing, and conclude the document wasn't there.

That is not hypothetical. An agent was asked to fetch a named PDF from a note, searched the body, found only a passing mention in a to-do list, concluded the source did not exist, and used a similar-looking PDF from a *different* note instead. The resulting work was internally consistent and correctly attributed — to the wrong document, which is the hardest kind of wrong to notice afterwards. The note did have the PDF. It was one of four attachments, all titled `PDF`.

- **New `scripts/list-attachments.sh`.** Lists every attachment on matching notes with its type, title and identifying text; `--paths` also resolves the on-disk file.
- **Scanned documents are identified by their OCR text, not by name.** Anything scanned in the app (`com.apple.paper.doc.pdf`) is titled literally `PDF` with no filename — 17 of 17 in the library this was built against — so four scanned recipes on one note render as four identical rows, and filtering by title finds nothing *while looking thorough*. Notes stores the text it recognises in `ZOCRSUMMARY`, so the distinguishing first line is usually a column read rather than a PDF extraction. Coverage is uneven in a way that matters: measured by UTI, scans are 31 of 32 populated and images ~100%, but **PDFs added from the file picker (`com.adobe.pdf`) are 0 of 179** — Notes recognises what it renders itself and never a file you attached. Those, however, carry real titles. So a scan is identified by its text and a file PDF by its name, the two gaps cover each other, and an empty text column means "identify this one another way" rather than "nothing here". That partial success is exactly what makes the trap misleading.
- **The two on-disk layouts are documented, including the one that fails silently.** Scans live at `FallbackPDFs/<attachment-id>/<generation>/FallbackPDF.pdf`; everything else at `Media/<media-row-id>/<filename>` — keyed by the **linked media row's** identifier, with the filename on that row, because the attachment row's own `ZFILENAME` is always null. Joining the attachment row instead yields no path and no error.
- **Reads SQLite rather than AppleScript, deliberately.** `get name of every attachment of note "…"` hung indefinitely, and a shell-level `timeout 30` did not kill it — the process survived `SIGTERM` while blocked on the Apple Event, which is the one failure mode this skill's existing retry guidance cannot recover. The database path also resolves file paths and keeps working while the bridge is wedged. It needs Full Disk Access instead of Automation; both are now listed per-script.
- **States the general rule.** A body search returning nothing is evidence about the search, not about the note. Never substitute a similar file found elsewhere — a plausible substitute is worse than an empty result, because nothing downstream can tell it was the wrong one.

<!--
bumps:
  skills:
    apple-notes: minor
-->
