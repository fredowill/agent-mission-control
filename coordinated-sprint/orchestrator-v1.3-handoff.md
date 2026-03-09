# Orchestrator v1.3 Handoff

**Date:** March 8-9, 2026 | **Campaign:** MC Evolution Sprint (campaign-001)

---

## 🎯 Pick Up Where You Left Off

v1.3 ran Sprint 7 of campaign-001. Heavy session — lots of mistakes, lots of learning, lots of infrastructure built. The orchestrator skill was significantly upgraded but the workflow is still too manual. The #1 priority for v1.4 is **automating the dispatch workflow** so the user doesn't have to copy-paste prompts between terminals.

## What v1.3 Did

### Agents Dispatched (Sprint 7)
- **Workflow Builder (B)** — 4-tab workflow page with lifecycle, orchestrator, campaigns, learning sections
- **Workflow Polisher (C+)** — orchestrator flowchart (great), campaign flow cards (great), but SVG emoji failure (3 rounds), loop-back arc never resolved (5 attempts), 8 course-corrections
- **Grading Analyst (B)** — data-driven grading skill, report card UI with score bars and GSAP animations, but 6 course-corrections, JS syntax error shipped
- **Memory Cleanup + Lifecycle Enforcer** — cards created, prompts written, NOT dispatched yet

### Infrastructure Built
- `/api/brief/` endpoint — serves prompt files as plain text for Copy Prompt buttons
- **Collapsible sprints** on campaigns page — click header to expand/collapse
- **Follow-up prompt system** — `followUpBrief` field on agent cards, "Copy Follow-up" button on modal
- **Sprint 7 phase** added to campaigns page with CSS gradient
- **5-step dispatch checklist** added to orchestrator skill (f070)
- **Orchestrator skill v2** — 8 phases, 16+ rules, mandatory skill checklist, voice prompt parsing, file-based PRDs, follow-up convention, Agent tool prohibition

### Findings (13 total: f064-f076)
| ID | Title | Impact |
|----|-------|--------|
| f064 | Orchestrator must use skills on init | Skill checklist added to Phase 1 |
| f065 | Parse every voice prompt into structured decisions | P0, added to Phase 2 |
| f066 | PM007 notification raised 5+ times — auto-escalate | PM007 upgraded to must-close |
| f067 | PRDs go in files, never inline (3rd time!) | File delivery mandated in Phase 5 |
| f068 | Orchestrator must NEVER use Agent tool | Explicit prohibition in rules |
| f069 | Orchestrator PMs must feed back into skill | Phase 1 reads open PMs |
| f070 | 5-step dispatch checklist works | Codified in Phase 5, needs standalone skill |
| f071 | Memory must contain only stable patterns | No volatile data in MEMORY.md |
| f072 | Follow-up prompts go to same agent | followUpBrief field + convention |
| f073 | Reusable agent templates (video, findings) | Concept for /prompts |
| f074 | Agents must validate JS syntax before finishing HTML | PM012 prevention |
| f075 | Toolbox agents built for phredomade, not MC — root cause of skill gap | P0 for campaign-002 |
| f076 | Count user course-corrections as primary quality signal | In grading skill |

### Post-Mortems (3: PM010-012)
- **PM010** — Orchestrator v1.3 repeated 3 known anti-patterns on first deliverable
- **PM011** — Orchestrator ran sub-agent despite f058 prohibition
- **PM012** — JS syntax error broke campaigns page (shared file editing)
- **PM013** — Agent wasted 3 iterations on SVG emoji rendering (filed by Workflow Polisher)

## What's Next — Priority Order

### P0: Fix the Workflow (BEFORE ANYTHING ELSE — f077)

**DO NOT DISPATCH FEATURE AGENTS UNTIL THIS IS DONE.**

v1.4 has exactly FOUR jobs. Nothing else matters.

**CRITICAL: Do Job 1 FIRST.** Once auto-dispatch works, the orchestrator can dispatch agents for Jobs 2-4 without the user having to manually copy-paste prompts. Job 1 unblocks everything — it's the infrastructure that makes the rest possible without user overhead.

### Job 1: Auto-Dispatch (open new terminal + inject prompt) — DO THIS FIRST
- Research `claude -p "prompt"` and `--append-system-prompt` for non-interactive agent launch
- Build a flow where the orchestrator writes the prompt file AND launches the agent in a visible new terminal
- The user should never copy-paste a prompt again. The orchestrator does it.
- Investigate: can you open a new Windows Terminal tab/pane programmatically? `wt -w 0 new-tab cmd /c claude -p "..."` may work.

