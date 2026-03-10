## Mission: Research all orchestrator sessions to surface every user pain point about agent cards on the campaigns page, then propose a redesigned card that addresses all of them.

The campaigns page shows agent cards in a grid — each card represents a dispatched agent with its name, grade, status, lifecycle dots, and skill pills. The user has expressed frustration with these cards across multiple orchestrator sessions but hasn't consolidated the complaints into a single design spec. This agent's job is to mine the history, extract the pain points, and produce a concrete card redesign proposal.

**Deliverable:** A research document at `coordinated-sprint/agent-card-research.md` with: (1) exhaustive list of user complaints from orchestrator sessions, (2) proposed card redesign addressing each, (3) mockup description or wireframe spec.

## Known Pain Points (from orchestrator v2.1 and v2.2)

These are already documented — the agent should find MORE, not just repeat these:

1. **"VERIFYING / Bash" state is meaningless** — heuristic inference shows tool names (Bash, Grep) and guessed lifecycle states (VERIFYING, INVESTIGATING). User: "I don't want to know whether Bash is happening. This is outdated heuristic logic."
2. **Agent names are opaque** — "Live Modal Overhaul v2" tells the user nothing. Should show WHY it was dispatched in user's own words.
3. **Cards look boring** — "These look pretty boring in terms of colors, no emojis. I'd love to overhaul the colors completely." (v2.1)
4. **Cook timer missing** — "A little cook time that would actively update second by second on how long it's been running." (v2.1)
5. **MISSED section showed placeholders** — "Why is there a missed section if no items are missed?" (v2.1) — FIXED by v2.2, but verify.
6. **Dropdown auto-close** — clicking cards or expanding sections causes other dropdowns to close. Improved but not eliminated. (v2.1)
7. **Agent cards don't auto-appear** — new agents sometimes require page refresh to show up. (v2.1 systemic issues)

## Agent Lifecycle (follow in order)

### Stage 1: DEFINE
- **Read these files first:**
  - `projects/agent-mission-control/campaigns-page.html` — search for agent card rendering code (look for `renderAgentCard`, grid layout, `.agent-card` classes)
  - `projects/agent-mission-control/coordinated-sprint/orchestrator-v2.1-handoff.md` — section on systemic issues and user preferences
  - `projects/agent-mission-control/coordinated-sprint/orchestrator-v2.0-handoff.md` — if it exists, check for card complaints
  - `C:\Users\emeskel\Claude\apple-design-template.md` — our design system
  - The last 50 user prompts from these orchestrator sessions (read from `~/.claude/projects/C--Users-emeskel-Claude/`):
    - `6aa7eb5e-b1b4-4fd6-a899-b418eba4be29` — v2.1 session (390 prompts, richest source)
    - Check campaigns.json for v1.5, v1.6, v1.7 sessionIds and read their last 20 prompts each
  - `projects/agent-mission-control/campaigns.json` — look at the agent data structure to understand what fields are available for display
- **Success looks like:**
  1. A document with 10+ distinct pain points sourced from actual user prompts (with quotes)
  2. Each pain point has a proposed solution
  3. A card redesign spec that addresses all points
  4. Comparison of current card vs proposed card
- **Constraints:**
  - This is READ-ONLY RESEARCH. Do NOT modify any files except the output document.
  - Do NOT modify campaigns-page.html, server.js, or any data files
  - Focus on the CARD specifically (the grid item), not the report card modal (separate concern)

### Stage 2: DISCOVER (HARD GATE — do not skip)
Run: `ls .claude/skills/`
**You MUST load at least one skill before proceeding to Stage 3.**
Mandated skills for this task: `brainstorming`

### Stage 3: EXECUTE

1. **Mine orchestrator sessions** — read the last 30-50 user prompts from v2.1, v2.0, v1.7, v1.6, v1.5 sessions. Extract EVERY mention of:
   - Agent cards (appearance, information, layout)
   - Campaign page UX
   - States/status display
   - Colors, emojis, visual design
   - Information density (too much, too little)
   - Any "I wish the card showed X" or "why doesn't this show Y"

2. **Catalog pain points** — organize into categories:
   - **Information architecture** — what's shown vs what should be shown
   - **Visual design** — colors, emojis, typography, spacing
   - **Live state** — how running agents are displayed
   - **Completed state** — how finished agents are displayed
   - **Interactivity** — click behavior, dropdowns, expansion

3. **Research best practices** — WebSearch for:
   - "agent dashboard card design" (how do other AI agent tools display agent status?)
   - "task card UX patterns" (Jira, Linear, Asana — what info density works?)
   - "real-time status card design" (how do monitoring dashboards show live state?)

4. **Propose redesigned card** — for both active and completed states:
   - What info appears on the card face (without clicking)
   - What gets revealed on hover or expand
   - Color system (should convey grade + status at a glance)
   - Emoji usage (semantic, per the emoji standard in `memory/emoji-standard.md`)
   - Typography hierarchy
   - Live state display (replacing VERIFYING/Bash)

5. **Write the output document** — save to `coordinated-sprint/agent-card-research.md`

### Stage 4: REASON
- How much information is too much for a card? Linear shows very little per card; Jira shows more. What's the right density for our use case (orchestrator monitoring 5-15 agents)?
- Should the card show the user's original dispatch reason (the "why") or just the technical focus?
- Should lifecycle dots remain? Or should they be replaced with something more meaningful?
- Should grades use color (green A, red F) or stay neutral?

### Stage 5: VERIFY
- Verify: document has 10+ pain points with actual user quotes
- Verify: every known pain point from the list above is addressed
- Verify: proposed card spec is specific enough for a builder agent to implement
- Verify: research includes at least 3 external sources for card UX patterns

### Stage 6: DEBRIEF (MANDATORY — your grade depends on this)
```bash
curl -X POST http://localhost:3033/api/campaigns/agent-debrief \
  -H "Content-Type: application/json" \
  -d '{
    "campaignId": "campaign-002",
    "slot": "agent-card-research",
    "delivered": ["Item 1: pain point catalog with user quotes", "Item 2: card redesign spec", "Item 3: external research findings"],
    "missed": ["Item 1: anything not completed"],
    "lessons": ["Lesson 1: insight about card UX"]
  }'
```

## Constraints
- READ-ONLY. Do NOT modify any code files.
- Output goes to `coordinated-sprint/agent-card-research.md` only.
- Include actual user quotes with session attribution.
- Proposed card must work within the existing Apple design system (Plus Jakarta Sans, light mode, CSS custom properties).
