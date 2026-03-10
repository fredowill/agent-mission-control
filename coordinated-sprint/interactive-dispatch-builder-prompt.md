<!-- PIPELINE: create-agent-prompt | mandated: coding-standards,verification-before-completion | task-type: infrastructure -->
## Mission: Build the interactive dispatch system that lets agents pause mid-execution and ask the user for input, enforced by hooks -- not PRD text.

Currently all dispatched agents run start-to-finish in auto mode with zero user consultation. The user explicitly said "PRD checkpoints don't work -- hooks are the enforcement mechanism." This agent builds an interactive dispatch mode using the AUQ MCP server (ask-user-questions) for capability, plus PostToolUse and Stop hooks for enforcement.

**Key technical facts from v2.5 deep research:**
- AUQ MCP Server (`auq-mcp-server`) is a Model Context Protocol tool that lets agents ask users questions via a separate TUI terminal. Agent blocks until user responds. Supports multi-choice, text input, markdown.
- PreToolUse hooks can deny tool calls (exit code 2 or `permissionDecision: "deny"`). Stderr shown to agent.
- Stop hooks with exit code 2 can prevent agent from stopping and force continuation.
- The existing dispatch pipeline uses `dispatch.sh` which launches agents with `--dangerously-skip-permissions` via `/api/launch`.

## Agent Lifecycle (follow in order)

### Stage 1: DEFINE

- **Read these files first:**
  1. `.claude/agent-hub/scripts/dispatch.sh` -- understand how agents are launched, find where --dangerously-skip-permissions is set
  2. `.claude/agent-hub/server.js` -- find the /api/launch endpoint, understand what params it accepts
  3. `~/.claude/settings.json` -- see current hook configuration, understand where new hooks go
  4. `.claude/agent-hub/hooks/hook.js` -- understand PostToolUse hook patterns (but do NOT modify this file)

- **Success looks like:**
  1. AUQ MCP server installed globally and configured in MCP settings
  2. `/api/launch` accepts a `mode` field ("auto" or "interactive")
  3. `dispatch.sh` conditionally skips `--dangerously-skip-permissions` when mode is "interactive"
  4. A PostToolUse checkpoint hook (`hooks/checkpoint-counter.js`) that counts writes per session and injects checkpoint messages at configurable thresholds
  5. A Stop hook (`scripts/stop-gate.js`) that prevents interactive agents from finishing without consulting the user
  6. An E2E test script that validates all components

- **Constraints:**
  - DO NOT modify `hooks/hook.js` or `hooks/prompt-hook.js` -- these are existing hooks, create new files
  - DO NOT modify any `-page.html` files
  - AUQ installation: use `bun add -g auq-mcp-server` (bun is available on this machine)
  - All scripts must work on Windows (bash shell via Git Bash)
  - Zero external dependencies in hook scripts -- only Node.js built-ins
  - ASCII only in all output files (CLAUDE.md Rule 14)
  - Use `path.join(__dirname, ...)` for all paths

### Stage 2: DISCOVER (HARD GATE -- do not skip)

Run: `ls .claude/skills/`

**You MUST load at least one skill before proceeding to Stage 3.**

Mandated skills for this task:
1. `coding-standards` -- infrastructure JS must follow project conventions
2. `verification-before-completion` -- must verify all components with evidence

If you skip this stage, your grade caps at C regardless of deliverables.

### Stage 3: EXECUTE

**Part A: Install AUQ MCP Server**

1. Run `bun add -g auq-mcp-server` to install the AUQ MCP tool globally
2. Verify installation: `auq --version` or `which auq`
3. Add MCP server configuration. Check if there's a `.claude/mcp-servers.json` or similar config file. The AUQ server needs to be registered so agents can call `ask-user-questions` as a tool.
4. Test: verify the MCP tool is available by checking Claude Code's MCP tool list
5. Document: write a brief "How to use" section at the bottom of this prompt's output explaining how the user starts the `auq` listener terminal

**Part B: Add mode field to /api/launch**

6. In `server.js`, find the `/api/launch` POST endpoint
7. Add `mode` to the accepted parameters (default: "auto")
8. Pass `mode` to dispatch.sh as an environment variable or argument
9. Store `mode` in the agent card when creating it in campaigns.json (so Dashboard can display it later)

**Part C: Conditional auto-approve in dispatch.sh**

10. In `dispatch.sh`, find where `--dangerously-skip-permissions` is passed to `claude`
11. Add a conditional: if mode is "interactive", do NOT pass `--dangerously-skip-permissions`
12. Interactive agents should still get the prompt file -- just without auto-approve
13. Test: verify dispatch.sh works with both modes by running it with a mock prompt

**Part D: PostToolUse checkpoint counter hook**

