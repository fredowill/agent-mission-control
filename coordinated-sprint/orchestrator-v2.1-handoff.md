# Orchestrator v2.1 Handoff

**Date:** 2026-03-09 | **Campaign:** campaign-002 (MC Maturity Sprint) + campaign-003 (CARES Sprint) | **Machine:** Work laptop (DESKTOP-456PJPP)

---

## What v2.1 Did

The most productive orchestrator session in MC history. Built the dispatch pipeline architecture, standardized orchestrator grading, and fixed 8+ systemic issues.

| Component | What It Does |
|-----------|-------------|
| **`creating-agents` skill** | Parent dispatch pipeline — chains skill-mandate → create-agent-prompt. Replaces calling create-agent-prompt directly. (f102) |
| **`skill-mandate` skill** | Auto-discovers mandated skills by task type + scope. Eliminates hardcoded skill suggestions. |
| **`orchestrator-handoff` skill** | 9 quality-gated handoff with push confirmation (PM021 fix). First use is THIS handoff. |
| **`auto-grade-orchestrator.js`** | Orchestrator-specific grading: 4 factors (Coordination 35%, Planning 25%, Lifecycle 20%, Continuity 20%). Separate from sub-agent grader. |
| **Orchestrator lifecycle** | 6 stages: Orient → Plan → Dispatch → Monitor → Synthesize → Handoff. Research-backed (9 sources). |
| **Live orchestrator card** | Lifecycle bar, dispatched agents with status, stats row, previous orchestrators as mini-cards. |
| **Live agent modal** | Lifecycle-stage inference replacing tool-level activity. Mission status sentences. (v1 delivered, v2 in progress) |
| **Skills sanitization** | auto-grade.js strips shell output (`2>`, `**`, `| grep`) and validates against known skills directory. |
| **mandatedSkills system** | Agents now have `mandatedSkills` parsed from prompt files. Only mandated skills show as "missed" — no more irrelevant suggestions. |
| **Orchestrator filter fix** | `slot.startsWith('orchestrator-v')` instead of name-based band-aid. |
| **Dropdown persistence** | Broadened to cover infra groups, modals, debrief sections, "Show more" orchestrators. localStorage-based. |
| **Liveness fix** | Campaign status overrides PID liveness — completed agents stop blinking immediately. |
| **GPA scale fix** | A+ capped at 4.0 (was 4.3). |
| **v2.0 graded** | B — 10 delivered, 4 missed (Agent tool regression, manual dispatch, forgot git commit, hasty CLAUDE.md rules). |
| **Findings f101-f103** | Prompt quality vs agent quality, auto-mandate in dispatch pipeline, dependency assessment on design changes. |
| **PM006 closed** | Toolbox sync symptom resolved. Mode auto-detection deferred to cross-device handoff skill. |

### Sprint 1 Agents (6 dispatched, all completed)

| Agent | Grade | Key Output |
|-------|-------|------------|
| Lifecycle Research | A+ | 6-stage orchestrator lifecycle + grading weights + 9 sources |
| Handoff Skill Builder | A+ | `/orchestrator-handoff` with 9 quality gates |
| Grading Script Builder | B | `auto-grade-orchestrator.js` — historical calibration too harsh for pre-v1.6 |
| Live Card Designer | A+ | Orchestrator tab with lifecycle bar, dispatched agents, stats |
| Orchestrator Card Polish | A+ | Lightning emoji, mini-cards, alignment fixes |
| Orchestrator Card Polish v2 | A+ | Full-width lifecycle bar, styled mission text, tight spacing |

### Sprint 2 Agents (5 dispatched, 3 completed, 1 running, 1 queued)

| Agent | Grade | Key Output |
|-------|-------|------------|
| Live Agent Modal | A+ | Lifecycle inference, mission status (prompt was wrong — see f101) |
| Orch Card Polish v2 | A+ | Spacing, mission text styling |
| UI/UX Skill Research | C | Evaluation of ui-ux-pro-max-skill |
| Live Modal Overhaul | A- | Lifecycle-aware modal (replaced tool counts) |
| Lifecycle Self-Reporting Research | A- (90) | Recommends Option C (hybrid): enhanced heuristic + explicit self-report. 3 new state file fields. Modal auto-refresh via selective DOM update. 5-hour effort estimate. Output at `coordinated-sprint/lifecycle-self-reporting-research.md`. |
| Live Modal Overhaul v2 | 📝 Queued | Prompt ready at `coordinated-sprint/live-modal-overhaul-v2-prompt.md`. Dispatch ASAP — the research it depends on is complete. |

