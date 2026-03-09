# Orchestrator v1.7 Handoff

**Date:** March 9, 2026 | **Campaign:** MC Evolution Sprint (campaign-001) | **Session:** Sprint 10 (calibration continued)

---

## What v1.7 Did

This was the **foundation hardening sprint** — fixing the three broken P0 systems (grading, PRDs, server) that v1.6 identified but didn't resolve. No new features dispatched. User frustration dropped from 9/10 to satisfied.

### Infrastructure Delivered

| Component | What It Does |
|-----------|-------------|
| **`create-agent-prompt` skill** | New skill (133 lines) for generating quality-validated dispatch prompts. 8 quality gates, 6 task-type templates (perf/UI/research/refactor/infrastructure/review), Deep Research three-phase pattern enforced. Closes PM014. |
| **Review agent fix (`run-review.sh`)** | Review agent now checks `git diff --name-only` in BOTH repos (phredomade + agent-hub). Can no longer report "nothing delivered" when files were modified. Cross-references file changes against PRD requirements. |
| **Server restart with all fixes** | Cost cache: /api/cost 7s → 0.56s (12x). /api/launch auto-creates agent cards. Auto-grade defaults: empty deliverables cap at 10/40 not 30/40. Grade/score letter sync live. |
| **Grade cleanup** | integration-test: B- → D+ (68/100). server-review: D+ → B- (80/100, manual re-grade). plugin-audit: scoreBreakdown aligned to 83/100 matching v1.6's manual B grade. |
| **Orchestrator rules 18 + 19** | Rule 18: Deep Research pattern (outline → focused search → synthesize). Rule 19: Never propose destructive fallbacks without checking git state. |
| **`orchestrator-dispatch` updated** | Step 1 now references `create-agent-prompt` skill. Stage 2 DISCOVER includes research alongside skill loading. |
| **PM014 closed** | Vague PRDs → F grades. Fixed by create-agent-prompt skill with quality gates. |
| **PM015 closed** | Fragmented dispatch. Fixed by /api/launch auto-card-creation (verified working). |
| **PM017 filed** | "Reversibility assumption" — proposed git checkout on 7,453 lines uncommitted. |
| **PM018 filed** | Ignored user instruction to find research skill, did bad searches with internal jargon. |
| **MEMORY.md updated** | Search methodology rules, Deep Research pattern, stale entries fixed. |
| **Server-review agent dispatched** | First agent dispatched via /api/launch from orchestrator. Delivered SAFE WITH CAVEATS verdict. |

### Research Conducted (15+ sources)

| Topic | Key Sources | Insight |
|-------|-------------|---------|
| PRD templates for agents | prd-taskmaster, LobeHub PRD skill, ChatPRD | 12-step workflow with 13 quality checks. Machine-readable PRDs with file structure + sequenced build order. |
| Skill authoring | Anthropic official docs | Keep under 500 lines. Progressive disclosure. Description in third person. Test with all models. |
| Agent creation patterns | claudefast Agent Teams, Anthropic subagents docs | Team Lead → Teammates. Shared task list. Spawn prompt + context. |
| Agent evaluation | Anthropic evals blog | Three grader types (code, model, human). Start with 20-50 tasks from real failures. Transcript review is non-negotiable. |
| Scope creep prevention | cybercorsairs, singhdevhub, tessl avoid-feature-creep | Phase gates (FRAME→PLAN→VERIFY→EXECUTE). Circuit breakers. Explicit termination tools. |
| Research methodology | Weizhena/Deep-Research-skills | Three-phase: outline → focused search → structured output. Human-in-the-loop. Validation scripts. |

---

## Open Post-Mortems

| PM | Status | Summary |
|----|--------|---------|
| **PM016** | Partially closed | 5/7 items done. Remaining: /prompts page data-driven (P2), campaigns auto-refresh (P2). |
| **PM017** | Open | Reversibility assumption — add git state check before proposing reverts. Rule 19 added but not hook-enforced. |
| **PM018** | Open | Research quality — Deep Research pattern now in rules (18) and skills, but hasn't been tested in practice yet. |

---

## What's Next for v1.8

### P0: Test the new systems
1. **Dispatch an agent using `create-agent-prompt` skill end-to-end** — this skill has never been used by an actual agent. The server-review PRD was written manually before the skill existed. First real test.
2. **Verify auto-grade with new server code** — dispatch an agent, let it complete, check if the grade is correct with the fixed defaults.
3. **Verify review agent sees file changes** — dispatch an agent that modifies files, let run-review.sh grade it, confirm it reports deliverables correctly.

### P1: Remaining Sprint 10 tasks
| # | Task | Priority | Notes |
|---|------|----------|-------|
| 22 | Research Agent: Workflow Best Practices | P1 | Use Deep Research pattern |
| 10 | Sound Design System | P1 | Interactive mode |
| 12 | Clickable Skills on Cards | P1 | PRD written, not dispatched |
| 14 | Memory Cleanup | P1 | PRD written |
| 15 | Lifecycle Enforcer | P1 | PRD written |
| 16 | Demo Page | P2 | Wow view for teammates |

### P1: Process improvements
- **Guard hook whitelist for MC server** — allow killing port 3033 without manual intervention
- **Adapt Deep Research skill for our system** — lightweight version using WebSearch, not Exa
- **Close PM017/PM018** — implement the systemic fixes (git state check hook, research quality enforcement)

---

## User Preferences (Reinforced This Session)

1. **Don't clog the workflow** — take in what's good from research, discard the rest. Value > volume.
2. **Separation of concerns** — one skill, one job. orchestrator-dispatch handles dispatch, create-agent-prompt handles prompt writing.
3. **Search smarter** — short targeted queries, universal language, one concept per search. Internal jargon = graded failure.
4. **Find tools online FIRST** — when user says "find a research skill," find it before researching. Don't skip instructions.
5. **Fix foundation before features** — this held through the entire session. Zero features dispatched.
6. **Frustration dropped** — user went from 9/10 frustrated to saying "good job" and "starting to understand."

---

## Context Management

v1.7 is at moderate-high context. Writing handoff proactively per the v1.5 lesson (hit 1.9GB when delayed).

## How to Resume

1. Open a new Claude Code terminal
2. Start with: "You are Orchestrator v1.8. Read `.claude/agent-hub/coordinated-sprint/orchestrator-v1.7-handoff.md` and the orchestrator skill."
3. **First action:** Test the create-agent-prompt skill by dispatching a real agent through it.
4. **Second action:** Verify auto-grade + review agent fixes by letting that agent complete and checking its grade.
5. **Context:** Foundation fixes are in place but NOT yet verified. v1.8 must prove the pipeline works end-to-end before dispatching any feature agents. Verification first, features second.
