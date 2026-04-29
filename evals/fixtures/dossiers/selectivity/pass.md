## Key Facts

| Field | Value |
|-------|-------|
| Who decides | CTO |
| Deadline | 15 May 2026 |
| Audience | Backend leads |
| Constraints | Must integrate with existing Kafka pipeline; budget ≤$500/mo |
| Claim | Which managed Postgres provider for the billing service migration |

## Recommendations

1. **Use Neon** for the billing service: serverless branching enables safe migration testing; $340/mo at current write volume fits budget.
2. **Set a 90-day review checkpoint** at August 2026 to reassess once autoscaling behavior is understood under peak billing load.

## Further Reading

- Neon branching documentation — [neon.tech/docs/introduction/branching](https://neon.tech/docs/introduction/branching)
- PlanetScale migration guide (evaluated but not selected) — [planetscale.com/docs/tutorials/import-tool-migration-guide](https://planetscale.com/docs/tutorials/import-tool-migration-guide)
