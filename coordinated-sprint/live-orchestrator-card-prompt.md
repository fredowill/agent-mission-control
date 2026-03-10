## Mission: Redesign the orchestrator tab on the campaigns page to show a live, data-rich card instead of a static text dump.

The current orchestrator tab in `campaigns-page.html` (lines 2151-2217) shows: a purple icon, the orchestrator name, sprint number, status, and a raw `focus` text dump. If the orchestrator dispatched no sub-agents (e.g., v1.9 close-out), it says "No agents dispatched in Sprint 11 yet." The user wants a LIVE card that surfaces lifecycle progress, dispatched agent status, stats, and auto-replaces when a new orchestrator registers.

**Reference design spec:** `C:\Users\emeskel\Claude\coordinated-sprint\orchestrator-lifecycle-research.md` — Section 6 "Visual Design Notes" has the exact progress bar design, color coding, and integration plan.

**Deliverable:** Updated orchestrator tab section in `projects/agent-mission-control/campaigns-page.html` that renders a live orchestrator card.

## Agent Lifecycle (follow in order)

### Stage 1: DEFINE
- **Read these files first:**
  - `projects/agent-mission-control/campaigns-page.html` — the ENTIRE file, but focus on:
    - Lines 2151-2217: current orchestrator tab section
    - Lines 888-917: grading helper functions
    - Lines 804-821: load/render cycle (5-second polling)
    - Lines 1540-1554: toggleRcCollapse (recently updated, preserves state)
  - `C:\Users\emeskel\Claude\coordinated-sprint\orchestrator-lifecycle-research.md` — Section 6 Visual Design Notes (lines 253-306)
  - `projects/agent-mission-control/campaigns.json` — search for orchestrator entries to see real lifecycle data structure
  - `C:\Users\emeskel\Claude\apple-design-template.md` — design system spec (typography, colors, spacing)
- **Success looks like:** When I click the Orchestrator tab for any campaign, I see:
  1. Lightning emoji on active orchestrator icon
  2. 6-stage lifecycle progress bar with stage-specific labels (Orient/Plan/Dispatch/Monitor/Synthesize/Handoff for orchestrators, Define/Discover/Execute/Reason/Verify/Debrief for sub-agents shown in past orchestrators)
  3. Dispatched agents list with live status dots and grades
  4. Stats row (findings count, PM count, execution plan progress)
  5. Previous orchestrators section (collapsed, showing name + grade)
  6. NO raw focus text dump
- **Constraints:**
  - Only modify the orchestrator tab section (lines ~2151-2217) and add any needed CSS/helper functions
  - Do NOT touch other tabs (agents, debrief, timeline, retro, closeout)
  - Must work with existing 5-second polling (render cycle compatible)
  - Preserve the dropdown auto-close fix (line 813 area — skip re-render when dropdowns are open)
  - Follow Apple Design aesthetic (Plus Jakarta Sans, DM Sans, DM Mono fonts, existing CSS variables)

### Stage 2: DISCOVER (HARD GATE — do not skip)
Run: `ls .claude/skills/`
**You MUST load at least one skill before proceeding to Stage 3.**
Mandated skills for this task: `frontend-design` (UI component design) or `impeccable-polish` (visual quality)

### Stage 3: EXECUTE

1. Read all files listed in Stage 1
2. Load mandated skill
3. Build the new orchestrator card section:

**A. Orchestrator Hero Card (replaces current static card)**

```
┌─────────────────────────────────────────────────┐
│ [icon] Orchestrator v2.1        Sprint 2 · LIVE │
│                                                 │
│ Mission: Orchestrator standardization sprint     │
│                                                 │
│ ● Orient  ● Plan  ● Dispatch  ● Monitor  ...   │
│   PASSED    PASSED   IN PROG    PENDING         │
│                                                 │
│ Dispatched (2):                                 │
│ 🟢 Lifecycle Research           A+              │
│ 🟢 Handoff Skill Builder        A+              │
│                                                 │
│ 📊 2 findings | 0 PMs | 4/10 tasks done        │
├─────────────────────────────────────────────────┤
│ Previous: v2.0 (B+) · v1.9 (?) · v1.8 (A-)    │
└─────────────────────────────────────────────────┘
```

