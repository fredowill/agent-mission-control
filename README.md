<p align="center">
  <img src="https://img.shields.io/badge/zero_dependencies-black?style=flat-square" />
  <img src="https://img.shields.io/badge/node_18+-black?style=flat-square" />
  <img src="https://img.shields.io/badge/claude_code-hooks-black?style=flat-square" />
</p>

<h1 align="center">Mission Control</h1>
<p align="center">A real-time PM dashboard for Claude Code agents.<br/>See what every agent is doing. Know when one needs you. Never lose context.</p>

---

## The problem

You're running 4 Claude Code terminals. One is refactoring your API. One is writing tests. One asked you a question 3 minutes ago and you didn't notice. One finished and you forgot what it was doing.

Mission Control watches all of them from one tab.

```
  ┌───────────────────────────────────────────────────────────────┐
  │  ●  Mission Control            Dashboard  Findings  Toolbox   │
  ├───────────────────────────────────────────────────────────────┤
  │                                                               │
  │  TOP OF MIND                                          2m ago  │
  │                                                               │
  │  Building the architecture visualization page and crafting    │
  │  the travel itinerary map. Meanwhile, addressing              │
  │  plan/resume fixes for command reliability.                   │
  │                                                               │
  │  ╭───────────────╮ ╭──────────────╮ ╭───────────────╮        │
  │  │ Visualization │ │  Planning    │ │  Automation   │        │
  │  ╰───────────────╯ ╰──────────────╯ ╰───────────────╯        │
  │                                                               │
  │  ┌──────────────────┐  ┌──────────────────┐                  │
  │  │ ◉ Writing    now  │  │ ◉ Research  3m   │                  │
  │  │                   │  │                   │                  │
  │  │ Redesigning the   │  │ Building travel   │                  │
  │  │ MC dashboard      │  │ itinerary map     │                  │
  │  │           3x ctx  │  │                   │                  │
  │  └──────────────────┘  └──────────────────┘                  │
  │                                                               │
  │  ┌──────────────────┐  ┌──────────────────┐                  │
  │  │ ◉ Needs input     │  │ ○ Done      14m  │                  │
  │  │                   │  │                   │                  │
  │  │ Fixing plan and   │  │ Setting up email  │                  │
  │  │ resume commands   │  │ with Resend       │                  │
  │  └──────────────────┘  └──────────────────┘                  │
  └───────────────────────────────────────────────────────────────┘
```

---

## How it works

Three Claude Code hooks feed data into flat files. A zero-dependency Node server reads them and serves a dashboard that polls every 1.5 seconds.

```
  Agent uses a tool             You send a prompt            Agent's turn ends
       │                              │                            │
       ▼                              ▼                            ▼
   PostToolUse hook             UserPromptSubmit hook          Stop hook
       │                              │                            │
       ▼                              ▼                            │
  ┌─────────────┐             ┌──────────────┐                     │
  │ states/     │             │ prompts/     │                     │
  │ {sid}.json  │             │ {sid}.ndjson │                     │
  └──────┬──────┘             └──────┬───────┘                     │
         │                           │                             │
         └───────────┬───────────────┘                             │
                     ▼                                             │
              server.js:3033                                       │
              ├─ reads state files                                 │
              ├─ checks PIDs (is terminal still open?)             │
              ├─ merges sessions (same terminal = one card)        │
              └─ calls Cerebras AI (summarize, brief)              │
                     │                                             │
                     ▼                                             │
              Dashboard UI ◀──── polls /api/agents every 1.5s     │
              ├─ Agent cards with live state                       │
              ├─ Top of Mind briefing                              │
              ├─ Browser notification: "Agent needs your input"  ◀─┘
              └─ Filter: Active / All / Done / Archived
```

---

## Setup

**1. Copy files into your project**

```
your-project/.claude/agent-hub/
├── server.js
├── hook.js
├── prompt-hook.js
├── find-claude-pid.ps1
├── findings-page.html
├── logic-page.html
└── tools-page.html
```

**2. Register hooks** in `.claude/settings.json`

```json
{
  "hooks": {
    "PostToolUse": [{
      "matcher": ".*",
      "hooks": [{ "type": "command", "command": "node .claude/agent-hub/hook.js" }]
    }],
    "Stop": [{
      "matcher": "",
      "hooks": [{ "type": "command", "command": "node .claude/agent-hub/hook.js" }]
    }],
    "UserPromptSubmit": [{
      "matcher": "",
      "hooks": [{ "type": "command", "command": "node .claude/agent-hub/prompt-hook.js" }]
    }]
  }
}
```