### Job 2: Break Orchestrator Skill into Phase-Specific Skills
- The current monolithic SKILL.md has 8 phases in one file
- Each phase should become its own loadable skill: `orchestrator-init`, `orchestrator-dispatch`, `orchestrator-grade`, `orchestrator-transition`, etc.
- The main orchestrator skill becomes a loader that references the phase skills
- This lets each phase be improved independently and loaded on demand

### Job 3: Agent Auto-Linking
- When an agent launches, auto-map its session ID to the campaign card
- The prompt-hook.js already has some linking logic — extend it to match by agent name/slot
- The user should never have to manually tell the orchestrator a session ID

### Job 4: Notification Sound (PM007)
- When an agent finishes or needs user input, play an audio notification
- Raised 5+ times across sessions. The user's #1 productivity blocker.
- The user dispatches agents, switches context, and has no way to know when to come back.

**Everything else goes to v1.5.** Toolbox refactor, findings cleanup, regrade, auto-linking, GSAP, card compactness, split server.js, skill metrics — all deferred. v1.4 is infrastructure only.

### Deferred to v1.5+

| Task | Status |
|------|--------|
| Toolbox Refactor (f075) | Ready — P0 for skill adoption |
| Memory Cleanup | Prompt written, card in campaigns.json |
| Lifecycle Enforcer | Prompt written, card in campaigns.json |
| Findings Cleanup | Ready |
| Dashboard: Show Real Prompt | Ready |
| Regrade All Agents | Ready (grading skill exists) |
| Dispatch-Agent Standalone Skill (f070) | Ready |
| Agent Auto-Linking | Ready |
| GSAP MCP Server | Later |
| Campaign Card Compactness | Later |
| Split server.js | Later |
| Skill Metrics | Later |

### Known Broken Things
- **Loop-back arc on learning loop** — Workflow Polisher tried 5 times, never resolved. Needs fresh agent with SVG/CSS animation expertise or different visual approach entirely.
- **Score breakdown formula doesn't match self-grades** — report card showed 91 for a C+ agent. Formula and assessment disconnected.
- **Campaign cards too verbose** — delivered/missed text isn't compact enough, needs bold taglines.
- **GSAP CDN loaded** on campaigns-page.html and workflow-page.html — animations work but are a new dependency to be aware of.

## Key User Preferences (reinforced this session)

1. **Parse every voice prompt** (f065) — user dictates stream-of-consciousness. YOUR JOB: parse into structured list, confirm, then act. The user called this "P0-level" and "so helpful."
2. **Follow-ups go to same agent** (f072) — don't create new agents for polish iterations.
3. **5-step dispatch checklist** (f070) — file + campaigns.json + /prompts + verify + tell user. Never skip.
4. **NEVER dump prompts inline** (f067) — 3 failures on this. Write to file, user copies from UI.
5. **NEVER use Agent tool** (f068) — sub-agents are invisible. Every task gets a card.
6. **Bold-lead text, emojis, color** — the user loves scannable, visual output. CLI color helps.
7. **Memory = stable patterns only** (f071) — no volatile data, no counts that change.
8. **Course-corrections = quality signal** (f076) — 0-1 = A, 6+ = B at best.
9. **The user is burnt out on manual workflow** — the #1 thing v1.4 can do is AUTOMATE the dispatch. `claude -p` exists. Use it.

## Data File State

- `campaigns.json` — 1 campaign, 25+ agents (Sprint 7 has 7 agents including 2 ready)
- `findings.json` — 76 findings (f001-f076)
- `dispatch.json` — 13 post-mortems (PM001-PM013)
- `MEMORY.md` — cleaned up this session, ~95 lines, stable patterns only
- Orchestrator skill — `.claude/skills/orchestrator/SKILL.md` (v2, heavily updated)
- Grading skill — `.claude/skills/agent-grading/SKILL.md` (new, created this session)
- Design docs — `docs/plans/2026-03-08-workflow-page-redesign-design.md`

## How to Resume

1. Open a new Claude Code terminal
2. Start with: "You are Orchestrator v1.4. Read `.claude/agent-hub/coordinated-sprint/orchestrator-v1.3-handoff.md` and the orchestrator skill at `.claude/skills/orchestrator/SKILL.md`. Then check campaigns at http://localhost:3033/campaigns."
3. **First priority: investigate `claude -p` for auto-dispatch.** The user wants the orchestrator to launch agents itself, not write prompts for manual copy-paste.
4. **Second priority: notification sound (PM007).** Five sessions asking for this.
5. **Third priority: toolbox refactor (f075).** Root cause of skill adoption gap.
