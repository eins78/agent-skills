## Key Facts

| Field | Value |
|-------|-------|
| Who decides | CTO |
| Deadline | 15 May 2026 |
| Audience | Backend leads |
| Constraints | Must integrate with existing Kafka pipeline; budget ≤$500/mo |
| Claim | Which managed Postgres provider for the billing service migration |

## Recommendations

1. Use Neon for the billing service.
2. Consider PlanetScale for future MySQL workloads.
3. Evaluate CockroachDB for global distribution requirements.
4. Review Supabase for teams that also need Auth and Storage.
5. Watch the Turso (libSQL) space for edge deployments.

## Further Reading

- Neon docs — 12 links across architecture, branching, logical replication, monitoring, connection pooling, backups, point-in-time recovery, extensions, import tools, CLI reference, pricing, and enterprise SLAs
- PlanetScale comparison — 8 links covering sharding, Vitess internals, migration tooling, schema change workflows, CLI, branching model, deploy requests, and revert operations
- CockroachDB whitepaper — distributed SQL architecture, MVCC, consensus protocols, geo-partitioning, multi-region active-active, follower reads, CDC, and change data capture pipelines
- Supabase architecture overview — PostgREST, GoTrue, Realtime, Storage, Edge Functions, Studio, self-hosting, and Docker Compose setup
- Historical context: how Amazon RDS shaped the managed Postgres market from 2013–2020
- Database-per-service vs shared database patterns in microservices architectures
- CAP theorem refresher and its implications for billing system consistency guarantees

## Appendix A: Full Benchmark Data

*[245 lines of raw pgbench output, latency percentiles, connection pool behavior under 100/500/1000 concurrent connections, and flamegraph analysis of query planner decisions — none referenced in §Recommendations]*
