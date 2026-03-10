<!-- PIPELINE: create-agent-prompt | mandated: coding-standards,verification-before-completion | task-type: infrastructure -->

## Mission: Build a PostToolUse hook that auto-copies files to toolbox/ when Write/Edit targets .claude/skills/, .claude/agents/, or .claude/tools/

When a tool or skill is installed (Write/Edit to `.claude/skills/`, `.claude/agents/`, `.claude/tools/`), a PostToolUse hook should auto-mirror the changed file to the corresponding `toolbox/` subdirectory in the agent-hub repo. This makes handoff Gates 10/13 pure verification instead of detection. User quote: "We have to have a standardized way of when tools come in -- make it a hook and then execute a sync."

## Agent Lifecycle (follow in order)

### Stage 1: DEFINE
- **Read:** `.claude/settings.json` (project hooks), `~/.claude/settings.json` (user hooks), `.claude/agent-hub/server.js` (understand toolbox/ structure)
- **Read:** `.claude/agent-hub/hooks/hook.js` (understand existing PostToolUse hook patterns)
- **Read:** The `toolbox/` directory structure: `toolbox/agents/`, `toolbox/skills/`, `toolbox/commands/`, `toolbox/scripts/`, `toolbox/config/`
- **Success looks like:** A PostToolUse hook script that fires on Write/Edit, checks if the file path matches `.claude/skills/*`, `.claude/agents/*`, or `.claude/tools/*`, and copies the file to the corresponding `toolbox/` subdirectory. Must be <50ms execution time.
- **Constraints:** Do NOT modify server.js. Do NOT modify hook.js. Write a NEW standalone script. Do NOT touch any existing hooks or their behavior.

### Stage 2: DISCOVER (HARD GATE -- do not skip)
Run: `ls .claude/skills/`
**You MUST load at least one skill before proceeding to Stage 3.**
Mandated skills for this task: `coding-standards`, `verification-before-completion`
If you skip this stage, your grade caps at C regardless of deliverables.

### Stage 3: EXECUTE
1. Create `.claude/scripts/toolbox-sync.js` -- a Node.js script that:
   - Reads `tool_input` from stdin (JSON with `file_path` field for Write, `file_path` field for Edit)
   - Checks if the file path contains `.claude/skills/`, `.claude/agents/`, or `.claude/tools/`
   - If match: copies the file to the corresponding `toolbox/` subdirectory in `.claude/agent-hub/`
   - Mapping: `.claude/skills/X` -> `toolbox/skills/X`, `.claude/agents/X` -> `toolbox/agents/X`, `.claude/tools/X` -> `toolbox/scripts/X`
   - Must handle nested directories (skills have subdirectories with SKILL.md)
   - Must be async-safe (use `fs.copyFileSync` for simplicity)
   - Must exit 0 always (never block the agent on sync failure)
2. Add the hook to `.claude/settings.json` (project-level) under PostToolUse with matcher `Edit|Write`
3. Test by creating a dummy file in `.claude/skills/test-sync/SKILL.md` and verifying it appears in `toolbox/skills/test-sync/SKILL.md`
4. Clean up the test file after verification

### Stage 4: REASON
- Does the path matching handle both forward slashes and backslashes (Windows)?
- Does it handle the case where `toolbox/` subdirectory doesn't exist yet (mkdir -p equivalent)?
- Is the hook fast enough (<50ms)? File copy should be near-instant for small files.
- Does it conflict with any existing PostToolUse hooks?

### Stage 5: VERIFY
- Create a test skill file: `echo "test" > .claude/skills/sync-test/SKILL.md`
- Verify the hook fires and copies to `toolbox/skills/sync-test/SKILL.md`
- Measure execution time of the hook script
- Verify no errors in hook output
- Clean up test files
- Verify existing hooks still work (hook.js, check-code-change.sh, validate-html-js.js)

### Stage 6: DEBRIEF (before you exit)
curl -X POST http://localhost:3033/api/campaigns/agent-debrief -H "Content-Type: application/json" -d '{"campaignId":"campaign-002","slot":"toolbox-sync-hook","delivered":["item 1","item 2"],"missed":["item 1"],"lessons":["what you learned"]}'

## Constraints
- Script must be <50 lines
- Execution time <50ms
- Must work on Windows (Git Bash) -- use Node.js, not bash
- Exit 0 always -- never block the agent
- Do NOT modify server.js, hook.js, or any existing hooks
- Only sync files that match the 3 path patterns -- no blanket copying
