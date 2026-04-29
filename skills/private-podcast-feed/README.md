# private-podcast-feed — Development Documentation

## Purpose

Publishes a private MP3+RSS feed for self-subscription. Covers the critical
patterns for `podcast@2.0.1`, `itunes:block` via `customElements`, token-prefixed
URLs, ID3 CHAP/CTOC chapter injection, and the Overcast refresh ping.

**Tier:** Publishable — reusable across projects.

## Installation / Dependencies

- **Node.js** with `pnpm` (or `npm`)
- **podcast@2.0.1:** `pnpm add podcast`
- **mutagen** (ID3 chapters): `uv pip install mutagen`
- **ffmpeg:** `brew install ffmpeg`
- **xmllint** (sanity check): `brew install libxml2` (usually pre-installed on macOS)

## Usage

```bash
# Generate a token
openssl rand -hex 16 > .token

# Build the feed
pnpm tsx generate-feed.ts > public/p/$(cat .token)/feed.xml

# Ping Overcast after publishing
./scripts/ping-overcast.sh https://your-host.com/p/$(cat .token)/
```

See `templates/generate-feed.ts.example` for the feed generation skeleton.

## Origin / Provenance

Extracted from `eins78/home-workspace` experiments/tts-shootout/,
commits 1df3d9b–fd167b1 (Rounds 4–5, 2026-04).

Key patterns extracted:
- `podcast@2.0.1` named export (default export fails at runtime — R3 gotcha)
- `customElements: [{ "itunes:block": "Yes" }]` — the typed `FeedITunes` interface
  omits `itunesBlock`, so `customElements` is the only correct path
- Token-prefixed URL for URL obscurity (NOT cryptographic auth)
- ID3 CHAP/CTOC injection via mutagen — required for Overcast chapter skip-ahead
- Overcast ping — idempotent, safe on every publish

## Future Improvements

- **`id3-chapters` split candidate:** The `inject_chapters.py` pattern (mutagen
  CHAP/CTOC) is useful beyond podcast feeds for any long-form MP3. Extract as a
  standalone skill if non-podcast audio use cases emerge.
