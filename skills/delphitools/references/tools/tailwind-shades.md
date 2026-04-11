# Tailwind Shades

**Category:** Colour
**URL:** https://delphi.tools/tools/tailwind-shades
**Status:** stable

## What It Does

Generates a complete Tailwind CSS shade scale (50 through 950) from a single base colour, producing a harmonious lightness ramp suitable for use as a custom Tailwind colour palette.

## When to Use

- You have a brand colour and need a full Tailwind-compatible 11-step shade scale.
- You are setting up a `tailwind.config.js` with a custom colour and need all shades pre-generated.
- You want to compare how a colour looks across the full light-to-dark spectrum before committing to a palette.

## Browser Mode (Default)

### Inputs

- **Hex colour input field** — enter your base colour as a hex value (e.g. `#3b82f6`).

### Step-by-Step

1. Navigate to https://delphi.tools/tools/tailwind-shades
2. Click the hex colour input field and type or paste your base colour hex value.
3. The shade grid updates instantly, showing all 11 shades (50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950).
4. Click the Copy button on any individual shade to copy that hex value to the clipboard.
5. To copy the entire scale as a Tailwind config snippet, click the "Copy all" button above the shade grid.

### Output

A shade grid with one swatch per step (50–950), each labelled with its step number and hex value, plus individual Copy buttons. The URL updates with search params so the current colour can be shared or bookmarked.

### Options

- The base colour can be updated at any time by editing the hex colour input field; the grid regenerates immediately.

## Advanced Mode (Node.js/CLI)

N/A — custom implementation, use Browser Mode.