---

## Critical Tasks for v2.2

### P0: Dispatch Live Modal Overhaul v2
- Prompt is written at `coordinated-sprint/live-modal-overhaul-v2-prompt.md`
- Depends on Lifecycle Self-Reporting Research completing (agent `325a2177` may still be running)
- Check its output at `coordinated-sprint/lifecycle-self-reporting-research.md`
- Dispatch via `/api/launch` with slot `live-modal-overhaul-v2`, campaign-002, Sprint 2

### P0: Install ui-ux-pro-max-skill
- Research agent evaluated it (C grade, but the skill itself may be good)
- Read `coordinated-sprint/ui-ux-skill-evaluation.md` for the recommendation
- User explicitly said "I want this" — investigate and install

### P0: Test the `creating-agents` pipeline end-to-end
- Built this session but only test-drove it once (lifecycle research agent)
- The next orchestrator should use it for EVERY dispatch to validate the flow

### P1: Remaining systemic issues
| # | Issue | Status |
|---|-------|--------|
| 1 | Modal auto-refresh | In progress (v2 agent) |
| 2 | Lifecycle accuracy (70%→95%) | Research agent running |
| 3 | Lifecycle dots only go forward | Bundle with modal v2 |
| 4 | Orchestrator grade vs auto-grade gap | Need auto-review pipeline |
| 5 | Agent cards don't auto-appear | FIXED this session |
| 6 | Dropdown auto-close | Improved (6 selectors), not eliminated |
| 7 | Auto-review on agent completion | Not started |
| 8 | Execute always shows "partial" | Not started |
| 9 | Findings tab outdated (67/96) | Not started |
| 10 | Dashboard states don't match lifecycle | Not started |

### P1: CARES Sprint readiness
- Campaign-003 is active but no CARES agents dispatched yet
- User wants orchestrator standardization complete first
- FHL hooks demo deferred to Monday
- Demo preparation campaign is later this week

### P1: File structure cleanup
- The project has no folder organization — files everywhere in the root
- Needs a proper directory structure (e.g., `hooks/`, `scripts/`, `pages/`, `data/`, `config/`)
- This is a refactoring task, not urgent but quality-of-life

### P1: Add "skills synced to toolbox" gate to orchestrator-handoff
- Current handoff gates don't check if new skills in `~/.claude/skills/` were copied to `toolbox/skills/`
- v2.1 created 3 skills (creating-agents, skill-mandate, orchestrator-handoff) that almost didn't get pushed
- Gate should: diff `~/.claude/skills/` against `toolbox/skills/`, warn if new skills exist locally but not in toolbox

### P2: Backlog items
- Agent card emojis + color overhaul (cards look boring)
- Post-mortem skill
- Default campaign selector to most recent active
- /cost investigation
- Smarter skill activation hook (context-aware)
- Sound config cross-device sync
- Session compaction for init
- Demo page soundboard
- Auto-pipeline for CARES (configurator designs the workflow)

---

## Open Post-Mortems

| PM | Title | Status | Priority |
|----|-------|--------|----------|
| PM008 | Subagent flight search exposed 3 gaps | open | P1 |
| PM021 | v1.9 pushed without consent | open | P1 — closes when handoff skill is used (THIS handoff) |

---

## Gaps Left

1. **Lifecycle Self-Reporting Research COMPLETED (A-)** — recommends Option C hybrid approach. v2.2 should review output then dispatch modal v2 immediately.
2. **MISSED section display bug** — when an agent debrief says "No items missed" as text in the missed array, the card shows it as a red X missed item. Fix: hide MISSED section when array only contains "no items" text, or teach agents to send empty array.
2. **`creating-agents` pipeline only tested once** — needs more validation
3. **No auto-review on agent completion** — orchestrator still manually checks each agent
4. **Research skill not fully installed** — started installing Weizhena Deep Research skill but didn't complete
5. **MEMORY.md not updated with all new skills** — creating-agents, skill-mandate, orchestrator-handoff should be documented

---

## User Preferences Reinforced This Session

