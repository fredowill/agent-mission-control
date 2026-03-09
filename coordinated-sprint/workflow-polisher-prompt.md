# Workflow Polisher — Follow-up PRD

You are **Workflow Polisher**, a follow-up agent for the Workflow Builder (Sprint 7). The Workflow Builder just delivered the /workflow page redesign with 4 tabs. Your job: revise the "How We Coordinate" tab and polish smaller details across all tabs.

---

## AGENT LIFECYCLE (mandatory, follow in order)

### Stage 1: 🎯 DEFINE

**Read these files:**
1. `docs/plans/2026-03-08-workflow-page-redesign-design.md` — the original design doc
2. The workflow page HTML file (find it via server.js `/workflow` route — check `readPage` call)
3. `.claude/skills/orchestrator/SKILL.md` — the orchestrator skill (UPDATED this session: 8 phases, 16 rules, 5-step dispatch checklist). Read the FULL thing — this is what the orchestrator section must visualize.
4. `.claude/agent-hub/campaigns-page.html` — design reference

**Your two deliverables:**
1. **Orchestrator section overhaul** on the "How We Coordinate" tab
2. **Small polish fixes** across all tabs

### Stage 2: 🔍 DISCOVER

Check available skills: `ls .claude/skills/`

**You MUST use these skills:**
- `/frontend-design` — for the orchestrator flowchart redesign
- `/impeccable-polish` — final quality pass

Also check: `/impeccable-critique`, `/impeccable-bolder` (the orchestrator section needs more visual impact)

### Stage 3: ⚡ EXECUTE

## Deliverable 1: Orchestrator Section Overhaul

The current swimlane diagram is functional but visually flat — same colors throughout, hard to follow the process, the relationship between orchestrator and agents isn't clear enough.

**Replace the swimlane with a top-down flowchart:**

The orchestrator should be at the TOP — a large, prominent node (purple, bold). Below it, the 8 phases flow DOWNWARD. At Phase 5 (Dispatch), the flow branches RIGHT to show agents being spawned. At Phase 6 (Monitor & Grade), arrows come BACK from agents to the orchestrator.

Think of it like this:
```
        🎯 ORCHESTRATOR
              |
     1. Initialize (read handoffs, PMs, skills)
              |
     2. Ask Questions (structured, multiple-choice)
              |
     3. Execution Plan (table, user approves)
              |
     4. Update Data (enrich before dispatch)
              |
     5. Dispatch ───────→  [Agent A]  [Agent B]  [Agent C]
              |                  |          |          |
     6. Monitor & Grade ←────  grades + findings flow back
              |
     7. Capture Findings (real-time)
              |
     8. Sprint Transition (auto-generate next plan)
              |
        🔄 NEXT SPRINT
```

**Visual requirements:**
- **Top-down flow** — not side-by-side swimlane. Orchestrator at top, gravity pulls downward.
- **Each phase** is a card/node with: number, emoji, bold name, 1-line description
- **Phase 5 (Dispatch)** branches to the right showing 3-4 agent cards with colored dots
- **Phase 6 (Monitor)** has arrows coming back from agents (grade + findings)
- **Colors:** Each phase gets its own color accent (not all purple). Use the campaigns page palette: purple, blue, green, amber, rose, cyan.
- **The Orchestrator node** at the top should be BIG — a hero element. This is the most important agent in the system.
- **Emojis** on every phase: 📖 Initialize, ❓ Ask, 📋 Plan, 📊 Update, 🚀 Dispatch, 📡 Monitor, 🔍 Findings, 🔄 Transition
- **Connecting lines** between phases — SVG or CSS borders, subtle animated pulse on the dispatch arrow
- **Make it beautiful.** This is the centerpiece of the page. Apple Design: clean, considered, delightful.

**Orchestrator Skill section:**
- The current modal is too small for the content. Replace with an **expandable dropdown section** within the page (not a modal).
- When collapsed: shows "Orchestrator Skill — 8 phases, 16 rules, 3 versions" with a chevron
- When expanded: shows the full skill content rendered as formatted HTML (not raw markdown). Bold phase names, indented rules, clean typography.
- ALSO keep a "View in Toolbox" link for the full raw view
- This should feel like reading documentation, not a code dump

## Deliverable 2: Small Polish Fixes

Look at ALL four tabs and fix:
- **Color consistency** — ensure all tabs use the same color palette from the campaigns page
- **Spacing** — generous padding, no cramped sections
- **Font consistency** — Plus Jakarta Sans headings, DM Sans body, DM Mono stats
- **Expandable sections** — smooth transitions, consistent chevron behavior
- **Learning loop animation** — make sure the loop-back arrow animates on page load
- **Stats accuracy** — update finding count to 69 (current as of this session), rules to 16, agents to 21
- **Bold-lead text** — every description starts with bold keyword

### Stage 4: 🧠 REASON
- Does the top-down flowchart clearly show "orchestrator controls everything, agents are spawned and report back"?
- Is the orchestrator the most visually prominent element on the "How We Coordinate" tab?
- Does the expandable skill section feel like documentation, not a code dump?
- Are all four tabs visually consistent?

### Stage 5: ✅ VERIFY
- Playwright screenshot of the "How We Coordinate" tab — flowchart must be visible and clear
- Playwright screenshot of the expanded orchestrator skill section
- Playwright screenshot of all 4 tabs to verify consistency
- Test expandable sections work
- Test at narrow viewport

## Constraints
- Only modify the workflow page HTML file
- Do NOT touch server.js, campaigns.json, findings.json, or any other file
- Vanilla HTML/CSS/JS only — no external libraries
- The page must still load fast
