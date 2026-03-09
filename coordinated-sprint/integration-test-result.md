# Integration Test v5 — Full Pipeline Result

**Agent:** Full Pipeline Test
**Date:** 2026-03-08
**Purpose:** Validate auto-dispatch integration, lifecycle visibility, and dashboard tracking

---

## What dispatch.sh Does

`dispatch.sh` is the entry point for auto-dispatched agents. It runs inside a new Windows Terminal tab opened by `wt.exe`.

**Inputs:** agent name, prompt file path, session ID, mode (auto|interactive), auto-close flag

**Flow:**
1. Validates required arguments (agent name, prompt file, session ID) and prompt file existence
2. `cd`s to the phredomade repo root (`/c/Users/ephra/phredomade`)
3. Unsets `CLAUDECODE` env var to prevent "nested session" errors (MC server inherits from orchestrator)
4. Constructs a trigger message telling the agent to follow the 5-stage Agent Lifecycle
5. Runs `claude` with `--append-system-prompt-file` (mission brief) and `--dangerously-skip-permissions`
   - **Auto mode** (default, `-p`): headless, runs to completion, `--verbose` flag
   - **Interactive mode**: full TUI, user can interact
6. Runs `auto-grade.js` to analyze activity log and write grade to campaigns.json
7. Plays a sound notification: chimes.wav for success, beep tone for failure
8. Prints exit status and a resume command (`claude --resume <session-id>`)
9. Either auto-closes tab (if `close` flag + success) or keeps terminal open via `exec bash`

---

## /api/launch Endpoint — Confirmed

The `/api/launch` POST endpoint exists at server.js line 2432. It:

1. Accepts `{ agentName, promptFile, campaignId, slot, mode, autoClose }` in the request body
2. Generates a deterministic session ID via `crypto.randomUUID()`
3. Resolves prompt file path relative to agent-hub directory; returns 404 if not found
4. Pre-links the session to a campaign agent card in `campaigns.json` (sets `sessionId` and `status: 'active'`)
5. Creates a pre-state file in `states/` with dispatch metadata:
   - `parentSessionId` from `x-parent-session` header
   - `dispatchMeta`: agentName, campaignId, slot, mode, dispatchedAt
   - Initial state: `launching` with rocket emoji
6. Writes a temp launcher `.sh` script to avoid wt.exe/spawn/cmd.exe triple-quoting issues
7. Spawns `wt.exe new-tab` with the launcher script

---

## Skills Found (36 total)

| Category | Skills |
|----------|--------|
| **Agent/Orchestration** | agent-development, agent-grading, agent-skill-creator, orchestrator, dispatching-parallel-agents, subagent-driven-development |
| **Planning/Execution** | brainstorming, writing-plans, executing-plans, verification-before-completion |
| **Design/UI** | frontend-design, design-md, enhance-prompt, impeccable-adapt, impeccable-animate, impeccable-audit, impeccable-bolder, impeccable-clarify, impeccable-colorize, impeccable-critique, impeccable-delight, impeccable-distill, impeccable-extract, impeccable-frontend-design, impeccable-harden, impeccable-normalize, impeccable-onboard, impeccable-optimize, impeccable-polish, impeccable-quieter, impeccable-teach-impeccable |
| **Development** | skill-builder, skill-creator, systematic-debugging, test-driven-development, writing-hookify-rules |

---

## Lifecycle Stages Completed
- [x] Stage 1: DEFINE — Read dispatch.sh, server.js /api/launch (lines 2431-2500), CLAUDE.md
- [x] Stage 2: DISCOVER — Listed 36 available skills across 4 categories
- [x] Stage 3: EXECUTE — Created this result file with system summary
- [x] Stage 4: REASON — Read-back verified accurate, v5 adds auto-grade + sound + autoClose details missing in v4
- [x] Stage 5: VERIFY — Dashboard reports 76 total sessions, 3 active. Tracking confirmed.
