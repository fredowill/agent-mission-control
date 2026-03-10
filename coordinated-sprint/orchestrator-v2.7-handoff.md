# Orchestrator v2.7 Handoff

**Date:** 2026-03-10 | **Campaign:** campaign-002 (MC Maturity Sprint) | **Machine:** Home PC (ephra)

---

## What v2.7 Did

Two system-level improvements that affect every session on every machine. No agents dispatched — built directly per Rule 12 (small infrastructure).

| Component | What It Does |
|-----------|-------------|
| **SessionStart hook** | `~/.claude/hooks/session-context.js` — injects Session Catalog (20 recent sessions) + Skill Index (62 skills) on every new session and after compaction. 9/9 smoke tests, 354ms, ~2K tokens. |
| **Skill Index** | `.claude/skills/skill-index.md` — categorized one-liners for all 62 skills. Enables LLM reasoning instead of keyword matching. |
| **Skill-activation hook rewrite** | `.claude/hooks/skill-activation-hook.sh` — forced eval pattern ("pick 0-2 based on REASONING, not habit"). Replaced keyword matching via skill-rules.json. eval-harness activated for first time ever in live test. |
| **Topic context file** | `.claude/rules/00-topic-context.md` — cross-machine knowledge: active projects, MC decisions, user preferences, setup requirements. Travels via git (but .claude/ is gitignored in phredomade — see Gaps). |
| **Lifecycle RECALL update** | `.claude/rules/00-agent-lifecycle.md` — RECALL step now references Session Catalog injected at start. |
| **Chime fix** | `scripts/play-chime.ps1` reverted to hardcoded `chimes.wav` via MediaPlayer. `[console]::beep()` from sound-design agent doesn't work in hook subprocesses. |
| **Deep research x2** | Context injection (4 searches, 5 hypotheses, 3 community tools evaluated), Skill selection (4 searches, Scott Spence forced-eval 84%, Paddo controllability). |
| **6 inferred findings** | User tests by using (not asking), thinks in systems, catches what agents skip, wants infrastructure that self-announces, prefers better defaults over new infrastructure, treats audio feedback as real feature. |

---

## Critical Tasks for v2.8

### P0: Cross-machine file sync for .claude/
The `.claude/` directory is gitignored in phredomade. Files created this session (`00-topic-context.md`, `00-agent-lifecycle.md`, `skill-index.md`, `skill-activation-hook.sh`, `session-context.js`) live locally only. They need a transport mechanism to the work laptop. Options:
1. Add them to agent-hub repo (already done for skill-index via toolbox-sync)
2. Create a setup script that copies from agent-hub/toolbox to .claude/
3. Un-gitignore specific .claude/ paths

### P0: Sound design interactive redo (PM032)
Framework built (play-sound.ps1 + sound-config.json). Chime reverted to .wav. User needs to hear and pick real sounds — Mixkit/Pixabay libraries identified. Must be interactive dispatch.

### P1: skill-mandate SKILL.md update
Still uses hardcoded 7-task-type map. Should reference skill-index.md and use LLM reasoning like the activation hook now does.

### P1: Toolbox page bugs
Click broken in Work mode. Nav overlap. User feedback gathered from 5 sessions (usage counts, collapsible sections, Home/Work labels, category counts, machine badges).

### P2: CLAUDE.md review skill
Carried 5+ sessions. Low user energy.

---

## Open Post-Mortems

| PM | Title | Status | Priority |
|----|-------|--------|----------|
| PM008 | Subagent flight search exposed 3 gaps | open | p1 |
| PM032 | Sound design dispatched headless | open | p0 |

PM031 closed this session (systemic fix confirmed, no regression).

---

## Gaps Left

1. **Cross-machine .claude/ sync** — The biggest gap. Rules, skills, hooks created this session don't travel via git. Agent-hub toolbox has skill-index but not rules or hooks.
2. **skill-mandate still hardcoded** — The activation hook uses LLM reasoning now, but the dispatch pipeline (skill-mandate SKILL.md) still has the old task-type map.
3. **Sound design** — Chime works but it's the Windows default. Real sound design needs interactive dispatch.
4. **4 ungraded orchestrators** — v2.2, v2.4, v2.5, v2.6 never graded (found by eval-harness in live test).
5. **skill-rules.json** — Dead code. Skill-activation hook no longer uses it. Can be removed.

