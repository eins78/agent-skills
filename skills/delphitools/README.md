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
2. **Call the same npm library** — if the tool wraps a third-party npm library (svgo, bwip-js, etc.), call that library's API with matching options/config from the DelphiTools component
3. **Use Node.js builtins** — if the browser library has a better Node.js equivalent (e.g. Node `crypto` vs `crypto-js`)
4. **Never reimplement** — if neither option works, the tool is browser-only and has no wrapper script

**Key principle:** Wrappers must match the behaviour of the corresponding DelphiTools component. API call patterns, option names, and output formats should align with the source React component. When the component uses `.text("fractions")`, the wrapper uses `.text("fractions")`. When the component applies specific plugin configs, the wrapper applies the same config.

#### Bundle contents

The GitHub Action (`.github/workflows/delphitools-bundle.yml`) builds daily and includes:

- `lib/` — Pre-compiled ES modules: imposition, palette-strategies, palette-collection, colour-notation, paper-sizes, math-constants
- `lib-src/` — Raw TypeScript source of the same modules + shavian transliteration
- `package.json` — Dependency reference (npm library versions)
- Static site files (serve with any HTTP server)

**Not in the bundle** (and why):
- `lib/tools.ts` — imports `lucide-react` (React/DOM dependency), only useful for UI rendering
- `lib/utils.ts` — CSS class merging (`cn()`), pure UI utility
- `lib/colour-names.ts` — imports `color-name-list` npm package; no wrapper needs it

### Wrapper script inventory

| Script | Approach | Matches Component? |
|--------|----------|-------------------|
| `impose-pdf.mjs` | **Imports from bundle** `lib/imposition.js` | Yes — same layout engine |
| `optimize-svg.mjs` | Calls svgo with identical plugin config | Yes — same plugins, multipass |
| `algebra.mjs` | Calls nerdamer with `.text("fractions")` output | Yes — same API pattern |
| `generate-barcode.mjs` | Calls bwip-js with color/scale/padding options | Yes — same option mapping |
| `generate-qr.mjs` | Calls qr-code-styling with corner/logo/transparency options | Yes — matches styling options |
| `trace-image.mjs` | Calls imagetracerjs with preset support | Yes — same preset system |
| `create-pdf.mjs` | Calls pdf-lib for PDF creation | Yes — same library |
| `encode.mjs` | Node.js built-in `crypto` module | Equivalent — same hash output, better for Node |

### Why most wrappers call npm libraries directly (not the bundle)

The bundle only contains DelphiTools' **custom computation modules** from `lib/`. Most tools (SVG optimiser, QR generator, barcode generator, etc.) are React components that call npm libraries directly — there is no intermediate lib/ module to extract. Creating new lib/ modules would mean writing new code in the upstream repo, which contradicts the "use, don't reimplement" principle.

The impose-pdf wrapper is the exception because `lib/imposition.ts` is a genuine standalone computation module with no React/DOM dependencies.

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

## Skill Maintenance

### How to discover new or changed tools

DelphiTools has no tags or releases — check the source directly.

```bash
# Clone or update the local fork
cd ~/FORK/delphitools && git pull origin main

# Compare the canonical tool list against our reference files
# The source of truth is lib/tools.ts — it defines every tool's id, name, category, and URL
grep -oP "id: \"[^\"]+\"" lib/tools.ts | sort > /tmp/dt-tools.txt
ls /path/to/agent-skills/skills/delphitools/references/tools/ | sed 's/\.md$//' | sort > /tmp/skill-tools.txt
diff /tmp/dt-tools.txt /tmp/skill-tools.txt
```

Also check the component directory for new `.tsx` files:

```bash
ls components/tools/ | sed 's/\.tsx$//' | sort
```

If a new tool appears: it will be in `lib/tools.ts` (with id, name, description, category) and have a matching `components/tools/<id>.tsx` component.

### Adding a new tool reference file

1. **Read the source component** at `~/FORK/delphitools/components/tools/<tool-id>.tsx`. Identify:
   - What npm library it imports (if any)
   - What inputs it accepts (file upload, text input, colour picker, etc.)
   - What outputs it produces (download, clipboard, preview)
   - Any options/settings in the UI

2. **Visit the live tool** at `https://delphi.tools/tools/<tool-id>` via Playwright MCP. Verify:
   - Actual UI element labels (button text, placeholder text, field names)
   - The interaction flow (what happens after uploading, what buttons appear)
   - Any options not obvious from the source code

