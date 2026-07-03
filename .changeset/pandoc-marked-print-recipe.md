---
"@eins78/agent-skills": minor
---

pandoc: v1.2.0 — add "compact A4 print" recipe with bundled `themes/marked-print.css` (9pt body, GitHub-like headings, full Unicode + emoji via Apple system font fallback) and `scripts/md2pdf-print.sh` wrapper that pipes markdown through pandoc into headless Chrome `--print-to-pdf`. Replaces Marked 2's broken PDF export pipeline on macOS 26.x (which clips ~5–10pt off the left edge in all styles) and avoids the LaTeX-vs-Japanese-vs-emoji font dance. Pandoc has no Chrome `--pdf-engine` (as of 3.9), so the shell wrapper is the canonical pattern. The wrapper captures Chrome's stderr and verifies a non-empty PDF before exiting, so silent failures surface instead of producing 0-byte output. The print stylesheet wraps long lines in fenced code blocks (`white-space: pre-wrap; overflow-wrap: anywhere`) so they don't get clipped at the page edge. Includes an in-repo fixture (`tests/fixtures/print-test.md`) and a regression test (`tests/test-md2pdf-print.sh`, run via `pnpm test:print`) that asserts page size, page count is within an expected range, Japanese and emoji survive the round-trip, and no `?` tofu substitutions appear in the extracted text — runnable on any contributor machine.

<!--
bumps:
  skills:
    pandoc: minor
-->
