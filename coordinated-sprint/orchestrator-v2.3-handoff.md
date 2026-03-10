# Orchestrator v2.3 Handoff

**Date:** 2026-03-09 | **Campaign:** campaign-002 (MC Maturity Sprint) + campaign-003 (CARES Sprint) | **Machine:** Home PC (ephra)

---

## What v2.3 Did

Infrastructure stabilization sprint. First home-machine orchestrator for campaign-002. Fixed everything broken by the v2.2 file restructure, built the PM skill, upgraded skill enforcement, and dispatched 4 agents.

| Component | What It Does |
|-----------|-------------|
| **3 broken hook paths fixed** | hook.js, prompt-hook.js, play-chime.ps1 all pointed to pre-restructure paths. 16/16 hooks verified. |
| **Agent-hub junction** | Created Windows junction: ~/.claude/agent-hub -> phredomade/.claude/agent-hub. Both paths resolve to same inode. |
| **Stale path audit** | Fixed 5 files with pre-restructure references (enrich-agents.js, 2 toolbox configs, prompt-hook.js campaigns path). |
| **Cross-machine prompt sync** | Pulled 66 prompt files from work laptop. gitignore fixed so prompts stay tracked. |
| **CLAUDE.md Rule 13** | Emoji coding + tables for ALL CLI output. Permanent, every session. |
| **CLAUDE.md Rule 14** | Never write non-ASCII punctuation to data files. |
| **PM025 watermark enforcement** | create-agent-prompt no longer stamps watermark. creating-agents (parent pipeline) owns it. /api/launch rejects prompts without it. |
| **Watermark refactor** | Moved watermark from create-agent-prompt to creating-agents Step 3.5. Bypass = rejection. |
| **filing-postmortems skill** | New skill. Reads existing PMs, enforces format, quality gates, sequential IDs, writes to dispatch JSON. |
| **Smart skill-activation hook** | Keyword matching via skill-rules.json. Replaces static list. 24/24 tests pass. |
| **Hook overwrite protection** | PreToolUse guard on skill-activation-hook.sh and skill-rules.json edits. |
| **writeJSON sanitization** | server.js writeJSON strips em dashes, smart quotes, arrows, replacement chars at write layer. |
| **Campaign page sprint labels** | Per-campaign labels instead of hardcoded campaign-001 labels. |
| **Mojibake cleanup** | Fixed 78 byte-level corruptions in campaigns.json + all dispatch files. Created fix-mojibake.py and fix-stray-quotes.py scripts. |
| **CLAUDE.md edit guard** | PreToolUse hook warns on CLAUDE.md edits -- forces justification. |
| **verification-before-completion upgraded** | Added Infrastructure End-to-End Tests table for skills, hooks, pipelines, APIs. |
| **Toolbox sync** | Installed 13 missing agents (26 total) and 18 missing skills (61 total). |
| **v2.1 graded A-** | Deferred 3 times, finally done. |
| **PM026-028 filed** | Hook overwrite (open), /story vs /why dispatch error (closed), skill ID gap (closed). |
| **f104-f105 filed** | Watermark seal pattern, keyword matching standard. |
| **Operational defaults** | Created memory/operational-defaults.md for scenario-specific knowledge (not CLAUDE.md). |

### Sprint 4 Agents (4 dispatched)

| Agent | Grade | Key Output |
|-------|-------|------------|
| JSON Cleanup | A- | 6 root JSON files moved to data/. v2.2 had updated code paths but forgot to move actual files. |
| Cerebras Migration | B | 5 callLLM sites migrated to callClaude. Deep-summary fallback (line 810) still uses Cerebras. |
| Story Overhaul | ? | Still running at handoff. Overhauled /story (wrong target -- should have been /why). |
| Why2 Overhaul | ? | Still running at handoff. Creates /why2 page -- data-driven reimagining of MC value proposition. |

---

## Critical Tasks for v2.4

### P0: Review Why2 + Story Overhaul agents
Both still running. Review their output, grade them. Why2 is the demo showpiece.

### P0: Orchestrator hard stops
User pain point: orchestrators drag too long, regress, waste time. Needs brainstorming + design. Ideas: context % threshold, token budget, auto-handoff trigger, hard prompt count limit.

### P0: Demo sprint preparation
User wants a fast demo sprint to show friends. Prerequisites from this session are mostly done. Remaining: review the Why2 page, verify Cerebras migration works, test the full MC workflow end-to-end.

### P0: Update orchestrator-handoff gates with v2.3 lessons
Gate changes needed:
- **Gate 1 rename:** "Git committed" not "Git clean" -- handoff always follows changes. Purpose is to commit, not have zero changes.
- **Gate 10 (toolbox sync):** Don't skip -- run it. v2.3 had 13 agents + 18 skills missing because nobody checked.
- **New gate: Toolbox install audit** -- verify all toolbox items are installed to .claude/, not just synced to toolbox/. This is what PM029 was about.
- **Gate 9 (prompts reviewed):** Check for explicit "v{N-1} Items Still Not Done" table with status updates per item.

