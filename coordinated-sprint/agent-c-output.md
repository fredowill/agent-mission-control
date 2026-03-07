# Agent C Output: Agent Interface & Multi-Agent UX Investigation

## 1. Current State Analysis

### What the Dashboard Does Today

The Dashboard (`/` route, embedded in server.js lines 1136-2524) is a card-grid overview of all agent sessions:

**Data Pipeline:**
```
hook.js (PostToolUse/Stop) --> states/{sid}.json + logs/{sid}.ndjson
prompt-hook.js (UserPromptSubmit) --> prompts/{sid}.ndjson
    |
    v
readAgents() merges by claudePid --> /api/agents JSON
    |
    v
Dashboard HTML polls /api/agents every 3s --> renders cards
```

**What Each Card Shows:**
- State pill (Researching / Writing / Planning / Verifying / Needs Input / Thinking / Done / Idle)
- Color-coded left accent bar per state
- AI-generated mission summary (via Cerebras free tier)
- Last activity timestamp ("3s ago", "2m ago")
- Workstream assignment (color dot + name)
- Context switches badge (`2x ctx` = /plan -> implement transitions)
- Resume count badge (`1x resume` = terminal change via /resume)
- 6-char hex ID (last 6 of session UUID)
- AI workstream suggestions for unassigned sessions

**What the Session Detail Page Shows (`/session/:id`):**
- Full state pill + mission title
- Three tabs:
  - **Summary**: AI-generated deep narrative with sections, key decisions, outcome, and citation links back to specific prompts
  - **Prompts**: Full history of every user prompt (with copy buttons, skill detection)
  - **Timeline**: Last 40 activity log entries as a vertical timeline with colored dots

**What readAgents() Does (server.js:637-779):**
- Reads all state JSON files
- Groups sessions by claudePid (same terminal window = one card)
- Merges mission, prompts, summary staleness across chained sessions
- Checks PID liveness via `getLiveClaudePids()` -- active = PID alive, done = PID dead
- Resolves workstream assignments from agent-workstreams.json
- Sorts by timestamp (newest first)

**Smart Features Already Built:**
- Browser notifications when agent enters "waiting" state
- Dynamic favicon color (green = active, amber = waiting, gray = idle)
- Dynamic page title with counts: "(1) Mission Control" for waiting
- Stale/archived card dimming with opacity
- Mode toggle (Home/Work) filtering across all pages
- AI-powered "Top of Mind" briefing with theme aggregation

### What the Campaigns Page Does Today

The Campaigns page (`campaigns-page.html`, 327 lines) is a war room for coordinated efforts:

- Campaign hero card: name, description, status (active/completed/paused), objectives checklist
- Agent grid: named slots (e.g., "Agent A: Terminal Identity") with status badges
- **Link Session** modal: dropdown of active sessions to associate with an agent slot
- Live state overlay: when linked, shows state dot, last tool, last file, elapsed time
- Session ID reference (truncated)
- Auto-refresh every 5s

**Architecture:** Uses `/api/campaigns` (reads campaigns.json) + `/api/agents` for live state cross-referencing.

---

## 2. Gap Analysis: What's Missing for Effective Multi-Agent UX

### Critical Gaps (Daily Pain Points)

| Gap | Impact | Severity |
|-----|--------|----------|
| **No terminal-to-card mapping** | Can't identify which terminal window corresponds to which Dashboard card | P0 |
| **No quick-peek from Dashboard** | Must navigate away to /session/:id to see any depth -- loses overview context | P0 |
| **No unified activity feed** | Can't see what ALL agents are doing in one chronological view | P1 |
| **No agent naming** | Cards identified by hex IDs or AI summaries -- no human-friendly names | P1 |
| **Dashboard and Campaigns are disconnected** | Two separate pages for related needs -- overview vs. coordinated effort | P2 |

### Architectural Gaps

| Gap | Current | Needed |
|-----|---------|--------|
| **Real-time updates** | Polling every 3s | SSE or WebSocket for instant state changes |
| **Detail without navigation** | Click = navigate to /session/:id | Slide-out panel or modal for quick inspection |
| **Terminal locator** | No mechanism exists | PID -> window title, or color/emoji matching |
| **Interleaved timeline** | Each session has its own timeline | Combined timeline showing all agents' actions |
| **Agent identity** | Auto-generated hex ID | User-assignable names, colors, or icons |

