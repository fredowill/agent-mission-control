## Mission: Update the Workflow page to reflect the auto-dispatch pipeline

The Workflow page (`/workflow`) was redesigned in Sprint 7 but doesn't reflect the auto-dispatch infrastructure shipped in Sprint 8. The "How We Coordinate" tab specifically needs updating — Phase 5 still says "user runs in terminals" when auto-dispatch now handles launching programmatically.

## Context

- **File:** `.claude/agent-hub/workflow-page.html` — this is the ONLY file you modify
- **Server:** MC runs at `http://localhost:3033` (zero-dependency Node.js, port 3033)
- **Auto-dispatch components (shipped in Sprint 8):**
  - `POST /api/launch` — endpoint that generates session UUID, pre-links to campaign, writes temp launcher script, opens Windows Terminal tab
  - `dispatch.sh` — runs in new tab, supports `auto` (headless `-p`) and `interactive` modes, calls auto-grade on exit, plays LoL ping
  - `auto-grade.js` — reads activity log, infers lifecycle stages, calculates score, writes to campaigns.json
  - `guard-destructive.sh` — PreToolUse hook that blocks dangerous commands (rm -r, force push, hard reset, process kills)
  - `notify-ping.wav` — LoL Enemy Missing ping at 40% volume (single = success, double = error)
  - Parent-child tracking: `parentSessionId` + `dispatchMeta` preserved through hook.js and prompt-hook.js
- **Design system:** Apple-inspired light mode. Fonts: Plus Jakarta Sans, DM Sans, DM Mono. The page uses 4 tabs with rich visualizations.

## Agent Lifecycle (follow in order)

### Stage 1: DEFINE
Read `workflow-page.html` fully. Understand:
- The 4-tab structure: How Agents Start, How Agents Work, How We Coordinate, How We Learn
- The "How We Coordinate" tab content (starts at `id="tab-coordinate"`)
- The orchestrator flowchart (phases 1-8 with vertical flow)
- The existing dispatch section and campaign flow
- The version history table at the bottom

Success = the Coordinate tab accurately reflects the current auto-dispatch workflow, with a clear visualization of the automated pipeline.

### Stage 2: DISCOVER
Check available skills: `ls .claude/skills/`
Relevant skills to load:
- `frontend-design` — for new visualizations
- `impeccable-polish` — for final quality pass

### Stage 3: EXECUTE

**Step 1: Update Phase 5 description**
Find the Phase 5 card (🚀 Dispatch Agents) and update:
- Old: "PRD prompts to files, one deliverable per agent, user runs in terminals"
- New: "Auto-dispatch via `/api/launch` — PRDs to files, agents launch in new tabs automatically"

**Step 2: Add Auto-Dispatch Pipeline visualization**
After the existing orchestrator flowchart, add a new section: **"Auto-Dispatch Pipeline"**
Show the automated flow as a horizontal or vertical pipeline:

```
Orchestrator calls POST /api/launch
    ↓
dispatch.sh launches in new Windows Terminal tab
    ↓
claude -p runs with PRD (auto mode) or claude (interactive mode)
    ↓
Agent executes, hook.js tracks state in real-time
    ↓
Agent exits → auto-grade.js scores performance
    ↓
campaigns.json updated with grade + lifecycle
    ↓
🔔 LoL ping notification (success or error)
```

Use the same visual style as the orchestrator flowchart (colored cards, emoji icons, concise descriptions). Each step should have:
- An emoji icon
- A bold title
- A one-line description of what happens

**Step 3: Add Safety & Tracking section**
Below the pipeline, add a compact section showing the safety and tracking infrastructure:
- `guard-destructive.sh` — blocks rm -r, force push, hard reset, process kills, npm publish, DB drops
- Parent-child tracking — `parentSessionId` links dispatched agents back to orchestrator
- Live state — hook.js updates state files every tool call, Dashboard shows real-time agent status
- Auto-grading weights: 40% deliverables, 25% execution, 20% lifecycle, 15% skills

**Step 4: Update version history table**
Add v1.4 entry:
- Version: v1.4
- Focus: Auto-dispatch infrastructure
- Key changes: dispatch.sh, /api/launch, auto-grading, safety hooks, LoL notifications, orchestrator tab

**Step 5: Update the Campaign Flow section**
The existing campaign flow (7 circles with labels) should reflect that steps are now automated:
- Step 5 "Dispatch" → "Auto-Dispatch" with note about /api/launch
- Step 6 "Monitor" → "Auto-Monitor" with note about live state + auto-grading

**Step 6: Add "Expand All / Collapse All" toggle**
The workflow page has many collapsible sections across all 4 tabs. Add a floating or sticky "Expand All / Collapse All" button (similar to the campaigns page Agents tab). Requirements:
- One button that toggles ALL collapsible sections on the currently visible tab
- Text changes between "Expand All" and "Collapse All" based on state
- Position: top-right of the tab content area, or as a sticky button
- All sections should default to OPEN (expanded). The button is for quickly collapsing everything.
- Style: match the campaigns page button (font-family DM Sans, 12px, 600 weight, 6px 16px padding, 8px border-radius, surface background)

### Stage 4: REASON
- Does the auto-dispatch pipeline visualization fit naturally alongside the existing orchestrator flowchart?
- Is the safety section informative without being overwhelming?
- Does the version history accurately capture v1.4's contributions?
- Are all 4 tabs still rendering correctly after changes?

### Stage 5: VERIFY
- Take a Playwright screenshot of the Coordinate tab at `http://localhost:3033/workflow` (click "How We Coordinate" tab)
- Verify: Phase 5 description is updated
- Verify: Auto-dispatch pipeline visualization renders cleanly
- Verify: Safety section is present and readable
- Verify: Version history shows v1.4
- Verify: All 4 tabs still work (click through each)
- Check all other tabs for regressions

## Constraints
- **ONE file only:** `workflow-page.html`. Do NOT modify server.js or any other files.
- **Preserve existing content.** The orchestrator flowchart, phase cards, and other sections should remain. You're ADDING the auto-dispatch section, not replacing what exists.
- **Match existing design patterns.** Use the same CSS classes, card styles, and color system already in the file.
- **No SVG for content with emojis.** If using emojis in diagrams, use HTML divs — never SVG text elements (PM013 lesson). SVG only for curves/arrows that CSS can't do.
- **Keep all 4 tabs working.** Test each tab after your changes.
