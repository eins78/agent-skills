## Executive Summary

This dossier evaluates three time-series databases for IoT telemetry storage. Sources include vendor documentation, independent benchmarks from TimescaleDB community research [S3], and a neutral comparison from Percona [S4]. Two sources are vendor-produced; both are annotated below.

**Recommendation:** InfluxDB OSS 3.0 for new deployments. TimescaleDB for teams already on PostgreSQL.

## Recommendations

- **InfluxDB OSS 3.0** [S1]: strong ingest performance; no licensing cost for self-hosted.
- **TimescaleDB** [S2]: best fit if the team already operates PostgreSQL; compression ratios favorable for irregular data.
- **QuestDB**: strong read latency for time-range queries; smaller community, higher operational risk.

## Sources

- [S1] InfluxDB 3.0 product page — [influxdata.com/products/influxdb](https://influxdata.com/products/influxdb) ⚠️ *Vendor source: InfluxData marketing page. Claims about ingest throughput are corroborated by [S3].*
- [S2] TimescaleDB documentation — [docs.timescale.com](https://docs.timescale.com) ⚠️ *Vendor source: Timescale Inc. official documentation. Compression figures independently verified in [S3].*
- [S3] TimescaleDB community benchmark 2025 — [community.timescale.com/t/benchmark-2025](https://community.timescale.com/t/benchmark-2025) — independent community benchmark
- [S4] Percona time-series comparison — [percona.com/blog/time-series-comparison-2025](https://percona.com/blog/time-series-comparison-2025) — neutral third-party analysis
