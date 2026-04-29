**Dossier:** Managed Redis Provider Selection — [internal wiki link omitted for review]
**Decider:** Backend Lead
**Deadline:** 5 May 2026
**Context:** We're migrating our session cache and rate-limiter from self-hosted Redis 6 to a managed provider. The dossier evaluated Upstash, Redis Cloud, and AWS ElastiCache.

---

### DEC-1 — Which managed Redis provider for session cache and rate-limiter?

*Single-select. This decision gates the June infrastructure migration.*

**Must — before June 2026 migration begins**

- [ ] A. **Upstash** — serverless, per-request billing, HTTP API works from Edge Functions; ~$60/mo at current request volume
- [ ] B. **Redis Cloud** — managed Redis with persistent connections; $120/mo for equivalent throughput; requires VPC peering
- [ ] C. **AWS ElastiCache** — lowest latency if already on AWS VPC; $200/mo reserved; highest operational overhead

*Recommended: A — Upstash fits the serverless-first architecture and stays under budget*

---

### DEC-2 — Fallback strategy if managed provider has an outage?

*Single-select. Affects reliability SLA for session-dependent endpoints.*

**Should — agree before migration; flag dissent if on-call team has concerns**

- [ ] A. **Graceful degradation** — endpoints requiring session auth return 503; rate-limiter falls back to allow-all
- [ ] B. **Local in-process cache** — 5-minute TTL fallback; risk of stale session data across instances
- [ ] C. **No fallback** — accept downtime; session loss is acceptable per current SLA

*Recommended: A*
