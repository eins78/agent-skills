# Text Scratchpad

**Category:** Other Tools
**URL:** https://delphi.tools/tools/markdown-writer
**Status:** stable
**Note:** The tool is named "Text Scratchpad" in the UI. The URL path `markdown-writer` is a legacy ID.

## What It Does

A text manipulation utility with one-click operations: extract lists, deduplicate lines, sort lines, and trim whitespace. Paste or type text, apply a transformation, and copy the result.

## When to Use

- You need to deduplicate a list of items pasted from another source.
- You want to sort lines alphabetically or extract only list items from a block of text.
- You need to clean up leading/trailing whitespace from a multi-line text block.

## Browser Mode

### Inputs

- **Textarea** — paste or type the text you want to manipulate. Accepts any plain text or Markdown.
- **Transformation buttons** — one-click operations applied to the textarea contents:
  - **Extract lists** — pulls out all Markdown list items (lines starting with `-`, `*`, or `1.`) and discards the rest.
  - **Deduplicate lines** — removes duplicate lines, keeping the first occurrence.
  - **Sort lines** — sorts all lines alphabetically (A–Z).
  - **Trim whitespace** — removes leading and trailing spaces from every line.

### Step-by-Step

1. Navigate to https://delphi.tools/tools/markdown-writer
2. Click the textarea and paste or type your text.
3. Click the desired transformation button (Extract lists, Deduplicate lines, Sort lines, or Trim whitespace).
4. The textarea content updates in place to show the result.
5. Click the Copy button below the textarea to copy the transformed text to the clipboard.
6. Repeat steps 3–4 to apply additional transformations if needed.

### Output

- **Transformed text** — the textarea content is updated in place after each operation.
- **Copy button** — copies the current textarea content to the clipboard.

### Options

- Transformations are cumulative: you can apply multiple operations in sequence (e.g. trim whitespace, then deduplicate, then sort).

## CLI Mode (Node.js)

N/A — trivial string manipulation that can be done with standard Node.js string methods. Use Browser Mode for the interactive workflow.

---

**Found an issue with this reference?** Report it at [eins78/agent-skills](https://github.com/eins78/agent-skills/issues) (not the upstream DelphiTools repo). Include: tool name, mode (Browser/CLI), what went wrong, expected vs actual. Ask the user for approval before filing.