### P1: .claude/rules/ directory setup
Research showed CLAUDE.md should be < 200 lines with overflow in .claude/rules/. Not started.

### P1: CLAUDE.md review skill
Guard hook exists but no review SKILL that evaluates proposed edits against best practices. Not started.

### P1: Close-out tab update
Stale -- doesn't cover sprints 3+. Deferred from v2.1.

---

## Open Post-Mortems

| PM | Title | Status | Priority |
|----|-------|--------|----------|
| PM008 | Subagent flight search exposed 3 gaps | open | P1 |
| PM026 | Smart skill activation hook was overwritten | open | P1 |

---

## User Preferences Reinforced This Session

1. **Creative emoji coding** -- not just status dots. Pertinent, semantic emojis. CLAUDE.md Rule 13.
2. **Tables for EVERYTHING** -- no bullet dumps, no paragraph walls. Ever.
3. **Parse voice prompts** -- user dictates via Wispr Flow. Parse into 3-column table first.
4. **Research online BEFORE building** -- user caught me multiple times skipping this.
5. **Use your own agents** -- 26 agents installed, use them. Rule 17.
6. **End-to-end test everything** -- don't claim done without testing where the USER sees the output.
7. **CLAUDE.md is sacred** -- guard hook warns on edits. Use memory files or skills instead.
8. **Skill-rules.json is the skill enforcement pattern** -- keyword matching, not static lists. Protected by guard hook.
9. **creating-agents is the ONLY entry point** -- watermark enforcement at API level. PM025 closed.
10. **filing-postmortems skill is MANDATORY** -- orchestrator Rule 21. Never hand-write a PM.
11. **Toolbox must be synced** -- all agents and skills should be installed. Check on init.

---

## Gaps Left

1. **Story Overhaul agent** -- dispatched to wrong page (/story instead of /why). Agent still running. May produce good content anyway but needs review.
2. **Why2 agent** -- still running. Must be reviewed before demo sprint.
3. **Orchestrator hard stops** -- not started. Design needed.
4. **.claude/rules/ directory** -- research done, not implemented.
5. **CLAUDE.md review skill** -- guard hook exists, review skill does not.
6. **Cost page on work laptop** -- CWD slug mismatch. Work machine issue.
7. **Deep-summary Cerebras fallback** -- line 810 still uses callLLM. Within no-touch zone but is a 6th Cerebras dependency.
8. **Duplicate pm006, pm007 in dispatch** -- two entries each with different content. Data cleanup needed.

---

## Communication Style Guide for v2.4

### Emoji coding (CLAUDE.md Rule 13)
Creative, semantic emojis in every table row. Not just status dots. Use the full vocabulary. See f094, f095.

### Voice prompt parsing
3-column table: emoji | bold type | content. Parse BEFORE responding.

### Tables over text
If it's more than 2 items, it's a table. Bold leads. No text walls.

### skill-rules.json
Keyword matching fires on every prompt. 7 rules defined. Add new rules by editing the JSON -- no hook code changes.

---

## v2.2 Items Still Not Done

| Item | Priority | v2.3 Status |
|------|----------|-------------|
| Cerebras to hooks migration | P1 | DONE -- Cerebras Migration agent (B grade) replaced 5 callLLM sites. Deep-summary fallback (line 810) still uses Cerebras. |
| Sound Design System | P1 | Not started. Run on home machine (LoL sounds). |
| Viewable Skill Content on Agent Cards | P1 | Not started. |
| Update Close-Out tab retrospective | P1 | Not started. Stale, 8+ orchestrators old now. |
| Research: Workflow Best Practices | P1 | Not started. |
| Cross-device handoff skill | P1 | Partially addressed -- prompt sync done, junction created. Full skill not built. |
| phredomade.com style analysis | P3 | Not started. |
| Cost page zeros on work laptop | P1 | Investigated -- works on home machine. Work laptop CWD slug mismatch. |
| Card focus text polish | P1 | Not started. |

---

## How to Resume

1. Open a new Claude Code terminal
2. Start with: "You are Orchestrator v2.4. Read `.claude/agent-hub/coordinated-sprint/orchestrator-v2.3-handoff.md` then run /orchestrator-init"
3. **MANDATORY:** Load /orchestrator-rules FIRST.
4. **First tasks (in order):**
   - Check if Story Overhaul and Why2 agents completed -- review and grade them
   - Brainstorm orchestrator hard stops (user P0 request)
   - Plan demo sprint
   - Consider .claude/rules/ directory setup
5. **Context:** Home machine. MC server at localhost:3033. Campaign-002 active (Sprint 4 complete). 2 open PMs (PM008, PM026). 26 agents, 61 skills installed. skill-rules.json has 7 keyword rules. writeJSON sanitizes Unicode. Watermark enforcement live on /api/launch.
