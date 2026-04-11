# Regex Tester

**Category:** Other Tools
**URL:** https://delphi.tools/tools/regex-tester
**Status:** stable

## What It Does

Tests a regular expression against a test string and highlights all matches inline with live feedback as you type.

## When to Use

- You are writing or debugging a regular expression and need immediate visual feedback on what it matches.
- You want to verify that a pattern matches the expected substrings before embedding it in code.
- You are checking edge cases by quickly editing either the pattern or the test string.

## Browser Mode (Default)

### Inputs

- **Pattern field** — enter the regular expression (without delimiters; flags are set separately).
- **Flags text field** — type regex flags directly (e.g. `gi` for global + case-insensitive). This is a text input, not a toggle.
- **Test string field** — enter or paste the text to match the pattern against.

### Step-by-Step

1. Navigate to https://delphi.tools/tools/regex-tester
2. Click the pattern field and type your regular expression (e.g. `\b\w{4}\b`).
3. Type flags into the flags text field (e.g. `gi` for global + case-insensitive).
4. Click the test string field and type or paste the text you want to test against.
5. All matches are highlighted inline in the test string field as you type.
6. If there are no matches, no highlighting appears; check your pattern or flags.

### Output

Inline match highlighting within the test string field — matched substrings are visually distinguished. A match count is shown below the test string field.

### Options

- **Flags** — `g` (find all matches), `i` (case-insensitive), `m` (multiline anchor behaviour). Combine as needed.

## Advanced Mode (Node.js/CLI)

N/A — custom implementation, use Browser Mode.

---

**Found an issue with this reference?** Report it at [eins78/agent-skills](https://github.com/eins78/agent-skills/issues) (not the upstream DelphiTools repo). Include: tool name, mode (Browser/Advanced), what went wrong, expected vs actual. Ask the user for approval before filing.
