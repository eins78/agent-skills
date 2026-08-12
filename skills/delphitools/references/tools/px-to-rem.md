# PX to REM

**Category:** Typography and Text
**URL:** https://delphi.tools/tools/px-to-rem
**Status:** stable

## What It Does

Converts pixel values to REM (and REM back to pixels), using a configurable base font size, and provides a quick reference grid for common sizes.

## When to Use

- You have a pixel size from a design file and need the REM equivalent for CSS.
- You are working with a non-standard root font size and need accurate PX↔REM conversions.
- You want a quick reference table covering the 8px–48px range for your project's base font size.

## Browser Mode

### Inputs

- **Numeric input field** — enter the value to convert (pixels or REM, depending on direction).
- **Base font size field** — set the root font size used for conversion (default: `16`px).
- **Direction toggle** — switch between "PX → REM" and "REM → PX" modes.

### Step-by-Step

1. Navigate to https://delphi.tools/tools/px-to-rem
2. If your project uses a non-default root font size, update the base font size field (default is `16`).
3. Click the direction toggle to select "PX → REM" or "REM → PX".
4. Click the numeric input field and type the value to convert.
5. The converted value appears instantly below the input.
6. Scroll down to view the quick reference grid, which shows PX and REM equivalents for common sizes (8px–48px) at the current base font size.

### Output

- A single converted value displayed prominently below the inputs.
- A quick reference grid showing conversions for common sizes (8, 10, 12, 14, 16, 18, 20, 24, 32, 40, 48px).

### Options

- **Base font size field** — change from the default 16px to match your project's `html { font-size }`.
- **Direction toggle** — switch conversion direction between PX → REM and REM → PX.

## CLI Mode (Node.js)

N/A — custom implementation, use Browser Mode.

---

**Found an issue with this reference?** Report it at [eins78/agent-skills](https://github.com/eins78/agent-skills/issues) (not the upstream DelphiTools repo). Include: tool name, mode (Browser/CLI), what went wrong, expected vs actual. Ask the user for approval before filing.