3. **Create the reference file** at `skills/delphitools/references/tools/<tool-id>.md`. Use this template (copy from any existing file like `svg-optimiser.md`):

   ```markdown
   # Tool Name

   **Category:** <category from lib/tools.ts>
   **URL:** https://delphi.tools/tools/<tool-id>
   **Status:** stable | beta | new

   ## What It Does

   <One paragraph. What the tool does, not how to use it.>

   ## When to Use

   - <Concrete scenario 1>
   - <Concrete scenario 2>
   - <Concrete scenario 3>

   ## Browser Mode (Default)

   ### Inputs

   <List each input method: drop zone, text field, colour picker, etc.
    Use the EXACT label text from the UI.>

   ### Step-by-Step

   1. Navigate to https://delphi.tools/tools/<tool-id>
   2. <Concrete action with exact UI element name>
   3. <Next action>
   ...

   ### Output

   <What the user gets: file download, clipboard, preview, stats>

   ### Options

   <List any configurable settings, or "None" if fixed>

   ## Advanced Mode (Node.js/CLI)

   <If an npm library works in Node.js, show a minimal code snippet.
    If a wrapper script exists, reference it.
    If browser-only: "N/A — custom implementation, use Browser Mode.">

   ---

   **Found an issue with this reference?** Report it at
   [eins78/agent-skills](https://github.com/eins78/agent-skills/issues)
   (not the upstream DelphiTools repo). Include: tool name, mode
   (Browser/Advanced), what went wrong, expected vs actual.
   Ask the user for approval before filing.
   ```

4. **Update SKILL.md** — add a row to the correct category table in the Quick Reference section.

5. **Update this README** — increment the tool count (currently 47) in the Purpose section and the browser-only list if applicable.

6. **Add evals** — see "Updating evals" below.

**Batch work with subagents:** When adding multiple tools, dispatch Sonnet subagents batched by category (4-8 tools per agent). Each agent reads the source components and the live site, then writes the reference files. This was the approach used during initial creation — 5 parallel agents writing 47 files. Give each agent the template above and 2-3 example reference files for calibration.

### Updating an existing tool reference

When a tool's UI changes upstream:

1. **Pull latest source:** `cd ~/FORK/delphitools && git pull`
2. **Diff the component:** `git diff HEAD~10 components/tools/<tool-id>.tsx` (adjust range as needed)
3. **Verify in browser:** Navigate to the tool via Playwright MCP and check that the reference file's step-by-step instructions still match the actual UI
4. **Update the reference file** — fix any outdated UI element names, steps, or options
5. **Check the wrapper script** (if one exists) — verify the npm library API calls still match the component. Read the component's import and usage, compare to the wrapper's usage.

### Adding or updating wrapper scripts

Follow the hierarchy in strict order:

1. **Check the bundle first.** Does `~/FORK/delphitools/lib/` have a standalone `.ts` module for this tool's logic (no React/DOM imports)? If yes → the wrapper should import from the bundle's `lib/` directory. See `impose-pdf.mjs` for the pattern.

2. **Check the npm library.** Read the component (`components/tools/<id>.tsx`) to find which npm library it imports. If it uses a library that works in Node.js (svgo, bwip-js, qr-code-styling, nerdamer, pdf-lib, imagetracerjs, etc.) → the wrapper calls that library directly. **Match the component's API calls exactly** — same function names, same options, same output format.

3. **Check Node.js builtins.** If the browser library has a better Node.js native equivalent (e.g., `crypto-js` → Node `crypto`), use the builtin. Document why in the script header.

4. **If none of the above works** → the tool is browser-only. Do not create a wrapper. Add the tool id to the "browser-only" list in this README.

**Verifying alignment with the component:**

```bash
# Read the component to see how it calls the library
cat ~/FORK/delphitools/components/tools/<tool-id>.tsx | grep -A5 'import.*from'
# Look for: option objects, config presets, output formatting
```

Key things to match:
- **nerdamer:** use `.text("fractions")` not `.toString()`, use wrapper syntax like `nerdamer(\`expand(${expr})\`)` not `nerdamer.expand(expr)`
- **bwip-js:** include `paddingwidth`/`paddingheight`, handle 2D scale differently from 1D, strip `#` from hex colours
- **qr-code-styling:** include `cornersSquareOptions`, `cornersDotOptions`, `imageOptions` for logo
- **imagetracerjs:** support `optionpresets` by name, expose all tuning parameters
- **svgo:** match the plugin array exactly

### Updating the GitHub Action bundle build

The workflow is at `.github/workflows/delphitools-bundle.yml`. It compiles specific `lib/*.ts` files to JS for Node.js import.

**When to update:**
- A new pure-computation module appears in `~/FORK/delphitools/lib/` (no React/DOM imports)
- An existing module is renamed or split

**How to update:**

1. Check the new module has no DOM/React dependencies:
   ```bash
   grep -E "import.*from.*(react|lucide|clsx|tailwind)" ~/FORK/delphitools/lib/<new-module>.ts
   # If this returns results, the module has DOM deps — do NOT add to bundle
   ```

2. Add the module to the `tsc` compile line and the `cp` line in the workflow:
   ```yaml
   npx tsc ... lib/<new-module>.ts 2>/dev/null || true
   cp ... lib/<new-module>.ts /tmp/delphitools/out/lib-src/ 2>/dev/null || true
   ```

3. Update the "Bundle contents" section in this README.

**Currently compiled modules:** imposition, palette-strategies, palette-collection, colour-notation, paper-sizes, math-constants