### Data Gaps

The hook system captures excellent raw data but the Dashboard underutilizes it:

| Available Data | Used in Dashboard? | Potential |
|---------------|-------------------|-----------|
| Tool name + detail | No (only in session detail) | Show "Reading server.js" live on card |
| Activity log timeline | No (only in session detail) | Mini-timeline or sparkline on card |
| Prompt history | Only for AI summary | Show last prompt as context |
| claudePid | For grouping only | Could map to terminal window title |
| resumeCount | Badge only | Could indicate terminal stability |
| Cost estimate | Badge only | Could aggregate across campaign |

---

## 3. Agent Manager Concept: The Overwatch Panel

### Architecture Recommendation: Slide-Out Panel, Not New Page

The core insight: the user doesn't want ANOTHER page to navigate to. They want to **stay on the Dashboard** but **drill deeper without leaving**. The ChatGPT sidebar analogy is about quick context-switching, not full page navigation.

**Proposed Pattern: Dashboard + Slide-Out Inspector**

```
+--------------------------------------------------+
|  Mission Control  [Dashboard] Dispatch Findings.. |
+--------------------------------------------------+
|                                      |            |
|  [Top of Mind briefing]              |  INSPECTOR |
|                                      |  PANEL     |
|  +--------+  +--------+  +--------+ |            |
|  | Agent A |  | Agent B |  | Agent C| | Agent B   |
|  | Writing |  |Research |  | Idle   | | ----------|
|  | "Fix..  |  |"Inves.. |  | "Done" | | State:    |
|  |  2s ago |  | 5s ago  |  | 3m ago | | Researching|
|  +--------+  +--------+  +--------+ |            |
|                                      | Last Tool: |
|  +--------+                          | WebFetch   |
|  | Agent D |                          | server.js  |
|  |Planning |                          |            |
|  | "Build..|                          | Timeline:  |
|  | 10s ago |                          | [mini vis] |
|  +--------+                          |            |
|                                      | Summary:   |
|                                      | "Researchi.|
|                                      | [Full view]|
+--------------------------------------------------+
```

**How it works:**
1. Dashboard looks the same as today (cards grid)
2. Clicking a card **slides open a panel on the right** (300-400px wide)
3. Panel shows: live state, current tool + file, mini timeline, summary excerpt, prompts count, terminal locator
4. Panel auto-refreshes with the card's session data
5. Clicking a different card swaps the panel content (no navigation)
6. "Full view" link in panel navigates to the existing /session/:id page for deep dive
7. Panel has a close button to go back to full-width grid

**Why this beats alternatives:**
- **vs. New page**: Doesn't lose the overview. You see all cards + one card's depth simultaneously.
- **vs. Modal**: Modals block the overview. Panels coexist.
- **vs. Tabs**: Tabs require navigation. Panels are instant.
- **vs. Hover tooltips**: Tooltips disappear. Panels persist and are scrollable.

### Enhanced Card Design

Current cards show mission + state. Enhanced cards should show **live activity** at a glance:

```
+------------------------------------------+
| [*] Researching                    5s ago |
|                                           |
| Investigating booking API security        |
|                                           |
| Read route.ts | Grep "csrf" | Read mid... |  <-- live tool stream
| ~~~~~~~~~~~~~~~~~~~~~~~~~~~~              |  <-- mini sparkline of activity
|                                           |
| #a1b2c3  [Portraits]  $0.42              |
+------------------------------------------+
```

New elements:
- **Live tool stream**: Last 3 tools with truncated details, scrolling ticker-style
- **Mini sparkline**: Tiny colored bar showing recent state transitions (blue-blue-amber-blue = lots of reading then some writing)
- **Prominent workstream tag**: Already exists but could be more visible

### Inspector Panel Content

When you click a card, the slide-out panel shows:

