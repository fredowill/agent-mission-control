# Orchestrator v2.6 Handoff

**Date:** 2026-03-10 | **Campaign:** campaign-002 (MC Maturity Sprint) | **Machine:** Home PC (ephra)

---

## What v2.6 Did

Most impactful orchestrator for agent quality. Shifted focus from dispatching quantity to making every session smarter by default. Fixed a bug that meant skill-activation keyword matching NEVER worked in production.

| Component | What It Does |
|-----------|-------------|
| **Universal agent lifecycle** | .claude/rules/00-agent-lifecycle.md -- 6 stages (READ, RECALL, DISCOVER, RESEARCH, BUILD, VERIFY) for ALL sessions, not just dispatched agents. Includes RECALL step that searches 480+ past sessions via aichat-search. |
| **Default behaviors** | .claude/rules/00-defaults.md -- emoji coding, tables, voice prompt parsing, research-first, no SVGs. Every session sees these. |
| **Skill-activation hook FIXED** | Windows path bug (`/c/Users/...` -> `C:\c\Users\...` in Node.js) meant keyword matching never fired. Fixed with cygpath + backslash escaping. Now 18/18 categories pass. |
| **18 skill rules** | Expanded from 10 to 18: added eval-harness, verification-loop, continuous-learning, writing-plans, security-review, skill-builder, impeccable-polish, coding-standards. |
| **User-level skill hook** | skill-activation-hook.sh now in ~/.claude/settings.json -- fires for ALL projects. |
| **3 Sprint 6 agents** | toolbox-sync-hook (A-), workflow-page-refresh (A, 12 items), sound-design-system (B+, needs redo as interactive). |
| **dispatch.sh /tmp/ fix** | Self-buffer mechanism crashed on Windows because /tmp/ is a Cygwin virtual directory. Now uses script directory. |
| **Rust + aichat-search** | Rust 1.94 installed via winget. MSVC Build Tools installed. cargo config.toml with explicit linker path. aichat-search binary built via batch file (vcvarsall workaround). JSON session search working. |
| **Lasso removed** | Prompt injection defender had no path exclusion config -- every internal file triggered false positives. Removal justified after checking patterns.yaml. |
| **PM031 + 4-layer fix** | Manual dispatch regression: Rule 26, dispatch skill Step 5 rewritten, Gates 14-15 added to handoff. |
| **PM032 filed** | Sound design dispatched headless when it needed user interaction. Interactive dispatch gap. |
| **f109: Paradigm shift** | "The orchestrator's job is to build agents that can work -- not to dispatch headless chickens." Tier-1 finding. |

---

## Critical Tasks for v2.7

### P0: Toolbox page refresh
User feedback gathered from session search (5 requirements): usage counts, collapsible sections, Home/Work labels, category counts, machine badges. Click functionality broken in Work mode. Nav bar has overlap issues. Agent prompt NOT yet written -- needs the creating-agents pipeline.

### P0: Sound design redo (interactive)
PM032 -- the sound-design-system agent ran headless. User never heard the sounds. Needs interactive dispatch. Explore sound libraries (Pixabay, Mixkit, ElevenLabs) and let user pick. The framework (play-sound.ps1 + sound-config.json) is solid -- just needs real sounds instead of console beeps.

### P1: Selective context injection
User wants agents to automatically surface past session context about the current topic. The RECALL step in 00-agent-lifecycle.md tells agents to use `aichat search`, but this depends on agents actually following the lifecycle. Consider: a UserPromptSubmit hook that auto-injects top 3 session search results for the user's topic.

### P1: Interactive dispatch mode reasoning
Rule 26 covers /api/launch, but no rule tells the orchestrator WHEN to use interactive vs auto mode. Creative/subjective tasks (sound, UI review, design choices) need interactive. Deterministic tasks (hooks, scripts) can be auto. Add this reasoning to the dispatch checklist.

### P2: CLAUDE.md review skill
Carried since v2.3. Never started. Low user energy for this.

---

## Open Post-Mortems

| PM | Title | Status | Priority |
|----|-------|--------|----------|
| PM008 | Subagent flight search exposed 3 gaps | open | p1 |
| PM031 | Manual dispatch + /tmp/ crash | open (systemic fix done, can close) | p0 |
| PM032 | Sound design dispatched headless | open | p0 |

