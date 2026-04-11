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

1. **Trigger test:** Ask "optimise this SVG" — skill should load and guide to browser tool
2. **Retrieval test:** Ask "generate a styled QR code" — should reference qr-genny tool
3. **Browser test:** Walk through SVG Optimiser via Playwright MCP
4. **Advanced mode test:** Run `optimize-svg.mjs` script
5. **Anti-pattern test:** Ask "write code to generate a QR code" — should suggest the tool instead

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
