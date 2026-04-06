# Pandoc Skill Creation

**Date:** 2026-04-05
**Source:** Claude Code

## Summary

Created `pandoc` skill for the agent-skills repo — a discovery-first skill that teaches agents to use pandoc instead of writing ad-hoc conversion scripts. PR #27.

## Key Accomplishments

- Created SKILL.md with 184 lines of recipes, quick reference, and common mistakes
- Curated pandoc manual from 5213 lines → 686 lines (87% reduction)
- Wrote advanced reference (Lua filters, citations, slides, templates, EPUB, batch processing)
- Wrote installation guide with PDF engine comparison table
- PR created: eins78/agent-skills#27

## Changes Made

- Created: `skills/pandoc/SKILL.md`
- Created: `skills/pandoc/README.md`
- Created: `skills/pandoc/references/pandoc-manual.md`
- Created: `skills/pandoc/references/pandoc-advanced.md`
- Created: `skills/pandoc/references/pandoc-install.md`
- Modified: `README.md` (skills table)
- Created: `.changeset/add-pandoc-skill.md` (minor bump)

## Decisions

- **`globs: []`**: Pandoc handles 60+ formats — file-type triggering would be too broad (match every `.md`) or too narrow (miss `.docx`). Description-based matching is correct for tool-oriented skills.
- **Manual curation strategy**: Kept options reference, common variables (HTML + LaTeX only), extensions overview, markdown variants. Cut: exhaustive per-extension docs (2000+ lines), per-format variables (ConTeXt, wkhtmltopdf, man, Texinfo, Typst, ms), Pandoc's Markdown syntax (1600+ lines), deep template syntax, niche sections (Vimdoc, Chunked HTML, Accessible PDFs, web server mode). Replaced exhaustive lists with `pandoc --list-*` command references.
- **No scripts bundled**: Unlike `chrome-browser` or `tmux-control`, pandoc's CLI is already the right interface. Recipes (copy-paste commands) suffice.
- **"Always prefer pandoc" in description**: Core behavioral instruction that intercepts agents' default instinct to write Python scripts with python-docx/beautifulsoup4.

## Plan Reference

- Plan: `~/.claude/plans/linked-dazzling-babbage.md`
- Planned: 9-step implementation with curated manual, install guide, advanced topics, README, validation
- Executed: All steps completed as planned, no deviations

## Next Steps

- [ ] Merge PR #27
- [ ] Consider adding `defaults/` directory with pre-built YAML profiles
- [ ] Consider example Lua filters for common transformations

## Repository State

- Committed: `39967b2` — pandoc: Add document format conversion skill
- Branch: `add-pandoc-skill`
- Pushed and PR open: eins78/agent-skills#27