```
INSPECTOR: Agent #a1b2c3
━━━━━━━━━━━━━━━━━━━━━━━━

[x] Close                          [-> Full view]

STATUS
  State: Researching (5s ago)
  Tool:  Grep "csrf validation"
  File:  src/app/api/grad-booking-request/route.ts
  PID:   48388

IDENTITY
  Terminal: Git Bash #3 (title: "claude - phredomade")
  Workstream: Portraits
  Started: 2:34 PM today
  Prompts: 7 messages

MINI TIMELINE (last 10 events)
  2:41 PM  [*] Read route.ts
  2:41 PM  [*] Grep "csrf"
  2:40 PM  [#] Edit middleware.ts
  2:39 PM  [*] Read middleware.ts
  2:38 PM  [>] Bash "npm test"
  ...

SUMMARY
  "Investigating CSRF protection in the booking
   API. Read the route handler, found the Origin
   guard, now looking at middleware for..."
  [Re-summarize] [Copy summary]

LAST PROMPT
  "Check the booking API route for security
   issues, especially CSRF and input validation"
  [Copy prompt]
```

### Data Architecture

No new hooks needed. Everything in the inspector is derivable from existing data:

| Inspector Field | Data Source | API |
|----------------|------------|-----|
| State, tool, detail | `states/{sid}.json` | `/api/agents` |
| PID | `states/{sid}.json` -> claudePid | `/api/agents` |
| Timeline | `logs/{sid}.ndjson` | `/api/session/:id` |
| Summary | `deep-summaries.json` | `/api/session/:id/summary` |
| Prompts | `prompts/{sid}.ndjson` | `/api/session/:id` |
| Cost | Cost tracker in server.js | Already in agent data |

The only new API needed: **`/api/session/:id/quick`** -- a lightweight endpoint that returns state + last 10 timeline events + last prompt + cached summary (no AI generation trigger). This avoids the overhead of the full session detail API which triggers deep summary generation.

### Real-Time Upgrade Path

Current: Polling `/api/agents` every 3s.

Recommended upgrade: **Server-Sent Events (SSE)** on `/api/agents/stream`:

```javascript
// In server.js (conceptual)
app.get('/api/agents/stream', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });

  const interval = setInterval(() => {
    const agents = readAgents();
    res.write(`data: ${JSON.stringify(agents)}\n\n`);
  }, 1000);

  req.on('close', () => clearInterval(interval));
});
```

Even better: Use `fs.watch()` on the states directory to only push updates when state files actually change. This gives sub-second latency for state changes without constant polling.

---

## 4. Campaigns Page Recommendations

The Campaigns page is the right concept for coordinated sprints. Improvements:

### 4a. Inline Agent Detail

Currently, campaign agent cards show state/tool/file/time. Add:
- **Click to expand**: Card expands inline to show mini-timeline + last prompt + summary
- This mirrors the inspector panel concept but within the campaign context

### 4b. Campaign Activity Feed

Add a section below the agent grid:

```
CAMPAIGN ACTIVITY FEED (all agents, interleaved)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

2:45 PM  [Agent B]  Writing  agent-b-output.md
2:44 PM  [Agent C]  Reading  server.js
2:44 PM  [Agent A]  Verifying  bash "npm test"
2:43 PM  [Agent C]  Reading  hook.js
2:42 PM  [Agent B]  Researching  WebSearch "claude agent patterns"
2:41 PM  [Agent A]  Writing  terminal-identity-hook.js
```

This gives the "army general's war room" view -- what ALL agents are doing in real-time, interleaved chronologically.

**Data source**: Read all linked agents' log files, merge, sort by timestamp. New API: `/api/campaigns/:id/feed`.

### 4c. Campaign Progress Indicators

- Aggregate cost across all linked agents
- Total prompts / total tool calls
- Duration since campaign started
- Objective completion percentage (checkboxes already exist -- wire them to persistent state)

### 4d. Campaign-Level Summary

When all agents complete, auto-generate a campaign-level summary by sending all agents' deep summaries to the AI summarizer. "This sprint accomplished X, Y, Z across 4 agents over 2 hours."

---

## 5. Terminal-to-Dashboard Mapping

This complements Agent A's terminal identity work. My recommendations from the Dashboard side:

