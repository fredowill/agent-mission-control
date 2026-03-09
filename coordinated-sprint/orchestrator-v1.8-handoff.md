# Orchestrator v1.8 Handoff

**Date:** March 9, 2026 | **Campaign:** MC Evolution Sprint (campaign-001) | **Session:** Sprint 10 (pipeline verification + foundation hardening)

---

## What v1.8 Did

This was the **pipeline verification sprint** — proving the create-agent-prompt → dispatch → auto-grade → review pipeline works end-to-end, then fixing every systemic issue discovered along the way. 4 agents dispatched, all graded correctly. User frustration: minimal — praised the systemic fix approach.

### Infrastructure Delivered

| Component | What It Does |
|-----------|-------------|
| **Auto-grade transcript parsing** | Parses `.jsonl` transcripts for Skill tool calls, Playwright screenshots, debrief API calls. Fixed critical bug: was looking in project `.claude/` instead of `$HOME/.claude/`. |
| **Auto-grade deliverables ratio** | Scores from actual `delivered.length / (delivered + missed)` instead of defaulting to 30/40. Bonus for 0 misses + verified. |
| **Auto-grade always-update** | Re-runs now always update grade/reason/breakdown — no more stale grades from "don't overwrite" check. |
| **Debrief API markdown stripping** | Strips `**bold**` and `�` on write. Filters "No missed items" placeholders. Systemic — all future agents get clean data. |
| **Agent card auto-colors** | `nameToColor()` hashes agent name to unique HSL hue. No more manual color assignments. Known agents get handpicked colors, unknown get auto-generated. |
| **Path portability** | dispatch.sh, run-review.sh, server.js — all use `$SCRIPT_DIR`/`__dirname` instead of hardcoded `/c/Users/ephra/`. |
| **setup-hooks.sh** | Generates machine-specific settings.json from template. Run once after pull on new machine. |
| **SYNC-GUIDE.md** | Step-by-step cross-machine sync checklist in the repo. |
| **`/api/hook/<name>` endpoint** | Server-side hook file lookup — no hardcoded user paths in client. |
| **Guard hook MC whitelist** | `guard-destructive.sh` allows killing MC server (port 3033) by PID lookup. Systemic — not hardcoded PID. |
| **Execution plan collapse** | Clickable header with chevron, 19/27 done counter. |
| **Infrastructure attribution section** | Skills (9 custom), Hooks (8), Rules (14) with version pills, staleness badges, clickable content modals. Chip grid layout. |
| **Toolbox sync** | 9 new skills, 8 scripts, hooks, configs exported for work laptop. Pushed to GitHub. |
| **Grade default fix** | Active/ready agents show `?` instead of F/48. |
| **orchestrator-init updated** | Added dispatch-home.json and dispatch-work.json to Phase 1 read list. |
| **CLAUDE.md Rules 11 + 12** | Rule 11: 6-stage lifecycle in every prompt. Rule 12: Always fix the system, not the symptom. |
| **Orchestrator Rule 20** | Tables for all status reporting. |
| **Finding f093** | "Always fix the system, not the symptom" — tier1 principle. |
| **PM019 filed** | Orchestrator built instead of dispatching. |

### Agents Dispatched (4)

| Agent | Grade | Skills Loaded | Key Delivery |
|-------|-------|---------------|-------------|
| infra-attribution | B+ (86) | frontend-design | Infrastructure section with 3 groups, staleness, clickable modals. 12 Playwright screenshots. |
| infra-polish | B (85) | frontend-design | Chip grid redesign, staleness subgroups, tightened hooks/rules. |
| memory-cleanup-v2 | A (95) | writing-plans | MEMORY.md rewritten to 98 lines, hooks table, zero stale data. |
| lifecycle-enforcer-v2 | B+ (87) | agent-development | Lifecycle reference card, CLAUDE.md Rule 11, 19-prompt audit scorecard. |

**Key stat:** All 4 agents loaded their mandated skill. This is the first time 100% skill compliance was achieved in a sprint.

---

## Open Post-Mortems

| PM | Status | Summary |
|----|--------|---------|
| **PM016** | Partially closed | 5/7 items done. Remaining: /prompts page data-driven (P2), campaigns auto-refresh (P2). |
| **PM017** | Open | Reversibility assumption — Rule 19 added but no hook enforcement. |
| **PM018** | Open | Research quality — Deep Research pattern in rules, used in PRD generation but not formally tested. |
| **PM019** | Open | Orchestrator built CSS instead of dispatching — caught mid-session. |

---

## What's Next for v1.9

### P0: Push latest fixes + verify work laptop
1. **Push agent-hub** — auto-grade fix, debrief API fix, guard hook whitelist, auto-colors, CLAUDE.md rules 11+12 are NOT yet pushed (only the first 3 commits were pushed before these fixes).
2. **Test on work laptop** — pull, run `setup-hooks.sh`, verify skills/hooks work, toggle to Work mode.

### P1: Feature agents (PRDs need create-agent-prompt regeneration)
| # | Task | Priority | Notes |
|---|------|----------|-------|
| 10 | Sound Design System | P1 | Interactive mode — different sounds for different events |
| 16 | Demo Page | P2 | Wow view for teammates |
| — | Enforcement Hook | P1 | lifecycle-enforcer-v2 identified: PreToolUse hook to block Execute before Discover |

### P1: Process improvements
- **Close PM017/PM018/PM019** — implement systemic fixes
- **Execution plan cleanup** — some items are duplicated or stale across sprints
- **Agent naming** — agents show `memory-cleanup-v2` not `Memory Cleanup v2` (display name vs slot name)

---

## User Preferences (Reinforced This Session)

1. **Tables, not bullet walls** — Rule 20. Status reports, voice prompt parsing, post-fix summaries must use tables.
2. **Always fix the system** — Rule 12, f093. Every fix must prevent recurrence, not just patch the instance.
3. **Don't ask to restart MC server** — just do it. Guard hook now whitelists port 3033.
4. **Show me the page after changes** — Playwright screenshot after every batch of fixes. Don't describe it, show it.
5. **Third-party skills aren't "stale"** — only custom/homegrown orchestrator skills need staleness tracking.
6. **Voice prompt parsed in table format** — not bullet points, not paragraphs. Short rows with # | Decision | Means columns.

---

## Context Management

v1.8 is at high context after a very productive session (4 agents dispatched, 15+ systemic fixes, 3 git pushes). Writing handoff proactively.

## How to Resume

1. Open a new Claude Code terminal
2. Start with: "You are Orchestrator v1.9. Read `.claude/agent-hub/coordinated-sprint/orchestrator-v1.8-handoff.md` and the orchestrator skill."
3. **First action:** Push the remaining fixes to GitHub (auto-grade, debrief API, guard hook, auto-colors, CLAUDE.md 11+12).
4. **Second action:** Test work laptop sync (user has work tomorrow — CARES guide + FHL hooks demo).
5. **Context:** Pipeline is proven. Auto-grade is accurate. Foundation is solid. v1.9 can start dispatching feature agents confidently.
6. **Unpushed commit:** `ad646f8` + one more (out-of-scope reclassification, debrief API fix, handoff update). Push at END of v1.9 session, not mid-session.
7. **Idea from user:** Agents should write their own state updates to MC directly (via the Claude terminal's own API calls), instead of going through Cerebras summarization. Would eliminate rate limiting. Investigate in v1.9.
8. **Push workflow rule:** Only push to GitHub at the end of an orchestrator session, not mid-session. Check in with user before pushing.
