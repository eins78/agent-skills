# Colour Converter

**Category:** Colour
**URL:** https://delphi.tools/tools/colour-converter
**Status:** stable

## What It Does

Converts a colour value from any supported format into all 8 formats simultaneously: HEX, RGB, Decimal RGB, HSL, LAB, LCH, OKLAB, and OKLCH.

## When to Use

- You have a hex code from a design file and need the HSL or OKLAB equivalent.
- You need to hand off a colour to a developer who requires multiple format representations at once.
- You are exploring perceptual colour spaces (LAB, LCH, OKLAB, OKLCH) from a known RGB or HEX starting point.

## Browser Mode

### Inputs

- **Format selector dropdown** — choose the input format (HEX, RGB, Decimal RGB, HSL, LAB, LCH, OKLAB, OKLCH).
- **Text value field** — type or paste the colour value matching the selected format.

### Step-by-Step

1. Navigate to https://delphi.tools/tools/colour-converter
2. Click the format selector dropdown and choose the format of the colour you have (e.g. "HEX").
3. Click the text value field and type or paste your colour value (e.g. `#3b82f6`).
4. The results panel updates instantly, showing all 8 format representations.
5. Click the Copy button next to any output row to copy that format's value to the clipboard.

### Output

A results panel with one row per format (HEX, RGB, Decimal RGB, HSL, LAB, LCH, OKLAB, OKLCH), each with its converted value and a Copy button. A colour swatch previews the colour visually.

### Options

- Input format is selectable — switch the format selector dropdown if your source value is not HEX.

## CLI Mode (Node.js)

N/A — custom implementation, use Browser Mode.

---

**Found an issue with this reference?** Report it at [eins78/agent-skills](https://github.com/eins78/agent-skills/issues) (not the upstream DelphiTools repo). Include: tool name, mode (Browser/CLI), what went wrong, expected vs actual. Ask the user for approval before filing.
