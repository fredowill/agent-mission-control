## Mission: Fix the dropdown auto-close bug on the campaigns page where expanding a section or clicking a card causes other open sections to snap shut.

The user has complained about this across multiple sessions: "after like 5 seconds it closes", "shows for like 5 seconds before automatically closing back again, which is pissing me the fuck off." v2.1 improved it (added 6 localStorage selectors) but did not eliminate it. The page's 5-second polling refresh cycle calls `render()` which rebuilds the DOM, destroying open dropdown states. The fix must persist ALL interactive states across render cycles.

**Deliverable:** Updated `projects/agent-mission-control/campaigns-page.html` where all expandable sections, dropdowns, sprint phase collapses, and "Show more" buttons maintain their open/closed state across the 5-second polling refresh.

## Agent Lifecycle (follow in order)

### Stage 1: DEFINE
- **Read these files first:**
  1. `projects/agent-mission-control/campaigns-page.html` — search for: `refreshLoop`, `load()`, `render()` to understand the 5-second polling cycle. Then search for `localStorage` to see v2.1's persistence attempts. Search for `toggleRcCollapse`, `expandAll`, sprint phase toggle handlers.
  2. `coordinated-sprint/orchestrator-v2.1-handoff.md` — line 79, "Dropdown auto-close: Improved (6 selectors), not eliminated"
- **Success looks like:**
  1. Open a report card modal, expand the Summary section, expand the Missed section — close the modal. Wait 10 seconds (2 refresh cycles). Reopen the modal — sections are still expanded.
  2. Expand Sprint 1 phase — wait 10 seconds — Sprint 1 is still expanded.
  3. Click "Show more" on previous orchestrators — wait 10 seconds — still showing all.
  4. No flicker or layout jump during refresh when sections are open.
- **Constraints:**
  - ONLY modify `campaigns-page.html`
  - Must work with the existing 5-second polling `refreshLoop`
  - Do NOT disable or slow down the polling — it's needed for live agent updates
  - The fix must be generic — any new collapsible section added in the future should auto-persist without manual localStorage code

### Stage 2: DISCOVER (HARD GATE — do not skip)
Run: `ls .claude/skills/`
**You MUST load at least one skill before proceeding to Stage 3.**
Mandated skills for this task: `coding-standards`, `systematic-debugging`

### Stage 3: EXECUTE

The root cause is that `render()` rebuilds innerHTML, destroying DOM state. Two approaches:

**Approach A: Diff-based rendering (preferred)**
Instead of replacing innerHTML entirely, compare the new HTML with the existing DOM and only update elements that changed. Libraries like `morphdom` do this, but for zero-dependency: implement a simple check — if the section content hasn't changed, skip the update.

**Approach B: State persistence + restore (current approach, needs completion)**
Before each render, capture ALL open/closed states. After render, restore them. The v2.1 fix did this for 6 specific selectors but missed others.

1. **Audit all interactive elements** — find every collapsible section, dropdown, expandable area, "show more" button, and modal state on the campaigns page. List them all.
2. **Implement a generic state capture** — before `render()`, walk the DOM and capture the open/closed state of every element with a toggle class (e.g., `.rc-collapse.open`, `.phase-collapsed`, `.show-more-expanded`).
3. **Implement generic state restore** — after `render()`, re-apply all captured states.
4. **Use data attributes for identification** — each collapsible needs a stable identifier (e.g., `data-collapse-id="sprint-1"`, `data-collapse-id="agent-lifecycle-research-summary"`) so states map correctly across render cycles.
5. **Handle the modal specially** — if a modal is open during render, do NOT re-render the modal content (the Modal v2 agent already handles this with its own refresh logic). Just preserve the modal overlay.
6. **Test with multiple open sections** — open 3+ sections simultaneously, wait 15 seconds, verify all stay open.

### Stage 4: REASON
- Approach A (diff-based) is more robust but more complex. Approach B is simpler but fragile — every new collapsible needs to be registered.
- Consider: a MutationObserver that watches for class changes (`.open` added/removed) and auto-persists to a Map, then after any innerHTML swap, re-applies from the Map. This is generic and future-proof.
- The modal has its own refresh logic (from Modal v2 agent) — don't interfere with it.

### Stage 5: VERIFY
- Playwright: open campaign-002, expand Sprint 1, expand Sprint 2, wait 10 seconds, screenshot — both still expanded
- Playwright: open a report card modal, expand Summary + Delivered sections, close modal, wait 10 seconds, reopen — sections still expanded
- Playwright: click "Show more" on orchestrators, wait 10 seconds — still expanded
- Test: open 5 things simultaneously, wait 15 seconds, verify all 5 persist

### Stage 6: DEBRIEF (MANDATORY — your grade depends on this)
```bash
curl -X POST http://localhost:3033/api/campaigns/agent-debrief \
  -H "Content-Type: application/json" \
  -d '{
    "campaignId": "campaign-002",
    "slot": "dropdown-fix",
    "delivered": ["Item 1: generic state persistence across render cycles", "Item 2: all collapsible sections maintain state through 5s polling"],
    "missed": ["Item 1: anything not completed"],
    "lessons": ["Lesson 1: insight about DOM state persistence"]
  }'
```

## Constraints
- ONLY modify `campaigns-page.html`
- Must work with 5-second polling (do NOT disable it)
- Generic solution — future collapsibles auto-persist
- No external libraries (zero-dependency project)
- Must not interfere with Modal v2's own refresh logic
