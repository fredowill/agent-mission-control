# Work Laptop: Pull & Integrate Home Changes

## Context
The home computer just pushed a massive Mission Control update to both repos:
- **phredomade repo**: Toolbox files (.claude/agents/, skills/, commands/, scripts/, settings.json) now git-tracked
- **Mission Control repo** (agent-mission-control): New Home/Work mode toggle, workstream management, data-driven findings, toolbox context, dispatch context filtering, and more

Your work laptop already pushed its toolbox to `toolbox/` in the MC repo. Now you need to pull the home changes and integrate.

## Steps

### 1. Pull the Mission Control repo

```bash
cd <path-to-mission-control-repo>   # wherever agent-mission-control is cloned
git pull origin main
```

This will bring in:
- Updated server.js (mode toggle, new APIs, toolbox directory scanning)
- Updated HTML pages (dispatch V2, findings, workflow, toolbox — all with Home/Work toggle)
- New config files: areas.json, findings.json, workstreams.json, toolbox-context.json, dispatch.json
- Your toolbox/ directory (already there from your earlier push)

### 2. Restart the MC server

```bash
# Kill existing server if running
# Then start with the new code
node server.js
```

The server should start on port 3033. Check http://localhost:3033 — you should see the toggle in the header.

### 3. Verify the toggle works

- Open http://localhost:3033/dispatch — you should see the Home/Work toggle next to "Mission Control" logo
- Toggle to Work mode — you should see AQG, CARES, Matching, API workstreams
- Toggle to Home mode — you should see Mission Control, Portfolio Site, Personal workstreams
- Open http://localhost:3033/tools — Work mode should show YOUR agents (architect, planner, code-reviewer, etc.)

### 4. Check for issues

Things that might need attention:
- **Hooks**: The server reads hooks from `.claude/settings.json` relative to the project. Your work laptop's project structure may differ from home. If the workflow page shows missing hooks, check the paths.
- **CLAUDE.md**: The workflow page looks for CLAUDE.md at `../../CLAUDE.md` relative to agent-hub. If your MC repo isn't inside a project directory, CLAUDE.md won't be found. This is fine — it just won't show on the workflow page.
- **Memory files**: Same — memory files are read from `~/.claude/projects/<cwd-slug>/memory/`. These are machine-local and won't sync.
- **Toolbox context**: `toolbox-context.json` maps tools to home/work. Your work tools should be tagged "work". If something is miscategorized, use the API: `POST /api/toolbox-context` with `{"name": "tool-name", "context": "work"}`.
- **Workstreams**: Open the gear icon (bottom-right of dispatch page) to verify workstream names, colors, and contexts are correct. You can edit them inline.

### 5. If the phredomade repo is NOT on this machine

The phredomade repo tracks toolbox files via `.gitignore` whitelist. This only matters on the home computer. On the work laptop, your toolbox files are in your own project's `.claude/` directory and are exported to `toolbox/` in the MC repo. No action needed for phredomade.

### 6. What NOT to do
- Do NOT delete the `toolbox/` directory — it's the bridge between machines
- Do NOT modify .gitignore unless you understand the whitelist rules
- Do NOT force push — if there's a conflict, resolve it or ask
- If something looks wrong, check the MC server console for errors before debugging

### 7. Known differences between machines
- **Session data** (states/, logs/, prompts/) is machine-specific — you'll have your own sessions, not home's
- **Summaries and Top of Mind** are regenerated per machine by Cerebras
- **mode.json** is machine-local — your default mode won't change just from pulling
- **Agent workstream assignments** are machine-specific — agents you run get classified locally
