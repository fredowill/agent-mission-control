## Mission: Polish the orchestrator hero card layout — fix empty space around lifecycle bar and improve the mission text styling.

This is a v2 polish pass on the orchestrator tab. The previous polish agent (v1) fixed the lightning emoji, previous orchestrators mini-cards, and alignment. This pass addresses 3 remaining issues from user feedback:

1. **Empty space left and right of lifecycle bar** — the bar is centered but there's wasted space on both sides. Either make the bar full-width or condense the overall layout.
2. **"Orchestrator standardization sprint" text is unstyled** — it's plain gray text just sitting under the name. Should be styled: color-coded, bolded lead, feel alive — not a debug dump.
3. **General spacing tightness** — condense the hero card vertically. Less padding, tighter gaps.

**Deliverable:** Updated orchestrator tab section in `projects/agent-mission-control/campaigns-page.html` with these 3 visual fixes.

## Agent Lifecycle (follow in order)

### Stage 1: DEFINE
- **Read these files:**
  - `projects/agent-mission-control/campaigns-page.html` — search for `tab-orchestrator` to find the orchestrator section
  - `C:\Users\emeskel\Claude\apple-design-template.md` — design system
- **Success looks like:**
  1. Lifecycle bar uses full available width (no dead space on sides)
  2. Mission text is styled: bold lead word, subtle color, compact — not a plain text dump
  3. Hero card feels tight and polished — no extra breathing room
- **Constraints:**
  - Only modify the orchestrator tab section + CSS
  - Do NOT touch other tabs, modals, or the report card
  - Do NOT change the lifecycle bar labels or logic — just the width/positioning
  - SMALL changes only — this is polish, not redesign

### Stage 2: DISCOVER (HARD GATE)
Run: `ls .claude/skills/`
Mandated: `impeccable-polish`

### Stage 3: EXECUTE
1. **Lifecycle bar width** — remove centering constraints. Make the lifecycle dots span the full card width with even spacing. Use `justify-content: space-between` or similar on the container.
2. **Mission text styling** — replace plain text with styled format:
   - Bold the first word or two as a label (e.g., "Mission:" or "Focus:")
   - Use `color: var(--text2)` with `font-weight: 600` for the label
   - Keep the rest as `color: var(--text3)` body text
   - Add a small emoji prefix (🎯) for visual anchoring
   - Max 1 line with overflow ellipsis if too long
3. **Spacing** — tighten:
   - Hero card padding: aim for 20px instead of 24px
   - Gap between name/lifecycle/dispatched: aim for 12px instead of 16px
   - Remove any margin-bottom on the last section inside the hero card

### Stage 4: REASON
- Should the mission text be editable/live or static from focus field?
  - Static from focus field is fine — this is display polish, not functionality.

### Stage 5: VERIFY
- Playwright screenshot of campaign-002 orchestrator tab
- Check: lifecycle bar spans full width, mission text is styled, no dead space, tight layout

### Stage 6: DEBRIEF
```bash
curl -X POST http://localhost:3033/api/campaigns/agent-debrief \
  -H "Content-Type: application/json" \
  -d '{
    "campaignId": "campaign-002",
    "slot": "orchestrator-card-polish-v2",
    "delivered": ["Item 1: full-width lifecycle bar", "Item 2: styled mission text", "Item 3: tightened spacing"],
    "missed": ["Item 1: anything not completed"],
    "lessons": ["Lesson 1: insight"]
  }'
```

## Constraints
- Only campaigns-page.html (orchestrator tab + CSS)
- POLISH only — no new features
- Apple Design aesthetic
- Must work with 5-second polling
