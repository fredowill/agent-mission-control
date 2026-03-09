## Mission: Make the Debrief tab auto-populate wins/losses from agent grading data

The Debrief tab on the campaigns page (`/campaigns`) currently shows static, manually-entered wins and losses. Since Sprint 7, agents have `delivered[]` and `missed[]` arrays in their campaigns.json entries — populated by auto-grading. These should flow into the Debrief automatically so it stays current without orchestrator intervention.

## Context

- **File:** `.claude/agent-hub/campaigns-page.html` — this is the ONLY file you modify
- **Server:** MC runs at `http://localhost:3033` (zero-dependency Node.js, port 3033)
- **Data source:** `/api/campaigns` returns campaigns.json. Each agent has `delivered[]`, `missed[]`, `grade`, `sprint`, `name`
- **Current debrief:** reads `c.debrief.wins[]` and `c.debrief.losses[]` — manually curated arrays
- **Design system:** Apple-inspired light mode. Fonts: Plus Jakarta Sans, DM Sans, DM Mono. See existing CSS variables in the file.
- **Existing patterns:** Agent name pills use `agentCls()` function + `.d-agent` CSS class for color coding. Sprint pills use `.sprint-pill` class.

## Agent Lifecycle (follow in order)

### Stage 1: DEFINE
Read `campaigns-page.html` fully. Understand:
- How `wins[]` and `losses[]` are currently rendered (search for `tab-debrief`)
- The `agentCls()` function and `.d-agent` pill styling
- How agent data (`delivered`, `missed`, `grade`) is structured in the API response
- The collapsible section pattern (`toggleCollapse`, `getCollapseState`)

Success = the Debrief tab shows ALL agent deliverables as wins and ALL missed items as losses, merged with existing manual entries, with clear visual distinction between manual and auto-generated entries.

### Stage 2: DISCOVER
Check available skills: `ls .claude/skills/`
Relevant skills to load:
- `frontend-design` — for any new UI components
- `impeccable-polish` — for final quality pass

### Stage 3: EXECUTE

**Step 1: Generate auto-entries from agent data**
In the render function, before rendering the debrief, iterate over all agents that have `delivered[]` or `missed[]` arrays. For each:
- Each `delivered` item → add to wins array with `{ agent: agent.name, text: item, sprint: agent.sprint, auto: true }`
- Each `missed` item → add to losses array with `{ agent: agent.name, text: item, sprint: agent.sprint, auto: true }`

**Step 2: Visual distinction**
- Auto-generated entries: use existing `.d-agent` pill + sprint pill (they already have this pattern)
- Manual entries: keep as-is (they already have agent pills where specified)
- Add a small "auto" indicator — subtle, not distracting. A tiny `AUTO` badge or different dot style.

**Step 3: Deduplication**
- Manual entries take priority — if a manual win matches an auto-generated one, skip the auto version
- Simple string matching is fine (`.includes()` on the text)

**Step 4: Sort order**
- Group by sprint (latest first) so the most recent agent results appear at top
- Within a sprint, manual entries first, then auto-generated

**Step 5: Update the tab badge count**
The debrief tab shows `wins.length + losses.length` — ensure this includes auto-generated entries.

### Stage 4: REASON
- Does the merged list look cluttered? Auto-entries should add value, not noise
- Are agent names showing correctly with color-coded pills?
- Is deduplication working? (e.g., manual "2-hour demo transcribed" shouldn't duplicate with auto "2-hour demo transcribed: 80KB, 1168 segments")
- Does the tab badge count update?

### Stage 5: VERIFY
- Take a Playwright screenshot of the Debrief tab at `http://localhost:3033/campaigns` (click the Debrief tab using `[data-tab="debrief"]`)
- Verify: auto-generated entries appear with agent pills and sprint pills
- Verify: manual entries are still present
- Verify: no visual clutter — the distinction between auto and manual is subtle
- Verify: tab badge count reflects total entries

## Constraints
- **ONE file only:** `campaigns-page.html`. Do NOT modify server.js or campaigns.json.
- **Preserve existing manual entries.** Do not remove or modify the manual wins/losses in campaigns.json.
- **Match existing design patterns.** Use the same CSS classes, pill styles, and section patterns already in the file.
- **No new API endpoints.** All data is already in `/api/campaigns`.
