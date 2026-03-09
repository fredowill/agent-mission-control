# Orchestrator v1.4 Handoff

**Date:** March 8-9, 2026 | **Campaign:** MC Evolution Sprint (campaign-001) | **Session:** Sprint 8

---

## What v1.4 Built

This session shipped **auto-dispatch** — the ability for the orchestrator to launch agents in new terminal tabs programmatically, with automatic grading, notifications, and campaign tracking. No more copy-pasting prompts.

### Components Delivered

| Component | File(s) | What It Does |
|-----------|---------|-------------|
| **dispatch.sh** | `.claude/agent-hub/dispatch.sh` | Bash script that runs inside a new terminal tab. Supports `auto` (headless) and `interactive` modes. Auto-grades on completion. Plays LoL ping notification. Auto-close option. |
| **/api/launch** | `server.js` (line ~2431) | POST endpoint. Generates UUID, pre-links to campaign, pre-creates state file with parent tracking, writes temp launcher script, opens wt.exe tab. |
| **auto-grade.js** | `.claude/agent-hub/auto-grade.js` | Runs after agent exits. Reads activity log, infers lifecycle stages, calculates score aligned with agent-grading SKILL.md, writes to campaigns.json. |
| **Safety guard** | `.claude/scripts/guard-destructive.sh` | PreToolUse hook on Bash. Blocks rm -r, force push, hard reset, process kills, npm publish, DB drops. |
| **Live state CSS/JS** | `campaigns-page.html` | Blinking pulse indicators for active agents. Lifecycle stage heuristic. Agent cards glow green when running. |
| **Parent-child tracking** | `hook.js`, `prompt-hook.js` | Both hooks preserve `parentSessionId` and `dispatchMeta` through writes. Dashboard shows "Dispatched" badge. |
| **Orchestrator tab** | `campaigns-page.html` | Dedicated tab on campaigns page. Shows current orchestrator, dispatched agents, execution plan. Orchestrators separated from regular agents. |
| **Notification sound** | `dispatch.sh` + `notify-ping.wav` | LoL Enemy Missing ping on agent completion. Single ping = success, double ping = error. |

### How to Dispatch an Agent

```bash
curl -X POST http://localhost:3033/api/launch \
  -H "Content-Type: application/json" \
  -H "X-Parent-Session: YOUR_SESSION_ID" \
  -d '{
    "agentName": "Agent Name",
    "promptFile": "coordinated-sprint/agent-prompt.md",
    "campaignId": "campaign-001",
    "slot": "agent-slot",
    "mode": "auto",
    "autoClose": true
  }'
```

**Modes:** `auto` = headless -p, runs to completion | `interactive` = full TUI, user can type

### Findings (f077–f082)

| ID | Title | Resolution |
|----|-------|-----------|
| f077 | CLAUDECODE env var must be unset for dispatch | `unset CLAUDECODE` in dispatch.sh |
| f078 | wt.exe + Node.js spawn = quoting hell | Temp launcher .sh scripts bypass all quoting |
| f079 | Safety hooks need calibration | rm -f false positive fixed. Stop-Process added to blocklist. |
| f080 | prompt-hook.js overwrites dispatch metadata | Both hooks now preserve parentSessionId + dispatchMeta |
| f081 | bash `kill` doesn't work on Windows PIDs | Use Node.js `process.kill()` instead |
| f082 | Auto-grading must run post-exit, not as Stop hook | Stop fires every turn. dispatch.sh calls auto-grade.js after exit. |

---

## What's Next for v1.5

### P0: Complete Integration

| Task | Why | Complexity |
|------|-----|-----------|
| **Dashboard performance** | Takes 10s to load. Likely sync file reads or Cerebras API calls. User notices. | Medium — needs profiling |
| **Workflow page update** | Auto-dispatch fundamentally changed the workflow. The workflow tab must reflect this. | Medium |
| **Debrief liveness** | Debrief tab is static — last touched a day ago. Should update in real-time as agents complete. Auto-populate wins/losses from auto-grade results. | Medium |
| **Test card cleanup** | Test dispatch agents clutter campaigns. Need visual distinction or auto-cleanup convention. | Small |
| **Tab focus stealing** | wt.exe has no `--no-focus` flag (GitHub issue #17460). `focus-tab -t 0` is partial workaround. | Small (workaround) |

### P1: Original Jobs 2-4

| Job | Task | Status from v1.4 |
|-----|------|-------------------|
| **Job 2** | Break orchestrator skill into phase-specific skills | NOT STARTED. The monolithic SKILL.md has 8 phases in one file. Each phase should become a loadable skill. |
| **Job 3** | Agent auto-linking improvements | PARTIALLY DONE. /api/launch pre-links session ID. prompt-hook.js auto-detection still works. What's left: improve accuracy of name matching. |
| **Job 4** | Notification sound design system | PARTIALLY DONE. LoL ping works for completion. Need: different sounds for different events (needs input, dispatched, error). UI legend showing what each sound means. |

### P2: Post-Integration Polish

| Task | Notes |
|------|-------|
| Agent communication channel | Agents should write deliverables/missed to campaigns.json so user sees results without opening terminal |
| Auto-grade manual override | Deliverables defaults to 30/40 for completed agents. Orchestrator/user should override with actual assessment. |
| Retroactive grading for v1.3 agents | Run auto-grade.js on old sessions to fill in lifecycle data |
| Sound design system | Different audio cues for different events. UI to show what each sound means. |

---

## Key User Preferences (Reinforced This Session)

1. **Parse EVERY voice prompt** (f065) — user dictates via Wispr Flow. Parse → confirm → act.
2. **Single pane of glass** — everything visible from campaigns page. No switching between 3 windows.
3. **Orchestrator is separate** — dedicated tab, not mixed with regular agents.
4. **Everything should be LIVE** — debrief, campaigns, orchestrator tab. Static data = stale data.
5. **LoL ping for notifications** — `notify-ping.wav` at 40% volume. Success = single, error = double.
6. **`--dangerously-skip-permissions`** is always on. Safety comes from hooks, not permission prompts.
7. **Build it yourself when bootstrapping** — the dispatch system couldn't be built by dispatching agents. Orchestrator Rule 12 (small fixes OK) applies to infrastructure work.
8. **Don't make me copy-paste** — the whole point of auto-dispatch.

## Data File State

- `campaigns.json` — 1 campaign, 27 agents (Sprint 8 has 2: Orchestrator v1.4 + Integration Test)
- `findings.json` — 76+ findings (f077-f082 added this session but not yet written to file)
- `dispatch.json` — 13 post-mortems
- `MEMORY.md` — stable patterns only
- Orchestrator skill — `.claude/skills/orchestrator/SKILL.md` (v2)
- Grading skill — `.claude/skills/agent-grading/SKILL.md`
- **NEW:** `auto-grade.js`, `dispatch.sh`, `guard-destructive.sh`, `notify-ping.wav`
- **NEW:** Orchestrator tab on campaigns page

## How to Resume

1. Open a new Claude Code terminal
2. Start with: "You are Orchestrator v1.5. Read `.claude/agent-hub/coordinated-sprint/orchestrator-v1.4-handoff.md` and the orchestrator skill. Then check campaigns at http://localhost:3033/campaigns."
3. **First priority:** Dashboard performance + debrief liveness (P0 integration items)
4. **Second priority:** Job 2 (break orchestrator skill into phase skills)
5. **Third priority:** Workflow page update to reflect auto-dispatch
