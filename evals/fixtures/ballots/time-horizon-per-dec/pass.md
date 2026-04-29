**Dossier:** Kubernetes Ingress Controller Selection
**Decider:** Head of Platform Engineering
**Deadline:** 30 April 2026

---

### DEC-1 — Which ingress controller for new clusters?

*Single-select. Affects clusters provisioned from May 2026 onward.*

**Must — before first cluster provisioned post-May-2026**

- [ ] A. Deploy Traefik v3 on all new clusters
- [ ] B. Deploy NGINX Ingress on all new clusters
- [ ] C. Evaluate further; no new clusters until Q3

*Recommended: A*

---

### DEC-2 — Migration timeline for existing NGINX clusters?

*Single-select. Affects 4 production clusters currently running NGINX Ingress.*

**Should — before Q3 maintenance window**

- [ ] A. Migrate all 4 clusters to Traefik v3 during Q3 maintenance window
- [ ] B. Migrate opportunistically as clusters are recreated; no forced migration
- [ ] C. Keep NGINX permanently; standardize on dual-controller support

*Recommended: B*
