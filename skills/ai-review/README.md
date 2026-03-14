# AI Review Skill

## Purpose

Get code reviews from a second AI model (Gemini/OpenAI) mid-session via CLI. Designed for situations where the human can't review (unfamiliar stack) or wants a second opinion before committing.

**Tier:** Publishable — reusable across projects and machines.

## Components

```
ai-review/
├── SKILL.md                  # Skill instructions for Claude Code
├── README.md                 # This file
└── scripts/
    ├── install-dependencies.sh  # Install gemini CLI + auth setup
    └── review.sh                # Provider-agnostic review wrapper
```

## Dependencies

| Dependency | Required | Install |
|---|---|---|
| `gemini` CLI | Yes (primary provider) | `npm install -g @google/gemini-cli` |
| Google Account OAuth | Yes | Run `gemini` once interactively |
| `python3` | Yes (for repo-relative paths) | Pre-installed on macOS |
| `codex` CLI | No (secondary provider) | `brew install codex` |

Run `./scripts/install-dependencies.sh` to install required dependencies.

## Usage

The skill triggers on `/ai-review` or phrases like "get a second opinion".

```bash
# Review unstaged changes
./scripts/review.sh

# Review specific files
./scripts/review.sh src/Views/ContentView.swift

# Review branch vs main
./scripts/review.sh --branch

# Add stack context
./scripts/review.sh --context "SwiftUI, iOS 18+" src/App.swift
```

## Testing

```bash
# Verify gemini CLI works
gemini --version

# Test with a simple review (needs OAuth completed)
echo 'print("hello")' | gemini -p "Review this Python code"

# Test the script on a real diff
cd /path/to/any/git/repo
path/to/ai-review/scripts/review.sh
```

## Design Decisions

- **CLI over MCP:** Bash wrapping is simpler, debuggable (`bash -x`), and works with any provider. MCP adds abstraction without proportional value for single-tool integration.
- **stdin over arguments:** Code is piped via stdin to avoid `ARG_MAX` limits with large diffs. The review instruction stays as a `-p` argument (small, safe).
- **Basename file headers:** File headers use repo-relative paths to avoid triggering gemini's agent mode (it tries to `read_file` on absolute paths).
- **1-hour timeout:** Quality over speed. Never skip reviews — if blocked, escalate to the human.
- **`--include-directories`:** Gives gemini's sandbox read access to the repo root, so it can read surrounding context if needed.

## Provenance

Created 2026-03-14. Based on comparative research of Gemini CLI, OpenAI Codex CLI, and GitHub Copilot for AI-assisted code review. Chose Gemini CLI (free tier, 1000 RPD) as primary provider.

Research: [AI Code Review Integration Research](https://github.com/eins78/home-workspace/blob/main/docs/research/2026-03-14-ai-code-review-integration.md)

## Known Gaps

- No `--model` flag to select specific model (Google auto-selects)
- No structured JSON output parsing (reviews are free-text)
- No diff chunking for very large changesets (>500KB warning only)
- `python3` dependency for `os.path.relpath` (could be replaced with pure bash)

## Changelog

### 0.0.1 (2026-03-14)

- Initial release
- Gemini CLI as primary provider, OpenAI Codex as secondary
- stdin-based code delivery (ARG_MAX safe)
- 1-hour timeout with watchdog process
- Repo-relative file headers for gemini sandbox compatibility
- `--include-directories` for gemini workspace access
- Fail-fast provider availability check
- Process cleanup (including orphaned sleep children)
