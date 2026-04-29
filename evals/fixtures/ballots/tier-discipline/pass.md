**Dossier:** Payment Gateway Migration
**Decider:** VP Engineering
**Deadline:** 2 May 2026

---

### Must — blocks the May 2026 billing release

#### DEC-1 — Which payment provider for the new billing service?

- [ ] A. Stripe — migrate all existing subscriptions via Stripe's migration API
- [ ] B. Braintree — use existing merchant account credentials
- [ ] C. Adyen — requires new merchant onboarding (6–8 week lead time; **blocks deadline**)

*Recommended: A*

---

### Should — blocks release if reviewers disagree

#### DEC-2 — Webhook retry strategy?

- [ ] A. Exponential backoff with 5-retry cap (platform default)
- [ ] B. Linear backoff with dead-letter queue after 10 failures
- [ ] C. No retry; rely on provider idempotency keys + manual reconciliation

*Recommended: A — flag dissent if your team has seen idempotency issues with Stripe webhooks*

---

### Could — informational; signal interest without committing

#### DEC-3 — Add fraud scoring middleware?

- [ ] A. Interested — include in Q3 roadmap
- [ ] B. Not a priority this cycle

*No recommendation; depends on risk appetite*