---

## User Preferences Reinforced This Session

1. **"I care more about context injection than toolbox page"** — Reprioritized sprint mid-flight based on what user actually said in v2.6 prompts, not handoff doc priorities.
2. **"You should also do end-to-end testing"** — Verification is mandatory. User tests by using the feature naturally (opened new session, asked "what sessions have I had recently?").
3. **"Why aren't you using the aichat search?"** — User caught me not using the tool I literally just built. Agents must practice what they preach.
4. **"Just revert it, I'll design it later"** — Quick fixes over perfect solutions. Chime reverted to .wav in one edit.
5. **"There's no reasoning; the skill mandate is predefined"** — Keyword matching and hardcoded maps are inferior to LLM reasoning on a compact index.

---

## v2.6 Items Still Not Done

| Item | Priority | v2.7 Status |
|------|----------|-------------|
| Toolbox page refresh | P0 | NOT DONE — deprioritized (user cared about context injection) |
| Sound design redo (interactive) | P0 | PARTIAL — chime regression fixed, full redo still pending |
| Selective context injection | P1 | DONE — SessionStart hook + skill index + lifecycle update |
| Interactive dispatch mode reasoning | P1 | NOT STARTED |
| CLAUDE.md review skill | P2 | NOT STARTED (carried 5+ sessions) |

---

## Key Research from This Session

### Deep Research: Context Injection
- Type B synthesis, 8 web searches, 5 hypotheses all confirmed
- Evaluated claude-mem (heavy, overkill), context-memory (SQLite+FTS5, lighter), engram (Go binary)
- Chose: build on aichat-search (already installed) + SessionStart hook + skill index
- Key insight: "Curated 2K context outperforms 25K dump" — multiple sources confirmed

### Deep Research: Skill Selection
- Scott Spence forced-eval approach: 84% activation rate vs 20% baseline vs 50% simple hook
- Paddo controllability study: Claude uses pure LLM reasoning (no algorithmic routing)
- Community consensus: good descriptions > keyword matching
- Key insight: We were MAKING IT WORSE with keyword matching — Claude already does LLM reasoning natively

### Session Search (aichat)
- Used throughout session for RECALL: toolbox feedback, user frustration patterns, chime history, skill bias
- 204 sessions indexed, JSON output working
- Integrated into SessionStart hook for automatic catalog injection

---

## How to Resume

1. Open a new Claude Code terminal
2. Start with: "You are Orchestrator v2.8. Read `.claude/agent-hub/coordinated-sprint/orchestrator-v2.7-handoff.md` then run /orchestrator-init"
3. **MANDATORY:** Load /orchestrator-rules FIRST (26 rules).
4. **MANDATORY:** Load /deep-research at init (Rule 23).
5. **First tasks (in order):**
   - Fix cross-machine .claude/ sync (P0 — nothing from v2.7 travels to work laptop yet)
   - Sound design interactive redo (PM032)
   - Update skill-mandate to use skill-index.md
6. **Work laptop setup (one-time):**
   - `uv tool install claude-code-tools` — installs aichat CLI for session search (requires Python/uv)
   - Copy `~/.claude/hooks/session-context.js` (65 lines) — or recreate from agent-hub toolbox reference
   - Add `SessionStart` hook entry to work laptop's `~/.claude/settings.json`
   - Copy `.claude/rules/00-topic-context.md` and `.claude/rules/00-agent-lifecycle.md` from home machine
   - Copy `.claude/hooks/skill-activation-hook.sh` (rewritten — forced eval, no more keywords)
   - Copy `.claude/skills/skill-index.md` (or use `toolbox/skills/skill-index.md` from agent-hub)
7. **Context:** Home machine. MC server at localhost:3033. Campaign-002 active (Sprint 7). 2 open PMs. 0 Sprint 7 agents dispatched (orchestrator built directly). SessionStart hook live at `~/.claude/hooks/session-context.js`. Skill-activation hook rewritten. skill-rules.json is dead code.
