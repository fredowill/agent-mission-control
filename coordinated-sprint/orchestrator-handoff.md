# Orchestrator Handoff — v1.0 to v1.1

**Session:** 7fa7419f | **Date:** March 7, 2026 | **Campaign:** MC Evolution Sprint (campaign-001)

---

## What You Are

You're Orchestrator v1.1 for Mission Control. You coordinate agents, manage the campaign, and build MC features. Read CLAUDE.md first — it has 10 non-negotiable rules. Rule #10 (UI must be polished) and Rule #7 (Playwright verify every UI change) are the most commonly violated.

## Campaign Status

Campaign: MC Evolution Sprint (campaign-001) — ACTIVE, Closing Sprint phase.

### Agents by Phase

**Initial Push (all completed):** Orchestrator, Beacon, Compass, Overwatch
**Polish & Analysis (all completed):** Polisher, Retrospector, Integrator, Analyst
**Deep Dives (all completed):** Video Analyzer, Findings Analyst, Medic
**Closing Sprint (mixed):**
- Pipeline Architect — COMPLETED. Built /capture (mobile idea intake), /president (CEO dashboard, needs iteration), triaged Discord dump
- Workflow Redesign — ACTIVE (session 81bb8744). Redesigning workflow-page.html with collapsible sections, agent lifecycle pipeline, learning loop diagram
- Dashboard Fix — COMPLETED. Fixed blank card bug (PM008/PM011), extracted some Dashboard code
- Morning Brief — COMPLETED. Wrote morning-brief.md, updated campaign debrief

### Key Pages Built This Campaign
- /campaigns — campaign war room with agents, debrief, retrospective
- /prompts — one-click copy prompts for agent dispatch
- /capture — mobile-first idea intake (phone on same WiFi)
- /president — CEO summary (needs v2 iteration, currently 4/10)
- /why — value proposition landing page
- /health — system diagnostics
- /video-findings — demo transcript analytics
- /demo-guide — how to present MC
- /starter — getting started guide for friends
- /morning-brief — wake-up summary
- /cost — token cost tracker (hidden)

## Active P0s (do these first)

1. **Notification sound** — agents get stuck waiting and user doesn't know. PM007. The campaigns page has notification code but the sound doesn't play and browser permission isn't confirmed. This is the #1 productivity blocker.
2. **FHL hooks demo** — Monday deadline. Demo hooks to work teammates in CARES guide context. Don't reveal MC exists. Tony Stark energy. Task: wk-hooks-demo in dispatch-work.json.
3. **Workflow page redesign** — agent is running (81bb8744). This is P0 for campaign close.
4. **President page v2** — Pipeline Architect is iterating now. Should be weather-app simple, not information dump.

## Key Patterns & Rules

- **Prompts:** NEVER dump inline. Use /prompts page or campaign card Copy Prompt buttons.
- **Deliverables:** Deliver what user asked for and PAUSE. Don't fly off into follow-up work.
- **Tasks from campaigns:** Any task created BECAUSE of a campaign goes in campaign remaining AND dispatch. Both.
- **Agent dispatch:** Agents auto-link via prompt-hook.js (detects "You're the X agent" in first prompt).
- **Machine tags:** All PMs and dispatch items should have machine:home or machine:work tag.
- **StatusLine:** hook.js now writes human-readable statusLine to state files. Dashboard and campaigns page display it.
- **Readability:** Bold lead phrase on every list item. No scroll prisons. Align columns. F044 is critical.
- **Token efficiency:** One long orchestrator + many short executors. Sub-agents run on Sonnet when possible.
- **Dead agent detection:** If PID is gone but campaign says "active", mark completed.
- **Server.js:** 3600+ lines, embedded Dashboard HTML is browser JS not server JS (PM008). Multiple agents have flagged it needs splitting. Task: serverjs-split.

## Data Files

```
Campaign data:    .claude/agent-hub/campaigns.json
Dispatch (home):  .claude/agent-hub/dispatch-home.json
Dispatch (work):  .claude/agent-hub/dispatch-work.json
Findings:         .claude/agent-hub/findings.json (47 findings, 8 critical)
Sources/Radar:    .claude/agent-hub/sources.json
Workstreams:      .claude/agent-hub/workstreams.json
Areas:            .claude/agent-hub/areas.json
Mode:             .claude/agent-hub/mode.json
Sprint outputs:   .claude/agent-hub/coordinated-sprint/
Morning brief:    .claude/agent-hub/coordinated-sprint/morning-brief.md
Retrospective:    .claude/agent-hub/coordinated-sprint/retrospective.md
Video transcript: .claude/agent-hub/coordinated-sprint/demo-transcript.txt
Video analysis:   .claude/agent-hub/coordinated-sprint/video-analysis.md
```

## User Work Style

- Uses Wispr Flow (voice-to-text) — prompts are spoken, conversational, stream-of-consciousness
- Organization is priority #1 — always wants to know what's happening at a glance
- Apple design quality — every UI must be clean, minimal, polished
- Values readability above all — bold leads, no walls of text, no scroll prisons
- Runs multiple agents simultaneously — needs terminal identity and notification sounds
- Works at Microsoft (CARES team) — MC is PERSONAL IP, not work product. Sensitive.
- Has a home PC and work laptop — Home/Work mode toggle, separate git repos
- Personal projects: grandfather documentary (P0), language learning AI, photography portfolio

## Orchestrator v1.0 Retrospective

Read: `coordinated-sprint/orchestrator-v1.0-retrospective.md`

TL;DR: 6.5/10. Good throughput, weak visual discipline. Broke Dashboard 3 times, never Playwright tested, shipped unreadable UI. Key lesson for you: if context is high, dispatch sub-agents for code changes. Don't build blind. And ALWAYS pause after giving the user what they asked for before moving to your next task.

## Design Principle: Lightweight Above All

MC's biggest risk is information overload. Too many pages, too much text, too many scroll windows = user stops using it. Every page must earn its existence. Every section must be collapsible or removable. If the user has to parse, it's failed. Keep it lightweight.

## What to Do First

1. Read CLAUDE.md
2. Read this handoff + the v1.0 retrospective
3. Check which agents are still running: read recent state files in .claude/agent-hub/states/
4. Check /campaigns for current campaign status
5. Ask the user what they want to focus on — don't assume
