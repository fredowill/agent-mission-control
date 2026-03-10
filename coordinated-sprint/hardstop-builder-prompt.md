<!-- PIPELINE: create-agent-prompt | mandated: coding-standards,verification-before-completion | task-type: infrastructure -->
## Mission: Build the triple-layer orchestrator hard stop system that monitors context usage via StatusLine, injects warnings at thresholds into prompts, and creates emergency handoff files before auto-compaction fires.

Orchestrator sessions currently have zero awareness of their own context consumption. v2.2 consumed context until quality degraded silently -- the user caught it, not the system. The v2.5 orchestrator researched 11 community tools and found that only 3 of 11 have hard stop mechanisms. This agent builds ours, informed by patterns from Continuous-Claude-v3 (YAML ledgers, dirty flag thresholds), ClaudeFast ContextRecoveryHook (StatusLine monitoring, dual triggers), and Zeroshot (SQLite persistence).

**Key technical fact:** StatusLine is the ONLY Claude Code hook that receives real-time context metrics. It exposes `context_window.remaining_percentage` and `context_window.used_percentage`. Other hooks (UserPromptSubmit, PostToolUse, etc.) do NOT get token counts. Auto-compaction fires at ~83.5% usage (167K of 200K tokens). The 16.5% buffer means `remaining_percentage` includes the buffer -- actual free space before compaction = remaining% - 16.5%.

## Agent Lifecycle (follow in order)

### Stage 1: DEFINE

- **Read these files first:**
  1. `.claude/agent-hub/hooks/prompt-hook.js` -- understand existing prompt counting and injection
  2. `.claude/agent-hub/hooks/hook.js` -- understand existing PostToolUse hook patterns
  3. `~/.claude/settings.json` -- see current hook configuration, find where StatusLine and PreCompact entries go
  4. `.claude/skills/orchestrator-handoff/SKILL.md` -- understand the handoff skill that the hard stop will trigger
  5. `.claude/skills/strategic-compact/SKILL.md` -- see if there is existing compaction logic to integrate with

- **Success looks like:**
  1. A `scripts/statusline-hardstop.js` StatusLine script that reads context % and writes threshold state to a file
  2. Updated `hooks/prompt-hook.js` that reads threshold state and injects warnings at 60%/75%/85% context usage
  3. Updated `hooks/prompt-hook.js` that tracks prompt count and injects warnings at 30/50/75 prompts
  4. A PreCompact hook entry in settings.json that creates emergency handoff files
  5. An E2E test script that validates all thresholds fire correctly using mock state

- **Constraints:**
  - DO NOT modify `server.js` -- this is hooks and scripts only
  - DO NOT modify any `-page.html` files
  - DO NOT modify `hook.js` (the PostToolUse hook) -- only modify `prompt-hook.js`
  - StatusLine script must be <50ms response time (it fires on every render cycle)
  - All file writes use ASCII only (CLAUDE.md Rule 14 -- no em dashes, no smart quotes)
  - Use `path.join(__dirname, ...)` for all paths -- no hardcoded absolute paths

### Stage 2: DISCOVER (HARD GATE -- do not skip)

Run: `ls .claude/skills/`

**You MUST load at least one skill before proceeding to Stage 3.**

Mandated skills for this task:
1. `coding-standards` -- infrastructure JS must follow project conventions
2. `verification-before-completion` -- must verify all threshold layers with evidence before claiming done

If you skip this stage, your grade caps at C regardless of deliverables.

### Stage 3: EXECUTE

**Part A: StatusLine Context Monitor (`scripts/statusline-hardstop.js`)**

1. Create `scripts/statusline-hardstop.js` -- a StatusLine hook script
2. The script receives context data via stdin as JSON (StatusLine protocol)
3. Parse `context_window.remaining_percentage` and `context_window.used_percentage`
4. Calculate `freeUntilCompact = Math.max(0, remainingPercentage - 16.5)` (the 16.5% is the autocompact buffer)
5. Determine current threshold level:
   - `used_percentage < 60` => level: "green"
   - `used_percentage >= 60 && < 75` => level: "yellow" (L1: awareness)
   - `used_percentage >= 75 && < 85` => level: "orange" (L2: preparation)
   - `used_percentage >= 85` => level: "red" (L3: hard stop)
6. Write state to `.claude/agent-hub/data/hardstop-state.json`:
   ```json
   {
     "level": "yellow",
     "usedPct": 62.3,
     "remainingPct": 37.7,
     "freeUntilCompact": 21.2,
     "promptCount": 0,
     "ts": 1234567890
   }
   ```
7. Output to stdout a status emoji for the StatusLine display:
   - green: no output (clean status line)
   - yellow: `[60%]`
   - orange: `[75% HANDOFF]`
   - red: `[85% STOP]`
8. Performance: must complete in <50ms. No network calls. Synchronous file write only.

**Part B: Prompt-Hook Threshold Injection (edit `hooks/prompt-hook.js`)**

9. Read the existing `prompt-hook.js` to understand its current structure
10. Add a function `checkHardstopThresholds()` that:
    a. Reads `.claude/agent-hub/data/hardstop-state.json` (if exists)
    b. Reads or increments the prompt count for the current session
    c. Checks both context % thresholds AND prompt count thresholds
