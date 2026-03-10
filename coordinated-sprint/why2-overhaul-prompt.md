<!-- PIPELINE: create-agent-prompt | mandated: impeccable-frontend-design,impeccable-polish | task-type: ui -->
## Mission: Create /why2 page -- a massively upgraded version of the /why page with fresh design, updated data, and demo-worthy visual impact.

The /why page (pages/why-page.html) is MC's value proposition pitch -- dark mode, beautiful typography, compelling narrative about why Mission Control exists. But it was written during campaign-001 and the content/stats are outdated. The user wants a v2 that keeps the soul and narrative quality of /why but with completely fresh design, updated stats from live data, and enough visual impact to demo in front of friends.

CRITICAL: Do NOT modify why-page.html. Create a NEW file: why2-page.html. The original must be preserved.

## Agent Lifecycle (follow in order)

### Stage 1: DEFINE
- **Read:**
  - `.claude/agent-hub/pages/why-page.html` -- the REFERENCE for content, tone, and narrative structure. Study this deeply. The writing quality is the gold standard.
  - `.claude/agent-hub/pages/cost-page.html` -- reference for data visualization patterns
  - `.claude/agent-hub/pages/campaigns-page.html` -- reference for the light-mode MC design system
  - Curl `http://localhost:3033/api/campaigns` -- live campaign data (3 campaigns, 40+ agents, grades, findings)
  - Curl `http://localhost:3033/api/findings` -- 100+ findings showing the self-improvement loop
  - Curl `http://localhost:3033/api/cost` -- $5000+ cost data with model breakdown
- **Success looks like:** A /why2 page that:
  1. Keeps the narrative arc and compelling copy style of /why but with FRESH writing (not copy-paste)
  2. Has a completely different visual design -- not just a reskin, a reimagining
  3. Pulls live stats from APIs (campaign count, agent count, cost, findings, GPA)
  4. Would make someone who has never seen MC say "holy shit" when scrolling through
  5. Can be shown to friends as a demo of what MC is and why it matters
- **Constraints:**
  - Do NOT modify why-page.html -- create why2-page.html
  - Single HTML file, inline CSS/JS
  - MC design system fonts (Plus Jakarta Sans, DM Sans, DM Mono) but creative freedom on colors/layout
  - Dark mode preferred (the /why page's dark mode was praised)
  - Must tell the MC story: the problem (blind agents), the solution (visibility + learning loop), the proof (real data)

### Stage 2: DISCOVER (HARD GATE -- do not skip)
Run: `ls .claude/skills/`
**You MUST load at least one skill before proceeding to Stage 3.**
Mandated skills for this task: `impeccable-frontend-design`, `impeccable-polish`
If you skip this stage, your grade caps at C regardless of deliverables.

### Stage 3: EXECUTE
1. Read why-page.html thoroughly -- absorb the narrative voice, the section structure, the design choices
2. Fetch live data from /api/campaigns, /api/findings, /api/cost
3. Design a completely new page structure. Some ideas (but be creative):
   - Hero with live animated stats counting up
   - "The Problem" section with real before/after examples from campaign data
   - "The Proof" section with real agent grades, GPA, cost efficiency
   - "The Self-Improvement Loop" showing findings that became hooks that prevented future failures (f104 watermark is a perfect example)
   - Interactive elements -- hover states, scroll reveals, data that updates
4. Write why2-page.html with inline CSS/JS
5. The writing must be as compelling as the original -- short punchy sentences, bold claims backed by data

### Stage 4: REASON
- What makes someone go "holy shit" when seeing a demo? Real numbers, not marketing speak.
- The /why page quotes the user directly -- that's powerful. Find more quotes from prompt data.
- The learning loop (mistake -> PM -> finding -> hook -> prevention) is the most impressive thing about MC. Make it the centerpiece.
- Visual storytelling: show, don't tell. Animate the data.

### Stage 5: VERIFY
1. Take a Playwright screenshot of the full page at 1440px width
2. Verify all API data loads correctly
3. Check responsive at 768px
4. Critically evaluate: is this demo-worthy? Would it impress a non-technical friend?
5. Compare side-by-side with /why -- is the new version strictly better?

### Stage 6: DEBRIEF (before you exit)
curl -X POST http://localhost:3033/api/campaigns/agent-debrief \
  -H "Content-Type: application/json" \
  -d '{"campaignId":"campaign-002","slot":"why2-overhaul","delivered":["..."],"missed":["..."],"lessons":["..."]}'

## Constraints
- Create why2-page.html -- do NOT touch why-page.html
- Single HTML file, inline CSS/JS, vanilla JS
- Dark mode preferred
- Data-driven from live APIs
- Demo-worthy visual quality -- this is a showpiece
- Must work without server.js changes (server already serves pages/ directory)
