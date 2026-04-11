# Glyph Browser

**Category:** Typography and Text
**URL:** https://delphi.tools/tools/glyph-browser
**Status:** stable

## What It Does

Lets you browse and search the full Unicode character set by name, codepoint, or category. Click any glyph to copy it to the clipboard.

## When to Use

- You need to find a specific Unicode character (arrow, symbol, dingbat, emoji) but do not know its codepoint.
- You want to search by a descriptive name such as "right arrow" or "snowflake".
- You need to copy a special character to paste into text.

## Browser Mode (Default)

### Inputs

- **Search field** — type a character name (e.g. "bullet"), codepoint (e.g. "U+2022"), or category keyword (e.g. "arrow", "emoji").
- **Category filter dropdown** — filter characters by Unicode category (e.g. Letter, Number, Symbol, Punctuation, Emoji).

### Step-by-Step

1. Navigate to https://delphi.tools/tools/glyph-browser
2. Type in the search field to filter characters by name or codepoint. Results update as you type.
3. Alternatively, select a category from the category filter dropdown to browse all characters in that group.
4. Scroll through the glyph grid. Each cell shows the rendered character.
5. Click any glyph cell to copy the character to the clipboard. A brief confirmation toast appears.

### Output

- **Glyph grid** — each cell shows the rendered character glyph. Hover to see the character name and codepoint.
- **Clipboard copy** — clicking a glyph copies the character itself (not the codepoint) to the clipboard.

### Options

- Category filter dropdown restricts the grid to a Unicode category.
- Search field filters by name or codepoint in real time.

## Advanced Mode (Node.js/CLI)

N/A — rendering and clipboard access require a browser environment. Use Browser Mode.
