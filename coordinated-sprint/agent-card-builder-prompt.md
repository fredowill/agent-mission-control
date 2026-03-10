## Mission: Redesign agent cards on the campaigns page implementing the full spec from the card research document, including task-type colors, segmented lifecycle bar, cook timer, dispatch reason line, and cleaned-up completed state.

A research agent analyzed 22 user pain points across 10+ orchestrator sessions and produced a complete card redesign spec. Your job is to implement that spec in `campaigns-page.html`. The research doc at `coordinated-sprint/agent-card-research.md` is your PRIMARY INPUT — read it entirely before writing any code.

**Deliverable:** Updated `projects/agent-mission-control/campaigns-page.html` with redesigned agent cards matching the research spec for both active and completed states.

## Agent Lifecycle (follow in order)

### Stage 1: DEFINE
- **Read these files first (in order):**
  1. `coordinated-sprint/agent-card-research.md` — THE PRIMARY INPUT. Read ALL sections. Contains 22 pain points, card anatomy, external research, proposed redesign with CSS code, color system, lifecycle progress bar spec, cook timer code, and dispatch reason field.
  2. `projects/agent-mission-control/campaigns-page.html` — the file you're modifying. Search for: `renderAgentCard` (card rendering function), `.agent-card` CSS classes, lifecycle dot rendering, live state rendering, and the existing color system.
  3. `C:\Users\emeskel\Claude\apple-design-template.md` — our design system (Plus Jakarta Sans, DM Sans, CSS custom properties, spacing rhythm)
  4. `projects/agent-mission-control/campaigns.json` — look at actual agent data to understand what fields are available (slot, name, focus, grade, lifecycle, skillsUsed, delivered, missed, status, sessionId)
- **Success looks like:**
  1. Active agent cards show: emoji + name, cook timer (live-updating), dispatch reason line, segmented lifecycle progress bar with stage label, natural language activity line
  2. Completed agent cards show: emoji + name, grade badge (color-coded), dispatch reason line, delivered count (missed only if > 0), total cook time, full progress bar with DONE label
  3. Task-type color system applied: research=blue, build=green, UI=pink, etc. (see research doc section 4.3)
  4. Skill pills REMOVED from card face (moved to modal)
  5. "no skills used" pill REMOVED entirely
  6. "Status: Completed" text REMOVED
  7. No regressions: clicking cards still opens report card modal, sprint phase headers still work, orchestrator tab still works
- **Constraints:**
  - ONLY modify `campaigns-page.html`
  - Do NOT modify server.js, campaigns.json, or any other files
  - The research doc proposes new JSON fields (`dispatchReason`, `taskType`) — for NOW, infer these from existing data:
    - `taskType`: infer from agent slot name or focus text (e.g., "research" in focus = research type, "UI" or "design" in focus = ui type, "build" or "fix" in focus = infrastructure type). Default to "infrastructure" if unclear.
    - `dispatchReason`: use the existing `focus` field, truncated to ~60 chars. The proper field will be added later by the orchestrator.
  - Apple Design aesthetic: Plus Jakarta Sans, light mode, CSS custom properties, 8/12/16/24px spacing
  - Must work with the existing 5-second polling refresh loop
  - Cook timer must NOT cause layout jumps when time increments change digit count

### Stage 2: DISCOVER (HARD GATE — do not skip)
Run: `ls .claude/skills/`
**You MUST load at least one skill before proceeding to Stage 3.**
Mandated skills for this task: `frontend-design`, `impeccable-polish`, `ui-ux-pro-max`

Use `ui-ux-pro-max` search to find card design patterns:
```bash
python ~/.claude/skills/ui-ux-pro-max/scripts/search.py "minimalist status card" --domain style --max-results 3
python ~/.claude/skills/ui-ux-pro-max/scripts/search.py "agent dashboard" --domain landing --max-results 3
```
Note: Python is at `C:\Users\emeskel\AppData\Local\Programs\Python\Python313\python.exe` — use full path if `python` is not in PATH.

### Stage 3: EXECUTE

