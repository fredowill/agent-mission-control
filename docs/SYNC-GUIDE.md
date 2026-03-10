# Cross-Machine Sync Guide

## After pulling on a new/different machine:

```bash
cd <your-project-root>   # wherever .claude/agent-hub/ lives

# 1. Setup hooks with correct paths for this machine
bash .claude/agent-hub/setup-hooks.sh

# 2. Copy scripts from toolbox to .claude/scripts/ (if not already there)
mkdir -p .claude/scripts .claude/hooks
cp .claude/agent-hub/toolbox/scripts/* .claude/scripts/
cp .claude/agent-hub/toolbox/hooks/* .claude/hooks/

# 3. Copy skills you want from toolbox to .claude/skills/
# Home skills:
cp -r .claude/agent-hub/toolbox/skills/brainstorming .claude/skills/
cp -r .claude/agent-hub/toolbox/skills/frontend-design .claude/skills/
# ... or copy all:
cp -r .claude/agent-hub/toolbox/skills/* .claude/skills/

# 4. Copy agents from toolbox to .claude/agents/
cp .claude/agent-hub/toolbox/agents/* .claude/agents/

# 5. Start the MC server (optional — not needed for basic Claude Code usage)
node .claude/agent-hub/server.js

# 6. Toggle to your machine's mode
# Visit http://localhost:3033 and click the Home/Work toggle
```

## What syncs via git (agent-hub repo):
- MC server, pages, and data (campaigns, dispatch, findings)
- Toolbox directory (copies of all skills, agents, commands, hooks from both machines)
- PRDs and handoff docs
- Auto-grade and review pipeline

## What does NOT sync (machine-specific):
- `.claude/settings.json` — generated per-machine by `setup-hooks.sh`
- `.claude/skills/`, `.claude/agents/` — copied from toolbox after pull
- `mode.json` — each machine sets its own mode
- State files, logs, transcripts — per-machine session data

## Troubleshooting

**Toolbox shows 0 items:** Check mode. Home mode shows home tools, Work mode shows work tools. Toggle to your machine's mode.

**Hooks not firing:** Run `bash .claude/agent-hub/setup-hooks.sh` to regenerate settings.json with correct paths.

**Skills not loading:** Copy from toolbox: `cp -r .claude/agent-hub/toolbox/skills/* .claude/skills/`
