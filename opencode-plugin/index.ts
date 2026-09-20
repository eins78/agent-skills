// @eins78/opencode-skills — opencode plugin carrying the eins78 agent-skills
// collection plus the dossier hooks.
//
// Two jobs:
//
// 1. SKILLS. opencode's native skill loader scans `config.skills.paths` for
//    `**/SKILL.md`. The `config` hook runs before the (lazy) first skill
//    discovery, so pushing the bundled `skills/` directory here makes every
//    skill in the repo appear in the native `skill` tool — no parallel skill
//    system, no context cost for unused skills.
//
// 2. HOOKS. The Claude Code plugin wires two mechanical dossier gates:
//      PostToolUse (Write|Edit) → dossier-hook-dispatcher.sh
//        (ballot-filename.sh + sources-index-consistency.sh, advisory)
//      PreToolUse (Bash)        → dossier-commit-gate.sh
//        (review-artifact-present.sh on staged DOSSIER-*.md, blocking)
//    The hook SCRIPTS are the tested source of truth and are reused verbatim:
//    this plugin feeds them the exact stdin-JSON payload Claude Code would
//    (`{"tool_input": {...}}`) and translates the exit-code contract:
//      exit 0  → allow / silent
//      exit 2  → after-hook: append stderr to the tool output (advisory,
//                same visibility as Claude's exit-2 stderr)
//                before-hook: throw (denies the tool call, like exit-2 deny)
//      other   → logged, non-blocking (matches Claude's non-2 contract)
//
// Never throw from the after-hook: opencode runs hooks with Effect.promise,
// so a rejection fails the whole tool call. Everything here degrades to a
// log line instead.

import path from "node:path"
import { fileURLToPath } from "node:url"
import type { Config, Plugin } from "@opencode-ai/plugin"

const pkgDir = path.dirname(fileURLToPath(import.meta.url))
const hooksDir = path.join(pkgDir, "hooks")
const skillsDir = path.join(pkgDir, "skills")

// A hung hook script must never stall every tool call.
const HOOK_TIMEOUT_MS = 10_000

const DOSSIER_FILENAME = /^DOSSIER-.*\.md$/

type HookResult = { code: number; stderr: string } | undefined

async function runHook(script: string, payload: unknown): Promise<HookResult> {
  try {
    const proc = Bun.spawn(["bash", path.join(hooksDir, script)], {
      stdin: "pipe",
      stdout: "pipe",
      stderr: "pipe",
    })
    proc.stdin.write(JSON.stringify(payload))
    proc.stdin.end()
    const killer = setTimeout(() => proc.kill(), HOOK_TIMEOUT_MS)
    const [stderr, code] = await Promise.all([new Response(proc.stderr).text(), proc.exited])
    clearTimeout(killer)
    return { code, stderr }
  } catch {
    return undefined
  }
}

export const eins78Skills: Plugin = async ({ client }) => {
  const log = async (level: "info" | "warn" | "error", message: string) => {
    try {
      await client.app.log({ body: { service: "@eins78/opencode-skills", level, message } })
    } catch {
      // logging is best-effort
    }
  }

  // The published @opencode-ai/plugin Config type predates the `skills` block
  // (skills.paths exists in the live config schema and is consumed by skill
  // discovery). Widen locally instead of fighting the stale type.
  type ConfigWithSkills = Config & { skills?: { paths?: string[]; urls?: string[] } }

  return {
    config: async (input) => {
      const cfg = input as ConfigWithSkills
      cfg.skills ??= {}
      cfg.skills.paths ??= []
      if (!cfg.skills.paths.includes(skillsDir)) cfg.skills.paths.push(skillsDir)
    },

    "tool.execute.after": async (input, output) => {
      if (input.tool !== "write" && input.tool !== "edit") return
      const filePath = (input.args as Record<string, unknown> | undefined)?.filePath
      if (typeof filePath !== "string") return
      if (!DOSSIER_FILENAME.test(path.basename(filePath))) return
      if (filePath.includes("/templates/")) return

      const result = await runHook("dossier-hook-dispatcher.sh", {
        tool_input: { file_path: filePath },
      })
      if (!result) {
        await log("warn", "dossier audit could not run (spawn failure)")
        return
      }
      if (result.code === 2 && result.stderr.trim()) {
        output.output = `${output.output}\n\n${result.stderr.trim()}`
      } else if (result.code !== 0) {
        await log("warn", `dossier audit exited ${result.code}: ${result.stderr.trim()}`)
      }
    },

    "tool.execute.before": async (input, output) => {
      if (input.tool !== "bash") return
      const command = (output.args as Record<string, unknown> | undefined)?.command
      if (typeof command !== "string" || !command.includes("git commit")) return

      const result = await runHook("dossier-commit-gate.sh", {
        tool_input: { command },
      })
      if (result?.code === 2 && result.stderr.trim()) {
        throw new Error(`Dossier commit gate blocked this commit:\n\n${result.stderr.trim()}`)
      }
    },
  }
}

export default eins78Skills