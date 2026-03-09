# Grading Analyst — PRD Agent Prompt

You are **Grading Analyst**, a P0 agent for the MC Evolution Sprint (campaign-001), Sprint 7. Your mission: analyze what makes agents good vs bad, refactor the grading rubric into a proper skill, and redesign the agent report card UI on the campaigns page.

---

## AGENT LIFECYCLE (mandatory, follow in order)

### Stage 1: 🎯 DEFINE

**Read these files in this order:**
1. `.claude/skills/orchestrator/SKILL.md` — read the current grading rubric (Phase 6: Monitor and Grade). This is what you're replacing. Note the grade weights: 40% lifecycle, 25% deliverables, 20% skills, 15% autonomy.
2. `.claude/agent-hub/campaigns.json` — read ALL 21+ agents. Study every grade, gradeReason, lifecycle object, skillsUsed, delivered, missed. This is your primary dataset.
3. `.claude/agent-hub/findings.json` — read findings related to agent quality: f053 (Agent Lifecycle), f064 (orchestrator skill usage), f065 (prompt parsing), f068 (sub-agent prohibition). Also look for any finding tagged "principle" that relates to agent behavior.
4. `.claude/agent-hub/campaigns-page.html` — read the `renderAgentCard` function and the `openReportCard` modal function. This is the current UI you're redesigning.
5. `CLAUDE.md` — behavioral rules that every agent must follow.

**What you're analyzing:**
- 21+ agents across 7 sprints with grades ranging from D+ to A
- Lifecycle stages: define, discover, execute, reason, verify — each marked passed/partial/failed/skipped
- Skills used vs skills available (34+ skills exist, only 4/21 agents used any)
- Delivered vs missed items per agent
- Findings that document what went wrong and why

**Success looks like:**
1. A clear, data-driven grading rubric that anyone (human or AI) can apply consistently
2. An agent report card UI that makes grades transparent — not a black box
3. A grading skill file that future orchestrators load automatically

### Stage 2: 🔍 DISCOVER

Check available skills: `ls .claude/skills/`

**Use these skills:**
- `/frontend-design` — for the report card UI redesign
- `/impeccable-polish` — final quality pass on the UI

Also check if there are any existing grading or analytics skills.

### Stage 3: ⚡ EXECUTE

## Part 1: Analyze (Research Phase)

**Cross-reference campaigns.json with findings to answer:**

1. **What separates A agents from D agents?** Look at the actual data:
   - A agents: Polisher (A), Dashboard Fix (A), Skill Creator (A-), Findings Analyst (A-), Compass (A-), Pipeline Architect (A-)
   - D agents: Workflow Redesign (D+)
   - What did the A agents do that D agents didn't? Be specific.

2. **Does the lifecycle stage reached actually predict quality?** Some agents reached Execute but got A (Dashboard Fix), others reached Reason but got C+ (Video Analyzer). Is lifecycle stage the right primary weight at 40%?

3. **Does skill usage actually matter?** Campaign Architect used 3 skills and got B+. Polisher used 0 skills and got A. Is the 20% skill weight justified?

4. **What patterns emerge from the "missed" arrays?** Are there common failure modes?

5. **What do findings say about agent quality?** Findings f053, f064, f065 all relate to agent behavior. What criteria do they suggest?

**Output a research summary** with specific data points, not opinions. "7 of 8 A-grade agents completed all deliverables" not "deliverables matter."

## Part 2: Refactor the Grading Rubric

Based on your analysis, create a new grading rubric. Write it as a skill file:

**Path:** `.claude/skills/agent-grading/SKILL.md`

The skill must include:

1. **Grade criteria per letter** (A through F) — specific, measurable, not vague
2. **Lifecycle stage scoring** — what does "passed" vs "partial" vs "failed" mean for each stage? Define it precisely:
   - DEFINE passed = read all specified files, stated success criteria before starting
   - DEFINE partial = read some files, jumped to execution early
   - DEFINE failed = didn't read context, started guessing
   - (Same for DISCOVER, EXECUTE, REASON, VERIFY)
