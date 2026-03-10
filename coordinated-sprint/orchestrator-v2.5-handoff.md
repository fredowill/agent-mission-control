# Orchestrator v2.5 Handoff

**Date:** 2026-03-10 | **Campaign:** campaign-002 (MC Maturity Sprint) | **Machine:** Home PC (ephra)

---

## What v2.5 Did

First orchestrator to use deep research at init (Rule 23). Most infrastructure-focused session in campaign-002 history. Zero UI agents dispatched -- all systems work.

| Component | What It Does |
|-----------|-------------|
| **Triple-layer hardstop system** | StatusLine monitors context %, prompt-hook injects warnings at 60/75/85%, PreCompact creates emergency handoff. 23/23 tests. Live in settings.json. |
| **Handoff auto-skeleton** | At L2 (75%), prompt-hook auto-generates a pre-filled handoff doc with real campaign data. Reduces handoff context cost ~60%. (f108) |
| **Interactive dispatch system** | AUQ MCP server for agent-asks-user. /api/launch mode field. Checkpoint counter hook. Stop gate. Built by dispatched agent (A+). |
| **3 deep research sessions** | Hard stops (11 tools), interactive agents (5 mechanisms), ecosystem scan (parry, Dippy, claude-code-tools). |
| **Rules 23-25** | Deep research at init (23), creating-agents pipeline mandatory (24), stop and investigate failures (25). |
| **Handoff gates 9 to 13** | Gate 1 renamed Git Committed. Gate 12: hardstop state check. Gate 13: toolbox install audit. Gate 7: auto-skeleton integration. |
| **.claude/rules/ directory** | 7 thematic rule files. CLAUDE.md is now a lean index table (15 lines vs 56). |
| **Security tools** | Lasso claude-hooks (prompt injection defender, PostToolUse). Dippy (AST bash command approval, PreToolUse). Both wired + tested. |
| **dispatch.sh self-buffer** | Copies to temp on startup. Prevents bash race condition when agents edit dispatch.sh mid-flight. |
| **PM audit** | Closed 5 PMs (PM007-009, PM011, PM026). 3 remain open (PM008-dispatch, PM012, PM013). |
| **Nav responsive fix** | Toggle labels hide at narrow widths. Nav links shrink. No more overlap. |

---

## Critical Tasks for v2.6

### P0: Auto-sync hook for toolbox
When a tool/skill/agent is installed (Write/Edit to `.claude/skills/`, `.claude/agents/`, `.claude/tools/`), a PostToolUse hook should auto-mirror to `toolbox/`. This makes Gates 10/13 pure verification instead of detection. User said: "We have to have a standardized way of when tools come in -- make it a hook and then execute a sync." Design as PostToolUse hook on Write/Edit with path matching. Must be <50ms (just a file copy).

### P0: MC page refactoring
The Workflow page, Toolbox page, and Orchestrator tab are all stale relative to what v2.5 built. The Workflow page doesn't know about the hardstop system, checkpoint hooks, Lasso, Dippy, or the new rules directory. This is the highest priority because the pages are how the user sees the system -- if the pages don't reflect reality, the user loses trust.

### P1: Sound design system
Different chimes for different events. Carried since v2.2. Default chime works but the user approved this as a next item. Low effort, high delight.

### P1: aichat-search Rust binary
Session full-text search needs cargo (Rust) which isn't installed on Windows. Either install Rust or find pre-built Windows binary. The Python aichat CLI is installed and indexes 479 sessions but crashes on display (Windows path issue).

### P1: Wire session search into MC Dashboard
Once aichat-search works, expose it via an MC API endpoint so the Dashboard/Dispatch page can search full session content, not just captured prompts.

### P1: CLAUDE.md review skill
Carried since v2.3. Never started.

### P2: Why3 page soul iteration
User deprioritized -- no demo timeline. Deep research from v2.4 (Evil Martians, Cursor, Sentry patterns) is available.

---

## Open Post-Mortems

| PM | Title | Status | Priority |
|----|-------|--------|----------|
| PM008 (dispatch) | Subagent flight search exposed 3 gaps | open | p1 |
| PM012 (dispatch-home) | Morning Brief written as markdown -- user can't find | open | p0 |
| PM013 (dispatch-home) | Campaign debrief losses column crushed | open | p1 |

---

## Gaps Left

