# Orchestrator v1.6 Handoff

**Date:** March 8-9, 2026 | **Campaign:** MC Evolution Sprint (campaign-001) | **Session:** Sprint 10 (calibration)

---

## What v1.6 Was About

This was the **calibration sprint** — the session where we stopped dispatching and started fixing the foundation. User frustration hit 9/10 because 6 orchestrator versions never searched online, never used 13 available agents, and kept dispatching on broken infrastructure.

### The Turning Point
User: "Why are we acting like crayon baby munching fucking idiots? The internet is our oyster bro."

v1.6 was the first orchestrator to use WebSearch. Should have been v1.0.

---

## Infrastructure Delivered

| Component | What It Does |
|-----------|-------------|
| **Skill activation hook** | `UserPromptSubmit` hook at `.claude/hooks/skill-activation-hook.sh`. Injects mandatory skill check into every prompt. Based on community patterns (umputun gist + claudefast blog). This is the structural enforcement that PRD text alone could never provide. |
| **3 plugins enabled** | `security-guidance` (PreToolUse security scan), `code-review` (5-agent PR review), `pr-review-toolkit` (6 specialized review agents). Per Plugin Audit agent recommendations. |
| **Auto-grade defaults fix** | Empty deliverables get 5-15/40, not 30/40. Dashboard Perf v1 got 69/100 (B-) despite delivering nothing — now correctly gets F. |
| **Grade letter/score sync** | UI now computes letter grade from `scoreBreakdown.total` instead of trusting manual `grade` field. No more B- with 71/100 (C-). |
| **v1.5 graded (B+)** | Orchestrator-specific 5-dimension rubric: Coordination, Infrastructure, Findings, Process, Context Management. |
| **v1.6 self-registration** | Orchestrator auto-registers in campaigns.json. Skill updated to mandate this. |
| **`/api/launch` auto-creates agent cards** | No more manual JSON editing. Pass `sprint`, `focus`, `slot` and the card is created automatically. **Needs server restart.** |
| **PM010/PM011/PM012 closed** | Systemic fixes verified. |
| **PM014/PM015/PM016 filed** | Vague PRD failure, dispatch fragmentation, systemic "never research online" failure. |
| **Orchestrator rules 16 + 17** | Rule 16: Research online before building. Rule 17: Use your own agents. |
| **MEMORY.md updated** | 4 new critical rules: research online, use own agents, skill hook installed, plugins enabled. |
| **Agent card colors** | Default slate gray for unrecognized agents + indigo for plugin/audit + teal for research. No more colorless cards. |
| **Orchestrator icon** | ◉ → 🟣 for completed orchestrators. |

### Agents Dispatched (Sprint 10)

| Agent | Grade | Key Result |
|-------|-------|-----------|
| **Dashboard Perf v2** | C- (71/100) | Actually implemented per-session cost cache (498 insertions in server.js). Was wrongly graded F by blind review agent. Scope crept to 1637 lines changed. **Needs server restart to test.** |
| **Plugin Audit** | B (75/100) | Delivered 297-line recommendations doc. Answered all 8 decisions. Verified security plugin at 57ms. Was wrongly graded D+ by auto-grade defaults. |

---

## Research Findings (first time any orchestrator searched online)

