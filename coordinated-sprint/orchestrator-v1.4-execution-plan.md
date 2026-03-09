# Orchestrator v1.4 — Execution Plan

**Campaign:** MC Evolution Sprint (campaign-001)
**Focus:** Infrastructure automation — stop building features, automate the workflow
**Last updated:** 2026-03-09

---

## Phase A: Auto-Dispatch (DONE)

| # | Task | Status | Notes |
|---|------|--------|-------|
| A1 | `dispatch.sh` — bash launcher script | ✅ Done | Supports auto + interactive modes, auto-close option |
| A2 | `/api/launch` server endpoint | ✅ Done | Pre-links session to campaign, generates UUID |
| A3 | `CLAUDECODE` env var fix | ✅ Done | Unset in dispatch.sh to prevent nested session error |
| A4 | wt.exe launcher scripts (quoting fix) | ✅ Done | Temp .sh files sidestep Windows quoting hell |
| A5 | Safety guard hook | ✅ Done | PreToolUse blocks rm -r, force push, process kills, etc. |

## Phase B: Integration (IN PROGRESS)

| # | Task | Status | Notes |
|---|------|--------|-------|
| B1 | Parent-child session tracking | ✅ Done | `parentSessionId` + `dispatchMeta` in state files, preserved by both hooks |
| B2 | Dashboard dispatch badge | ✅ Done | Shows "Dispatched: Agent Name" on child cards |
| B3 | Campaigns page live state | ✅ Done | Blinking pulse for active/idle/waiting/done agents |
| B4 | Lifecycle stage heuristic | ✅ Done | Tool-based inference: Read→Define, Skills→Discover, Write→Execute, Bash→Verify |
| B5 | Auto-grading on completion | ✅ Done | `auto-grade.js` runs after agent exits, writes lifecycle + grade to campaigns.json |
| B6 | Tab auto-close option | ✅ Done | `autoClose: true` in /api/launch → tab closes on success |
| B7 | Tab focus stealing fix | 🔍 Researching | wt.exe may not support no-focus — investigating |
| B8 | Test card vs real card distinction | ⬜ Todo | Visual indicator or auto-cleanup for test dispatches |
| B9 | Dashboard performance (10s load) | ⬜ Todo | Investigate: likely sync reads or Cerebras API calls |
| B10 | Update workflow page | ⬜ Todo | Reflect new auto-dispatch flow in workflow tab |

## Phase C: Original Jobs 2-4 (BLOCKED on Phase B)

| # | Task | Status | Notes |
|---|------|--------|-------|
| C1 | Break orchestrator skill into phase-specific skills (Job 2) | ⬜ Deferred | Monolithic SKILL.md → 8 loadable phase skills |
| C2 | Agent auto-linking improvements (Job 3) | 🟡 Partial | Pre-linking via /api/launch done. Auto-detection from prompt-hook still works. |
| C3 | Notification sound on completion (Job 4) | ⬜ Deferred | PM007 — raised 5+ times. User's #1 productivity blocker. |

## Phase D: Post-Integration Polish

| # | Task | Status | Notes |
|---|------|--------|-------|
| D1 | Agent communication channel | ⬜ Todo | Agents write deliverables/missed to campaigns.json. Single pane of glass. |
| D2 | Auto-grade manual override | ⬜ Todo | Deliverables score defaults to 20/40 — orchestrator/user overrides |
| D3 | Workflow page update | ⬜ Todo | Document the auto-dispatch→grade→campaigns pipeline |
| D4 | Orchestrator v1.3 retroactive grading | ⬜ Todo | Run auto-grade.js on old sessions to fill in lifecycle data |

---

## Findings This Session

| ID | Title | Status |
|----|-------|--------|
| f077 | CLAUDECODE env var must be unset for dispatch | Fixed in dispatch.sh |
| f078 | wt.exe + Node.js spawn = quoting hell | Fixed with temp launcher scripts |
| f079 | Safety hooks need calibration (rm -f false positive) | Fixed regex |
| f080 | prompt-hook.js overwrites dispatch metadata | Fixed — both hooks now preserve parentSessionId + dispatchMeta |
| f081 | bash `kill` doesn't work on Windows PIDs | Use Node.js `process.kill()` instead |
| f082 | Auto-grading must run post-exit, not as Stop hook | Stop fires every turn. dispatch.sh calls auto-grade.js after exit. |
