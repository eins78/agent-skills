---
"@eins78/agent-skills": minor
---

**`send-to-kindle`** — adds delivery verification and documents the `E999` failure mode.

- **New section: "Confirming delivery — sending is not delivering."** Kindle ingress validation is asynchronous: Amazon accepts the SMTP transaction, validates afterwards, and reports failure by email ~30–60s later. So every signal available at send time — the client reporting "sent", the outbox draining to 0, the subject appearing in the sent mailbox — proves only that the mail *left*. A table maps each of those to what it actually establishes, ending at the one real signal: no bounce after a few minutes.
- **Scripted senders make this trap worse.** An AppleScript `send` returns as soon as the message is *queued*, so a script that checks immediately afterwards reports success unconditionally. This is exactly how three sends were reported as delivered when all three had bounced.
- **`E999 - Send to Kindle Internal Error` documented, with the recovery that actually works.** It is Amazon's generic internal error and names no defect in the document — but it is not simply transient either. Observed across six sends in one morning (three delivered, three bounced, all EPUBs from one generator): rebuilding from source and resending succeeded, while resending the **byte-identical** file 3.5 hours later bounced again in 16 seconds. The guidance is therefore *rebuild and resend*, not *retry the same bytes* — and explicitly not *go hunting for a format defect*, since the twice-failing file was the smallest and structurally simplest of the batch and passed zip integrity.
- **The two silences distinguished.** "Nothing arrived and no bounce" is an allowlist problem (Amazon drops unapproved senders wordlessly). "Nothing arrived and a bounce" means the sender is approved and the rejection happened downstream. They need opposite responses, and a bounce is mildly good news about your configuration.
- Three new Common Mistakes rows covering `E999`, the outbox-check false positive, and the existing allowlist case.
