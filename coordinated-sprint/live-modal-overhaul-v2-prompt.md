## Mission: Fix the agent modal to auto-refresh live content every 5 seconds and implement lifecycle accuracy improvements from the self-reporting research.

The current agent modal shows lifecycle-aware status (Define/Discover/Execute/etc.) but has two P0 issues: (1) the modal content freezes when opened — you must close and reopen to see updates, and (2) lifecycle stage inference is heuristic (~70% accurate). A research agent has produced recommendations at `coordinated-sprint/lifecycle-self-reporting-research.md`.

**Deliverable:** Updated `projects/agent-mission-control/campaigns-page.html` with auto-refreshing modal and improved lifecycle accuracy.

## Agent Lifecycle (follow in order)

### Stage 1: DEFINE
- **Read these files first:**
  - `coordinated-sprint/lifecycle-self-reporting-research.md` — THE PRIMARY INPUT. Read the recommended approach, state file changes, and modal auto-refresh solution. Implement what it recommends.
  - `projects/agent-mission-control/campaigns-page.html` — search for `rc-live` classes and `openReportCard` function to find the modal rendering code
  - `projects/agent-mission-control/campaigns-page.html` — search for `inferLifecycleStage` to see the current heuristic
  - `projects/agent-mission-control/campaigns-page.html` — search for `refreshLoop` and `load()` to understand the 5-second polling
  - `C:\Users\emeskel\Claude\apple-design-template.md` — design system
- **Success looks like:**
  1. Open an active agent's modal → lifecycle dots and mission status update every 5 seconds WITHOUT closing the modal
  2. Lifecycle stage accuracy is improved per the research recommendations
  3. No flicker or layout jump during auto-refresh
  4. Completed agents still show normal graded view (no regression)
- **Constraints:**
  - Only modify campaigns-page.html
  - If the research recommends hook changes, do NOT implement them — only implement the campaigns-page.html changes. Hook changes are a separate agent's job.
  - Must work with existing 5-second polling
  - Apple Design aesthetic

### Stage 2: DISCOVER (HARD GATE — do not skip)
Run: `ls .claude/skills/`
**You MUST load at least one skill before proceeding to Stage 3.**
Mandated skills for this task: `frontend-design`, `impeccable-polish`

### Stage 3: EXECUTE

**Fix 1: Modal Auto-Refresh**
The modal is rendered once in `openReportCard()` and never updated. The 5-second `refreshLoop()` calls `load()` → `render()` which re-renders the page but NOT the modal overlay.

Implementation options (choose based on research doc recommendation):
- Option A: Re-render modal content (not the overlay) on each poll cycle
- Option B: Use a lightweight update function that patches just the live section DOM
- Option C: Close and reopen the modal silently (least elegant)

Key requirements:
- The modal must stay open during updates
- No flicker — update specific elements, not innerHTML of entire modal
- Scroll position must be preserved
- Use `requestAnimationFrame` or similar for smooth updates

**Fix 2: Lifecycle Accuracy**
Implement whatever the research doc recommends for improving lifecycle inference. This might be:
- Better heuristic rules in `inferLifecycleStage()`
- Reading a new `lifecycleStage` field from the state file (if the research recommends hook-based self-reporting and the hook changes are already done)
- A combination of both

**Fix 3: Lifecycle Dots Show Partial**
Currently dots only go forward (green for passed, blue for active, gray for pending). Add support for amber dots on earlier stages when they were "partial" quality. Read from the agent's `lifecycle` field in campaigns.json if available.

### Stage 4: REASON
- Should the modal poll independently or piggyback on the existing 5-second page poll?
  - Recommendation: Piggyback — the data is already fetched. Just update the modal content after `render()`.
- What if the research doc recommends hook changes that aren't implemented yet?
  - Fall back to improved heuristic. The hook changes will come from a separate agent.

### Stage 5: VERIFY
- Take Playwright screenshot of an active agent's modal DURING auto-refresh (verify content changes)
- Take screenshot of completed agent's modal (verify no regression)
- Verify: no flicker, no layout jump, lifecycle dots update correctly, partial stages show amber

### Stage 6: DEBRIEF (MANDATORY)
```bash
curl -X POST http://localhost:3033/api/campaigns/agent-debrief \
  -H "Content-Type: application/json" \
  -d '{
    "campaignId": "campaign-002",
    "slot": "live-modal-overhaul-v2",
    "delivered": ["Item 1: modal auto-refresh without close/reopen", "Item 2: improved lifecycle accuracy", "Item 3: partial stage dots (amber)"],
    "missed": ["Item 1: anything not completed"],
    "lessons": ["Lesson 1: insight"]
  }'
```

## Constraints
- Only modify campaigns-page.html (modal section + CSS)
- Do NOT modify hooks, server.js, or state files
- Must work with existing 5-second polling
- No flicker during updates
- Apple Design aesthetic
