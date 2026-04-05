# Source Strategy by Domain

Consult this during SCOPE (Phase 1) to plan the gather strategy. This is a **reference for inspiration**, not a checklist. Design source plans per-topic. Unknown domains default to WebSearch + community signal.

## Domain → Source Mapping

| Domain | Primary Sources | Community Signal | Specialized |
|--------|----------------|-----------------|-------------|
| **Self-hosted software** | GitHub repos, official docs, Docker Hub | Reddit [r/selfhosted](https://reddit.com/r/selfhosted), [HN](https://news.ycombinator.com), [Lemmy](https://lemmy.world) | Docker Hub pulls, blog benchmarks, [awesome-selfhosted](https://github.com/awesome-selfhosted/awesome-selfhosted) |
| **Consumer electronics** | Manufacturer sites, spec sheets | Reddit product subs, YouTube reviews | [Wirecutter](https://www.nytimes.com/wirecutter/), [Rtings](https://www.rtings.com/), [DxOMark](https://www.dxomark.com/) |
| **Travel** | Official tourism sites, booking platforms | [Reddit r/travel](https://reddit.com/r/travel), [TripAdvisor](https://www.tripadvisor.com/), travel blogs | [Google Maps](https://maps.google.com/), [SeatGuru](https://www.seatguru.com/), [Rome2Rio](https://www.rome2rio.com/) |
| **Health/nutrition** | [PubMed](https://pubmed.ncbi.nlm.nih.gov/), [WHO](https://www.who.int/), .gov sites | Reddit health subs (cautiously) | [Examine.com](https://examine.com/), [Cochrane](https://www.cochranelibrary.com/), UpToDate |
| **Policy/regulation** | Government gazettes, legal databases | News outlets, think tanks | [OECD](https://www.oecd.org/), [EUR-Lex](https://eur-lex.europa.eu/) |
| **Art/design** | Gallery sites, artist portfolios | [Behance](https://www.behance.net/), [Dribbble](https://dribbble.com/), Instagram | Museum databases, auction records |
| **Finance/investing** | Regulatory filings, exchange data | [Reddit r/investing](https://reddit.com/r/investing), [Bogleheads](https://www.bogleheads.org/) | [Morningstar](https://www.morningstar.com/), Bloomberg |
| **Food/recipes** | Cookbook databases, food blogs | [Reddit r/cooking](https://reddit.com/r/cooking), YouTube | [Serious Eats](https://www.seriouseats.com/), Paprika library |
| **Open source** | GitHub, package registries ([npm](https://www.npmjs.com/), [PyPI](https://pypi.org/)) | HN, Reddit, blog posts | npm/PyPI download stats, [Snyk](https://snyk.io/), [Socket](https://socket.dev/) |
| **Swiss-specific** | [admin.ch](https://www.admin.ch/), cantonal sites | [local.ch](https://www.local.ch/), [Reddit r/askswitzerland](https://reddit.com/r/askswitzerland) | [SBB](https://www.sbb.ch/), [Comparis](https://www.comparis.ch/), [Digitec](https://www.digitec.ch/) |
| **Vehicles/automotive** | Manufacturer specs, dealer sites | Reddit car subs, YouTube | [TCS](https://www.tcs.ch/), ADAC, [Autovisual](https://www.autovisual.ch/) |
| **Home/garden** | Retailer sites, manufacturer docs | Reddit, YouTube how-tos | [IKEA](https://www.ikea.com/), [Hornbach](https://www.hornbach.ch/), local hardware stores |
| **Music/audio** | Label sites, streaming platforms | Reddit music subs, YouTube, forums | [Discogs](https://www.discogs.com/), [Bandcamp](https://bandcamp.com/), [ASR](https://www.audiosciencereview.com/) |
| **Software dev tools** | Official docs, GitHub | HN, Reddit r/programming, dev blogs | [ThoughtWorks Radar](https://www.thoughtworks.com/radar), [StackShare](https://stackshare.io/) |

## Source Quality Weighting

When synthesizing findings, weight by source quality:

| Weight | Source type | Why |
|--------|-----------|-----|
| **Highest** | Official docs, specs, regulatory filings | Authoritative, verifiable |
| **High** | Community with engagement signals (upvotes, stars, views) | Crowd-validated |
| **Medium** | Expert blog posts, comparison articles | Informed but single-perspective |
| **Lower** | News coverage, marketing materials | May have bias or lack depth |
| **Lowest** | AI-generated content, SEO articles | Often superficial or recycled |

Cross-source signals are strongest: an item praised on Reddit AND HN AND official docs is high-confidence.

## last30days Integration

| Topic has... | Use last30days? | Why |
|-------------|----------------|-----|
| Active community (OSS, consumer, trending) | Yes — run first | Social signal seeds deeper research |
| Niche technical audience | Maybe — try, pivot if <3 results | May surface HN/Reddit threads |
| B2B, enterprise, policy | No | Low social media signal |
| Academic, historical | No | Not in 30-day window |