### 5a. PID Display on Cards

The claudePid is already in state data. Show it as a small badge:
```
#a1b2c3  PID:48388
```
Users can cross-reference with their terminal's process. Not elegant but immediately functional.

### 5b. Terminal Color System

Assign each active agent a color from a fixed palette. Show this color as:
- Dashboard card's left accent bar (already exists, currently state-based)
- A colored dot or square in the card header
- This same color could be set as the terminal's tab color (Agent A's domain)

The key insight: **color assignment must happen in MC, not in the terminal**. MC has the global view of all agents and can ensure unique colors. Agent A's terminal identity work should READ the assigned color from MC (e.g., state file or a new `/api/agents/:id/identity` endpoint) rather than choosing independently.

### 5c. "Locate" Button Concept

A "Locate" button on the Dashboard card could:
1. Flash/animate the card to confirm "this is the one you're looking at"
2. Show a system notification with the PID and suggested terminal action
3. In the future (if Agent A implements window title setting): the title is already unique and searchable

### 5d. Cross-Agent Note for Agent A

Agent A should know: **MC already has claudePid per session**. Any terminal identification scheme should use the same PID as the join key. If Agent A sets `TITLE "MC:48388"` in the terminal, MC can show "Terminal: MC:48388" in the inspector panel. The mapping becomes trivial.

---

## 6. Multi-Agent UX Research: Key Patterns from Other Domains

### 6a. CI/CD Dashboards (GitHub Actions, GitLab CI)

**Pattern: Pipeline as Hero, Jobs as Cards**
- The pipeline (= campaign) is the top-level view
- Individual jobs (= agents) are shown as colored status indicators within the pipeline
- Click a job to see its log stream (= our session detail)
- Key insight: **progress is shown at TWO levels simultaneously** -- pipeline overall + each job

**Pattern: Log Streaming**
- Clicking a job shows its live log output scrolling in real-time
- The log auto-follows new output unless the user scrolls up
- This maps to our activity timeline but with real-time streaming (SSE)

**Pattern: Status Matrix**
- GitHub Actions shows a matrix grid when running the same job across multiple configurations
- Each cell is color-coded: green (pass), amber (running), gray (pending)
- Our equivalent: campaign agent grid with state-colored cards

### 6b. Kubernetes Dashboards (K8s Dashboard, Lens)

**Pattern: Resource Hierarchy with Drill-Down**
- Namespace -> Deployments -> Pods -> Containers
- Each level shows a summary table; clicking drills deeper
- Back button preserves context
- Our equivalent: Dashboard -> Campaign -> Agent -> Session Detail

**Pattern: Live Resource Metrics**
- Pod cards show CPU/memory sparklines in real-time
- These tiny visualizations give immediate "health" signal without clicking
- Our equivalent: activity sparklines on agent cards

**Pattern: Multi-Select and Bulk Actions**
- Select multiple pods, delete/restart them together
- Our equivalent: Select multiple agents for campaign assignment, bulk dismiss, etc.

### 6c. ChatGPT / Chat Sidebars

**Pattern: Sidebar List + Main Content**
- Left sidebar shows conversation titles (truncated)
- Clicking switches the main area content without page navigation
- Current conversation is highlighted
- Key insight: **no page load** -- it's all client-side rendering in a split layout

**Pattern: Auto-Title Generation**
- ChatGPT names conversations after the first few messages
- MC already does this (AI-powered mission summaries)
- Enhancement: let users rename sessions manually (override AI title)

**Pattern: Pinned / Archived Organization**
- Recent conversations at top, older ones in collapsible sections
- Our equivalent: Active/Done/Archived filter tabs (already exist)

### 6d. Real-Time Monitoring (Grafana, Datadog)

**Pattern: Dashboard Panels with Time-Series**
- Multiple panels on one page, each showing a different metric over time
- Our equivalent: each agent card could have a mini time-series of state changes

**Pattern: Drill-Down via Click**
- Click a panel to see full-screen detail with more granular data
- Back to dashboard preserves scroll position and filter state
- Critical UX detail: **the drill-down doesn't lose the overview state**