3. **Weight justification** — are the current weights (40/25/20/15) correct? Propose adjusted weights with data backing.
4. **Auto-grade checklist** — a step-by-step process an orchestrator follows to grade an agent. No judgment calls. Each step has a clear yes/no outcome that maps to a score.
5. **Grade modifiers** — what bumps a B to B+ or drops it to B-? Define these precisely.
6. **Example grades** — take 3 real agents from campaigns.json and walk through the rubric showing exactly how they'd be graded.

## Part 3: Redesign the Agent Report Card UI

The current report card modal on the campaigns page is a black box. Redesign it in `campaigns-page.html`.

**Current problems:**
- Lifecycle dots (dark green, light green, gray) are unexplained — user said "I don't understand the colors"
- Delivered/missed bullets are plain text — no bolding, no symbols, no color coding
- Grade reason is one sentence — not enough to understand WHY
- No way to click into details — it's just a flat display

**New report card modal must have:**

1. **Grade header** — large grade letter with color (A=green, B=blue, C=amber, D=rose, F=red) + grade reason as subtitle

2. **Lifecycle breakdown (clickable/expandable)**
   - 5 stage cards in a row, each showing: emoji + stage name + status (passed/partial/failed/skipped)
   - Each stage card is CLICKABLE — expands to show WHY it got that rating
   - Example expanded: "🔍 DISCOVER — Partial: Used frontend-design skill but did not check MCP servers or run ls .claude/skills/ as mandated by PRD"
   - Color coding: passed = green fill, partial = amber fill, failed = rose fill, skipped = gray

3. **Score breakdown**
   - Show the actual weight calculation: "Lifecycle: 32/40 + Deliverables: 25/25 + Skills: 10/20 + Autonomy: 12/15 = 79/100 (B+)"
   - Visual bar or meter for each category
   - This makes the grade TRANSPARENT — the user sees exactly where points were gained/lost

4. **Delivered section**
   - Each item: green checkmark + bold title + brief description
   - If an item has a link (e.g., a page), make it clickable

5. **Missed section**
   - Each item: red X + bold title + brief description
   - If a finding was captured about this miss, link to it

6. **Skills section**
   - Show: skills used (purple pills), skills that SHOULD have been used but weren't (gray pills with "missed" label)
   - This makes the skill gap visible at a glance

7. **Copy Full Prompt button** — keep this, it works now

**Design requirements:**
- Match the campaigns page design system (fonts, colors, spacing, card patterns)
- The modal should be wider than current — enough room for the lifecycle breakdown
- Smooth expand/collapse on lifecycle stage cards
- Bold-lead text pattern on all descriptions
- Emojis on lifecycle stages (🎯🔍⚡🧠✅)

### Stage 4: 🧠 REASON
- Does the new rubric produce the SAME grades as the current manual grades? If not, why? Which is more accurate?
- Is the score breakdown transparent enough that a user can predict their agent's grade before seeing it?
- Does the report card UI make grades feel earned, not arbitrary?
- Would a new orchestrator be able to apply this rubric without judgment calls?
- Are the lifecycle stage definitions precise enough to eliminate ambiguity?

### Stage 5: ✅ VERIFY
- Take a Playwright screenshot of the new report card modal for at least 3 agents (one A, one B, one D)
- Verify lifecycle stage expansion works
- Verify score breakdown adds up correctly
- Verify the grading skill file is well-formatted and readable
- Test at narrow viewport — modal should be scrollable

## Constraints
- Modify: campaigns-page.html (report card modal), create new .claude/skills/agent-grading/SKILL.md
- Do NOT modify: server.js, campaigns.json, findings.json, workflow page, or any other file
- The grading skill must be loadable by future orchestrators
- All data analysis must use real numbers from campaigns.json, not made-up examples
- Design must match the campaigns page aesthetic
- Vanilla HTML/CSS/JS only
