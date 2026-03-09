## Mission: Make skill pills clickable on agent report cards

When viewing an agent's report card on the campaigns page, skill names (e.g., "frontend-design", "impeccable-polish") should be clickable. Clicking a skill should show the skill's SKILL.md content in a modal or expandable section.

## Context
- **File:** `.claude/agent-hub/campaigns-page.html` — this is the ONLY file you modify
- **Skills directory:** `.claude/skills/` — each skill has a `SKILL.md` file
- **Existing pattern:** Agent cards already have `.skill-pill` elements with "used" and "missed" variants
- **API needed:** You may need to add a `/api/skill/<name>` endpoint to `server.js` that reads `.claude/skills/<name>/SKILL.md`
- **Design system:** Apple-inspired light mode. Fonts: Plus Jakarta Sans, DM Sans, DM Mono.

## Agent Lifecycle (follow in order)

### Stage 1: DEFINE
Read `campaigns-page.html` — understand:
- How skill pills are rendered (search for `skill-pill`)
- The modal system (`openReportCard`, `closeModal`, `modalBg`)
- How the Toolbox page renders skills (if it has a pattern to reuse)

Success = clicking a skill pill shows the SKILL.md content without leaving the page.

### Stage 2: DISCOVER (HARD GATE — do not skip)
Run: `ls .claude/skills/`
**You MUST load at least one skill before proceeding to Stage 3.**
Mandated skills for this task: `frontend-design`
If you skip this stage or proceed without loading skills, your grade caps at C regardless of deliverables.

### Stage 3: EXECUTE
1. Add a `/api/skill/<name>` endpoint to `server.js` that reads `.claude/skills/<name>/SKILL.md` and returns the content
2. Make `.skill-pill` elements clickable — `onclick` fetches the skill content
3. Display in a small overlay/popover near the pill, or a slide-in panel
4. Show skill name, description, and key sections from SKILL.md
5. Click outside or press Escape to close

### Stage 4: REASON
- Does clicking a skill pill interfere with the report card modal?
- Is the SKILL.md content readable in the display format?
- What happens if the skill doesn't have a SKILL.md file?

### Stage 5: VERIFY
- Take a Playwright screenshot showing a clicked skill pill with content visible
- Test with at least 2 different skills (frontend-design, orchestrator)
- Verify the report card modal still works after your changes

### Stage 6: DEBRIEF (before you exit)
Before exiting, call the debrief API:
```bash
curl -s -X POST http://localhost:3033/api/campaigns/agent-debrief -H "Content-Type: application/json" -d '{"campaignId":"campaign-001","slot":"clickable-skills","delivered":["item 1"],"missed":["item 1"],"lessons":["lesson 1"]}'
```

## Constraints
- Primary file: `campaigns-page.html`. You may also add an API endpoint to `server.js`.
- Do NOT modify the skill files themselves.
- Match existing design patterns — Apple-inspired light mode.
- Skill content display must not break the report card modal flow.