**Pattern: Alerting with Severity**
- Red/amber/green indicators with clear priority ordering
- "Needs Input" (amber) is already the highest-priority signal in MC
- Enhancement: visual/audio alert escalation for long-waiting agents

### 6e. Innovative Patterns Worth Considering

**Cursor's Multi-Tab Terminal**: Cursor IDE shows multiple agent sessions as tabs within the editor. Each tab has the agent's name and a color indicator. This is the closest analogy to what MC needs -- but MC has the advantage of a DEDICATED dashboard UI.

**Linear's Issue Board**: Linear uses a compact list view with inline previews. Hovering shows a preview card; clicking opens a side panel. The list never navigates away. MC could adopt this for a more compact agent view.

**Figma's Multiplayer Cursors**: Figma shows other users' cursors in real-time with name labels and colors. For MC, this metaphor could translate to showing which FILES each agent is touching in real-time -- a "file heatmap" showing concurrent access.

---

## 7. Prototype Specification

Rather than a standalone prototype, here's a detailed spec for the highest-impact changes that can be implemented incrementally:

### Phase 1: Enhanced Cards (Smallest Change, Biggest Impact)

Modify `renderCard()` in Dashboard to show:
1. Current tool + detail as a subtitle line: `Reading server.js` in monospace
2. Last prompt excerpt (truncated to 60 chars) in gray italic
3. These use data already in `/api/agents` response -- zero backend changes

### Phase 2: Inspector Panel

Add to Dashboard HTML:
1. `<div class="inspector-panel">` -- fixed-position right panel, 380px wide
2. Clicking a card calls `/api/session/:id/quick` and populates the panel
3. Panel shows: state, tool, file, PID, last 10 timeline events, summary excerpt, last prompt
4. Close button collapses panel, grid returns to full width
5. CSS transition for smooth slide-in/out

### Phase 3: Campaign Activity Feed

Add to Campaigns page:
1. New API: `/api/campaigns/:id/feed` -- reads all linked agents' log files, merges, returns last 50 events
2. New section below agent grid: chronological interleaved feed with agent name labels
3. Color-coded by agent (not by state) so you can follow one agent's thread visually

### Phase 4: SSE Real-Time

Replace polling with SSE:
1. New endpoint: `/api/events` (SSE stream)
2. Uses `fs.watch()` on states directory
3. Sends delta events: `{type: "state_change", sessionId, newState}`
4. Dashboard and Campaigns pages subscribe to this stream

---

## 8. Sprint Retrospective Notes

### Key Findings
1. MC's data pipeline is excellent -- hook.js + prompt-hook.js capture everything needed. The gap is in PRESENTATION, not data collection.
2. The Dashboard already does 80% of what's needed. The missing 20% (inspector panel, live tool display, terminal mapping) would transform it from "overview only" to a true command center.
3. The Campaigns page is the right abstraction for coordinated sprints but needs inline depth (expand cards, activity feed) to be useful during active execution.
4. SSE is the right real-time upgrade path -- simpler than WebSocket, sufficient for one-way server-to-client state pushes.

### Recommendations Prioritized
1. **P0**: Add current tool + detail to Dashboard cards (renderCard enhancement -- pure frontend, 30 min)
2. **P0**: Add inspector slide-out panel to Dashboard (frontend + one new API, 2-3 hours)
3. **P1**: Campaign activity feed (new API + frontend section, 1-2 hours)
4. **P1**: Terminal color assignment system (coordination with Agent A, 1 hour)
5. **P2**: SSE real-time upgrade (backend refactor, 2-3 hours)
6. **P2**: Campaign-level summary generation (AI integration, 1-2 hours)

### Cross-Agent Coordination Notes
- **For Agent A**: MC already has `claudePid` per session. Use this as the join key for terminal identification. If you set terminal titles to include the PID, MC can display the mapping directly. See section 5d.
- **For Orchestrator**: The Campaigns page needs inline card expansion + activity feed to fulfill the war room vision. See section 4.
- **For Agent B**: The value proposition of MC is strongest when articulated as "command-level visibility" (general's metaphor). The inspector panel concept is the UX embodiment of that value -- overview + depth without context switching.
