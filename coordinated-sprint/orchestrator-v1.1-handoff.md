# Orchestrator v1.1 Handoff

**Date:** March 8, 2026 | **Campaign:** MC Evolution Sprint (campaign-001)

---

## What v1.1 Did (this session)

### Built
- `/story` page — visual timeline of v1.0's 10-hour campaign
- `/close-out` page — grouped remaining items with priorities, linked from campaigns
- Campaigns page: collapsible debrief sections, sprint tags on wins, grouped remaining items, close-out button
- Memory cleanup: rewrote MEMORY.md, deleted stale files, moved phredomade.md + security-audit.md to docs/

### Captured
- **9 findings** (f048-f056): Agent Lifecycle, Calibration, skills gap, prompt quality, prototyping, workflow as living doc, memory cleanup
- **Agent Lifecycle concept** (f053): 5-stage mandatory pipeline — Define → Discover → Execute → Reason → Verify
- **Calibration concept** (f054): phase between campaigns for system improvement
- Cleaned 49 remaining items → 37 grouped items + 10 deferred

### Updated
- campaigns.json: all agents marked completed, v1.1 added as active orchestrator, debrief fully updated with all 5 sprints, remaining items grouped with priorities
- principles.md: added Agent Lifecycle section + Calibration
- design-context.md: MC-only now (phredomade design removed)

---

## What's Next (for v1.2 or resumed session)

### Priority 1: Campaigns Page Overhaul PRD
Write a PRD-quality prompt for an agent to overhaul the campaigns page. Use /brainstorming + /enhance-prompt. This is the reference page for all future agents.

Group A items (must-close):
- Campaign states lifecycle, close-out flow, activity feed, wins/losses collapsible, view buttons, embed story + video-findings, sprint tracking, agent-to-remaining linking, refresh retrospective, wire /why deliverable, document Agent Lifecycle

### Priority 2: Calibration Work (Group G)
- Memory cleanup (DONE by v1.1)
- Workflow page: capture orchestrated workflow + agent lifecycle
- Workflow page: auto-update from postmortems/findings
- Agent prompts must include lifecycle stages

### Priority 3: Other Groups
- D (Nav + UX): nav dropdown redesign, findings 2-tier toggle, notification sound
- F (Analytics): session analytics, campaign metrics, agent quality metrics, orchestrator skill
- C (Infrastructure): split server.js, default to Sonnet, sub-agent visibility

### Deferred to campaign-002
10 items in campaigns.json `deferred` array.

---

## Key User Preferences Learned This Session

1. **Don't put phredomade-specific files in global memory** — portfolio stuff goes in docs/ or local .md files. Global memory = MC + universal principles only.
2. **Findings need hierarchy** — concepts vs findings vs pain points should look different. Uber-important findings (CLAUDE.md level) must be visually distinct.
3. **Orchestrator should create handoff skills** — automate the handoff process. This is a P0 for next session.
4. **Notifications still don't work** — PM007 is still the #1 productivity blocker. No sound, no reliable browser notification.
5. **User gets upset when memory files have irrelevant info** — be ruthless about what goes in global memory.
6. **Close-out page should be a sub-page of campaigns, not standalone nav** — campaign-001 links to its close-out.
7. **Agents should autonomously use skills** — P0 for campaign-002.

---

## Uncaptured Items From User's Final Prompts

1. **Orchestrator handoff skill** — automate the handoff process. "Automation is where the money's at." Create a skill that generates the handoff doc + prompt automatically.
2. **Notifications STILL don't work** — user got one browser popup but no sound. PM007 remains the #1 blocker.
3. **Background agent execution was praised** — user loved that v1.1 ran agents in background. Keep doing this.
4. **Campaign naming** — "001" is clunky. Consider better naming convention.
5. **Close-out should sync with campaign debrief** — they should be a "working set" with each other, not independent.
6. **Workflow is THE most important page after Dashboard** — it informs how everything works. Invest heavily here.
7. **Workflow must capture**: orchestrator pattern, PRD-based dispatch, agent lifecycle, skill discovery, campaigns system. The workflow looks NOTHING like 2 days ago.
8. **Postmortems should auto-trigger workflow review** — there's no mechanism to translate PM findings into workflow updates. This is a gap.
9. **Scope creep awareness** — user noted "every task I do, more tasks are created instead of less." Be disciplined about what goes into campaign vs deferred.
10. **Findings need "concepts" as a separate category** — not all findings are the same. Some are CLAUDE.md-level principles, some are minor observations. Visual distinction needed.

## Active P0s

1. **Notification sound** (PM007) — still broken
2. **Campaigns page overhaul** — must close before ending campaign-001
3. **Workflow page update** — must reflect orchestrated workflow + agent lifecycle
4. **Orchestrator handoff skill** — create so future context switches are automated

---

## User Work Style (reinforced this session)
- Uses Wispr Flow (voice-to-text) — prompts are long, stream-of-consciousness. YOUR JOB is to parse these into structured tasks.
- Gets upset when agents don't use skills or don't reason properly about what should go where.
- Loves when things are connected — close-out ↔ campaigns, findings ↔ workflow, everything should link.
- Values readability above ALL else. Bold leads. No walls of text. Scannable in seconds.
- Wants to SEE things in Chrome, not read them in terminal. Build pages, not text dumps.
- Praised v1.1's table format for task breakdowns. Keep using tables.
- Praised background agent execution. Keep dispatching in background when possible.
- "Every task I do, more tasks are created" — be disciplined about scope. Close things, don't just add.

## Data Files (current state)
- campaigns.json: 1 campaign, 17 agents (16 completed + v1.1 active), 24 wins, 8 losses, 37 remaining, 10 deferred
- findings.json: 56 findings (f001-f056)
- Memory files: MEMORY.md, principles.md, design-context.md, local-ports.md, mcp-setup.md (5 files, clean)
- Close-out page: /close-out (static HTML, reflects campaigns.json groupings)
- Story page: /story (static HTML, v1.0 visual timeline)
