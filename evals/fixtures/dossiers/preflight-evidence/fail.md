## Key Facts

| Field | Value |
|-------|-------|
| Who decides | TBD |
| Deadline | Eventually |
| Audience | Engineering |
| Constraints | Various |
| Claim | Looking into some infrastructure options |

## Executive Summary

This dossier explores the broad space of Kubernetes networking and routing solutions. There are many interesting options in this space, and the landscape is evolving rapidly. We will examine ingress controllers, service meshes, API gateways, and related technologies to get a holistic picture of the available options.

It's worth noting that the right answer depends heavily on context, team maturity, and organizational priorities. We will try to cover all relevant angles without being too prescriptive, since different teams may have different needs.

Various factors should be considered including performance, security, operational complexity, vendor support, community size, and integration with existing tooling. This is a complex topic and we encourage readers to do their own research.

## Recommendations

- Consider Traefik if you prefer newer tooling
- NGINX is battle-tested and has broad adoption
- Envoy Gateway is worth watching
- A service mesh might be more appropriate for some use cases
- Consult your infrastructure team for guidance specific to your environment
- Further research is recommended before making a final decision

## Sources

- Various blog posts and documentation pages
- Community discussions