**Phase 1: CSS Foundation**
1. Add the task-type color system CSS variables (section 4.3 of research doc — 8 task types with bar color, emoji, border tint)
2. Add the segmented lifecycle progress bar CSS (section 4.4 — replace dot styles)
3. Add cook timer CSS (monospace, fixed-width to prevent layout jumps)
4. Add dispatch reason line CSS (italic, truncated with ellipsis, muted color)
5. Remove or override: `.agent-card .skill-pill` styles on the card (keep in modal), "no skills used" styles

**Phase 2: Card Rendering (JS)**
6. Modify `renderAgentCard` (or equivalent function) to implement the new card layout:
   - Infer task type from agent focus/slot text
   - Render: color bar (6px, task-type color) → emoji + name + cook timer → dispatch reason → lifecycle progress bar with label → activity line (active) or delivered count (completed)
7. Implement cook timer: `setInterval` updating every second for active agents. Use the agent's session start time from the state data or `created` field.
8. Implement segmented lifecycle progress bar: 6 segments, filled solid up to current stage, current stage pulses. Read from `agent.lifecycle` field.
9. Implement natural language activity line for active agents (replace VERIFYING/Bash):
   - Map tool names to human descriptions: Read → "Reading files...", Write/Edit → "Writing code...", Bash → "Running commands...", Grep/Glob → "Searching codebase...", WebSearch → "Researching online..."
   - If lifecycle stage is available, prefix with stage: "Execute: Writing code..."
10. For completed cards: show "✓ N delivered" always. Show "✗ N missed" ONLY if missed count > 0 (filter "no items" text like the existing fix). Show total cook time. Show full progress bar with "DONE".

**Phase 3: Cleanup**
11. Remove skill pills from card face rendering (keep the data — it's still used in the report card modal)
12. Remove "no skills used" pill entirely
13. Remove "Status: Completed" text
14. Ensure the grade badge on completed cards gets a colored background (A=green, B=blue, C=amber, D/F=red)

### Stage 4: REASON
- Task-type inference from focus text is imperfect — what's the best heuristic? Consider: keyword matching (research, UI, design, build, fix, review, security, refactor, polish) with a sensible default.
- The cook timer needs a start time. For active agents, use the session start from the state file. For completed agents, calculate from campaign data if available, otherwise don't show.
- Should the lifecycle progress bar segments be clickable? Probably not on the card — save that for the modal.
- The dispatch reason line uses `focus` field for now — it may be too long. Truncate with CSS `text-overflow: ellipsis` at ~2 lines max.

### Stage 5: VERIFY
- Take Playwright screenshot of campaign-002 Sprint 3 cards (active + completed agents visible)
- Take Playwright screenshot of campaign-001 cards (verify no regression on historical data)
- Verify: cook timer is ticking (take 2 screenshots 5 seconds apart, confirm timer changes)
- Verify: no broken layouts, text overflow, or missing elements
- Verify: clicking a card still opens the report card modal correctly
- Verify: task-type colors are visually distinct and match the research spec

### Stage 6: DEBRIEF (MANDATORY — your grade depends on this)
```bash
curl -X POST http://localhost:3033/api/campaigns/agent-debrief \
  -H "Content-Type: application/json" \
  -d '{
    "campaignId": "campaign-002",
    "slot": "agent-card-builder",
    "delivered": ["Item 1: task-type color system (8 types)", "Item 2: segmented lifecycle progress bar", "Item 3: cook timer (live-updating)", "Item 4: dispatch reason line", "Item 5: cleaned completed state (no empty missed, no status text, no skill pills)"],
    "missed": ["Item 1: anything not completed"],
    "lessons": ["Lesson 1: insight about card UI implementation"]
  }'
```

## Constraints
- ONLY modify `campaigns-page.html`
- Apple Design aesthetic (Plus Jakarta Sans, DM Sans, CSS custom properties)
- No regressions on existing functionality (modal, sprint headers, orchestrator tab)
- Cook timer must use monospace font with fixed width to prevent layout jumps
- All changes must survive the 5-second polling refresh (don't rebuild cards that haven't changed)
