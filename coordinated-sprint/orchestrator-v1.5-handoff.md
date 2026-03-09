# Orchestrator v1.5 Handoff

**Date:** March 8-9, 2026 | **Campaign:** MC Evolution Sprint (campaign-001) | **Session:** Sprint 9

---

## What v1.5 Built

This session was the **integration testing sprint** — the first real test of v1.4's auto-dispatch pipeline. We dispatched 4 agents, found major gaps, and hardened the system.

### Infrastructure Delivered

| Component | What It Does |
|-----------|-------------|
| **6-stage Agent Lifecycle** | Added Debrief as 6th stage. Define → Discover → Execute → Reason → Verify → Debrief |
| **Agent self-debrief API** | `POST /api/campaigns/agent-debrief` — agents report delivered/missed/lessons before exit |
| **Review agent pipeline** | `run-review.sh` — mini agent runs after main agent exits, reads activity log + PRD, generates debrief. Safety net for agents that skip self-reporting |
| **Review status on cards** | Agent cards show "🟣 Review agent analyzing..." → "✓ Reviewed" |
| **Data-driven execution plan** | `executionPlan` field in campaigns.json, rendered live on Overview + Orchestrator tabs with sprint grouping, priority badges, colored agent pills |
| **`POST /api/campaigns/plan`** | API to update execution plan item status and agent assignment |
| **Requirements section** | Report card modal loads PRD mission + key steps from `/api/brief/` |
| **JS syntax validation hook** | `validate-html-js.js` — PostToolUse hook catches syntax errors in HTML files (PM012 prevention) |
| **Skills scoring fix** | Discover: failed → 0/15 skills in both auto-grade.js and campaigns-page.html |
| **Grade scale correction** | Moved from inflated scale (67=B-) to standard academic scale (80=B-) |
| **Hard gate on skills** | PRD template Stage 2 now says "grade caps at C if you skip skills" |
| **Agent card improvements** | Condensed delivered/missed to counts, colored pills for new agents, sprint collapse persistence via localStorage, Expand All button |
| **Bold-lead text fix** | Only splits on ` — ` or `: `, not word-hyphens |
| **11 findings** | f078–f088 captured |

### Agents Dispatched (Sprint 9)

| Agent | Grade | Key Result |
|-------|-------|-----------|
| **Debrief Liveness** | C+ | Delivered: auto-populates 95 wins/49 losses. Missed: no skills, no auto/manual distinction |
| **Workflow Updater** | C+ | Delivered: auto-dispatch pipeline visualization. Missed: no skills, safety section |
| **Dashboard Perf** | F | Delivered nothing. Agent started but produced zero output. Needs re-dispatch. |
| **Skill Splitter** | C+ | Delivered: 6 phase skills + hub. Self-debriefed. Missed: no skills loaded, no verification |
| **Clickable Skills** | Ready | Not yet dispatched (queued behind Dashboard Perf) |

---

## Critical Issues for v1.6 to Fix

### P0: Auto-grade defaults are lies
Auto-grade gives 30/40 for deliverables when there's no data. Dashboard Perf got 69/100 (was B-) despite delivering NOTHING. The defaults inflate grades and hide failures.

**Fix needed:** When delivered[] is empty AND no scoreBreakdown exists, deliverables should be 0-5/40, not 30/40. Same for execution — an agent with no file writes should get low execution score.

### P0: 67% of agents use zero skills
20 out of 30 agents used zero skills. The hard gate language in PRDs is untested — the first two agents after the gate (Dashboard Perf, Skill Splitter) BOTH ignored it. The gate has no teeth.

**Options to explore:**
- Hook-based enforcement (block file writes until a skill is loaded)
- Agent explicitly reports which stage it's in
- Heavier grade penalty (already 0/15 for Discover: failed)

### P0: Dashboard still loads in 10 seconds
Dashboard Perf agent failed completely. Need to re-dispatch with either:
- Interactive mode (user can guide)
- A better PRD with more specific profiling steps
- Or the orchestrator profiles it directly (Rule 12)

### P1: Agent lifecycle dots are inaccurate while running
The blinking dot jumps around because it's a heuristic based on current tool usage, not actual stage progression. Agents should explicitly report which stage they're in.

### P1: Report card modal is blank for running agents
Clicking a running agent shows all PENDING with no useful info. Should show live state (what the agent is doing, files being read/written).

### P1: Review agent not visible enough
The review agent runs inside the terminal tab. User wanted to see "Review agent analyzing..." on the card — implemented but not tested in production yet.

