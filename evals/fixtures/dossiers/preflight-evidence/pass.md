## Key Facts

| Field | Value |
|-------|-------|
| Who decides | Head of Platform Engineering |
| Deadline | 30 April 2026 |
| Audience | Platform team leads |
| Constraints | Must support existing Kubernetes clusters; no vendor lock-in |
| Claim | Evaluating three ingress controllers for multi-tenant SaaS workloads |

## Executive Summary

This dossier evaluates three Kubernetes ingress controllers — NGINX Ingress, Traefik v3, and Envoy Gateway — for use in a multi-tenant SaaS platform serving 50+ enterprise customers. The evaluation is bounded to production-readiness, multi-tenancy isolation, and operational overhead; API gateway features and service mesh integration are out of scope.

**Recommendation:** Traefik v3 for greenfield clusters; NGINX Ingress for clusters already running it. The multi-tenancy isolation model in Traefik's IngressRoute CRD eliminates the namespace-annotation footgun that caused the Q1 2026 tenant data leak in cluster-prod-02.

## Recommendations

- **Deploy Traefik v3** on all new clusters provisioned after 2026-05-01.
- **Retain NGINX Ingress** on existing clusters; migrate opportunistically during Q3 maintenance windows.
- **Reject Envoy Gateway** for this use case: 3 of 5 evaluated features require alpha CRDs not suitable for production.

## Sources

- [S1] Traefik v3 release notes — [traefik.io/blog/traefik-proxy-v3-rc](https://traefik.io/blog/traefik-proxy-v3-rc)
- [S2] NGINX Ingress multi-tenancy guide — [kubernetes.github.io/ingress-nginx](https://kubernetes.github.io/ingress-nginx/user-guide/multiple-ingress/)
- [S3] CNCF Envoy Gateway maturity assessment — [gateway.envoyproxy.io/docs/tasks/quickstart](https://gateway.envoyproxy.io/docs/tasks/quickstart/)
- [S4] Internal postmortem Q1 2026 — cluster-prod-02 tenant data leak (internal link)
