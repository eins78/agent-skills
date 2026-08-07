---
name: send-to-kindle
description: >-
  Use when getting a document onto an Amazon Kindle — which delivery routes
  still work, what format to produce, and why a delivery can silently fail.
  Kindle-only; nothing here applies to Kobo, reMarkable or other e-readers.
  Triggers: send to Kindle, put this on my Kindle, read on Kindle, Kindle
  email address, sendtokindle, personal documents, sideload EPUB, Kindle
  didn't receive it, kindle.com address, Kindle highlights, My Clippings.
globs: []
compatibility: claude-code, cursor
license: MIT
metadata:
  author: eins78
  repo: https://github.com/eins78/agent-skills
  version: "0.1.0"
---

# send-to-kindle

Delivering a document to a Kindle. Covers what to produce, how it gets there,
and the two failure modes that give no error message.

Producing the file is the `pandoc` skill's job —
`scripts/md2kindle-epub.sh` turns markdown into a suitable EPUB. This skill
starts at "the file exists".

**Everything below is service behaviour, and it moves.** Between 2022 and 2026
Amazon stopped accepting MOBI, started accepting EPUB, killed USB download of
purchased books, and retired Word's Send-to-Kindle button. Statuses here are
**as of 2026-08**; re-verify before relying on a dated claim.

## Produce EPUB, not PDF

| | |
|---|---|
| **EPUB** | Reflowable — text re-wraps to the reader's font size and margins. Kindles do not render EPUB natively; Send-to-Kindle converts it server-side into the device's own format (KFX/AZW3) on delivery, which is what buys reflow, resizable type, and a native TOC. Free, no local tooling. |
| **PDF** | Fixed-layout. A PDF page is a fixed canvas — on a 6" screen it either shrinks to illegible or needs constant pan/zoom. Right for print, wrong for reading. An A5 print booklet is roughly 60% wider than a Paperwhite's visible area. |
| **MOBI / AZW** | Not accepted as *input* since August 2022. Don't reach for an old MOBI recipe. |
| **AZW3 (locally converted)** | Only needed for the USB path — see below. |

## Delivery routes (status as of 2026-08)

| Route | Status | Notes |
|---|---|---|
| **Send-to-Kindle email** (`…@kindle.com`) | Works | The default. Wireless, works over a phone hotspot. See the three facts below |
| **Web upload** (sendtokindle.com, drag-and-drop) | Works | Manual, but no sender allowlist to trip over |
| **Kindle mobile app → "Import file"** | Works | Only useful if the reader reads on the phone |
| **USB sideload into `documents/`** | Works | A raw `.epub` copied over USB is **not indexed** by the Kindle library — convert to AZW3 locally first (e.g. Calibre). Email delivery gets that conversion for free. Unaffected by the 2025 removal of USB *download* for purchased Kindle Store books, which is a different thing |
| **Send to Kindle desktop app** | Being retired | Kindle for PC and the Windows desktop app shut down 2026-06-30. Email and web upload do not depend on it |
| **Send to Kindle from Microsoft Word** | Retired 2026-02-09 | The button is gone; web upload is unaffected |
| **Wireless delivery to older hardware** | Cut off for pre-2013 devices | The May-2026 cutoff hit Paperwhite 1 and older only. 2018-era hardware and newer keep full wireless delivery |

## Sending by email — three facts

1. **Send the file as an email attachment** to the reader's Send-to-Kindle
   address. Nothing else in the message matters.
2. **Addresses are per device, not per account.** An account with several
   registered Kindles has a separate ingress address for each, so delivery is
   granular. Amazon-facing *device names* are user-set and can be misleading —
   pick the target by a stable identifier (the address itself, or the device
   serial), never by display name.
3. **The sender address must be pre-approved** on the account's Approved
   Personal Document E-mail List. Mail from an unapproved sender is **dropped
   silently — no bounce, no error, no delivery.** This is the single most
   likely cause of "I sent it and nothing arrived".

The allowlist is separate from the ingress address; both live under
*Manage Your Content and Devices → Preferences → Personal Document Settings*.

## Size ceilings

| Route | Ceiling |
|---|---|
| Email attachment | **~50 MB** — widely-circulated community figure, not confirmed against an official Amazon page. Verify on the Personal Document Settings page if it matters |
| Web upload | ~200 MB, same caveat |

Text documents will not come near either. A document bundling archived source
captures plausibly could.

## Highlights only come back one way

Anything delivered via Send-to-Kindle is a **personal document**, not a Kindle
Store purchase, and Amazon's cloud highlight ecosystem is structurally closed
to it:

| Route | Covers personal documents? |
|---|---|
| `documents/My Clippings.txt` on the device | **Yes — the only route.** Plain text, trivially parseable, but retrieval requires physically connecting the device over USB. No wireless path exists for this file |
| `read.amazon.com/notebook` (web Notebook) | No — Kindle Store purchases only |
| Per-book "Export Notes and Highlights" | No — same scope, and manual anyway |
| Readwise | No — its docs explicitly exclude files sent via Send-to-Kindle |

So the USB cable is not a convenience fallback here; it is the only mechanism.
Plan around a manual step, or do not promise highlight round-tripping.

## Common Mistakes

| Symptom | Cause | Fix |
|---------|-------|-----|
| Sent it, nothing arrived, no bounce | Sender not on the approved list | Add the exact sending address under Personal Document Settings |
| Arrived on the wrong person's Kindle | Targeted by device display name | Target by ingress address or serial; names are user-set and often stale |
| Reader has to pan and zoom every page | A PDF was sent | Send EPUB and let Send-to-Kindle convert it |
| Copied an `.epub` over USB, it never appears in the library | Raw EPUB isn't indexed on-device | Convert to AZW3 locally, or use email delivery instead |
| Checkboxes render as blank gaps | Task-list HTML `<input>` elements were emitted | See the `pandoc` skill — build the EPUB with `task_lists` disabled |
| Waiting for highlights to sync | Personal documents never reach the cloud | USB + `My Clippings.txt`, or nothing |

## What this skill deliberately does not do

- **It does not send anything.** No sender script, no AppleScript, no SMTP
  helper, and no configuration contract for one. The send step is the three
  facts above, performed by a human in a mail client.
- **It carries no addresses.** Ingress addresses, approved senders, device
  serials, and keychain account names are personal values that belong in the
  operator's own private workspace, never in a published skill.
