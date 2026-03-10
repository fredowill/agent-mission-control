## Mission: Polish the orchestrator tab on the campaigns page — fix the lightning emoji, redesign previous orchestrators section, and fix alignment issues.

The Live Card Designer agent (Sprint 1b) built the new orchestrator tab with lifecycle bar, dispatched agents, and stats. It works, but has visual issues the user caught:

1. **Lightning emoji missing** — the active orchestrator still shows 🟣 (purple ball) instead of ⚡ (lightning). The code was supposed to show ⚡ when `orchIsLive` is true, but it's not working.
2. **Previous orchestrators section is misaligned** — the version chips/buttons are not aligned with each other, looks sloppy.
3. **Previous orchestrators should be full cards, not tiny buttons** — the user preferred the old style where each orchestrator was a proper card with name, grade, sprint, and focus. The tiny button chips feel like a downgrade.
4. **White space issues** — excess padding/margins around the v2.0 area.

**Deliverable:** Updated orchestrator tab section in `projects/agent-mission-control/campaigns-page.html` with all 4 issues fixed.

## Agent Lifecycle (follow in order)

### Stage 1: DEFINE
- **Read these files first:**
  - `projects/agent-mission-control/campaigns-page.html` — focus on the orchestrator tab section. Search for `tab-orchestrator` to find the relevant code block.
  - `C:\Users\emeskel\Claude\apple-design-template.md` — design system (typography, spacing, colors)
- **Success looks like:**
  1. Active orchestrator shows ⚡ lightning emoji in its icon (not 🟣)
  2. Previous orchestrators are full mini-cards (not tiny chip buttons) — each showing: name, grade badge, sprint number, and a 1-line focus summary
  3. Previous orchestrators are vertically stacked, properly aligned, with consistent spacing
  4. No excess white space
  5. Looks polished — Apple Design aesthetic
- **Constraints:**
  - Only modify the orchestrator tab section in campaigns-page.html
  - Do NOT touch other tabs or the agent card modal
  - Keep the existing lifecycle bar, dispatched agents, and stats — only polish the hero card icon and previous orchestrators section
  - This is a POLISH task — no new features, just visual fixes

### Stage 2: DISCOVER (HARD GATE — do not skip)
Run: `ls .claude/skills/`
**You MUST load at least one skill before proceeding to Stage 3.**
Mandated skills for this task: `impeccable-polish` (visual quality pass)

### Stage 3: EXECUTE

**Fix 1: Lightning Emoji**
- Find the orchestrator icon rendering code in the tab section
- The icon should show ⚡ when the orchestrator has `status === "active"` — check if the condition is using `orchIsLive` (which checks PID liveness) vs `status === "active"` (which checks campaign data). The PID check may fail because the orchestrator is THIS session, not a tracked PID.
- Fix: use `currentOrch.status === 'active'` as the condition, not just `orchIsLive`

**Fix 2: Previous Orchestrators as Mini-Cards**
Replace the tiny chip buttons with properly styled mini-cards:
```
┌────────────────────────────────────────────┐
│ 🟣 Orchestrator v2.0    B    Sprint 1     │
│ Campaign nav, dispatch fixes, 3 agents     │
├────────────────────────────────────────────┤
│ 🟣 Orchestrator v1.9    A-   Sprint 11    │
│ Campaign-001 close-out, multi-campaign     │
├────────────────────────────────────────────┤
│ 🟣 Orchestrator v1.8    A-   Sprint 10    │
│ Pipeline verification, 4 agents, 15 fixes  │
└────────────────────────────────────────────┘
```

Each mini-card should have:
- Purple dot icon (smaller than the hero card's icon)
- Name in bold
- Grade badge (same style as agent cards)
- Sprint number
- First ~60 chars of the `focus` field as a subtitle
- Consistent vertical stacking with 8px gap
- Same border-radius and subtle border as the hero card

**Fix 3: Alignment**
- Use CSS flexbox or grid for the previous orchestrators section
- Consistent padding: 12px on all cards
- All cards same width (full width of the container)

**Fix 4: White Space**
- Audit margins between the hero card, dispatched agents section, stats row, and previous section
- Remove any excess margin-bottom or padding that creates gaps larger than 16px between sections

### Stage 4: REASON
- Should previous orchestrators show a collapsed view (3 most recent) with "Show all" expander?
  - Recommendation: Yes, if more than 3. Campaign-001 has 10 orchestrators — showing all would be very long.
- Should clicking a previous orchestrator card open its report card modal?
  - Recommendation: Yes — reuse the existing agent card modal onclick.

### Stage 5: VERIFY
- Take a Playwright screenshot of the orchestrator tab for campaign-002 (few orchestrators) AND campaign-001 (10 orchestrators)
- Verify:
  - ⚡ shows on the active orchestrator (v2.1 in campaign-002)
  - Previous orchestrators are full mini-cards, aligned, properly spaced
  - No white space gaps
  - Campaign-001 shows 3 most recent + "Show all" if there are more
  - Clicking a previous orchestrator opens its report card
  - Page looks polished — Apple Design aesthetic

### Stage 6: DEBRIEF (MANDATORY — your grade depends on this)
```bash
curl -X POST http://localhost:3033/api/campaigns/agent-debrief \
  -H "Content-Type: application/json" \
  -d '{
    "campaignId": "campaign-002",
    "slot": "orchestrator-card-polish",
    "delivered": ["Item 1: lightning emoji fix", "Item 2: previous orchestrators as mini-cards", "Item 3: alignment fix", "Item 4: white space cleanup"],
    "missed": ["Item 1: anything not completed"],
    "lessons": ["Lesson 1: what you learned"]
  }'
```

## Constraints
- Only modify campaigns-page.html (orchestrator tab section + CSS)
- POLISH only — no new features
- Apple Design aesthetic
- Must work with 5-second polling
- Preserve the dropdown auto-close fix
