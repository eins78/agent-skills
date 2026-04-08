---
phase: FRAME
mode: rigorous
started: 2026-04-08
timebox: 2026-04-09
slug: delphitools-skill
tags: [skill-creation, browser-tools, headless-research]
verdict: null
confidence: null
---

# Lab Notes: DelphiTools Skill — Browser-Based Design Tools for AI Agents

## Motivation

DelphiTools is a collection of 47 browser-based design tools (SVG optimization, QR codes, PDF tools, image conversion, colour utilities, etc.). They have no CLI or API — everything is browser-only. We want to create a skill that teaches agents to use these tools, ideally without needing a browser. The key research question: can the underlying npm libraries be used headlessly in Node.js?

## Hypothesis

The majority (>70%) of DelphiTools' 47 browser tools are thin UI wrappers around standalone npm libraries that can be used directly in Node.js without a browser. For the remaining tools, Playwright MCP browser automation provides a viable fallback.

## Success Criteria

- [ ] MUST: Identify and verify headless Node.js recipes for at least 12 of the 15 most useful tools
- [ ] MUST: SKILL.md under 200 lines following pandoc skill conventions
- [ ] MUST: All recipes verified to actually run in Node.js
- [ ] SHOULD: Playwright MCP recipes for at least 3 browser-only tools
- [ ] SHOULD: Complete tool catalog with headless feasibility for all 47 tools

## Fail Condition

If more than 5 of the "Tier A" libraries (svgo, qrcode, pdf-lib, pdfjs-dist, bwip-js, mathjs, nerdamer, crypto-js, jszip, imagetracerjs, gifenc) fail to work in Node.js due to ESM/CJS issues, browser globals, or missing WASM files — the headless approach is less viable than assumed and the skill should pivot to primarily browser-automation recipes.

## Time Box

**Deadline:** 2026-04-09
**Early Stop:** If headless approach is validated for >12 tools, skip exhaustive browser testing and move to writing.
**Rationale:** This is a single-session skill creation task. One day is sufficient.

## Pre-Committed Decisions

**If confirmed:** Write the skill with Node.js recipes as primary, browser automation as escape hatch. Publish as beta.
**If refuted:** Pivot the skill to be primarily a Playwright MCP automation guide, with the tool catalog as discovery value.

## Environment

- macOS Darwin 24.6.0, Mac Mini M4 Pro (mac-zrh)
- Node.js (system version)
- pnpm 10.27.0
- Playwright MCP available via chrome-browser skill
- DelphiTools source: https://github.com/1612elphi/delphitools

## Baseline

No existing skill for browser-based design tools in the agent-skills repo. Agents currently have no guidance on tools like svgo, QR generators, or browser-based image processing.

---

## Running Log

### 2026-04-08 22:44 — Experiment framed

Initial research complete via Explore agents:
- DelphiTools has 47 tools across 8 categories (Social Media, Colour, Images, Typography, Print, Other, Calculators, Turbo-nerd)
- 100% client-side — static Next.js 16 export, zero server components
- No CLI, no API — all browser UI
- Key npm deps identified: svgo, pdfjs-dist, pdf-lib, imagetracerjs, bwip-js, qrcode, @huggingface/transformers, mathjs, nerdamer, crypto-js, gifenc, jszip
- Live site appears to be at `https://tools.rmv.fyi` (not `https://delphi.tools` as originally stated — need to verify)
- Repo has 296 stars, actively developed (pushed today)

Three-tier model proposed:
- Tier A (pure Node.js): svgo, qrcode, pdf-lib, pdfjs-dist, bwip-js, mathjs, nerdamer, crypto-js, jszip, imagetracerjs, gifenc
- Tier B (Node.js with caveats): @huggingface/transformers
- Tier C (browser-only): social-cropper, paste-image, artwork-enhancer, and other Canvas/DOM-heavy tools

---

## Failed Attempts

| # | What Was Tried | Why It Failed | Lesson |
|---|---------------|---------------|--------|

## Findings


## Verdict

**Outcome:**
**Confidence:**
**Evidence:**

**Next Action:**