---

## Gaps Left

1. **Toolbox page** -- agent not dispatched, only scoped. User feedback from 5 sessions gathered but not acted on.
2. **Sound design** -- framework built but user hasn't approved the actual sounds
3. **Interactive mode** -- no reasoning framework for when to use interactive vs auto dispatch
4. **aichat-search Unicode** -- `--json` mode crashes with encoding error on some sessions (PYTHONUTF8=1 workaround)
5. **Lasso** -- removed entirely. If injection defense needed later, need to fork patterns.yaml to add path exclusions.

---

## User Preferences Reinforced This Session

1. **"Don't dispatch headless chickens"** -- f109. The orchestrator's job is agent quality, not quantity. Spend 80% on agent design, 20% on logistics.
2. **"I can't do CARES because MC keeps eating attention"** -- The baseline session must be good without MC. Universal lifecycle + skill activation makes every session smart by default.
3. **"The main thing I care about is if I've ever talked about it before"** -- Session search (aichat) > curated context files. Agents should RECALL past conversations, not read maintained summaries.
4. **Always use /api/launch** -- PM031. Third time this regressed. Now Rule 26 + Gate 15.
5. **Investigate before removing** -- Tried to uninstall Lasso without checking if it could be tuned. User caught it. Always check config options first.
6. **Dispatch board cleanup at every handoff** -- Gate 14. Not a separate agent, just part of the orchestrator's exit routine.

---

## v2.5 Items Still Not Done

| Item | Priority | v2.6 Status |
|------|----------|-------------|
| MC page refactoring (Workflow) | P0 | DONE -- workflow-page-refresh agent delivered (A) |
| MC page refactoring (Toolbox) | P0 | NOT DONE -- scoped but not dispatched |
| Auto-sync hook for toolbox | P0 | DONE -- toolbox-sync-hook agent delivered (A-) |
| Sound design system | P1 | PARTIAL -- framework built, needs interactive redo (PM032) |
| aichat-search Rust binary | P1 | DONE -- built via vcvarsall batch file |
| Wire session search into MC Dashboard | P1 | NOT STARTED |
| CLAUDE.md review skill | P1 | NOT STARTED (carried 4 sessions) |
| Why3 page soul iteration | P2 | NOT STARTED (deprioritized) |

---

## Key Research from This Session

### Deep Research at Init
- Type C analysis of full campaign landscape
- 5 hypotheses tested, all confirmed or disconfirmed with evidence
- Community tools surveyed: PostToolUse hooks (Claude Code docs), PowerShell sounds, Lasso config

### Session Search (aichat)
- 480 sessions indexed, JSON output working
- Found user's Toolbox feedback from 5 different sessions (counts, collapsible sections, Home/Work labels)
- PYTHONUTF8=1 required for Unicode content

### Skill-Activation Bug Discovery
- Node.js on Windows converts `/c/Users/...` to `C:\c\Users\...` (prepends C:\ to Unix paths)
- Fix: cygpath -w for Windows path + double backslash escaping for JS string embedding
- This bug existed since the hook was first installed -- keyword matching never worked in production

---

## How to Resume

1. Open a new Claude Code terminal
2. Start with: "You are Orchestrator v2.7. Read `.claude/agent-hub/coordinated-sprint/orchestrator-v2.6-handoff.md` then run /orchestrator-init"
3. **MANDATORY:** Load /orchestrator-rules FIRST (now 26 rules).
4. **MANDATORY:** Load /deep-research at init (Rule 23).
5. **First tasks (in order):**
   - Toolbox page refresh (scoped, needs prompt + dispatch)
   - Sound design interactive redo (PM032)
   - Close PM031 (systemic fix already done)
6. **Context:** Home machine. MC server at localhost:3033. Campaign-002 active (Sprint 6). 3 open PMs. 3 Sprint 6 agents completed. Universal lifecycle live in .claude/rules/. Skill-activation hook fixed and expanded to 18 rules. Rust + aichat-search installed. 26 orchestrator rules. 15 handoff gates.
