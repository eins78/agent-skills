**Dossier:** Payment Gateway Migration
**Decider:** VP Engineering
**Deadline:** 2 May 2026

---

### Must — before end of year

#### DEC-1 — Which payment provider?
- [ ] A. Stripe
- [ ] B. Braintree

#### DEC-2 — Webhook retry strategy?
- [ ] A. Exponential backoff
- [ ] B. Linear backoff

#### DEC-3 — Add fraud scoring middleware?
- [ ] A. Yes
- [ ] B. No

#### DEC-4 — PCI compliance approach?
- [ ] A. SAQ-A (hosted fields)
- [ ] B. SAQ-D (full cardholder data environment)

#### DEC-5 — Payment method support?
- [ ] A. Cards only
- [ ] B. Cards + SEPA

#### DEC-6 — Currency handling?
- [ ] A. Single currency (EUR)
- [ ] B. Multi-currency

#### DEC-7 — Invoicing format?
- [ ] A. PDF via provider
- [ ] B. Custom HTML invoices

#### DEC-8 — Refund workflow?
- [ ] A. Self-serve refunds via customer portal
- [ ] B. Support-team-only refunds

#### DEC-9 — Dunning strategy?
- [ ] A. 3 automated retries then cancel
- [ ] B. 5 automated retries then flag for manual review

#### DEC-10 — Revenue recognition?
- [ ] A. On charge
- [ ] B. On invoice date

#### DEC-11 — Tax calculation?
- [ ] A. Use provider's tax module
- [ ] B. Integrate with Avalara
