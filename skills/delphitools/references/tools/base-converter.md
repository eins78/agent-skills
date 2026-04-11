# Base Converter

**Category:** Calculators
**URL:** https://delphi.tools/tools/base-converter
**Status:** stable

## What It Does

Converts a number between decimal, hexadecimal, binary, and octal, displaying all four representations simultaneously with copy buttons. Handles large integers via BigInt.

## When to Use

- You have a decimal number and need its hex or binary equivalent for low-level code or bitmasking.
- You are reading a binary or octal value (e.g. file permissions) and need the decimal equivalent.
- You are working with large integers (beyond 32-bit) that require BigInt-safe conversion.

## Browser Mode (Default)

### Inputs

- **Number input field** — enter the number to convert.
- **Base selector** — choose the base of the entered number (decimal, hexadecimal, binary, octal).

### Step-by-Step

1. Navigate to https://delphi.tools/tools/base-converter
2. Click the base selector and choose the base that matches your input (e.g. "Decimal").
3. Click the number input field and type or paste the number to convert.
4. The results panel updates instantly, showing the value in all four bases.
5. Click the Copy button next to any row to copy that representation to the clipboard.

### Output

A results panel with four rows — Decimal, Hexadecimal, Binary, Octal — each showing the converted value and a Copy button.

### Options

- Base selector — set to match the base of your input value; switch it to re-interpret the same digits in a different base.

## Advanced Mode (Node.js/CLI)

N/A — custom implementation, use Browser Mode.

---

**Found an issue with this reference?** Report it at [eins78/agent-skills](https://github.com/eins78/agent-skills/issues) (not the upstream DelphiTools repo). Include: tool name, mode (Browser/Advanced), what went wrong, expected vs actual. Ask the user for approval before filing.
