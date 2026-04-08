# DelphiTools Skill — Development Documentation

## Purpose

Teaches agents to use DelphiTools' 47 browser-based design utilities — primarily via their underlying Node.js libraries (svgo, pdf-lib, qrcode, bwip-js, etc.) for headless execution, with Playwright MCP browser automation as a fallback for tools that require the browser.

**Tier:** Published (beta) — available in the [eins78/agent-skills](https://github.com/eins78/agent-skills) plugin

## Design Decisions

<!-- TODO: Fill in after research -->

## File Structure

```
delphitools/
├── SKILL.md                     # Core skill (recipes, patterns, when-to-use)
├── README.md                    # This file
└── references/
    ├── tool-catalog.md          # All 47 tools with headless feasibility
    ├── node-recipes.md          # Extended Node.js recipes
    └── browser-automation.md    # Playwright MCP patterns for browser-only tools
```

## Dependencies

- Node.js (for headless recipes)
- Per-recipe npm packages (installed on demand)
- Playwright MCP (for browser-only tools, optional)

## Testing

<!-- TODO: Fill in after skill is written -->

## Provenance

- Tool inventory from https://github.com/1612elphi/delphitools source code
- Node.js recipes validated against actual library execution
- Browser automation patterns tested via Playwright MCP

## Known Gaps

<!-- TODO: Fill in after research -->

## Future Improvements

<!-- TODO: Fill in after research -->