**B. Lifecycle Progress Bar**

- Detect agent type: `slot.startsWith('orchestrator-v')` → use orchestrator labels
- 6 dots with stage-specific labels:
  - Orchestrators: Orient → Plan → Dispatch → Monitor → Synthesize → Handoff
  - Sub-agents (in past orchestrators list): Define → Discover → Execute → Reason → Verify → Debrief
- Color coding from research doc:
  - Not reached: `#e0e0e0` (gray)
  - In progress: `#3b82f6` (blue)
  - Passed: `#22c55e` (green)
  - Partial: `#f59e0b` (amber)
  - Failed: `#ef4444` (red)

**C. Icon Logic**
- Active orchestrator (status === 'active'): ⚡ lightning emoji in purple gradient box
- Completed orchestrator: 🟣 purple circle
- Keep the existing gradient background style

**D. Dispatched Agents Section**
- Pull from campaigns.json: agents in the same sprint where `!slot.startsWith('orchestrator')`
- Show: colored status dot + name + grade badge (if graded)
- Live status dot: 🟢 completed, 🟡 active, ⬜ queued
- If no agents dispatched AND orchestrator's delivered[] is non-empty: show "Close-out sprint — no agents dispatched" instead of the misleading "No agents dispatched yet"

**E. Stats Row**
- Count findings from the orchestrator's session
- Count open PMs from dispatch.json
- Execution plan progress: `done/total` from the campaign's executionPlan.items

**F. Previous Orchestrators**
- Show past orchestrators (sorted by version descending) as a collapsed row
- Each shows: name, grade (or "?"), sprint number
- Clickable to expand into the full report card modal

**G. Auto-Replacement**
- When a new orchestrator self-registers (status: active), it automatically becomes the hero card
- Previous orchestrator moves to the "Previous" section
- This already works via the version-sort logic (line 2156-2160) — just verify it renders correctly

4. Write CSS for the new components (add to the existing `<style>` block)
5. Test with campaign-001 (many orchestrators) and campaign-002 (new, few orchestrators)

### Stage 4: REASON
- The `focus` field currently serves as the only description. What replaces it?
  - Recommendation: Use the first line of `focus` as a "Mission" subtitle. The rest is replaced by structured data (lifecycle bar, dispatched agents, stats).
- Should the previous orchestrators section be in the hero card or separate?
  - Recommendation: Inside the hero card, below the stats row, as a collapsed section. Keeps everything in one scannable card.
- How to handle campaigns with 10+ orchestrators (campaign-001 has 10)?
  - Recommendation: Show the 3 most recent in the collapsed row, with a "Show all (10)" expand button.

### Stage 5: VERIFY
- Take a Playwright screenshot of the orchestrator tab for campaign-001 (many orchestrators) and campaign-002 (active, with dispatched agents)
- Verify:
  - Lightning emoji shows on active orchestrators
  - Lifecycle bar renders 6 stages with correct labels and colors
  - Dispatched agents show with status dots
  - Stats row has real data
  - Previous orchestrators are listed
  - No raw focus text dump visible
  - Page survives 5-second polling without layout jump

### Stage 6: DEBRIEF (MANDATORY — your grade depends on this)
```bash
curl -X POST http://localhost:3033/api/campaigns/agent-debrief \
  -H "Content-Type: application/json" \
  -d '{
    "campaignId": "campaign-002",
    "slot": "live-card-designer",
    "delivered": ["Item 1: live orchestrator hero card", "Item 2: 6-stage lifecycle progress bar with orchestrator labels", "Item 3: dispatched agents section with live status", "Item 4: stats row", "Item 5: previous orchestrators section", "Item 6: auto-replacement working"],
    "missed": ["Item 1: anything not completed"],
    "lessons": ["Lesson 1: what you learned"]
  }'
```

## Constraints
- Only modify campaigns-page.html (orchestrator tab section + CSS)
- No server.js changes (no new API endpoints)
- Must work with 5-second polling render cycle
- Apple Design aesthetic (existing fonts, colors, spacing)
- Cross-browser (Chrome, Edge)
