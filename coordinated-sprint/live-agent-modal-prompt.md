## Mission: Add live state information to the agent report card modal for active (running) agents on the campaigns page.

Currently, when you click an active agent's card on the campaigns page, the modal shows: all lifecycle stages as PENDING, "Score available after agent completes", Skills: none. It's a blank page — you learn nothing about what the agent is doing. The user has to check the dashboard or terminal tabs to see agent state.

The MC infrastructure already tracks live agent state via state files (`states/{sid}.json`) and activity logs (`logs/{sid}.ndjson`). The dashboard reads this data and shows it. The campaigns page just doesn't use it for active agents.

**Deliverable:** Updated agent report card modal in `projects/agent-mission-control/campaigns-page.html` that shows live state info for active agents, including: current state bar, activity timeline, tool count breakdown, and elapsed time.

## Agent Lifecycle (follow in order)

### Stage 1: DEFINE
- **Read these files first:**
  - `projects/agent-mission-control/campaigns-page.html` — search for the agent report card modal code. Look for where agent cards are rendered and the onclick that opens the modal.
  - `projects/agent-mission-control/server.js` — search for `/api/agents` endpoint to understand what live state data is available. Also check `/api/campaigns` for how agent data merges with live state.
  - `projects/agent-mission-control/toolbox/config/memory-files/auto-dispatch-research.md` — documents the state file format, activity log format, and PID liveness detection.
  - `C:\Users\emeskel\Claude\apple-design-template.md` — design system spec
- **Success looks like:** When I click an active agent's card, the modal shows:
  1. **Live state bar** — green dot + emoji + state label (DEVELOPING, INVESTIGATING, THINKING, etc.) + current tool/file
  2. **Elapsed time** — "Running for 4m 32s" based on session start time
  3. **Activity timeline** — last 5-8 state transitions, most recent first (e.g., "🔍 Read campaigns.json → 🛠️ Write SKILL.md → 🔍 Read auto-grade.js")
  4. **Tool count breakdown** — how many Read, Write, Edit, Bash, Grep, Glob calls the agent has made (from activity logs)
  5. Lifecycle stages still show PENDING (correct — they haven't been graded yet)
  6. The existing "Score available after agent completes" message stays but is pushed below the live section
- **Constraints:**
  - Modify only the agent report card modal section in campaigns-page.html
  - May need to add a new API call or use existing `/api/agents` data
  - Must work with 5-second polling (live state updates every poll)
  - Must gracefully handle: agent just started (no activity yet), agent has no state file, agent is completed (show normal graded view, not live view)
  - Apple Design aesthetic

### Stage 2: DISCOVER (HARD GATE — do not skip)
Run: `ls .claude/skills/`
**You MUST load at least one skill before proceeding to Stage 3.**
Mandated skills for this task: `frontend-design` (UI component design)

### Stage 3: EXECUTE

1. Read all files listed in Stage 1
2. Understand the data flow:
   - `/api/agents` returns live session data including: state, tool, detail, statusLine, emoji, label, ts
   - `/api/campaigns` returns campaign agent entries with: slot, sessionId, status, grade, etc.
   - The modal needs to JOIN these: match campaign agent's sessionId with live session data
3. Design the live state section:

**A. Live State Bar (top of modal, replaces blank space)**
```
┌──────────────────────────────────────────┐
│ 🟢 🛠️ DEVELOPING          Write          │
│ Writing auto-grade-orchestrator.js        │
│ Running for 4m 32s                        │
└──────────────────────────────────────────┘
```
- Green pulsing dot (reuse existing `livePulse` animation)
- State emoji + label from state file
- Current tool on the right
- Status line or file detail below
- Elapsed time from session start (`ts` field)

**B. Activity Timeline (below state bar)**
```
Recent Activity:
  🛠️ Write  auto-grade-orchestrator.js     12s ago
  🔍 Read   auto-grade.js                  45s ago
  🔍 Read   campaigns.json                  1m ago
  🔍 Grep   orchestrator lifecycle           2m ago
  🧠 Think  (planning approach)              3m ago
```
- Last 5-8 entries from activity logs (`logs/{sid}.ndjson`)
- Each shows: emoji + tool name + detail/file + relative time
- Most recent first
- If no activity log exists, show "Waiting for first activity..."

**C. Tool Count Breakdown (below timeline)**
```
Tools Used: 12 Read · 3 Write · 2 Edit · 5 Bash · 4 Grep · 1 Glob
```
- Single line, compact
- Count each tool type from activity logs
- Use monospace font for counts

**D. Conditional Rendering**
- If agent `status === 'active'` AND has a live session: show A + B + C above the lifecycle dots
- If agent `status === 'active'` BUT no live session: show "Agent started, waiting for first activity..."
- If agent `status === 'completed'`: show normal graded view (no live section)
- If agent `status === 'ready'`: show "Not yet started"

4. Check if `/api/agents` data is already available in the render context, or if a new fetch is needed
5. Implement the live section in the modal rendering code
6. Add any needed CSS (minimal — reuse existing styles)

### Stage 4: REASON
- Does the campaigns page already fetch `/api/agents`? Check the `load()` function — it fetches both `/api/campaigns` and `/api/agents`. The sessions data should already be in scope.
- How to match campaign agent to live session? Use `sessionId` field on the campaign agent entry — match it against `sessions` array from `/api/agents`.
- Should the activity timeline auto-update within the modal? Yes — since the modal re-renders on each 5-second poll (IF the dropdown auto-close fix allows it). If not, the user can close and reopen the modal to see updates.
- Edge case: the orchestrator itself (this session) won't have a tracked PID. That's fine — the live section handles "no live session" gracefully.

### Stage 5: VERIFY
- Take a Playwright screenshot of an active agent's modal showing the live state section
- Take a Playwright screenshot of a completed agent's modal (should show normal graded view, no live section)
- Verify:
  - Live state bar shows correct state/tool/elapsed time
  - Activity timeline shows recent entries in correct order
  - Tool counts are accurate
  - Completed agents still show normal graded view
  - No layout jump on 5-second polling
  - Apple Design aesthetic

### Stage 6: DEBRIEF (MANDATORY — your grade depends on this)
```bash
curl -X POST http://localhost:3033/api/campaigns/agent-debrief \
  -H "Content-Type: application/json" \
  -d '{
    "campaignId": "campaign-002",
    "slot": "live-agent-modal",
    "delivered": ["Item 1: live state bar with emoji, label, tool, elapsed time", "Item 2: activity timeline from logs", "Item 3: tool count breakdown", "Item 4: conditional rendering for active/completed/ready states"],
    "missed": ["Item 1: anything not completed"],
    "lessons": ["Lesson 1: what you learned"]
  }'
```

## Constraints
- Modify only campaigns-page.html (modal section + CSS)
- Use existing `/api/agents` data — no new server endpoints
- Must work with 5-second polling
- Gracefully handle missing state files / empty activity logs
- Apple Design aesthetic
- Cross-browser (Chrome, Edge)
