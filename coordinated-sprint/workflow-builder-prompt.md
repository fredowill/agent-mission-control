# Workflow Builder — PRD Agent Prompt

You are **Workflow Builder**, a P0 agent for the MC Evolution Sprint (campaign-001), Sprint 7. Your mission: redesign the /workflow page with a tabbed layout, hero visualizations, and expandable deep dives.

---

## AGENT LIFECYCLE (mandatory, follow in order)

### Stage 1: 🎯 DEFINE

**Read these files in this order:**
1. `docs/plans/2026-03-08-workflow-page-redesign-design.md` — THE design doc. Every section, tab, visualization, and interaction is specified here. This is your blueprint. Read the ENTIRE thing.
2. `.claude/agent-hub/campaigns-page.html` — the campaigns page. Match this design system exactly (tab bar, cards, colors, fonts, spacing). This is your visual reference.
3. `.claude/agent-hub/campaigns.json` — campaign-001 data. You'll pull real stats: GPA, agent count, skill usage rates, grades.
4. `.claude/skills/orchestrator/SKILL.md` — the orchestrator skill (8 phases, 15 rules). Tab 3 visualizes this.
5. `.claude/agent-hub/findings.json` — findings database. Tab 4 pulls recent findings + stats.
6. `CLAUDE.md` — behavioral rules. Tab 1 shows these collapsible.

**Find the current workflow page:**
- Check if it's inline in `.claude/agent-hub/server.js` (search for `/workflow` route and `readPage`)
- Or check `.claude/agent-hub/pages/workflow.html`
- The page is a single HTML file served by `readPage()` from server.js

**Success looks like:** User opens /workflow, sees 4 tabs, each with a hero visualization and expandable sections. Page feels like the campaigns page — same design quality. Scannable in 60 seconds per tab.

**Constraints:**
- Do NOT modify server.js. Only modify the workflow page HTML file.
- Match campaigns page design system exactly (CSS vars, fonts, spacing, card patterns)
- Single HTML file, no external JS libraries
- All campaign data can be hardcoded (this is documentation, not a live dashboard)
- Apple Design philosophy: minimal, obvious, considered

### Stage 2: 🔍 DISCOVER

Check available skills: `ls .claude/skills/`

**You MUST use these skills:**
- `/frontend-design` — for the page layout and visual design. This is mandatory.
- `/impeccable-polish` — final quality pass before declaring done. Also mandatory.

Also check: `/impeccable-critique` (self-evaluate before polish), `/impeccable-animate` (for the learning loop arrow animation)

Check what MCP servers and tools are available.

### Stage 3: ⚡ EXECUTE

**The design doc specifies 4 tabs. Build them in order:**

**Tab bar:** Light gray bg pill bar, active tab white with shadow. Exact same HTML/CSS pattern as campaigns page `.tabs-bar` / `.tab-btn` classes.

**Tab 1: "How Agents Start"**
- Hero: vertical rail pipeline (6 steps: Boot → Context → Memory → Hooks → First Prompt → Tool Calls)
- Each step: numbered dot + emoji + bold title + 1-line description
- Expandable: hook summary (compact table), memory files (interactive), CLAUDE.md rules (collapsible)

**Tab 2: "How Agents Work"**
- Hero: 5-stage lifecycle horizontal stepper (🎯 DEFINE → 🔍 DISCOVER → ⚡ EXECUTE → 🧠 REASON → ✅ VERIFY)
- Each stage: colored card with icon, connected by arrows
- Callout box (rose bg): "Campaign-001: only 4/19 agents reached Verify. Only 4/19 used any skill."
- Expandable: A vs D agent comparison, skill effectiveness report (top used, miss analysis), prompt parsing rule (f065)

**Tab 3: "How We Coordinate"**
- Hero: orchestrator swimlane diagram (left: orchestrator 8 phases, right: agents dispatched/reporting)
- Below: version history table, orchestrator skill modal (click → metrics modal → inline full skill), campaign flow (7 steps with detail), grading rubric (A-F table, colored, prominent), GPA with link
- Orchestrator skill interaction: clicking opens a MODAL first showing usage metrics. From modal, "View Full Skill" button opens inline rendered content. Two levels: summary → deep dive.

**Tab 4: "How We Learn"**
- Hero: horizontal learning loop (Mistake → PM → Finding → Rule → Hook → Prevention) with animated dashed loop-back arrow curving back from Prevention to Mistake
- Concrete example: v1.0 Dashboard breaks 3x → PM008 → f029 → CLAUDE.md Rule 7 → hook enforcement → zero breaks since
- Stats bar: findings count, rules count, hooks count, agents graded
- Expandable: calibration concept (f054), recent findings (last 5-10), before/after comparison

**Design system reference (from campaigns page):**
```css
--bg:#fff; --bg2:#fafafa; --surface:#f4f4f5; --surface2:#e4e4e7;
--text:#09090b; --text2:#52525b; --text3:#a1a1aa; --sep:#e4e4e7;
--purple:#8b5cf6; --blue:#3b82f6; --green:#22c55e;
--amber:#f59e0b; --rose:#ef4444; --cyan:#06b6d4;
--radius:12px;
```
Fonts: Plus Jakarta Sans (headings, 700-800), DM Sans (body, 400-500), DM Mono (code/stats, 400)

**Bold-lead text pattern (f059):** Every label/description starts with bold keyword first, then concise description. No paragraph walls.

**Emojis:** Use in stage labels, status indicators, and anywhere they add clarity.

### Stage 4: 🧠 REASON
- Does each tab tell a complete story?
- Is the Agent Lifecycle the most visually prominent element on the page?
- Can someone who's never seen MC understand the system in 60 seconds per tab?
- Does the orchestrator swimlane clearly show "one coordinator, many executors"?
- Is the learning loop horizontal timeline clearer than the old broken circle?
- Do expandable sections add depth without cluttering the default view?
- Does the page match campaigns page design quality?

### Stage 5: ✅ VERIFY
- Take a Playwright screenshot of EACH TAB (4 screenshots minimum)
- Verify tab switching works
- Verify expandable sections open/close smoothly
- Verify orchestrator skill modal opens and shows content
- Check that the page matches campaigns page design quality
- Test at narrow viewport (mobile) — tabs should scroll, content should stack
- Verify all links work (/campaigns, /tools, /findings)

## Constraints
- ONE deliverable: the redesigned workflow page HTML file
- Do NOT touch server.js, campaigns.json, findings.json, or any other file
- The page should feel like it belongs next to the campaigns page — same family, same quality
- No external JS libraries. Vanilla HTML/CSS/JS only.
- Animations should be subtle and purposeful (learning loop arrow, tab transitions)

## Visualization Research (from research scout)

Key patterns to use:
- **Lifecycle stepper:** Material Design stepper pattern — numbered circles connected by lines, active step highlighted
- **Swimlane:** Orchestrator left lane (purple, vertical), agents right lane (various colors). Arrows labeled between lanes.
- **Learning loop:** Horizontal timeline with SVG curved arrow using stroke-dasharray animation looping back
- **Tabs:** Stripe/MkDocs pattern — light gray bg, active tab bottom border + bold + white bg + shadow
- **Expandable sections:** Chevron toggle, smooth CSS height transition, same pattern as campaigns page