1. **Emoji-coded everything** — semantic emojis, not just color dots. Mix contextual (🔬🛠️📋) with status (🔴🟢). Never use 🅰️🅱️🅲️ (render colorless in CLI).
2. **Three-column parse tables** — emoji | type label | content. Standardize by type (✅ approval, 🎯 decision, 💡 idea, 😤 frustration, 📝 note).
3. **Ask before dispatching** — always confirm with user before /api/launch.
4. **Use the new pipeline** — `creating-agents` → `skill-mandate` → `create-agent-prompt`. Never call create-agent-prompt directly.
5. **Capture big findings, not small fixes** — orchestrator record should note architectural changes, not GPA scale fixes.
6. **Research online using the methodology** — Deep Research 3-phase pattern. Never raw WebSearch.
7. **Delegate research to agents** — don't investigate yourself when you can dispatch.
8. **Fix systemic issues, not band-aids** — replace the root cause, not the symptom.

---

## Communication Style Guide for v2.2

### Voice Prompt Parsing (CRITICAL)
Every user message gets a 3-column parse table FIRST, before any response:

```
## 📋 Parse

| | Type | Item |
|---|------|------|
| ✅ | **Approval** | User approved the plan |
| 🎯 | **Decision** | User chose option B |
| 💡 | **Idea** | User suggested a new feature |
| 😤 | **Frustration** | User is upset about X |
| 🐛 | **Bug** | User found a visual issue |
| 📝 | **Note** | Side comment, not urgent |
| 🌩️ | **Excitement** | User praised something |
| ❓ | **Question** | User asked something |
| 🔴 | **P0** | User flagged as critical |
```

Type emojis are FIXED — always use these. Content emojis are contextual.

### Status Updates
Use tables with pertinent emojis, not walls of text:
```
| Agent | Grade | Key Output |
|-------|-------|------------|
| 🔬 Lifecycle Research | A+ | 6-stage lifecycle + 9 sources |
| 🛠️ Handoff Skill Builder | A+ | 9 quality gates |
```

### When Presenting Options
Use numbered rows with descriptive emojis. NEVER use 🅰️🅱️🅲️ (render colorless):
```
| | Option | Tradeoff |
|---|--------|----------|
| 1️⃣ | Do X | Fast but incomplete |
| 2️⃣ | Do Y | Thorough but slow |
```

### Tone
- **Be honest about mistakes** — "You're right and I apologize" not defensive
- **Short sentences** — lead with the answer, not the reasoning
- **Bold leads** — every table row, every section header
- **No text walls** — if it's more than 3 sentences, make it a table

### What NOT to Do
- Don't dump raw tool output — summarize it
- Don't say "let me check" then show 50 lines of grep — show the conclusion
- Don't repeat what the user said back to them verbatim — parse it into structured decisions
- Don't bring up CARES readiness unprompted — the user will say when they're ready

---

## v2.0 Items Still Not Done

| Item | Priority | Notes |
|------|----------|-------|
| Cross-device handoff skill | P1 | Not started — wait until CARES requires cross-device |
| Cerebras to hooks migration | P0 carry | Not started — campaign-002 carry item |
| Sound Design System | P1 carry | Stopgap chime exists. Sound design agent should run on home machine (LoL sounds). |
| Viewable Skill Content on Cards | P1 carry | Click skill pills to view SKILL.md |
| Lifecycle enforcement hook | P1 carry | PreToolUse hook, never started |
| Research: Workflow Best Practices | P1 carry | No formal research dispatched |
| Update Close-Out tab retrospective | P1 | Stale, 5-6 orchestrators old |
| phredomade.com style analysis | P3 | One-shot prompting aesthetic for future projects |

---

## How to Resume

1. Open a new Claude Code terminal
2. Start with: "You are Orchestrator v2.2. Read `projects/agent-mission-control/coordinated-sprint/orchestrator-v2.1-handoff.md` then run /orchestrator-init"
3. **MANDATORY:** Load /orchestrator-rules FIRST.
4. **MANDATORY:** Read v2.1's session prompts (PM020 fix). Session ID for this conversation: check the most recent large .jsonl file in `~/.claude/projects/C--Users-emeskel-Claude/`.
5. **First tasks (in order):**
   - Check if Lifecycle Self-Reporting Research agent completed → review output
   - Dispatch Live Modal Overhaul v2 (prompt is ready)
   - Review and install ui-ux-pro-max-skill
   - Test `creating-agents` pipeline on next dispatch
   - Assess CARES readiness
6. **Context:** Work laptop. MC server at localhost:3033. Campaign-002 active (Sprint 2). Campaign-003 active (no agents yet). 2 open PMs (PM008, PM021). Lifecycle research agent may still be running.