### P2: Sound design system not started
Different sounds for different events (dispatch, completion, error, orchestrator needs input). User requested Windows chime for orchestrator events, LoL ping for agent completion.

### P2: Interactive mode for complex tasks
Infrastructure exists (dispatch.sh supports mode: "interactive") but hasn't been used. Sound Design and Demo Page should use it.

---

## Remaining Sprint 9 Tasks

| # | Task | Status | Notes |
|---|------|--------|-------|
| 9 | Dashboard Performance | **Re-dispatch** | Previous agent failed (F). Try interactive mode or orchestrator does it directly. |
| 10 | Sound Design System | Ready | Needs interactive mode — creative decisions required |
| 12 | Clickable Skills on Cards | Ready | PRD written, not dispatched yet |
| 17 | Skill Enforcement in PRDs | Partially done | Hard gate added but untested/ineffective |

## Sprint 10 Tasks

| # | Task | Notes |
|---|------|-------|
| 14 | Memory Cleanup | Strip stale content from MEMORY.md |
| 15 | Lifecycle Enforcer | Embed lifecycle in CLAUDE.md |
| 16 | Demo Page | Wow view for teammates |

---

## Systemic Findings This Session

| ID | Title | Priority |
|----|-------|----------|
| f078-f082 | v1.4 infrastructure findings (persisted from handoff) | Tier 2 |
| f083 | Structured Q&A is the orchestrator's killer UX pattern | Tier 1 |
| f084 | Proactive issue detection differentiates A-grade orchestrators | Tier 1 |
| f085 | Auto-graded agents have empty report cards | Tier 1 |
| f086 | Skills mandated in PRDs are ignored — no enforcement | Tier 1 |
| f087 | Orchestrator has no notification when dispatched agents finish | Tier 2 |
| f088 | Playwright screenshots verify layout, not content — verify both | Tier 1 |

---

## Key User Preferences (Reinforced This Session)

1. **Parse every voice prompt** — user dictates via Wispr Flow. Parse → confirm → act.
2. **Agent cards must be brief** — counts only ("✓ 5 delivered, ✗ 3 missed"), details in modal.
3. **Requirements section is essential** — user wants to see what the agent was asked to do, in their words.
4. **Grade scale must be honest** — 69/100 is NOT a B-. Standard academic scale.
5. **Fix identified gaps immediately** — don't identify 5 gaps then only fix 3.
6. **Content verification, not just screenshots** — test function output with real data, not just Playwright.
7. **Review agent should be visible** on the card, not just in the terminal.
8. **Make it bulletproof before scaling** — "there's no reason to move on before we make it bulletproof."
9. **Don't name agents with "orchestrator"** — they get filtered into the Orchestrator tab.
10. **Interactive mode for creative/complex tasks** — Sound Design, Demo Page.

## Data File State

- `campaigns.json` — 1 campaign, 30 agents (Sprint 9 has 5: 4 completed, 1 ready)
- `findings.json` — 88 findings (f001-f088)
- `dispatch.json` — 13+ post-mortems (PM010-PM012 still open)
- Orchestrator skill — now a hub referencing 6 phase skills (orchestrator-init, -plan, -dispatch, -grade, -sprint, -rules)
- `auto-grade.js` — updated with correct skills scoring and academic grade scale
- `run-review.sh` — new, review agent pipeline
- `validate-html-js.js` — new, JS syntax validation hook

## Context Management

v1.5 hit 1.9GB — that's too late for a clean handoff. Future orchestrators should track context proactively:
- **At 500MB:** Note it, start being concise
- **At 1GB:** Stop building, start wrapping up. Write handoff doc.
- **At 1.5GB:** Hard stop. Handoff immediately. Performance degrades past this point.
- **Never exceed 1.5GB.** v1.5 went to 1.9GB because of extensive calibration/review cycles. The calibration was valuable but should have triggered a handoff at 1GB with a "continue calibration" note.

## How to Resume

1. Open a new Claude Code terminal
2. Start with: "You are Orchestrator v1.6. Read `.claude/agent-hub/coordinated-sprint/orchestrator-v1.5-handoff.md` and the orchestrator skill."
3. **First priority:** Fix auto-grade defaults (P0 — deliverables 0 when empty, not 30)
4. **Second priority:** Re-dispatch Dashboard Perf (interactive or orchestrator-direct)
5. **Third priority:** Dispatch Clickable Skills + Sound Design
6. **Context:** We're testing the auto-dispatch integration. 4 agents dispatched, all had skills enforcement failures. The pipeline works mechanically but agents ignore PRD instructions.
