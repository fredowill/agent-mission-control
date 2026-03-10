# Dispatch Page Redesign Brief

## Context
The Dispatch page at `localhost:3033/dispatch` is a work queue in Mission Control (a PM dashboard).
It lives at `.claude/agent-hub/dispatch-page.html` and reads from `/api/dispatch` and `/api/workstreams`.
The server is at `.claude/agent-hub/server.js` on port 3033. HTML files hot-reload without server restart.

## Current State (broken)
Multiple failed iterations have left the page in a bad state. The click-to-detail modal is broken,
the layout was changed to a 2D matrix which the user hates. Start fresh with the HTML file.

## What the User Wants

### Layout: Kanban columns by STATUS
Four columns left to right: **In Progress | Todo | Backlog | Done**
- Full-width, edge to edge (minimal padding)
- NOT a 2D matrix, NOT priority rows — just normal kanban columns

### Sub-groups within each column by WORKSTREAM
Within each status column, items are grouped by their workstream/category:
- Mission Control items together (purple dot)
- Work/CARES items together (amber dot)
- Portfolio items together (green dot)
- Personal items together (blue dot)
- Untagged/Other at the bottom

This distributes the 14 todo items into visible clusters instead of one flat list.
Each sub-group gets a small colored dot + label header.

### Cards: Title only, click to expand
- Show ONLY the title on the card (no description, no tags)
- Priority left-border accent (red=P0, amber=P1, no border=P2/P3)
- Click card → opens detail modal with full description, tags, status actions, edit, delete
- THE MODAL MUST WORK — previous iteration broke it

### Drag and Drop
- Grab any card, drag between columns to change status
- Visual feedback: card lifts with shadow + slight rotation while dragging
- Drop zone highlights with dashed purple outline
- Apple-level smooth feel

### Tag Colors
Only workstream-level tags get colored dots. Everything else is plain gray.
Workstream categories: mission-control (purple), cares/mapi/work (amber), portfolio (green), personal (blue).
Workstream tags should appear FIRST before other tags.

### Filters
- Show ALL workstreams in filter pills regardless of item count (don't hide empty ones)
- Show empty state if filter has no results
- "All" filter shows everything

### Add Item Form
- Clean modal with header + subtitle
- Title, Description (textarea), Priority (select), Workstream (select), Tags, Linked Session
- Focus ring on inputs, rounded corners, Apple-quality

### Keyboard Shortcuts
- `n` → open add form
- `/` → focus search
- `Escape` → close modals

## Data Model
Each item has: id, title, description, status, priority (p0-p3), workstream (id), tags[], linkedSession, created, updated

## API Endpoints
- GET /api/dispatch → array of items
- POST /api/dispatch → create item
- PUT /api/dispatch/:id → update item
- DELETE /api/dispatch/:id → delete item
- GET /api/workstreams → array of {id, name, color}

## Design Direction
- Apple-inspired light mode
- Fonts: Plus Jakarta Sans (headings), DM Sans (body), DM Mono (code/badges)
- Colors: purple (#8b5cf6), blue (#3b82f6), green (#22c55e), amber (#f59e0b), rose (#ef4444)
- Border radius: 8-14px. Subtle shadows on hover. Clean separators.

## CRITICAL RULES
1. Playwright test EVERY iteration — screenshot the full page AND test the click-to-detail modal
2. The detail modal MUST work (click card → modal opens with full info + action buttons)
3. Drag and drop MUST work between columns
4. Don't restart the server — HTML files hot-reload
5. Verify the nav bar has ALL tabs: Dashboard, Dispatch, Findings, Workflow, Post-Mortems, Toolbox, Logic, Radar

## Reference
- Findings page (`findings-page.html`) — good example of card grid + click-to-expand modal
- Workflow page (`workflow-page.html`) — good example of grouped sections with colored accents
- The user's full session prompts are in `.claude/agent-hub/prompts/a7d75b0b-a7a4-477e-93c2-cd0c7e4fe890.ndjson`
