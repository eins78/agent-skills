# Palette Genny

**Category:** Colour
**URL:** https://delphi.tools/tools/palette-genny
**Status:** stable

## What It Does

Generates colour palettes using 20+ strategies spanning random, colour theory, mood, era, and nature themes. Individual colours can be locked before regenerating to keep specific values while varying the rest.

## When to Use

- You need a colour palette for a design and want to explore generated options rather than building one manually.
- You have one or two colours you want to keep and need the tool to fill in the rest of the palette.
- You want a palette that evokes a specific era (70s, 80s, Y2K) or mood (thermos, curfew, telegraph).

## Browser Mode (Default)

### Inputs

- **Strategy selector** — dropdown with 20+ strategies grouped into five categories:
  - **Random**: True-random, Cohesive
  - **Colour theory**: Analogous, Complementary, Triadic, Split-complementary, Tetradic, Monochromatic
  - **Mood**: Thermos, Specimen, Souvenir, Curfew, Telegraph
  - **Era**: 70s, 80s, 90s, Y2K
  - **Nature**: Ocean-sunset, Forest, Desert, Arctic
- **Regenerate button** — generates a new palette using the current strategy. Locked colours are kept.
- **Lock icons** — click the lock icon on any colour swatch to lock it; locked colours are not replaced on regeneration.

### Step-by-Step

1. Navigate to https://delphi.tools/tools/palette-genny
2. Choose a strategy from the strategy selector dropdown.
3. Click the Regenerate button to generate a palette. The palette preview shows colour swatches with hex values.
4. (Optional) Click the lock icon on any swatch to lock a colour you want to keep.
5. Click Regenerate again to get a new palette; locked colours remain unchanged.
6. To copy an individual colour, click its hex value. The value is copied to the clipboard.
7. To export the full palette, click the Export as PNG button. A PNG image of the palette swatches is downloaded.

### Output

- **Palette preview** — colour swatches with hex values displayed below each swatch.
- **Clipboard copy** — clicking a hex value copies it.
- **PNG export** — the Export as PNG button downloads an image of all swatches.

### Options

- Strategy selector: 20+ named strategies across five categories.
- Lock icons: lock individual colours to preserve them across regenerations.

## Advanced Mode (Node.js/CLI)

N/A for the full interactive generator. The palette generation algorithms are in `lib/palette-strategies.ts` (764 lines, pure TypeScript) and can be imported directly into a Node.js project if the source is available.

---

**Found an issue with this reference?** Report it at [eins78/agent-skills](https://github.com/eins78/agent-skills/issues) (not the upstream DelphiTools repo). Include: tool name, mode (Browser/Advanced), what went wrong, expected vs actual. Ask the user for approval before filing.