11. Context % thresholds (from StatusLine state file):
    - L1 (60%): Inject into prompt output: "CONTEXT AWARENESS: You have used 60%+ of your context window. Scope remaining work carefully. Consider what must be done vs what can be deferred."
    - L2 (75%): Inject: "HANDOFF RECOMMENDED: You have used 75%+ of context. Run /orchestrator-handoff to write your handoff doc NOW. Do not dispatch new agents. Focus on documenting what you have done and what remains."
    - L3 (85%): Inject: "CONTEXT CRITICAL -- MANDATORY HANDOFF: You have used 85%+ of context. You MUST run /orchestrator-handoff immediately. Do not perform any work except writing the handoff document. This is a hard stop."
12. Prompt count thresholds:
    - 30 prompts: Inject: "PROMPT COUNT: 30 prompts processed. Check your context usage."
    - 50 prompts: Inject: "PROMPT WARNING: 50 prompts processed. Begin handoff preparation."
    - 75 prompts: Inject: "PROMPT HARD STOP: 75 prompts processed. Write handoff doc NOW."
13. The injection should be appended to the hook's stdout output (prompt-hook.js uses `process.stdout.write`)
14. Prompt count persistence: write to `.claude/agent-hub/data/prompt-counts.json` keyed by session ID

**Part C: PreCompact Emergency Hook**

15. Create `scripts/precompact-handoff.js` -- fires when auto-compaction is imminent
16. When triggered:
    a. Read `hardstop-state.json` for latest context metrics
    b. Read `prompt-counts.json` for session prompt count
    c. Read the session's state file from `.claude/agent-hub/states/` to get session context (mission, topic, etc.)
    d. Write emergency handoff to `.claude/agent-hub/coordinated-sprint/emergency-handoff-{sessionId}.md` containing:
       - Session ID and timestamp
       - Context metrics at emergency time
       - Prompt count
       - Session mission/topic from state file
       - List of files modified this session (from state file activity log)
       - "This is an emergency handoff. The session hit auto-compaction without completing /orchestrator-handoff."
17. Exit with code 0 (do not block compaction)

**Part D: Settings.json Hook Entries**

18. Document (do NOT auto-edit) what needs to be added to `~/.claude/settings.json`:
    - StatusLine entry pointing to `scripts/statusline-hardstop.js`
    - PreCompact entry pointing to `scripts/precompact-handoff.js`
    - Write these as a "INSTALLATION" section at the top of this prompt's output, clearly formatted for the user to copy

**Part E: E2E Test Script**

19. Create `scripts/test-hardstop.js` that:
    a. Mocks a `hardstop-state.json` at each threshold level (green, yellow, orange, red)
    b. Runs the prompt-hook threshold check function against each mock
    c. Verifies the correct warning message is injected for each level
    d. Mocks prompt counts at 29, 30, 49, 50, 74, 75 and verifies threshold messages
    e. Tests the PreCompact hook by creating a mock state file and running it
    f. Outputs a pass/fail table for all test cases
20. The test must be runnable via `node scripts/test-hardstop.js` with no external dependencies

### Stage 4: REASON

After building all components, evaluate:
- Does the StatusLine script add perceptible latency? (must be <50ms)
- Does the prompt-hook injection work when the state file doesn't exist yet? (graceful degradation)
- Are the threshold messages clear enough that an orchestrator will actually stop?
- Is the PreCompact hook safe? (must not block compaction, must not crash)
- Does prompt count tracking correctly handle session restarts?
- Edge case: what if StatusLine data is stale (>5 minutes old)? Should we ignore it?

### Stage 5: VERIFY

1. Run `node scripts/test-hardstop.js` -- all test cases must pass
2. Run `node -c scripts/statusline-hardstop.js` -- syntax check
3. Run `node -c hooks/prompt-hook.js` -- syntax check (after edits)
4. Run `node -c scripts/precompact-handoff.js` -- syntax check
5. Verify `hardstop-state.json` schema matches what prompt-hook.js expects to read
6. Verify no hardcoded absolute paths in any of the 3 new/edited files
7. Create a mock `hardstop-state.json` with level "red", run prompt-hook manually, confirm the MANDATORY HANDOFF message appears in stdout

### Stage 6: DEBRIEF (before you exit)

curl -X POST http://localhost:3033/api/campaigns/agent-debrief \
  -H "Content-Type: application/json" \
  -d '{"campaignId":"campaign-002","slot":"hardstop-builder","delivered":["statusline-hardstop.js","prompt-hook threshold injection","precompact-handoff.js","test-hardstop.js","installation docs"],"missed":[],"lessons":[]}'

## Constraints

- This is a hooks-and-scripts-only task. No UI, no server.js, no page files.
- All scripts must work on Windows (bash shell via Git Bash) -- use `path.join`, not Unix-only paths
- Zero external dependencies -- only Node.js built-ins (fs, path, os)
- ASCII only in all output files (CLAUDE.md Rule 14)
- Total deliverable should be 4 files: 1 new StatusLine script, 1 edited prompt-hook, 1 new PreCompact script, 1 test script
- The settings.json hook entries should be documented for user installation, NOT auto-written (the user controls settings.json)
