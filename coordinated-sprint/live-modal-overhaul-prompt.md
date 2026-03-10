## Mission: Overhaul the active agent modal to show lifecycle stage progress and mission-level status instead of low-level tool activity.

The current live agent modal (built by a previous agent) shows: tool-by-tool activity logs (Read, Write, Grep), tool count breakdowns (12 Read · 3 Write), and raw state transitions. The user explicitly said: "I don't need to know the specific tools. Tools are not important. I need the bigger picture." and "I want to know where it's at in the current state" referring to lifecycle stages.

**What the user wants:**
1. Which lifecycle stage is the agent in? (Define → Discover → Execute → Reason → Verify → Debrief)
2. What has it accomplished so far at a mission level? (e.g., "Read 5 context files, loaded 2 skills, writing the deliverable")
3. Current high-level state (investigating context, building, verifying output)
4. Elapsed time

**What the user does NOT want:**
- Tool names (Read, Write, Edit, Bash, Grep, Glob)
- Tool counts
- Raw state transitions
- Activity timeline showing individual tool calls

**Deliverable:** Updated report card modal in `projects/agent-mission-control/campaigns-page.html` that replaces the tool-level live section with lifecycle-aware mission status.

## Agent Lifecycle (follow in order)

### Stage 1: DEFINE
- **Read these files first:**
  - `projects/agent-mission-control/campaigns-page.html` — search for `rc-live` CSS classes and the modal rendering code to find the current live section
  - `projects/agent-mission-control/server.js` — search for `/api/agents` and `/api/session` to understand available data
  - `C:\Users\emeskel\Claude\coordinated-sprint\orchestrator-lifecycle-research.md` — Section 6 for lifecycle stage visual design
  - `C:\Users\emeskel\Claude\apple-design-template.md` — design system
- **Success looks like:** When I click an active agent's card, I see:
  1. **Lifecycle progress bar** — same 6-dot style as completed agents, but with real-time stage inference: green dots for stages the agent has passed, blue pulsing dot for current stage, gray for upcoming
  2. **Mission status line** — one sentence describing what the agent is doing at a high level: "Reading context files and loading skills" or "Building the deliverable" or "Running verification checks"
  3. **Current stage label** — bold text: "Stage 3: EXECUTE" with a brief description
  4. **Elapsed time** — "Running for 4m 32s"
  5. **NO tool names, NO tool counts, NO activity timeline**
- **Constraints:**
  - Modify only the modal live section in campaigns-page.html
  - Replace the existing `rc-live-timeline` and `rc-live-tools` sections — do NOT add alongside them
  - Keep the state bar (pulsing dot + DEVELOPING label) but reframe it as the mission status
  - Must work with 5-second polling

### Stage 2: DISCOVER (HARD GATE)
Run: `ls .claude/skills/`
Mandated: `frontend-design` (UI component design)

### Stage 3: EXECUTE

1. **Lifecycle Stage Inference** — infer the current lifecycle stage from activity patterns:

| Stage | How to Detect |
|-------|--------------|
| **Define** | Agent is only reading files (state: investigating), no writes yet |
| **Discover** | Agent read or accessed `.claude/skills/` directory, or loaded a Skill |
| **Execute** | Agent started writing files (state: developing) |
| **Reason** | Agent is reading its own output files or running evaluation commands |
| **Verify** | Agent is running Bash commands (tests, Playwright, curl) or taking screenshots |
| **Debrief** | Agent called the debrief API endpoint |

Use the activity log entries to walk through these stages. Once a stage is detected, it stays "passed" — stages progress forward, never backward.

2. **Mission Status Line** — translate the raw state into human-readable mission context:

| Raw State | Mission Status |
|-----------|---------------|
| investigating (early) | "📖 Reading context and understanding requirements" |
| investigating (after skills) | "🔍 Discovering available skills and tools" |
| developing | "🛠️ Building the deliverable" |
| verifying | "✅ Running verification and testing output" |
| thinking | "🧠 Planning next steps" |
| waiting/idle | "⏳ Waiting for input" |
| done | "✅ Completed" |

The mission status should feel like a human-written sentence, not a debug label.

3. **Replace Tool Activity with Lifecycle Bar:**

```
┌────────────────────────────────────────────────┐
│ 🟢 🛠️ Building the deliverable                │
│ Stage 3: EXECUTE                    4m 32s     │
│                                                │
│ ● Define  ● Discover  ● Execute  ○ Reason ...  │
│   PASSED    PASSED      ACTIVE     PENDING     │
└────────────────────────────────────────────────┘
```

- Green filled dots for passed stages
- Blue pulsing dot for active stage
- Gray hollow dots for pending stages
- Stage labels below dots (same as completed agents but live-updating)

4. **Remove these elements entirely:**
- `rc-live-timeline` section (activity log)
- `rc-live-tools` section (tool counts)
- Any references to individual tool names in the modal

5. **Keep these elements:**
- Pulsing green dot (reframed as mission status indicator)
- Elapsed time
- The conditional rendering logic (active vs completed vs ready)

### Stage 4: REASON
- The lifecycle inference is heuristic — it won't be perfect. Is that OK?
  - Yes — approximate lifecycle position is 10x more useful than exact tool counts. If the agent has been writing files for 3 minutes, showing "Execute: ACTIVE" is accurate enough.
- Should the lifecycle bar in the modal update the ACTUAL lifecycle field in campaigns.json?
  - NO — the modal shows inferred state for display only. The grading script sets the official lifecycle values after completion.

### Stage 5: VERIFY
- Take a Playwright screenshot of an active agent's modal showing the new lifecycle-aware view
- Take a screenshot of a completed agent's modal (should show normal graded view unchanged)
- Verify: no tool names visible, no tool counts, lifecycle dots render correctly, mission status is human-readable

### Stage 6: DEBRIEF
```bash
curl -X POST http://localhost:3033/api/campaigns/agent-debrief \
  -H "Content-Type: application/json" \
  -d '{
    "campaignId": "campaign-002",
    "slot": "live-modal-overhaul",
    "delivered": ["Item 1: lifecycle stage inference from activity patterns", "Item 2: mission status line replacing tool activity", "Item 3: live lifecycle progress bar in modal", "Item 4: removed tool counts and activity timeline"],
    "missed": ["Item 1: anything not completed"],
    "lessons": ["Lesson 1: insight"]
  }'
```

## Constraints
- Modify only campaigns-page.html (modal live section + CSS)
- REPLACE the tool-level sections, don't add alongside
- No new server endpoints
- Must work with 5-second polling
- Apple Design aesthetic
- NO tool names or counts anywhere in the active agent modal