14. Create `hooks/checkpoint-counter.js` as a PostToolUse hook
15. The hook receives JSON on stdin with `tool_name` and tool results
16. Track write count per session in `.claude/agent-hub/data/checkpoint-counts.json` keyed by session ID
17. Only count Write and Edit tool calls (not Read, Bash, Grep, etc.)
18. Check dispatch mode for the current session -- only activate for "interactive" mode agents:
    a. Read the session's state file from `.claude/agent-hub/states/` to find the session ID
    b. Look up the agent card in campaigns.json to check if mode is "interactive"
    c. If mode is NOT "interactive", exit 0 immediately (no-op for auto agents)
19. At configurable thresholds (default: every 5 writes), output a JSON message to stdout that will be shown to the agent:
    ```
    CHECKPOINT: You have made N file changes. Before continuing, call the ask-user-questions MCP tool to check in with the user. Describe what you have done so far and ask if they want to adjust the approach.
    ```
20. The threshold should be configurable via a `checkpoint-config.json` file:
    ```json
    { "writeThreshold": 5, "enabled": true }
    ```

**Part E: Stop hook gate**

21. Create `scripts/stop-gate.js` as a Stop hook
22. When an interactive-mode agent tries to stop:
    a. Check if the agent ever called `ask-user-questions` during its session (look for it in the session's activity log or state file)
    b. If NOT, exit with code 2 and stderr message: "You are running in interactive mode but haven't consulted the user. Call the ask-user-questions tool before finishing."
    c. If YES, exit 0 (allow stop)
23. For auto-mode agents, always exit 0 (no-op)

**Part F: Settings.json hook entries**

24. Document (do NOT auto-edit settings.json) what needs to be added:
    - PostToolUse entry for `hooks/checkpoint-counter.js` matching `Edit|Write`
    - Stop entry for `scripts/stop-gate.js`
    - Write these as an "INSTALLATION" section clearly formatted for the user to copy

**Part G: E2E test script**

25. Create `scripts/test-interactive.js` that:
    a. Tests checkpoint counter: mock 4 writes (should NOT trigger), then 5th write (should trigger checkpoint message)
    b. Tests checkpoint counter with auto mode (should never trigger)
    c. Tests stop gate: mock an interactive session that never called ask-user-questions (should block)
    d. Tests stop gate: mock an interactive session that DID call ask-user-questions (should allow)
    e. Tests stop gate with auto mode (should always allow)
    f. Outputs a pass/fail table for all test cases
26. Runnable via `node scripts/test-interactive.js` with no external dependencies

### Stage 4: REASON

After building all components, evaluate:
- Does the checkpoint counter add perceptible latency to Write/Edit calls? (must be <50ms)
- What happens if campaigns.json doesn't have a mode field for an agent? (graceful default to "auto")
- How do we detect if ask-user-questions was called? (check session transcript or state file activity log)
- Edge case: what if AUQ MCP server isn't running when agent tries to call it?
- Should the checkpoint message be injected via stdout or stderr? (stdout is shown to agent as tool result)

### Stage 5: VERIFY

1. Run `node scripts/test-interactive.js` -- all test cases must pass
2. Run `node -c hooks/checkpoint-counter.js` -- syntax check
3. Run `node -c scripts/stop-gate.js` -- syntax check
4. Verify AUQ is installed: `auq --version` or `bun pm ls -g | grep auq`
5. Verify /api/launch accepts mode param: `curl -s -X POST http://localhost:3033/api/launch -H "Content-Type: application/json" -d '{"agentName":"test-interactive","promptFile":"test","mode":"interactive","campaignId":"campaign-002","slot":"test-interactive","sprint":5}' | jq .`
   (This may fail if test prompt doesn't exist -- that's OK, just verify the endpoint doesn't crash on the mode param)
6. Verify dispatch.sh handles both modes without errors

### Stage 6: DEBRIEF (before you exit)

curl -X POST http://localhost:3033/api/campaigns/agent-debrief \
  -H "Content-Type: application/json" \
  -d '{"campaignId":"campaign-002","slot":"interactive-dispatch-builder","delivered":["AUQ MCP installed","mode field in /api/launch","conditional auto-approve in dispatch.sh","checkpoint-counter.js","stop-gate.js","test-interactive.js","installation docs"],"missed":[],"lessons":[]}'

## Constraints

- This is infrastructure. No UI, no page files.
- All hook scripts must work on Windows (Git Bash)
- Zero external dependencies in hook scripts -- only Node.js built-ins
- AUQ is the only external install (via bun)
- ASCII only in all output files
- The checkpoint counter must be <50ms per Write/Edit call
- Default mode is "auto" -- existing agents are unaffected
- Settings.json entries are documented for user installation, NOT auto-written
