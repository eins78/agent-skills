# Compact A4 Print — Test Fixture

This file exercises the `md2pdf-print.sh` recipe against the four things
that historically broke print pipelines on macOS:

1. **English ASCII** with bold, *italic*, and `inline code`.
2. **Japanese**: `JR Clement Inn Takamatsu / JRクレメントイン高松` —
   〒760-0011 香川県高松市浜ノ町1-3 (Kagawa Pref., Takamatsu City).
3. **Emoji**: 🎟️ booked · ✅ confirmed · 🐱 cat · 🗾 map.
4. **A heading hierarchy** that should not page-break right after H2.

## Section with a table

| Time | Where | Notes |
|------|-------|-------|
| 11:35 | Okayama → Uno | JR Uno Line |
| 12:30 | Uno → Naoshima | Ferry, 20 min |
| 14:30 | Chichu Art Museum | 🎟️ booked |

### Subsection with a list

- One short item.
- 香川県 (Japanese list item).
- 🐱 An emoji item.

```js
// Code block — should render in monospace, not bleed past the right margin.
const greeting = "こんにちは, 世界! 🌏";
console.log(greeting);
```

> Blockquote: should keep the left bar and not get clipped.
> 「日本語の引用文」 — verify the quotes survive the PDF round-trip.
