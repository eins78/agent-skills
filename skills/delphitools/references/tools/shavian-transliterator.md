# Shavian Transliterator

**Category:** Turbo-nerd
**URL:** https://delphi.tools/tools/shavian-transliterator
**Status:** new

## What It Does

Transliterates English text into the Shavian alphabet — Bernard Shaw's phonemic writing system — and displays a gloss view with each word paired with its Shavian equivalent. Words not found in the dictionary and transliterated heuristically are highlighted in red.

## When to Use

- You want to see English text written in the Shavian alphabet for learning, curiosity, or novelty purposes.
- You need to identify which words fall back to heuristic transliteration (shown in red) versus dictionary-matched transliteration.
- You want a Shavian text file or copy of a passage to paste elsewhere.

## Browser Mode (Default)

### Inputs

- **Textarea** — the page loads with sample English text pre-filled. Replace or edit this text with any English input.
- **Shavian letter click** — in the gloss view, click any individual Shavian character to cycle through alternative phoneme mappings for that position.

### Step-by-Step

1. Navigate to https://delphi.tools/tools/shavian-transliterator
2. The textarea loads with sample English text. Clear it and type or paste your own English text, or edit the sample.
3. The gloss view below the textarea updates as you type. Each English word is shown with its Shavian transliteration beneath it, rendered in Noto Sans Shavian font.
4. Words shown in red are heuristic transliterations (not found in the dictionary). Words shown normally are dictionary-matched.
5. Click any Shavian letter in the gloss to cycle through alternative phoneme mappings if the default transliteration looks wrong.
6. Click the Copy Shavian text button to copy the full Shavian output to the clipboard.
7. Click the Download .txt button to save the Shavian text as a plain text file.

### Output

- **Gloss view** — each English word displayed with its Shavian transliteration beneath it in Noto Sans Shavian font.
- **Red highlighting** — words transliterated heuristically (not dictionary-matched) appear in red.
- **Clipboard copy** — the Copy Shavian text button copies the full Shavian output.
- **Text file download** — Download .txt saves the Shavian output as a .txt file.

### Options

- Clicking any Shavian letter in the gloss cycles alternative phoneme mappings for that word position.

## Advanced Mode (Node.js/CLI)

The transliteration logic is in `lib/shavian/` (pure TypeScript) and can be extracted for use in a Node.js project. However, rendering the gloss view requires the Noto Sans Shavian font, which is a browser-loaded web font. Use Browser Mode for the full interactive experience.
