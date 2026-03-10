# Dispatch Page V2 — Handoff Brief

## What Was Built
Complete rewrite of the Dispatch kanban board at `localhost:3033/dispatch`.
File: `.claude/agent-hub/dispatch-page.html` (hot-reloads, no server restart needed for HTML changes).
Server: `.claude/agent-hub/server.js` on port 3033 (restart needed only for new API routes).

## Current State — What Works
- **4-column kanban**: Backlog (collapsible left strip) → Todo (grouped by workstream) → In Progress (flat) → Done (collapsible right strip)
- **Trello-style cards**: Priority color bar, workstream label pill with dot+name, date, bold title
- **Inline-editable detail modal**: Click card → modal with two-column layout. Title, description, tags all click-to-edit. Status/Priority/Workstream use custom animated dropdowns. No separate "edit" screen.
- **Add flow**: "+ Add" creates a blank item and opens it in the same detail modal with title auto-focused
- **Drag & drop**: Cross-column (status change) + intra-column reorder with purple drop indicator line
- **Filters**: Workstream + Priority filter pills with Clear button
- **Stats bar**: "4 critical, 3 in progress, 11 to do, 5 done"
- **Keyboard shortcuts**: `n` = add, `/` = search, `Esc` = close
- **Responsive**: max-width 1400px, tested at 1280/1440/1920px

## Known Issues to Fix

### 1. Center alignment when Backlog+Done are collapsed
When both side columns collapse, Todo and In Progress sit on the left with dead space on the right. The board should center-align so the active columns feel balanced. Consider `justify-content: center` on the kanban grid, or dynamically adjusting grid columns when collapsed.

### 2. Intra-column reorder DOES NOT WORK in flat columns (In Progress, Done) — PRIORITY BUG
User confirmed: dragging cards within In Progress to reorder them does NOT work. Cards in grouped columns (Todo/Backlog) may work because the ws-group containers create different event boundaries.

**What was tried:**
- Added `dragover`/`drop` listeners on individual `.k-card` elements (not just `.col-body`)
- Added `pointer-events: none` on `.k-card.dragging` so the dragged card doesn't intercept events
- Added `getColBodyFromEvent()` helper to walk up from event target to find `.col-body`

**Root cause hypothesis:** The dragged card stays in the DOM during native HTML5 drag. Even with `pointer-events: none`, the card still occupies space and may affect the position calculations in `showDropIndicator()`. The `querySelectorAll('.k-card:not(.dragging)')` correctly excludes it, but the bounding box positions of remaining cards shift when the dragged card collapses/fades, causing insertIdx to be wrong.

**Suggested fix approaches:**
1. Instead of native HTML5 drag, use a mouse-event-based drag (mousedown/mousemove/mouseup) with a cloned ghost element. This gives full control over positioning.
2. Or: on dragstart, immediately remove the dragged card from DOM flow (store it), re-insert on dragend. This prevents it from affecting layout.
3. Or: use a library like SortableJS which handles all edge cases.
4. Debug by adding `console.log` in `onDrop` to verify the function fires at all — it may not be reaching `onDrop` in flat columns.

**Test manually in browser:** Open DevTools console, drag a card in In Progress, check if any console errors appear or if `onDrop` fires.

### 3. Description editor UX is poor
Clicking description opens a raw `<textarea>`. Needs:
- A proper rich text editor or at least a markdown-aware editor with preview
- Better textarea styling (larger, auto-resize to content, proper font)
- Save/cancel buttons instead of blur-to-save (easy to lose work)
- Support for markdown preview while editing (split pane or toggle)
- Look at: CodeMirror (lightweight), or a custom textarea with toolbar (bold, code, list buttons)

### 4. Modal scrolling on long descriptions
Modal max-height is 90vh. Very long descriptions force scrolling inside the modal. The description box no longer has max-height (was removed to prevent inner scroll), but the outer modal scroll might still feel awkward. Consider:
- Making the description box collapsible/expandable
- Or a full-page detail view for items with very long descriptions

### 5. Negative space / information density
When collapsed, the page feels empty. Ideas:
- Add a summary panel or quick stats cards above the board
- Show a "recently completed" strip at the bottom
- Add an activity feed sidebar (recent status changes, edits)
- Board-level progress indicators (e.g., "3/11 todo items are P0")

## API Endpoints
- `GET /api/dispatch` — all items (merged from dispatch.json + mc-backlog.json)
- `POST /api/dispatch` — create item, returns `{ ok, id }`
- `PUT /api/dispatch/:id` — update item fields (title, description, status, priority, workstream, tags, linkedSession, sortOrder)
- `DELETE /api/dispatch/:id` — delete item
- `POST /api/dispatch/reorder` — batch update sortOrder: `{ orderedIds: [id1, id2, ...] }`
- `GET /api/workstreams` — workstream definitions

## Design Tokens
- Fonts: Plus Jakarta Sans (headings), DM Sans (body), DM Mono (code/badges)
- Colors: purple #8b5cf6, blue #3b82f6, green #22c55e, amber #f59e0b, rose #ef4444
- Card radius: 12px, badge radius: 6px
- Shadows: rest `0 1px 4px rgba(0,0,0,.08)`, hover `0 4px 12px rgba(0,0,0,.12)`
- Card padding: 14px 16px inner

## Research Available
- `.claude/agent-hub/card-design-research.md` — kanban card CSS patterns, aspect-ratio, spacing scales
- `.claude/agent-hub/detail-modal-research.md` — Linear/Trello modal UX, inline editing, activity feeds
- `.claude/agent-hub/filter-research.md` — filtering patterns, keyboard shortcuts, dashboard metrics

## Architecture Notes
- HTML file hot-reloads (server reads from disk on each request via `readPage`)
- Only restart server when `server.js` changes (new routes, API endpoints)
- Items have `_source: 'local'` or `_source: 'mc'` — mc items stored in mc-backlog.json
- Workstream resolution: items have a `workstream` field (ID), or fallback inference from tags
- Custom dropdowns: `.m-dropdown` with `.m-dropdown-trigger` + `.m-dropdown-menu`, animated via CSS transitions
- Drag & drop: HTML5 native drag API, events on both `.col-body` and `.k-card` elements

## Recommended Next Steps
1. Fix center alignment issue (quick CSS fix)
2. Verify and polish intra-column reordering across all columns
3. Build a proper description editor (biggest UX gap)
4. Consider adding: activity log, due dates, keyboard navigation within columns
5. Run the design/critic/qa agents for comprehensive review before next iteration

## CRITICAL RULES (from CLAUDE.md)
- Playwright screenshot EVERY UI change — screenshot + critically evaluate
- Don't restart the server for HTML-only changes
- Root cause first, never workaround
- Verify the nav bar has ALL tabs: Dashboard, Dispatch, Findings, Workflow, Post-Mortems, Toolbox, Logic, Radar