### Sources Consulted
- [Skill authoring best practices — Anthropic](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices)
- [Mandatory Skill Activation Hook — umputun](https://gist.github.com/umputun/570c77f8d5f3ab621498e1449d2b98b6)
- [Skill Activation Hook: 100% Loading — claudefast](https://claudefa.st/blog/tools/hooks/skill-activation-hook)
- [Multi-agent PRD Framework — jkutasi](https://github.com/jkutasi/claude-get-started-prd-framework)
- [awesome-claude-code — hesreallyhim](https://github.com/hesreallyhim/awesome-claude-code)
- [Hooks reference — Claude Code Docs](https://code.claude.com/docs/en/hooks)
- [Agent creation architect prompt — Piebald-AI](https://github.com/Piebald-AI/claude-code-system-prompts/blob/main/system-prompts/agent-prompt-agent-creation-architect.md)
- [obra/superpowers issue #436](https://github.com/obra/superpowers/issues/436) — "Support reviewing uncommitted changes"

### Key Patterns Discovered
1. **Skill enforcement via hooks, not PRD text** — `UserPromptSubmit` hook injects skill activation check. Claude cannot skip it.
2. **PRDs are agent creation** — use Claude's agent creation architect pattern, not freeform text.
3. **10-phase slice lifecycle (jkutasi)** — A through J with mechanical gate checks. More rigorous than our 6-stage.
4. **Review agent needs `git diff`** — check working tree for uncommitted changes, not just activity logs.
5. **Anthropic says: test skills with all models** — we never test skills.
6. **Anthropic says: build evaluations BEFORE documentation** — we do the opposite.
7. **123+ community skills exist** — we reinvent everything from scratch.

---

## Critical Issues for v1.7

### P0: Review agent is blind to file changes
The review agent (`run-review.sh`) reports "nothing delivered" when the agent actually modified files. It reads activity logs and PRDs but never checks `git diff` or `git status` in the agent-hub repo.

**Fix:** Add `git status --short` and `git diff --name-only HEAD` to the review agent's assessment. If files were modified in the working tree, report them as deliverables. The `obra/superpowers` issue #436 documents this exact gap.

### P0: PRD skill/template doesn't exist
PM014 documents this. PRDs are freeform, quality varies wildly. The fix:
1. Fetch Claude's [agent creation architect prompt](https://github.com/Piebald-AI/claude-code-system-prompts/blob/main/system-prompts/agent-prompt-agent-creation-architect.md)
2. Use our `agent-expert` agent to review and adapt it
3. Create a PRD skill that enforces structure: mission, context, measurements (for perf), lifecycle stages, constraints
4. Research ChatPRD patterns for additional structure

### P0: Server restart needed
server.js has two sets of uncommitted changes:
1. **v1.6's `/api/launch` enhancement** — auto-creates agent cards
2. **Dashboard Perf v2's cost cache** — per-session mtime-based caching (498 insertions, but 1637 total lines changed — needs code review before restart)

**Recommendation:** Use the `critic` agent to review Dashboard Perf v2's changes before restarting. The agent over-scoped (1637 lines vs targeted fix). May need to cherry-pick only the cost cache changes.

### P1: Scientist agent is scoped to phredomade only
The `scientist` agent in `.claude/agents/scientist.md` is specifically scoped to photography portfolio research (web performance, UX, visual design, SEO). It does NOT cover MC workflow research, agent creation patterns, or Claude Code ecosystem research. Either broaden it or create an MC-specific research agent. The user wants a **research pipeline**: define query → search multiple sources → reason about relevance → return actionable findings.

### P1: PM014/PM015/PM016 still open
- PM014: PRD quality failure → needs PRD skill (above)
- PM015: Dispatch fragmentation → partially fixed (/api/launch auto-creates cards, needs restart)
- PM016: Systemic "never research online" → partially fixed (rules 16+17, MEMORY.md, skill hook)

### P1: Remaining Sprint 10 tasks

| # | Task | Priority | Notes |
|---|------|----------|-------|
| 22 | Research Agent: Workflow Best Practices | P1 | Use scientist agent + WebSearch |
| 23 | PRD Skill / Template | P1 | Use agent-expert + online research |
| 10 | Sound Design System | P1 | Interactive mode |
| 12 | Clickable Skills on Cards | P1 | PRD written, not dispatched |
| 14 | Memory Cleanup | P1 | PRD written |
| 15 | Lifecycle Enforcer | P1 | PRD written |
| 17 | Skill Enforcement in PRDs | P1 | Partially solved by hook |
| 16 | Demo Page | P2 | Wow view for teammates |

---

## User Preferences (Reinforced This Session)

1. **Research online FIRST** — "The internet is our oyster bro. Why don't you do your own research?"
2. **Use existing agents** — "You have all these agents and tasks you never fucking use. This is insane."
3. **Fix foundation before features** — "We need to integrate all these changes now before we even try to do something new."
4. **PRDs must be standardized** — "Our PRD is not standardized."
5. **Grade must match score** — "The score breakdown versus the overall grade letter doesn't make any sense."
6. **Don't paste prompts manually** — "I never want to paste it manually; that's not something I do anymore."
7. **Dispatch should be one step** — auto-create cards, auto-add to campaigns, one API call.
8. **Frustration at 9/10** — orchestrators keep doing the same things wrong. Research, use tools, fix before building.

## Context Management

v1.6 is at moderate context. Writing handoff proactively (learned from v1.5 which hit 1.9GB).

## How to Resume

1. Open a new Claude Code terminal
2. Start with: "You are Orchestrator v1.7. Read `.claude/agent-hub/coordinated-sprint/orchestrator-v1.6-handoff.md` and the orchestrator skill."
3. **First action:** Restart the MC server to pick up cost cache fix + /api/launch enhancement. Use `critic` agent to review Dashboard Perf v2's server.js changes first.
4. **Second action:** Fetch the agent creation architect prompt from Piebald-AI and use `agent-expert` to create a PRD skill.
5. **Third action:** Fix review agent blindness (`run-review.sh` → add `git diff` check).
6. **Context:** This is a calibration sprint. No new feature dispatching until the foundation is solid.
