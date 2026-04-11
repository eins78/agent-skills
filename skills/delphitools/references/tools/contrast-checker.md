# Contrast Checker

**Category:** Colour
**URL:** https://delphi.tools/tools/contrast-checker
**Status:** stable

## What It Does

Checks the WCAG 2.1 contrast ratio between two colours and reports pass/fail for all four accessibility levels: AA Normal, AA Large, AAA Normal, AAA Large.

## When to Use

- You are verifying that text on a background colour meets WCAG accessibility requirements.
- You need to find an accessible alternative to a colour that fails contrast requirements.
- You are auditing a colour palette for compliance before shipping a design.

## Browser Mode (Default)

### Inputs

- **Foreground hex input field** — enter the text/foreground colour as a hex value (e.g. `#1e293b`).
- **Background hex input field** — enter the background colour as a hex value (e.g. `#f8fafc`).
- **Swap button** — swaps the foreground and background values with a single click.
- **"Suggest accessible colour" wand button** — automatically adjusts one of the colours to meet AA requirements.

### Step-by-Step

1. Navigate to https://delphi.tools/tools/contrast-checker
2. Click the foreground hex input field and type or paste the foreground colour hex value.
3. Click the background hex input field and type or paste the background colour hex value.
4. The contrast ratio and pass/fail badges update instantly.
5. To reverse the colours, click the swap button between the two hex inputs.
6. If the ratio fails, click the "Suggest accessible colour" wand button to get an adjusted colour that passes AA Normal.

### Output

- **Contrast ratio** — displayed as a number (e.g. `7.54:1`).
- **Four pass/fail badges**: AA Normal (≥4.5:1), AA Large (≥3:1), AAA Normal (≥7:1), AAA Large (≥4.5:1).
- A colour preview swatch showing the foreground colour rendered on the background colour.

### Options

- Swap button reverses which colour is foreground and which is background.
- Wand button suggests an accessible alternative automatically.

## Advanced Mode (Node.js/CLI)

N/A — custom implementation, use Browser Mode.