1. **MC pages stale** -- Workflow, Toolbox, Orchestrator tab don't reflect hardstop system, new hooks, new rules directory
2. **aichat-search** -- needs Rust binary for full-text search. Python CLI crashes on Windows.
3. **Sound design** -- only default chime. No differentiation between events.
4. **Lasso/Dippy not in toolbox** -- installed locally but not synced for cross-machine

---

## User Preferences Reinforced This Session

1. **Deep research makes us smarter** -- "This is the first time I've actually gotten you to do it and it seems like we're actually becoming smarter." Now Rule 23.
2. **PRD text is aspirational, hooks are enforceable** -- "Checkpoints in PRDs absolutely do nothing." Design enforcement as hooks, not instructions.
3. **Creating-agents pipeline is mandatory** -- "Last time I let this regression slip, the Orchestrator would just skip through everything." Now Rule 24.
4. **Stop and investigate failures** -- "Why didn't you investigate it? Why did you move so fast?" Band-aiding auto-grade failure instead of investigating the bash race condition. Now Rule 25.
5. **Don't be afraid to restart the server** -- Rule 6 says "don't restart unnecessarily" not "never restart." CSS fixes in server.js require restarts.
6. **Always integrate fully** -- "When we install new things, it's important to always integrate and fully allow everything to be picked up by the dependencies that are tracking our tools."
7. **1M context window is worth it** -- 36% used after massive session. Premium pricing ($10/$37.50 past 200K) but quality stays high. Opus 4.6 scores 76% on 1M needle retrieval.

---

## v2.4 Items Still Not Done

| Item | Priority | v2.5 Status |
|------|----------|-------------|
| Why3 soul iteration | P0->P1 | Deprioritized by user (no demo pressure) |
| Orchestrator hard stops | P0 | DONE -- triple-layer system live |
| Interactive agents architecture | P0 | DONE -- AUQ + hooks, agent A+ |
| Demo sprint preparation | P1 | Not started |
| Handoff gate updates | P1 | DONE -- 9 to 13 gates |
| .claude/rules/ directory | P1 | DONE -- 7 files |
| CLAUDE.md review skill | P1 | NOT STARTED |
| Sound Design System | P1 | NOT STARTED |
| Close-out tab update | P1 | DROPPED -- user doesn't know what it is |

---

## Key Research from This Session

### Community Orchestration Tools (11 analyzed)
- **Continuous-Claude-v3**: YAML ledgers, dirty flag thresholds, daemon memory extraction. Best context management.
- **ClaudeFast ContextRecoveryHook**: StatusLine dual triggers (token + percentage), 3-file backup architecture.
- **Zeroshot**: SQLite ledger, model ceilings, blind validation.
- **Agent Teams (official)**: Plan approval, TeammateIdle hook, shared task list.
- Most tools (vibe-kanban, Conductor, Superset, Maestro, Automaker) focus on isolation, not context management.

### Ecosystem Scan
- **Lasso claude-hooks**: 50+ injection patterns. Installed.
- **Dippy**: AST bash parsing, 34 CLI handlers. Installed.
- **claude-code-tools (aichat)**: Session search via Tantivy. Partially installed (needs Rust).
- **awesome-claude-code**: 270+ plugins, 739 skills exist in the ecosystem.

### Context Window Research
- 1M context: Opus 4.6 scores 76% on 8-needle MRCR at 1M. Premium pricing past 200K (2x input).
- 36% of 1M = 360K tokens used (more than a full 200K session) but quality is better due to Opus architecture.

---

## How to Resume

1. Open a new Claude Code terminal
2. Start with: "You are Orchestrator v2.6. Read `.claude/agent-hub/coordinated-sprint/orchestrator-v2.5-handoff.md` then run /orchestrator-init"
3. **MANDATORY:** Load /orchestrator-rules FIRST (now 25 rules).
4. **MANDATORY:** Load /deep-research and research the primary P0 before questions (Rule 23).
5. **First tasks (in order):**
   - MC page refactoring (Workflow page is stale, doesn't show hardstop/hooks/rules)
   - Sound design system (user approved, carried 4 sessions)
   - Install Rust for aichat-search (or find Windows binary)
6. **Context:** Home machine. MC server at localhost:3033. Campaign-002 active (Sprint 5). 3 open PMs. 2 Sprint 5 agents (both A+). Hardstop system live. Lasso + Dippy wired. 25 orchestrator rules. 13 handoff gates. .claude/rules/ has 7 files.
