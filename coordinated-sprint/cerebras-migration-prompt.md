<!-- PIPELINE: create-agent-prompt | mandated: verification-before-completion,systematic-debugging | task-type: infrastructure -->
## Mission: Replace all 5 remaining Cerebras callLLM usages in server.js with Claude CLI (claude -p --model haiku).

Mission Control's server.js uses a callLLM function (line 313) that calls the Cerebras API for AI-powered features (task summarization, theme extraction, top-of-mind briefing, idea analysis, workstream classification). Cerebras is unreliable — if it goes down, 5 features silently fail. v2.2 already migrated deep-summaries to Claude CLI. This agent migrates the remaining 5.

## Agent Lifecycle (follow in order)

### Stage 1: DEFINE
- **Read:** .claude/agent-hub/server.js — specifically:
  - callLLM function definition (line 313-357)
  - Usage at line 393 (task title summarization)
  - Usage at line 445 (theme extraction)
  - Usage at line 479 (top-of-mind briefing)
  - Usage at line 2536 (idea/capture analysis)
  - Usage at line 3709 (workstream classification)
  - Deep-summary Claude CLI pattern (line ~770-810) — this is the REFERENCE implementation that already works
- **Success looks like:** All 5 callLLM call sites replaced with Claude CLI via child_process.execFile (not exec — use execFile for safety). The callLLM function itself can be removed or kept as dead code. All 5 features produce equivalent output.
- **Constraints:**
  - Do NOT touch the deep-summary pipeline (lines 700-900) — already migrated
  - Do NOT change prompt text — only the transport layer (Cerebras HTTP to Claude CLI)
  - Do NOT add new dependencies
  - Use child_process.execFile, NOT exec (security best practice — no shell injection)
  - Keep the same async patterns — if callLLM returned a Promise, the replacement should too
  - If Claude CLI is not available, fail gracefully (return empty string, same as current Cerebras timeout behavior)

### Stage 2: DISCOVER (HARD GATE — do not skip)
Run: ls .claude/skills/
**You MUST load at least one skill before proceeding to Stage 3.**
Mandated skills for this task: verification-before-completion, systematic-debugging
If you skip this stage, your grade caps at C regardless of deliverables.

### Stage 3: EXECUTE
1. Read the existing callLLM function (line 313) to understand the interface: callLLM(prompt, maxTokens) returns Promise of string
2. Read the deep-summary Claude CLI pattern (~line 770) as the reference implementation
3. Create a replacement function callClaude(prompt, maxTokens) that:
   - Uses child_process.execFile to run claude with args ['-p', '--model', 'haiku']
   - Pipes the prompt via stdin
   - Returns the stdout as a string
   - Has a timeout (15s, matching current Cerebras timeout)
   - Returns empty string on failure (matching current error behavior)
4. Replace each of the 5 callLLM(...) calls with callClaude(...)
5. Keep the callLLM function definition but add a comment: DEPRECATED Use callClaude. Kept for reference.
6. Verify the MC server starts without errors after changes

### Stage 4: REASON
- Does claude -p handle stdin correctly on Windows (Git Bash)?
- Is execFile with callback acceptable for these call sites, or do they need different async patterns?
- What happens if claude CLI is not in PATH? (Should fail gracefully like Cerebras)
- Are any of the 5 call sites in hot paths that would block on sync execution?

### Stage 5: VERIFY
1. Restart the MC server: node .claude/agent-hub/server.js
2. Verify server starts without errors
3. Curl /api/dashboard and confirm task titles are populated (uses summarization)
4. Curl /health and confirm 200
5. Check server logs for any callClaude errors

### Stage 6: DEBRIEF (before you exit)
curl -X POST http://localhost:3033/api/campaigns/agent-debrief \
  -H "Content-Type: application/json" \
  -d '{"campaignId":"campaign-002","slot":"cerebras-migration","delivered":["..."],"missed":["..."],"lessons":["..."]}'

## Constraints
- server.js only — no other files
- Do not change AI prompt text, only transport
- Use execFile not exec for security
- Graceful fallback on CLI unavailability
- Must work on Windows (Git Bash) and would work on macOS
