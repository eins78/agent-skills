# DelphiTools Skill — Implementation Plan

## Context

DelphiTools is an open-source collection of 47 browser-based design utilities at [delphi.tools](https://delphi.tools). The skill tracks this tool library and helps agents guide users (primarily designers) through using the tools in the browser. An advanced mode provides programmatic access for developers via git clone + Node.js wrapper scripts.

**Research base:** `research/2026-04-08-delphitools/DOSSIER-DelphiTools-Skill-Architecture-2026-04-11.md`

**Branch:** `feat/delphitools-skill` (already exists with skeleton + research)

---

## Cross-Cutting Requirement: Smaller Model Compatibility

**All skill content MUST be actionable by Sonnet/Haiku-class models.** If a smaller model cannot follow the instructions without Opus-level reasoning, the instructions need rewriting.

This applies to SKILL.md, every per-tool reference file, every wrapper script, and every shared reference. Concretely:

| Principle | Example |
|-----------|---------|
| **Explicit tool names, URLs, file paths** | Write `https://delphi.tools/tools/svg-optimiser` not "the SVG tool" or "the usual URL" |
| **Concrete browser actions** | Write `Click the "Download Optimized SVG" button` not "download the result" |
| **Copy-pasteable commands** | Write `node ${CLAUDE_SKILL_DIR}/scripts/optimize-svg.mjs input.svg > output.svg` not "run the SVG script on your file" |
| **No implicit context** | Each reference file is self-contained — never say "as described in the previous tool" |
| **One tool per file** | Never combine multiple tools into a single reference file |
| **Short, focused files** | Per-tool references target 40-80 lines — scannable by any model |
| **Step numbers for every procedure** | Numbered steps, not prose paragraphs |

**Verification gate:** Before committing any reference file, mentally ask: "Could a Haiku agent follow these steps with zero additional context?" If the answer is no, rewrite until the answer is yes.

---

## Phase 0: Baseline Testing (RED)

**Goal:** Establish what agents do WITHOUT the skill when asked to perform DelphiTools tasks.

This is a Reference-type skill, so baseline testing focuses on retrieval and application scenarios.

### Baseline Scenarios

Run these 5 prompts with a haiku subagent (no skill loaded) and document exact behavior:

1. **"I need to crop this photo for Instagram and Bluesky. What are the right dimensions?"**
   - Expected failure: agent guesses dimensions, doesn't know about DelphiTools
   - Observe: does it suggest any web tool? does it try to write custom code?

2. **"Check if the contrast between #3b82f6 and white meets WCAG AA."**
   - Expected failure: agent may compute the ratio (it's math) but won't suggest a visual tool
   - Observe: does it offer the web tool for the visual comparison + accessible colour suggestions?

3. **"I have a 12-page PDF and need to set it up as a saddle-stitched booklet."**
   - Expected failure: agent likely suggests pdfbook2, pdfjam, or ad-hoc code
   - Observe: does it know about DelphiTools Print Imposer with its full imposition engine?

4. **"Generate a QR code for my website https://example.com with rounded dots and my logo embedded."**
   - Expected failure: agent suggests `qrencode` CLI or basic `qrcode` npm — no styling support
   - Observe: does it know about DelphiTools QR Generator with 6 dot styles, eye styles, logo upload?

5. **"Optimize this SVG file to reduce its size."**
   - Expected failure: agent probably suggests `svgo` CLI directly — but misses the web tool option
   - Observe: does it mention DelphiTools as an option? does it know about the paste-SVG interface?

### Process

1. Create `evals/` directory in skill folder
2. Save scenarios to `evals/evals.json`
3. Run each scenario WITHOUT the skill loaded
4. Document baseline responses verbatim
5. Identify patterns: what the agent doesn't know, what it gets wrong, what it misses

---

## Phase 1: SKILL.md + Directory Structure (GREEN — minimal)

**Goal:** Write the core SKILL.md that addresses baseline failures, plus create the directory skeleton.

### File: `skills/delphitools/SKILL.md`

**Frontmatter:**

```yaml
---
name: delphitools
description: >-
  Use when performing design tasks — cropping images for social media,
  optimising SVGs, generating QR codes or barcodes, checking colour contrast,
  converting colours, generating palettes, imposing PDFs for print, tracing
  raster images to SVG, converting image formats, or any browser-based design
  utility task. Triggers: crop for Instagram, optimize SVG, generate QR code,
  check contrast, colour palette, impose PDF, booklet printing, favicon,
  barcode, image trace, tailwind shades, base64 encode.
globs: []
compatibility: claude-code, cursor
license: MIT
metadata:
  author: eins78
  repo: https://github.com/eins78/agent-skills
  version: "1.0.0-beta.1"
---
```

**Body structure (~150-180 lines):**

```
# DelphiTools

1-paragraph overview: 47 browser tools at delphi.tools, open-source, private, no tracking.

## Mode Selection (flowchart)

Decision: Is the user a designer using a browser, or a developer wanting CLI/programmatic access?
- Browser mode (default) → navigate to tool URL, guide step-by-step
- Advanced mode → git clone + wrapper scripts

## Quick Reference

Table: all 47 tools with ID, name, 1-line description, category.
Column for "Ref" pointing to ${CLAUDE_SKILL_DIR}/references/tools/{id}.md

## Browser Mode

Default workflow:
1. Identify the right tool from Quick Reference
2. Read the tool's reference file for detailed steps
3. Navigate to https://delphi.tools/tools/{tool-id} via Playwright MCP
4. Guide the user through the interface using browser automation patterns
5. Help download/copy the result

Reference: ${CLAUDE_SKILL_DIR}/references/browser-automation-patterns.md

## Advanced Mode

For developers wanting programmatic access:
1. Clone the source (version-pinned)
2. Or download pre-built bundle from GitHub Releases
3. Use wrapper scripts for specific tools

Reference: ${CLAUDE_SKILL_DIR}/references/advanced-mode.md

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Writing custom code to do what a tool already does | Check Quick Reference first |
| Suggesting the user visit the website without guiding them | Use Playwright MCP for browser automation |
| Skipping the reference file and guessing at tool options | Read the per-tool reference — it has exact UI elements |
| Using svgo/browser import path in Node.js | Use 'svgo' (not 'svgo/browser') in advanced mode |

## Self-Improvement
```

### Directory Structure

```
skills/delphitools/
├── SKILL.md
├── README.md
├── references/
│   ├── tools/                              # 47 per-tool reference files
│   │   ├── social-cropper.md
│   │   ├── matte-generator.md
│   │   ├── ... (45 more)
│   │   └── shavian-transliterator.md
│   ├── browser-automation-patterns.md      # Reusable Playwright MCP patterns
│   ├── advanced-mode.md                    # Git clone, build, self-host, bundle download
│   └── version-tracking.md                 # Tracked commit hash, changelog, download URLs
├── scripts/
│   ├── build-local.sh                      # Clone + install + build
│   ├── serve-local.sh                      # Serve static export
│   ├── optimize-svg.mjs                    # svgo wrapper
│   ├── generate-qr.mjs                     # qr-code-styling wrapper
│   ├── generate-barcode.mjs                # bwip-js wrapper
│   ├── create-pdf.mjs                      # pdf-lib wrapper
│   ├── impose-pdf.mjs                      # imposition.ts + pdf-lib wrapper
│   ├── trace-image.mjs                     # imagetracerjs wrapper
│   ├── algebra.mjs                         # nerdamer wrapper
│   └── encode.mjs                          # crypto-js + built-in encodings
└── evals/
    └── evals.json                          # Test scenarios for skill validation
```

### Deliverables

- [ ] `SKILL.md` with frontmatter + complete body
- [ ] `README.md` with design decisions, provenance, testing notes
- [ ] Empty `references/tools/` directory with all 47 filenames created (content TBD)
- [ ] `references/browser-automation-patterns.md` — 7 reusable patterns
- [ ] `references/advanced-mode.md` — git clone + build + bundle instructions
- [ ] `references/version-tracking.md` — pinned to commit `12919e0`
- [ ] `evals/evals.json` with baseline scenarios
- [ ] Run `pnpm test` to verify SKILL.md parses

---

## Phase 2: Per-Tool Reference Files (47 files)

**Goal:** Write the detailed user guide for each tool. This is the bulk of the skill's value.

### Template

Every `references/tools/{tool-id}.md` follows this structure:

```markdown
# {Tool Name}

**Category:** {category}
**URL:** https://delphi.tools/tools/{tool-id}
**Status:** {stable | beta | new}

## What It Does
{1-2 sentences}

## When to Use
{Bullet list of scenarios where this is the right tool}

## Browser Mode (Default)

### Inputs
{Exact UI elements: file upload drop zone, text input field, colour picker, sliders, toggles, etc.}

### Step-by-Step
1. Navigate to https://delphi.tools/tools/{tool-id}
2. {Specific steps referencing actual UI element names from the snapshot}
3. ...

### Output
{What the user gets: downloaded file with format, copied text, visual preview}

### Options
{All configurable settings with their defaults and ranges}

## Advanced Mode (Node.js/CLI)

### Underlying Library
{npm package, version, import style (ESM/CJS)}

### Recipe
{Minimal runnable Node.js code}

### Wrapper Script
{Path to script in ${CLAUDE_SKILL_DIR}/scripts/ if available}

### Notes
{Gotchas, polyfill requirements, API differences}
```

### Execution Strategy

Write tools in batches by interaction pattern (simpler patterns first):

**Batch 1 — Text-in/text-out (13 tools):**
`colour-converter`, `contrast-checker`, `tailwind-shades`, `harmony-genny`, `px-to-rem`, `line-height-calc`, `typo-calc`, `base-converter`, `time-calc`, `unit-converter`, `encoder`, `regex-tester`, `sci-calc`

These are the simplest: text input → text output. Browser automation = fill textbox, read result.

**Batch 2 — Text-in/rich-out (5 tools):**
`algebra-calc`, `graph-calc`, `qr-genny`, `code-genny`, `meta-tag-genny`

Text input but rich output (QR image, barcode, rendered LaTeX, HTML tags).

**Batch 3 — File-in/file-out (14 tools):**
`svg-optimiser`, `image-converter`, `image-splitter`, `image-tracer`, `image-clipper`, `favicon-genny`, `social-cropper`, `matte-generator`, `scroll-generator`, `watermarker`, `artwork-enhancer`, `background-remover`, `imposer`, `zine-imposer`

File upload + processing + file download. Browser automation = file upload pattern.

**Batch 4 — Reference/browse + analysis + interactive (9 tools):**
`paper-sizes`, `palette-collection`, `glyph-browser`, `tailwind-cheatsheet`, `markdown-writer`, `guillotine-director`, `pdf-preflight`, `font-explorer`, `paste-image`

**Batch 5 — Specialised (2 tools):**
`palette-genny`, `gradient-genny`

These have complex interactive UI (drag-and-drop, generative).

**Batch 6 — Niche (1 tool):**
`shavian-transliterator`, `colorblind-sim`

### Parallelisation

Use 3-4 parallel sonnet subagents per batch. Each agent writes 3-5 tool reference files using the template and the per-tool I/O details from the dossier.

### Deliverables

- [ ] 47 reference files in `references/tools/`
- [ ] Each file follows the template exactly
- [ ] Each file has verified tool URL, inputs, outputs, options
- [ ] Advanced Mode section present for tools with underlying npm libraries (13 tools)
- [ ] Advanced Mode section marked "N/A — custom implementation, use browser mode" for tools without libraries (34 tools)

---

## Phase 3: Wrapper Scripts for Advanced Mode

**Goal:** Write CLI-friendly Node.js wrapper scripts for the 10 tools with extractable library logic.

### Scripts to Write

| Script | Wraps | Input | Output |
|--------|-------|-------|--------|
| `build-local.sh` | — | git URL | Built `out/` directory |
| `serve-local.sh` | — | `out/` directory | Local HTTP server |
| `optimize-svg.mjs` | svgo 4.x | SVG file path or stdin | Optimised SVG to stdout |
| `generate-qr.mjs` | qr-code-styling + jsdom + canvas | URL/text + options | QR code PNG/SVG file |
| `generate-barcode.mjs` | bwip-js | Data string + format | Barcode PNG/SVG file |
| `create-pdf.mjs` | pdf-lib | Text/options | PDF file |
| `impose-pdf.mjs` | pdf-lib + lib/imposition.ts logic | PDF file + layout | Imposed PDF file |
| `trace-image.mjs` | imagetracerjs | Image file | SVG file |
| `algebra.mjs` | nerdamer | Expression + operation | Result string |
| `encode.mjs` | crypto-js / built-in crypto | Text + mode | Encoded text / hash |

### Script Conventions

Each wrapper script must:
1. Be self-contained (installs its own deps via inline `npm install` check or assumes pre-installed)
2. Accept input via command-line args and/or stdin
3. Produce output to stdout or specified file path
4. Include `--help` flag with usage info
5. Use `#!/usr/bin/env node` shebang
6. Reference the corresponding per-tool reference file in a header comment
7. Handle errors with clear messages

### Special Case: impose-pdf.mjs

This script is the most complex. It needs the imposition layout logic from `lib/imposition.ts`. Two approaches:

**Option A (recommended):** Copy the relevant layout functions from the source into the script. The imposition logic is pure TypeScript with no React dependencies. Convert to plain JS.

**Option B:** Require the user to have cloned the repo and reference the lib/ module via a relative import.

Decision: go with Option A for self-containment. The imposition logic is ~690 lines but only the core layout functions are needed (~200 lines for saddle-stitch + N-up).

### Deliverables

- [ ] 10 scripts in `scripts/`
- [ ] Each script is executable and self-contained
- [ ] Each script has `--help` output
- [ ] Each script tested with real input/output
- [ ] `build-local.sh` successfully clones + builds DelphiTools
- [ ] `serve-local.sh` serves the built output on localhost

---

## Phase 4: GitHub Action for Daily Agent Bundle

**Goal:** Add a GitHub Action to the agent-skills repo that builds and publishes pre-built DelphiTools bundles.

### File: `.github/workflows/delphitools-bundle.yml`

```yaml
name: DelphiTools Bundle

on:
  schedule:
    - cron: '0 6 * * *'    # Daily at 06:00 UTC
  workflow_dispatch:         # Manual trigger

jobs:
  build-bundle:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Check latest DelphiTools commit
        id: check
        run: |
          LATEST=$(git ls-remote https://github.com/1612elphi/delphitools.git HEAD | cut -f1)
          SHORT=${LATEST:0:7}
          echo "commit=$LATEST" >> $GITHUB_OUTPUT
          echo "short=$SHORT" >> $GITHUB_OUTPUT
          # Check if release already exists
          if gh release view "delphitools-bundle-$SHORT" &>/dev/null; then
            echo "skip=true" >> $GITHUB_OUTPUT
          else
            echo "skip=false" >> $GITHUB_OUTPUT
          fi
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}

      - name: Skip if already built
        if: steps.check.outputs.skip == 'true'
        run: echo "Bundle for ${{ steps.check.outputs.short }} already exists. Skipping."

      - name: Clone and build
        if: steps.check.outputs.skip == 'false'
        run: |
          git clone https://github.com/1612elphi/delphitools.git /tmp/delphitools
          cd /tmp/delphitools
          git checkout ${{ steps.check.outputs.commit }}
          npm install
          npm run build

      - name: Package bundle
        if: steps.check.outputs.skip == 'false'
        run: |
          cd /tmp/delphitools
          # Create manifest
          cat > out/BUNDLE-README.md << 'MANIFEST'
          # DelphiTools Pre-Built Bundle
          Built from: https://github.com/1612elphi/delphitools
          Commit: ${{ steps.check.outputs.commit }}
          Date: $(date -u +%Y-%m-%d)
          ## Usage
          Serve these files with any static HTTP server:
            npx serve .
            python3 -m http.server 3000
          Then open http://localhost:3000 in a browser.
          MANIFEST
          # Package as .tgz and .zip
          cd out
          tar czf /tmp/delphitools-bundle-${{ steps.check.outputs.short }}.tgz .
          zip -r /tmp/delphitools-bundle-${{ steps.check.outputs.short }}.zip .

      - name: Create release
        if: steps.check.outputs.skip == 'false'
        run: |
          gh release create "delphitools-bundle-${{ steps.check.outputs.short }}" \
            --title "DelphiTools Bundle (${{ steps.check.outputs.short }})" \
            --notes "Pre-built DelphiTools static site from commit ${{ steps.check.outputs.commit }}. Download and serve with any static file server." \
            /tmp/delphitools-bundle-${{ steps.check.outputs.short }}.tgz \
            /tmp/delphitools-bundle-${{ steps.check.outputs.short }}.zip
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}

      - name: Update version-tracking.md
        if: steps.check.outputs.skip == 'false'
        run: |
          # Update the skill's version tracking file
          cat > skills/delphitools/references/version-tracking.md << EOF
          # DelphiTools Version Tracking
          ## Current Tracked Version
          **Commit:** ${{ steps.check.outputs.short }}
          **Full SHA:** ${{ steps.check.outputs.commit }}
          **Date:** $(date -u +%Y-%m-%d)
          **Tools:** 47
          ## Download Pre-Built Bundle
          ### From GitHub Releases
          gh release download delphitools-bundle-${{ steps.check.outputs.short }} -p '*.tgz'
          ### From Source
          git clone https://github.com/1612elphi/delphitools.git
          cd delphitools && git checkout ${{ steps.check.outputs.commit }}
          npm install && npm run build
          EOF
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git add skills/delphitools/references/version-tracking.md
          git diff --staged --quiet || git commit -m "delphitools: update tracked version to ${{ steps.check.outputs.short }}"
          git push
```

### Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| Track HEAD not tags | DelphiTools has no releases/tags. When they add tags, update the action to use `git ls-remote --tags` |
| Skip if already built | Prevents duplicate releases when commit hasn't changed |
| Both .tgz and .zip | .tgz for developers, .zip for designers |
| Auto-update version-tracking.md | Keeps the skill's version reference always current |
| `workflow_dispatch` trigger | Allows manual re-runs after fixing issues |

### Deliverables

- [ ] `.github/workflows/delphitools-bundle.yml`
- [ ] Action tested via `workflow_dispatch`
- [ ] First release created successfully
- [ ] `version-tracking.md` auto-updated

---

## Phase 5: Testing and Refinement

**Goal:** Verify the skill works end-to-end, then iterate.

### Test Scenarios (expanded from Phase 0)

**Retrieval tests** — can the agent find the right tool?

| Scenario | Expected Tool | Expected Mode |
|----------|--------------|---------------|
| "I need to crop this photo for Instagram" | social-cropper | Browser |
| "Optimize this SVG file" | svg-optimiser | Browser (with paste option) |
| "What's the WCAG contrast ratio of these colours?" | contrast-checker | Browser |
| "Generate a QR code with rounded dots" | qr-genny | Browser |
| "Set up this PDF as a saddle-stitched booklet" | imposer | Browser |
| "Convert this PNG to WebP" | image-converter | Browser |
| "I need a 50-950 Tailwind shade scale for #3b82f6" | tailwind-shades | Browser |
| "Trace this bitmap to SVG" | image-tracer | Browser |

**Application tests** — can the agent guide the user correctly?

| Scenario | Expected Behavior |
|----------|------------------|
| "Crop for Instagram" + Playwright MCP available | Navigate to URL, guide through platform picker, aspect ratio, crop |
| "Crop for Instagram" + no Playwright | Give step-by-step text instructions with URL |
| "Optimize SVG" with file provided | Navigate, upload file, read stats, download result |
| "Optimize SVG" in advanced mode | Use `optimize-svg.mjs` wrapper script |

**Anti-pattern tests** — does the agent avoid common mistakes?

| Scenario | Should NOT Happen |
|----------|------------------|
| "Generate a QR code" | Agent writes custom QR code generation code from scratch |
| "Check contrast" | Agent computes ratio without mentioning the visual tool |
| "Impose PDF" | Agent suggests pdfjam or pdfbook2 instead of DelphiTools |

### Validation Process

1. Run retrieval tests: verify correct tool is identified
2. Run application tests: verify correct mode and step-by-step guidance
3. Run anti-pattern tests: verify skill prevents common mistakes
4. Run `pnpm test` to verify skill parses
5. Run `/simplify` on all files
6. Run `/ai-review` for code quality

### Definition of Done (per repo checklist)

- [ ] `pnpm test` passes
- [ ] `/simplify` run on all files
- [ ] `/ai-review` passes (APPROVE or INFO-only)
- [ ] SKILL.md frontmatter valid (name, description, version, license, metadata)
- [ ] README.md present and current
- [ ] Root README.md skills table updated (add `delphitools` row)
- [ ] Description follows CSO (triggering conditions only)
- [ ] No hardcoded user-specific values
- [ ] `${CLAUDE_SKILL_DIR}` for all bundled file refs
- [ ] Changeset added (`pnpm changeset`)

---

## Phase 6: Root README and Release

**Goal:** Update the repo's skills table and prepare the release.

### Deliverables

- [ ] Add `delphitools` row to `README.md` skills table (maintain alphabetical sort)
- [ ] Run `pnpm changeset` — minor bump for new skill
- [ ] Commit and push all changes
- [ ] Open PR from `feat/delphitools-skill` to `main`

---

## Execution Notes

### Parallelisation Opportunities

| Work | Can Parallelise? | Strategy |
|------|-----------------|----------|
| Phase 1 (SKILL.md + skeleton) | No — foundational | Sequential |
| Phase 2 Batch 1 (13 text tools) | Yes — 3-4 agents | Each agent writes 3-5 files |
| Phase 2 Batch 2 (5 rich-out tools) | Yes — 2 agents | Each writes 2-3 files |
| Phase 2 Batch 3 (14 file tools) | Yes — 4 agents | Each writes 3-4 files |
| Phase 2 Batches 4-6 (12 tools) | Yes — 3 agents | Each writes 4 files |
| Phase 3 (wrapper scripts) | Partially — 2-3 agents | Group by complexity |
| Phase 4 (GitHub Action) | No — single file | Sequential |
| Phase 5 (testing) | Partially — test agents | But sequential refinement |

### Estimated File Counts

| Category | Count | Notes |
|----------|-------|-------|
| SKILL.md | 1 | ~150-180 lines |
| README.md | 1 | ~70 lines |
| Per-tool reference files | 47 | ~40-80 lines each |
| Shared reference files | 3 | browser-automation-patterns, advanced-mode, version-tracking |
| Wrapper scripts | 10 | ~50-150 lines each |
| GitHub Action | 1 | ~80 lines |
| Evals | 1 | evals.json |
| **Total** | **64 files** | |

### Risk Register

| Risk | Impact | Mitigation |
|------|--------|------------|
| DelphiTools adds/removes/renames tools | Reference files become stale | version-tracking.md + GitHub Action auto-detect changes |
| `delphi.tools` domain changes | All URLs in reference files break | URLs are templated via `https://delphi.tools/tools/{id}` — update one line |
| Playwright MCP unavailable | Browser mode doesn't work | Skill falls back to text instructions (already in each reference file) |
| GitHub Action runs out of minutes | Bundle stops building | Schedule is daily but skips if unchanged — minimal minutes used |
| BRIA model license (CC BY-NC-ND 4.0) | Legal concern for background-remover | Document clearly in the tool's reference file |