**3. Start**

```bash
node .claude/agent-hub/server.js
# → http://localhost:3033
```

**4. (Optional) AI summaries** — get a free key from [cloud.cerebras.ai](https://cloud.cerebras.ai)

```bash
echo "CEREBRAS_API_KEY=csk-your-key" > .claude/agent-hub/.env
```

---

## Features

### Agent state detection

Every tool the agent calls maps to a human-readable state:

| State | Tools | Color |
|-------|-------|-------|
| **Researching** | Read, Grep, Glob, WebFetch, WebSearch | `blue` |
| **Writing** | Write, Edit, NotebookEdit | `amber` |
| **Planning** | Task, EnterPlanMode | `purple` |
| **Verifying** | Bash | `green` |
| **Needs input** | AskUserQuestion | `amber` pulsing |
| **Thinking** | *(between tool calls)* | `purple` pulsing |
| **Done** | *(terminal closed)* | `green` faded |

### Session chaining

When Claude Code transitions modes (`/plan` → implement, `/compact`), it creates a new session ID but the same process stays alive. Mission Control detects this by walking the Windows process tree to find the parent `claude.exe` PID. Sessions sharing a PID merge into one card — one terminal, one card, combined prompts.

### AI-powered summaries (Cerebras free tier)

| Feature | What it does | When |
|---------|-------------|------|
| **Card title** | 5-10 word summary from your prompts | Every 30s for new sessions |
| **Top of Mind** | 2-3 sentence briefing across all active agents | When titles change or >5 min stale |
| **Deep summary** | Narrative with sections, decisions, citations | On-demand (session detail page) |

Free tier: 1M tokens/day, 30 RPM. Typical usage: ~50K tokens/day with 5 active agents.

### Browser notifications

The moment an agent calls `AskUserQuestion`, you get a browser notification + amber pulsing banner. No more checking terminals to see who's waiting.

---

## Pages

| Page | Route | Purpose |
|------|-------|---------|
| **Dashboard** | `/` | Agent grid, Top of Mind, filters, live stats |
| **Session detail** | `/session/:id` | Prompt timeline, deep summary, activity log |
| **Findings** | `/findings` | Documented discoveries from past sessions |
| **Toolbox** | `/tools` | Agent roster + slash commands at a glance |
| **Logic** | `/logic` | System health, hook status, pipeline diagram |

---

## API

| Endpoint | Description |
|----------|-------------|
| `GET /api/agents` | All agent cards with live state |
| `GET /api/northstar` | Top of Mind briefing + theme tags |
| `GET /api/agents/:id/prompts` | Prompt history for a session |
| `GET /api/agents/:id/log` | Activity timeline (state transitions) |
| `GET /api/agents/:id/deep-summary` | Deep narrative summary |
| `POST /api/missions` | Set a manual card title `{sessionId, mission}` |
| `DELETE /api/agents/:id` | Remove a session and all its data |
| `GET /api/tools` | Agent definitions + slash commands |
| `GET /api/logic` | System health check |

---

## Configuration

### Thresholds (in `server.js`)

| What | Default | Description |
|------|---------|-------------|
| `PORT` | 3033 | Dashboard port |
| `STALE_MS` | 6 hours | Fade done cards after this |
| `ACTIVE_THRESHOLD` | 2 min | Fallback liveness (no PID) |
| `PID_CACHE_TTL` | 3 sec | Cache `tasklist` call |
| Summarization loop | 30 sec | Check for new sessions to summarize |
| Dashboard poll | 1.5 sec | Frontend refresh rate |
| API rate limit | 25/min | Stay under Cerebras 30 RPM |

---

## Design

Zero dependencies. No React, no bundler, no CSS framework. Just one Node.js server serving inline HTML with vanilla JS.

**Typography:** Plus Jakarta Sans, DM Sans, DM Mono (Google Fonts)

**State colors:** Green for active/verified, blue for research, amber for writing/waiting, purple for planning/thinking

**Inspired by:** Linear, Vercel Dashboard, Apple HIG

---

## Running on a second machine

Mission Control is 100% file-based — no database, no Docker, no `npm install`. If you can clone the repo and run `node`, you're done.

### What to do

**1. Copy the files** into your project's `.claude/agent-hub/` (same structure as Setup above).

**2. Register the hooks** in `.claude/settings.json` — same JSON as Setup step 2. The hook commands use relative paths (`node .claude/agent-hub/hook.js`) so they work on any machine without editing.

**3. Handle the transcript directory** — `server.js` has one hardcoded path near the top:

```js
const TRANSCRIPTS_DIR = path.join(
  process.env.HOME || process.env.USERPROFILE || '',
  '.claude', 'projects', 'C--Users-ephra-phredomade'  // ← machine-specific
);
```

This reads Claude Code conversation transcripts for fallback prompt extraction after auto-compact. **It's optional** — the dashboard works without it. To make it portable, replace with:

```js
// Auto-detect transcript dir from repo path
const PROJECT_SLUG = path.resolve(__dirname, '..', '..')
  .replace(/^\//, '').replace(/[/\\:]/g, '-');
const TRANSCRIPTS_DIR = path.join(
  process.env.HOME || process.env.USERPROFILE || '',
  '.claude', 'projects', PROJECT_SLUG
);
```

**4. Add `.env`** with your Cerebras key (optional, same as Setup step 4).

**5. Start** — `node .claude/agent-hub/server.js` → `http://localhost:3033`

### What you get

Each machine runs its own Mission Control instance tracking its own local Claude Code sessions. The hooks fire locally, write to local files, and the local server reads them. No network sync needed — each machine is self-contained.

### What if I want both machines in one dashboard?

Not supported yet. Each instance is local-only. Future options:
- **Shared filesystem** (NFS, SMB, Syncthing) pointing both machines' `agent-hub/` data dirs at the same location
- **Central server** — extend the API to accept remote hook POSTs and aggregate sessions
- **SSH tunnel** — `ssh -L 3033:localhost:3033 user@other-machine` to view one machine's dashboard from the other

---

## Platform notes

PID-based liveness uses Windows `tasklist` and PowerShell (`find-claude-pid.ps1`). The dashboard, hooks, and AI features are cross-platform — only the process detection needs adapting for macOS/Linux.

### Windows → macOS/Linux changes

**`server.js`** — replace the `tasklist` call (~line 83):

```js
// Windows (current):
execSync('tasklist /FI "IMAGENAME eq claude.exe" /FO CSV /NH', ...)

// macOS/Linux:
execSync('pgrep -x claude', ...)
```

**`hook.js`** — replace the PowerShell PID resolution. The hook calls `find-claude-pid.ps1` to walk the process tree from the hook's parent PID up to find `claude.exe`. On macOS/Linux, replace with:

```bash
# Walk up process tree to find claude ancestor
pid=$PPID
while [ "$pid" != "1" ] && [ -n "$pid" ]; do
  name=$(ps -o comm= -p "$pid" 2>/dev/null)
  if [ "$name" = "claude" ]; then echo "$pid"; exit 0; fi
  pid=$(ps -o ppid= -p "$pid" 2>/dev/null | tr -d ' ')
done
```

If both machines are Windows, no platform changes needed.

---

## Troubleshooting

**No cards appearing?**
- Open a Claude Code session, use any tool, then check `agent-hub/states/` for a new `.json` file
- If nothing appears, hooks aren't firing — verify `.claude/settings.json` has the hooks registered
- Test the hook directly: `node .claude/agent-hub/hook.js` (it'll error about missing env vars, but at least confirms the path resolves)

**Cards stuck on "Idle" after sending a prompt?**
- Known ~30s timing gap between receiving a prompt and the first tool call
- `prompt-hook.js` partially mitigates this by writing a "thinking" state immediately
- The gap is a Claude Code limitation — no hook fires for "agent is thinking"

**AI summaries not generating?**
- Verify `.env` has a valid `CEREBRAS_API_KEY`
- Check server stdout for rate limit errors (free tier = 30 RPM)
- Summaries are optional — the dashboard works fully without them

**Port 3033 already in use?**
- Windows: `netstat -ano | findstr 3033`
- macOS/Linux: `lsof -i :3033`
- Kill the process or change `PORT` on line 13 of `server.js`

**Hook paths not resolving?**
- The hook commands in `settings.json` run from the project root (where you launched Claude Code)
- Verify with: `node -e "console.log(require('path').resolve('.claude/agent-hub/hook.js'))"`
- If you use absolute paths, update them for each machine

---

## Stack

- Node.js `http` — no Express, no frameworks
- Cerebras API — free Llama-based models for summarization
- PowerShell — Windows process tree walking (see Platform notes for macOS/Linux)
- Vanilla JS + CSS — the entire UI is a template literal in `server.js`

**4,300 lines. Zero dependencies. One command to run.**
