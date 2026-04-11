# DelphiTools Skill — Development Documentation

## Purpose

Tracks the [DelphiTools](https://delphi.tools) browser-based design tool library (47 tools). Guides users — primarily designers — through using each tool in the browser via Playwright MCP. Provides advanced-mode wrapper scripts for developers who want programmatic access via Node.js.

**Tier:** Published (beta) — available in the [eins78/agent-skills](https://github.com/eins78/agent-skills) plugin

## Design Decisions

### Browser-first, not headless-first

The previous research iteration tried to recreate tools headlessly via npm libraries. That was wrong. The tools are open-source and run in the browser — the skill's job is to **guide users through the existing tools**, not rebuild them. Advanced mode (Node.js wrapper scripts) is available for developers but is not the default.

### Smaller model compatibility

All skill content is written so that Sonnet/Haiku-class models can follow the instructions. Every reference file uses explicit URLs, concrete UI element names, numbered steps, and copy-pasteable commands. No implicit context between files.

### Per-tool reference files

One file per tool (47 files) in `references/tools/`. This keeps each file short (40-80 lines), focused, and independently loadable. An agent only reads the reference file for the specific tool being used.

### Version tracking via commit hash

DelphiTools has no git tags or releases. The skill tracks the latest verified commit hash. A GitHub Action builds pre-built bundles daily.

### Wrapper script architecture

Wrapper scripts are **thin CLI shims**, not reimplementations. They follow this hierarchy:

1. **Import from the bundle** — if the tool's logic exists in the bundle's `lib/` directory (compiled JS from DelphiTools' pure computation modules), import it directly
2. **Call the same npm library** — if the tool wraps a third-party npm library (svgo, bwip-js, etc.), call that library's API
3. **Never reimplement** — if neither option works, the tool is browser-only and has no wrapper script

The GitHub Action bundle includes:
- `lib/` — Pre-compiled ES modules (imposition, palette, colour, paper sizes)
- `lib-src/` — Raw TypeScript source of the same modules
- `package.json` — Dependency reference
- Static site files (serve with any HTTP server)

### Wrapper script inventory

| Script | Approach | Source |
|--------|----------|--------|
| `optimize-svg.mjs` | Calls svgo npm library | Same lib as DelphiTools |
| `generate-barcode.mjs` | Calls bwip-js npm library | Same lib as DelphiTools |
| `generate-qr.mjs` | Calls qr-code-styling + jsdom/canvas polyfill | Same lib + browser shims |
| `create-pdf.mjs` | Calls pdf-lib npm library | Same lib as DelphiTools |
| `impose-pdf.mjs` | **Imports from bundle** `lib/imposition.js` | DelphiTools source |
| `trace-image.mjs` | Calls imagetracerjs + sharp | Same lib + Node decoder |
| `algebra.mjs` | Calls nerdamer npm library | Same lib as DelphiTools |
| `encode.mjs` | Uses Node.js built-in `crypto` module | Better than crypto-js for Node |

### Tools with no wrapper script (browser-only)

These 39 tools have no CLI wrapper because their core logic is custom Canvas/DOM code with no extractable library or bundle module:

social-cropper, matte-generator, scroll-generator, watermarker, colour-converter, tailwind-shades, harmony-genny, palette-genny, palette-collection, contrast-checker, colorblind-sim, gradient-genny, favicon-genny, placeholder-genny, image-splitter, image-converter (partial — gifenc/utif work but full conversion needs Canvas), artwork-enhancer, background-remover, paste-image, image-clipper, px-to-rem, line-height-calc, typo-calc, paper-sizes, word-counter, glyph-browser, font-explorer, pdf-preflight (analysis requires pdfjs-dist rendering), guillotine-director, zine-imposer, markdown-writer, tailwind-cheatsheet, meta-tag-genny, regex-tester, sci-calc (trivial via mathjs inline), graph-calc, base-converter, time-calc, unit-converter, shavian-transliterator

## File Structure

```
delphitools/
├── SKILL.md                              # Core skill (~176 lines)
├── README.md                             # This file
├── references/
│   ├── tools/                            # 47 per-tool reference files
│   │   ├── social-cropper.md
│   │   └── ...
│   ├── browser-automation-patterns.md    # Reusable Playwright MCP patterns
│   ├── advanced-mode.md                  # Git clone, build, wrapper scripts
│   └── version-tracking.md              # Tracked version + download URLs
├── scripts/                              # 10 CLI wrapper scripts
│   ├── build-local.sh
│   ├── optimize-svg.mjs
│   └── ...
└── evals/
    └── evals.json                        # Test scenarios
```

## Dependencies

- Playwright MCP (for browser mode — optional but recommended)
- Node.js 20+ (for advanced mode scripts)
- No other dependencies for browser mode

## Testing

### Eval Suite (evals/evals.json)

**Run evals whenever the skill is updated.** The eval suite has 56 test scenarios covering:

| Category | Count | What it tests |
|----------|-------|---------------|
| Tool identification | 23 | Can the agent pick the right tool for a user request? |
| Browser mode | 4 | Are browser-mode instructions correct and specific? |
| Advanced mode | 5 | Are CLI/Node.js instructions copy-pasteable and functional? |
| Edge cases (wrong tool) | 3 | Does the agent correctly refuse when no tool fits? |
| Edge cases (ambiguous) | 3 | Does the agent ask for clarification when multiple tools could apply? |
| Edge cases (domain) | 6 | Does the agent catch domain-specific gotchas (license, page count, logo size)? |
| Bug report routing | 3 | Does the agent route bugs to eins78/agent-skills, NEVER upstream? |
| Designer-casual | 3 | Can the agent handle casual/informal requests from designers? |
| Developer-specific | 3 | Can the agent guide developers through advanced/CLI usage? |
| Multi-tool workflows | 3 | Can the agent chain multiple tools for complex tasks? |

To run: use subagents (one per eval or batched) with and without the skill loaded. Compare baseline (no skill) vs with-skill behavior.

### Quick Smoke Tests

1. **Trigger:** Ask "optimise this SVG" — skill should load and guide to browser tool
2. **Retrieval:** Ask "generate a styled QR code" — should reference qr-genny tool
3. **Browser:** Walk through SVG Optimiser via Playwright MCP
4. **Advanced:** Run `node scripts/optimize-svg.mjs --help` — should show usage
5. **Anti-pattern:** Ask "write code to generate a QR code" — should suggest the tool instead
6. **Bug routing:** Ask "where do I report a problem with this tool reference?" — must say eins78/agent-skills

## Provenance

- Tool inventory from [1612elphi/delphitools](https://github.com/1612elphi/delphitools) source code and live site
- Browser automation patterns tested via Playwright MCP on Chrome for Testing
- Wrapper scripts validated with real input/output in Node.js v24
- Research documented in `research/2026-04-08-delphitools/`

## Known Gaps

- No coverage of the iOS TestFlight app (beta, not yet public)
- Wrapper scripts cover 10 of 47 tools — the rest are browser-only or pure math
- No automated detection of new tools added to DelphiTools (manual update needed)

## Future Improvements

- Auto-detect tool additions via the GitHub Action
- Add wrapper scripts for more tools as they gain library support
- Add screenshot-based reference files for visual guidance
