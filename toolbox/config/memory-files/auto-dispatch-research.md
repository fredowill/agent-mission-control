# Auto-Dispatch Infrastructure Research

**Date:** March 8, 2026 | **Status:** Complete research summary

## What Exists

### 1. Hooks (Fire-and-forget event capture)
- **prompt-hook.js** — UserPromptSubmit hook, appends to `.claude/agent-hub/prompts/{sid}.ndjson`
  - Detects and collapses skill expansions to short markers
  - Dedup guard (last 3 lines, 5s window)
  - Auto-links agent sessions to campaigns if first prompt mentions agent name
  - Filters system messages (`<task-notification>`, `<system-reminder>`)
  - Sets terminal title via `process.title` (Windows: SetConsoleTitleW Win32 API)
  - Captures Claude PID on first fire, stores in state file

- **hook.js** — PostToolUse + Stop hook, writes state file + activity log
  - Walks process tree via PowerShell to find `claude.exe` PID (first fire only, cached)
  - Maps tool names to state: Read/Grep/Glob → investigating, Write/Edit → developing, Bash → verifying, etc.
  - Tracks `resumeCount` when session is /resume'd in new terminal
  - Generates `statusLine` for orchestrator visibility
  - Appends to `.claude/agent-hub/logs/{sid}.ndjson` (activity history)
  - Optional debug logging to `debug-events.ndjson` (via `DEBUG_EVENTS=true` in .env)

### 2. Server Infrastructure
- **server.js** (~56KB) — Node.js server on port 3033
  - API endpoints: `/api/agents`, `/api/missions`, `/api/campaigns`, `/api/logic`, `/api/tools`, `/api/findings`, `/api/areas`, etc.
  - `readAgents()` (lines 518-587) — reads states, logs, prompts to render dashboard
  - PID liveness cache: `getLiveClaudePids()` caches `tasklist` output for 1.5s (reduced from 3s)
  - Agent merging: sessions sharing a `claudePid` consolidated into one card
  - Session states: thinking, investigating, developing, verifying, waiting, idle, done
  - Serves prompt files via `/api/brief/` endpoint (plain text for Copy Prompt buttons)

- **PowerShell helper** — `find-claude-pid.ps1`
  - Walks process tree from child PID upward (max 10 generations)
  - Finds first ancestor matching 'claude' in process name
  - Returns PID or exit 1 if not found

### 3. Data Files
- **State files** — `.claude/agent-hub/states/{sid}.json`
  ```json
  {
    "sessionId": "...",
    "state": "thinking|investigating|developing|waiting|idle|done",
    "tool": null,
    "detail": "file.tsx",
    "statusLine": "Reading file.tsx",
    "ts": 1234567890,
    "claudePid": 1234,
    "resumeCount": 0,
    "displayName": "Fix gallery grid",
    "emoji": "💭",
    "label": "THINKING"
  }
  ```

- **Prompt files** — `.claude/agent-hub/prompts/{sid}.ndjson` (append-only sacred user data)
  ```ndjson
  {"prompt": "fix the X", "ts": 1234567890, "type": "user"}
  {"prompt": "/skill was used", "ts": 1234567891, "type": "skill", "originalLength": 4200}
  ```

- **Activity logs** — `.claude/agent-hub/logs/{sid}.ndjson` (state transitions)
  ```ndjson
  {"state": "investigating", "emoji": "🔍", "tool": "Read", "detail": "file.tsx", "ts": 1234567890}
  ```

### 4. Pages/UI
- **logic-page.html** — System architecture audit with:
  - Trust statement (the #1 goal: cards say "active" = actually running right now)
  - Bug tracker: 6 fixed, 3 open (major: sync reads on poll; minor: auto-archive, done state)
  - Terminal deep-dive section
  - Architecture overview
  - Live diagnostics
  - Session audit table

### 5. What Does NOT Exist

**NO auto-dispatch mechanism yet.** The orchestrator v1.3 handoff (line 60-64) identifies this as Job 1 (P0):

> "Research `claude -p "prompt"` and `--append-system-prompt` for non-interactive agent launch. Build a flow where the orchestrator writes the prompt file AND launches the agent in a visible new terminal. The user should never copy-paste a prompt again."

Explicitly mentioned: "Investigate: can you open a new Windows Terminal tab/pane programmatically? `wt -w 0 new-tab cmd /c claude -p "..."` may work."

## Key Patterns to Build On

1. **Fire-and-forget hooks** — add Claude Code hooks to `.claude/.claude.json` configuration
2. **PID-based session tracking** — each session has a unique `claude.exe` PID, stored and checked for liveness
3. **State files** — single source of truth for session state, read on every poll
4. **Activity logs** — append-only for historical audit trail
5. **No manual close event** — liveness inferred from PID check, not explicit event
6. **Auto-naming** — terminal title set from first prompt, session display name derived

## Unknowns / To Be Determined

1. **Claude CLI surface** — exact syntax for `-p` prompt injection and `--append-system-prompt`
2. **Windows Terminal automation** — whether `wt.exe -w 0 new-tab cmd /c ...` is viable
3. **Integration with existing hooks** — how auto-dispatch launcher fits into current hook pipeline
4. **Prompt file lifecycle** — whether pre-written prompt files (for Copy Prompt) should be auto-cleaned after consumption
5. **Session ID generation** — should auto-dispatch generate deterministic IDs or rely on hook's ppid-based fallback?

## Related Findings

- **f077** — "Fix the Workflow" (auto-dispatch is the infrastructure blocker)
- **PM007** — Notification sound (when agent finishes or needs input)
- **f070** — 5-step dispatch checklist (file + campaigns.json + /prompts + verify + tell user)
- **f075** — Toolbox agents built for phredomade, not MC (skill gap root cause)

## Files to Integrate With

- `.claude/agent-hub/server.js` — add auto-dispatch endpoint
- `.claude/agent-hub/prompt-hook.js` — auto-launch logic
- `.claude/skills/orchestrator/SKILL.md` — Phase 5 dispatch workflow
- `.claude/agent-hub/campaigns.json` — agent card auto-linking
