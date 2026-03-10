## Mission: Build the PostToolUse hook that writes lifecycleStage to agent state files, implementing Option C (hybrid) from the lifecycle self-reporting research.

The lifecycle stage shown on agent cards and modals is currently guessed by heuristic (~70-85% accurate). A research agent produced a complete implementation plan for hook-based self-reporting at `coordinated-sprint/lifecycle-self-reporting-research-prompt.md` and the findings are in the lifecycle-self-reporting-research agent's debrief in campaigns.json. The card and modal already read `lifecycleStage` from state files when available — this agent builds the hook that WRITES it.

**Deliverable:** A PostToolUse hook that infers the agent's current lifecycle stage from tool activity patterns and writes it to the agent's state file. Both the campaigns page card and modal will immediately show accurate stages once this hook exists.

## Agent Lifecycle (follow in order)

### Stage 1: DEFINE
- **Read these files first:**
  1. `campaigns.json` — find the `lifecycle-self-reporting-research` agent entry. Read its `delivered` and `lessons` arrays for the recommended approach (Option C hybrid: enhanced heuristic + explicit self-report fields)
  2. `~/.claude/hooks.json` or `~/.claude/settings.json` — understand how hooks are configured. Look for existing PostToolUse hooks.
  3. `projects/agent-mission-control/hook.js` — the main MC hook that fires on PostToolUse. Understand how it reads tool call data and updates state files.
  4. `~/.claude/agent-hub/states/` — look at a state file to understand the current schema. The hook needs to ADD `lifecycleStage`, `lifecycleHistory`, and `lifecycleOverride` fields.
  5. `projects/agent-mission-control/campaigns-page.html` — search for `lifecycleStage` to see where the card/modal already reads this field (the Live Modal Overhaul v2 agent added this support)
- **Success looks like:**
  1. Every agent's state file gets a `lifecycleStage` field updated on each tool call
  2. The stage is monotonic — once an agent reaches EXECUTE, it never regresses to DEFINE even if it does a Read
  3. The campaigns page card and modal show the correct stage in real-time (no heuristic needed)
  4. Backward compatible — agents that existed before this hook still work (their state files just lack the field)
- **Constraints:**
  - The hook fires on EVERY PostToolUse for EVERY agent — it must be FAST (<50ms)
  - Do NOT modify campaigns-page.html — it already reads lifecycleStage when available
  - Do NOT modify server.js unless absolutely necessary (restart required)
  - Must work on Windows (Git Bash / MINGW64)
  - Must not break existing hook functionality (prompt capture, state updates, auto-grade triggers)

### Stage 2: DISCOVER (HARD GATE — do not skip)
Run: `ls .claude/skills/`
**You MUST load at least one skill before proceeding to Stage 3.**
Mandated skills for this task: `coding-standards`, `verification-before-completion`

### Stage 3: EXECUTE

**The hybrid approach (Option C from research):**

1. **Add lifecycle inference to hook.js** — after each tool call, infer the lifecycle stage from the cumulative activity pattern:
   - **DEFINE**: Agent is reading context files, no writes yet. Tools: Read, Glob, Grep only.
   - **DISCOVER**: Agent loaded skills (look for Skill tool usage or `ls .claude/skills` in Bash).
   - **EXECUTE**: Agent is writing code. Tools: Write, Edit, Bash (non-read commands). This is the longest stage.
   - **REASON**: Agent is reading/analyzing after writing (Read after Write/Edit pattern). Or explicit reasoning indicators.
   - **VERIFY**: Agent is running tests, Playwright screenshots, curl commands, syntax checks. Look for: Playwright, `node -c`, `curl`, screenshot-related Bash.
   - **DEBRIEF**: Agent calls the debrief API (`/api/campaigns/agent-debrief`). Detected by URL pattern in Bash.

2. **Implement monotonic tracking** — the stage can only move FORWARD. Store the highest stage reached. If the agent does a Read during EXECUTE, it stays at EXECUTE. The order is: DEFINE < DISCOVER < EXECUTE < REASON < VERIFY < DEBRIEF.

3. **Write to state file** — on each hook call, update the state file with:
   ```json
   {
     "lifecycleStage": "execute",
     "lifecycleStageIndex": 3,
     "lifecycleHistory": [
       {"stage": "define", "ts": 1234567890},
       {"stage": "discover", "ts": 1234567900},
       {"stage": "execute", "ts": 1234567950}
     ]
   }
   ```

4. **Handle the Skill tool specially** — when the tool is "Skill" or the Bash command contains `ls .claude/skills`, this is DISCOVER stage. Transition immediately.

5. **Handle debrief detection** — when a Bash command contains `api/campaigns/agent-debrief`, this is DEBRIEF. Transition immediately.

6. **Performance guard** — the inference logic must be synchronous and fast. No file reads beyond the state file. No API calls. Just pattern matching on the tool name and arguments already available in the hook payload.

### Stage 4: REASON
- The biggest accuracy challenge is EXECUTE vs REASON vs VERIFY — all three use similar tools. Consider: VERIFY is characterized by Playwright/curl/test commands AFTER substantial Write/Edit activity. REASON is a short Read phase between EXECUTE and VERIFY.
- Should the hook also support explicit self-reporting? The research recommended a `/api/lifecycle` endpoint that agents can call. This could be added as a bonus but is not required — the heuristic hook alone gets us to ~90%+ accuracy with monotonic tracking.
- What about the orchestrator itself? It doesn't follow the same lifecycle. Consider: detect orchestrator sessions (check if the session's prompt file contains "orchestrator") and use different stage labels or skip lifecycle tracking.

### Stage 5: VERIFY
- Start a test Claude Code session and watch its state file update with lifecycleStage as you use different tools
- Check that the campaigns page card shows the correct stage for the test session
- Verify monotonic behavior: do a Read after some Writes — stage should NOT regress from EXECUTE to DEFINE
- Verify performance: check that the hook adds <50ms overhead (log timestamps before and after the lifecycle logic)
- Verify backward compatibility: check that state files for completed agents (no hook) still render correctly on the campaigns page

### Stage 6: DEBRIEF (MANDATORY — your grade depends on this)
```bash
curl -X POST http://localhost:3033/api/campaigns/agent-debrief \
  -H "Content-Type: application/json" \
  -d '{
    "campaignId": "campaign-002",
    "slot": "lifecycle-hook-builder",
    "delivered": ["Item 1: PostToolUse lifecycle inference in hook.js", "Item 2: monotonic stage tracking", "Item 3: state file schema with lifecycleStage/lifecycleHistory"],
    "missed": ["Item 1: anything not completed"],
    "lessons": ["Lesson 1: insight about hook-based lifecycle tracking"]
  }'
```

## Constraints
- Hook must be FAST (<50ms per call)
- Monotonic — stages only go forward
- Do NOT modify campaigns-page.html or server.js (unless server restart is required for new API)
- Backward compatible with existing state files
- Must work on Windows (Git Bash / MINGW64)
