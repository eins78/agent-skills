---
"@eins78/agent-skills": minor
---

pandoc: v1.2.0 — add "compact A4 print" recipe with bundled `themes/marked-print.css` (9pt body, GitHub-like headings, full Unicode + emoji via Apple system font fallback) and `scripts/md2pdf-print.sh` wrapper that pipes markdown through pandoc into headless Chrome `--print-to-pdf`. Replaces Marked 2's broken PDF export pipeline on macOS 26.x (which clips ~5–10pt off the left edge in all styles) and avoids the LaTeX-vs-Japanese-vs-emoji font dance. Pandoc 3.9 doesn't support Chrome as a `--pdf-engine`, so the shell wrapper is the canonical pattern.

<!--
bumps:
  skills:
    pandoc: minor
-->
