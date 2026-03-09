## Mission: Redesign the Skills group in the Infrastructure Attribution section from a long vertical list to a compact chip/square grid layout.

The Infrastructure Attribution section on the Orchestrator tab works — skills, hooks, and rules show with version pills and staleness badges. But the Skills group (25 items) renders as a long boring vertical list that takes up excessive space. The user wants compact squares/chips instead. Hooks and Rules groups are OK but could also be more visually organized.

## Agent Lifecycle (follow in order)

### Stage 1: DEFINE

- **Read:** `.claude/agent-hub/campaigns-page.html` — find the Infrastructure Attribution section (search for `infra-section`, `infra-row`, `openInfraModal`, `getInfraStaleness`). Understand how the three groups (Skills, Hooks, Rules) currently render.
- **Read:** `.claude/agent-hub/campaigns.json` — find the `infrastructure` object to understand the data shape (skills have name/createdBy/type, hooks have name/createdBy/description, rules have name/createdBy).
- **Success looks like:** Skills render as a grid of compact clickable chips (not full-width rows). Each chip shows: skill name, version pill, staleness color indicator. Clicking still opens the content modal. Hooks and Rules are also visually improved but don't need the chip treatment — they can stay as rows but with better density.
- **Constraints:**
  - ONLY modify `campaigns-page.html`. Do NOT touch server.js or campaigns.json.
  - The click-to-modal behavior MUST still work — `openInfraModal(idx)` function already exists.
  - Match Apple-inspired light mode design: Plus Jakarta Sans, DM Sans, DM Mono.
  - Keep the collapsible group behavior intact.

### Stage 2: DISCOVER (HARD GATE — do not skip)

Run: `ls .claude/skills/`
**You MUST load at least one skill before proceeding to Stage 3.**
Mandated skills for this task: `frontend-design`
If you skip this stage, your grade caps at C regardless of deliverables.

### Stage 3: EXECUTE

1. **Redesign Skills group** — replace the full-width `.infra-row` list with a flex-wrap grid of compact chips:
   - Each chip: ~160-200px wide, rounded corners, shows skill name (truncated if needed), small version pill, staleness dot (colored circle, not full badge text)
   - Use `display:flex; flex-wrap:wrap; gap:8px` for the grid
   - Chips should be clickable (same `openInfraModal` handler)
   - Group chips by staleness: Current first, then Review, then Stale — with subtle visual separation
   - Staleness indicated by a small colored dot or left-border, not a full "STALE" text badge (saves space)

2. **Tighten Hooks group** — hooks can stay as rows but:
   - Show the description inline (it's already in the data)
   - Reduce vertical padding to make them more compact

3. **Tighten Rules group** — rules can stay as rows but:
   - More compact padding
   - Consider grouping CLAUDE.md rules vs Orchestrator rules visually

4. **Update section header** — currently shows "Infrastructure Attribution" with counts. Keep counts but consider showing a mini summary like "2 current · 9 review · 14 stale" in the header.

### Stage 4: REASON

- Does the chip grid work on narrower screens? The campaigns page has a max-width of 1200px so chips should wrap gracefully.
- Is the staleness dot clear enough without the text label? Consider a tooltip on hover.
- Does the collapsed state still work properly with the new chip layout?

### Stage 5: VERIFY

- Take a Playwright screenshot of the Orchestrator tab showing the redesigned Infrastructure section.
- Verify Skills render as a chip grid, not a vertical list.
- Click a skill chip and screenshot the modal to confirm click handler still works.
- Verify Hooks and Rules still render correctly.
- Compare the vertical space used by the new layout vs the old list — it should be significantly shorter.

### Stage 6: DEBRIEF (before you exit)

```bash
curl -s -X POST http://localhost:3033/api/campaigns/agent-debrief \
  -H "Content-Type: application/json" \
  -d '{"campaignId":"campaign-001","slot":"infra-polish","delivered":["item 1","item 2"],"missed":["item 1"],"lessons":["lesson 1"]}'
```

## Constraints

- **Primary file:** `campaigns-page.html` ONLY.
- **Do NOT modify** server.js, campaigns.json, or any other file.
- **Do NOT rewrite existing CSS** that isn't related to the infrastructure section. The previous agent already rewrote 670 lines of CSS beyond scope — do not repeat this.
- **Design system:** Apple-inspired light mode. Fonts: Plus Jakarta Sans (titles), DM Sans (body), DM Mono (code).
- **Preserve functionality:** All existing click handlers, modals, collapsible groups must still work.
