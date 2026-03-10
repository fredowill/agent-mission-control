<!-- PIPELINE: create-agent-prompt | mandated: impeccable-frontend-design,impeccable-polish | task-type: ui -->
## Mission: Completely overhaul the /story page into a data-driven, visually stunning timeline of Mission Control's entire evolution — from v1.0 to v2.3.

The current /story page is a static hardcoded narrative about Orchestrator v1.0 only. MC has since had 3 campaigns, 23+ orchestrators, 40+ agents, 100+ findings, and $5000+ in API costs. The page needs to tell the FULL story — data-driven from /api/campaigns — with a completely different visual design. This is a demo showpiece: when the user shows MC to friends, this page should make their jaw drop.

## Agent Lifecycle (follow in order)

### Stage 1: DEFINE
- **Read:**
  - `.claude/agent-hub/pages/story-page.html` — current 635-line static page (to be completely replaced)
  - `.claude/agent-hub/pages/campaigns-page.html` — reference for MC design system (fonts, colors, card patterns)
  - `.claude/agent-hub/pages/cost-page.html` — reference for data visualization patterns (charts, stat cards)
  - Curl `http://localhost:3033/api/campaigns` — the data source. Each campaign has agents with grades, delivered/missed arrays, lifecycle stages, skills used.
  - Curl `http://localhost:3033/api/findings` — findings data (100+ entries with tiers, tags, titles, lessons)
- **Success looks like:** A completely new /story page that:
  1. Pulls ALL data from /api/campaigns and /api/findings dynamically
  2. Tells the MC evolution story through data — campaign chapters, orchestrator milestones, agent fleet visualizations
  3. Has a completely different visual language from the current page — NOT the same timeline layout
  4. Is visually stunning enough to be a demo centerpiece
  5. Works without any server.js changes (reads from existing APIs)
- **Constraints:**
  - Do NOT modify server.js — page must work with existing API endpoints
  - Do NOT copy the current design — start fresh, completely different look
  - MUST use the MC design system: Plus Jakarta Sans (headings), DM Sans (body), DM Mono (mono), purple/blue/green/amber/rose palette
  - MUST be a single HTML file (no external JS/CSS besides Google Fonts)
  - Page must load fast — no heavy animations that slow scrolling

### Stage 2: DISCOVER (HARD GATE — do not skip)
Run: `ls .claude/skills/`
**You MUST load at least one skill before proceeding to Stage 3.**
Mandated skills for this task: `impeccable-frontend-design`, `impeccable-polish`
If you skip this stage, your grade caps at C regardless of deliverables.

### Stage 3: EXECUTE
1. Fetch /api/campaigns and /api/findings to understand the data shape
2. Design the page structure — suggested sections (but be creative):
   - **Hero:** Big bold title, key stats (total campaigns, agents, cost, findings, orchestrator versions)
   - **Campaign chapters:** Each campaign as a full-width section with its own color accent. Show campaign objectives, sprint count, agent fleet, GPA
   - **Orchestrator evolution:** Visual progression of orchestrators v1.0 through v2.3 — grades, key deliverables, lifecycle progression. Show how each one built on the last.
   - **Agent fleet visualization:** All 40+ agents shown visually — grouped by campaign, colored by grade, sized by impact
   - **Findings wall:** The 100+ findings as a scannable mosaic or tag cloud — showing the system learning over time
   - **Stats dashboard:** Key metrics — total tokens, cost breakdown, grade distribution, skills usage
3. Build the HTML page with inline CSS and JS
4. Use fetch() to pull data from /api/campaigns and /api/findings on page load
5. Apply the MC design system but with a FRESH layout — think Apple product launch page, not dashboard

### Stage 4: REASON
- What visual metaphor best tells the "evolution" story? (Timeline? Chapters? Growth chart?)
- How to make 40+ agents visually digestible without overwhelming?
- What data points will impress a non-technical friend the most? (Cost? Agent count? The self-improvement loop?)
- How to show the orchestrator progression as a narrative, not just a data dump?

### Stage 5: VERIFY
1. Take a Playwright screenshot of the full page
2. Verify all data loads from APIs (no hardcoded content)
3. Check responsive layout at 1440px and 768px
4. Verify no console errors
5. Critically evaluate: would this impress someone seeing MC for the first time?

### Stage 6: DEBRIEF (before you exit)
curl -X POST http://localhost:3033/api/campaigns/agent-debrief \
  -H "Content-Type: application/json" \
  -d '{"campaignId":"campaign-002","slot":"story-overhaul","delivered":["..."],"missed":["..."],"lessons":["..."]}'

## Constraints
- story-page.html only — no server.js changes
- Single HTML file, inline CSS/JS
- Data-driven from /api/campaigns and /api/findings
- MC design system (fonts, colors) but completely fresh layout
- Must be demo-worthy — this is a showpiece page
- No heavy frameworks — vanilla JS only
