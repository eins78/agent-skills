# Word Counter

**Category:** Typography and Text
**URL:** https://delphi.tools/tools/word-counter
**Status:** stable

## What It Does

Counts words, characters, sentences, paragraphs, and lines in a block of text, and estimates reading and speaking time. All statistics update live as you type.

## When to Use

- You need to know the word or character count of a piece of writing (e.g. for a submission with a word limit).
- You want to estimate how long a piece will take to read or present aloud.
- You need a quick count of lines or paragraphs in a text block.

## Browser Mode (Default)

### Inputs

- **Textarea** — paste or type the text you want to analyse. Statistics update live as you type.

### Step-by-Step

1. Navigate to https://delphi.tools/tools/word-counter
2. Click the textarea and paste or type your text.
3. The statistics panel updates instantly as you type. All counts are displayed simultaneously — there are no buttons to click.

### Output

Live statistics displayed in the panel:

- **Word count** — total number of words.
- **Character count (with spaces)** — total character count including all whitespace.
- **Character count (without spaces)** — total character count excluding whitespace.
- **Sentence count** — number of sentences (split on `.`, `!`, `?`).
- **Paragraph count** — number of paragraphs (split on blank lines).
- **Line count** — number of lines (split on newlines).
- **Reading time** — estimated time to read at 200 words per minute.
- **Speaking time** — estimated time to speak aloud at 150 words per minute.

### Options

- No configurable options. All statistics are always shown simultaneously.

## Advanced Mode (Node.js/CLI)

N/A — trivial string manipulation using standard split/regex operations. Implement directly in Node.js if needed rather than automating the browser. Use Browser Mode for interactive use.