**Currently excluded (with reason):**
- `tools.ts` — imports `lucide-react`
- `utils.ts` — CSS utility (`clsx` + `tailwind-merge`)
- `colour-names.ts` — imports `color-name-list` npm package; no wrapper needs it

### Updating evals

Evals are in `skills/delphitools/evals/evals.json`. When adding new tools:

1. **Add at least one tool-identification eval** for the new tool:
   ```json
   {
     "id": <next id>,
     "category": "tool-identification",
     "prompt": "<realistic user request that should trigger this tool>",
     "expected_tool": "<tool-id>",
     "expected_output": "<what the agent should do — mention URL, key steps>",
     "should_trigger": true
   }
   ```

2. **Add a browser-mode eval** if the tool has unusual interaction patterns (file upload + processing, multi-step workflow):
   ```json
   {
     "id": <next id>,
     "category": "browser-mode",
     "prompt": "<specific browser-mode task>",
     "expected_tool": "<tool-id>",
     "expected_output": "<expected Playwright MCP steps>"
   }
   ```

3. **Add an advanced-mode eval** if the tool has a wrapper script.

4. **Add edge-case-domain evals** if the tool has gotchas (e.g., EAN-13 requires exactly 12-13 digits, QR error correction H needed for logos, WCAG ratio thresholds).

5. **Update the eval count** in this README's Testing section.

**Running evals:** Dispatch Haiku subagents (one per eval or batched by category). Each agent runs the prompt with the skill loaded and reports what the model did. Compare against `expected_output`. Also run a baseline batch without the skill to verify the skill adds value.

### Changeset workflow

Every skill update needs a changeset per the repo's versioning rules.

```bash
cd /path/to/agent-skills
pnpm changeset
```

This creates a file in `.changeset/`. Edit it:

```markdown
---
"@eins78/agent-skills": minor
---

delphitools: add 3 new tools (gradient-picker, noise-generator, pdf-merger)

Skills: delphitools (minor)
```

**Bump levels:**
- **Patch:** Fix a reference file typo, update a URL, fix a wrapper script bug
- **Minor:** Add new tool references, add wrapper scripts, expand evals
- **Major:** Restructure the skill, remove tools, change the reference file format

The `Skills:` footer is required — it tells the release script which skill version to bump.

### Testing checklist before pushing

Run through this before committing:

```bash
# 1. Skill parses correctly
pnpm test

# 2. Validate frontmatter
pnpm run validate

# 3. Count reference files matches tool count in SKILL.md and README.md
ls skills/delphitools/references/tools/ | wc -l
# Should match the count stated in SKILL.md ("47 browser-based design tools") and README

# 4. Every tool in SKILL.md quick reference has a matching reference file
grep -oP 'references/tools/\K[^.]+' skills/delphitools/SKILL.md | sort > /tmp/skill-refs.txt
ls skills/delphitools/references/tools/ | sed 's/\.md$//' | sort > /tmp/actual-refs.txt
diff /tmp/skill-refs.txt /tmp/actual-refs.txt
# Should be empty (no diff)

# 5. Wrapper scripts have --help and don't crash
for f in skills/delphitools/scripts/*.mjs; do node "$f" --help > /dev/null 2>&1 && echo "OK: $f" || echo "FAIL: $f"; done

# 6. Evals JSON is valid
python3 -c "import json; json.load(open('skills/delphitools/evals/evals.json'))" && echo "evals.json valid"

# 7. Changeset exists (if skill content changed)
ls .changeset/*.md 2>/dev/null | head -5
```

### Common pitfalls

**Context limits with parallel subagents.** During initial creation, dispatching many parallel agents (8+ at once) caused branch conflicts and context exhaustion. Batch by category: 4-8 tools per agent, max 5 agents in parallel. Each agent should commit its own files to avoid merge conflicts.

**Wrapper script duplication.** The most common mistake is reimplementing logic that exists in the DelphiTools component. Always read the source component (`components/tools/<id>.tsx`) first and match its API calls exactly. If the component uses `nerdamer(\`expand(${expr})\`).text("fractions")`, the wrapper must use the same call — not `nerdamer.expand(expr).toString()`.

**UI element names change.** DelphiTools updates its UI without notice. Reference files that say "click the Upload button" may break if the button is renamed. Always verify via Playwright MCP before committing reference file updates.

**The lib/tools.ts file has React imports.** It looks like a pure data file but imports `lucide-react` for icons. Do not add it to the bundle build — it will fail TypeScript compilation without React types installed.

**Wrapper scripts must not auto-install npm packages.** The repo's security hooks reject `execSync` calls. Wrappers should print a clear error message ("Error: svgo not installed. Run: npm install svgo@4") and exit, not try to install packages programmatically.

**Evals need baseline comparison.** An eval that passes with the skill is meaningless if it also passes without the skill. Always run a baseline (no-skill) batch to confirm the skill provides value. During initial creation, Haiku baseline tests confirmed that without the skill, agents suggest generic tools (Coolors.co, Potrace, Inkscape) instead of DelphiTools.

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
