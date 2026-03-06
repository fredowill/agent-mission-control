# Work Laptop Sync Prompt

## Flow
1. Work laptop pushes its unique data to the **Mission Control repo** (this prompt)
2. Home computer pulls, merges with local changes
3. Home computer pushes the complete package
4. Work laptop pulls — gets everything

The only shared repo between machines is **Mission Control** (`fredowill/agent-mission-control`), located at `.claude/agent-hub/` on each machine.

---

## Prompt to paste on work laptop:

I need to export this work laptop's unique data into the Mission Control repo so my home computer can pull it. The MC repo is at `.claude/agent-hub/`. Follow these rules exactly:

### Rules
- **Only ADD files** — do NOT modify or delete anything already committed
- **Do NOT touch** server.js, any *-page.html, hook.js, prompt-hook.js, or .gitignore — those have changes coming from the home computer
- **Do NOT push runtime data** — states/, logs/, prompts/, summaries.json, deep-summaries.json, .env are machine-specific
- **Everything goes into `toolbox/`** — a new directory inside agent-hub. This avoids .gitignore conflicts (the current .gitignore may block dispatch.json and other config files from being added directly)

### Step 1: Create the export directory

```bash
cd .claude/agent-hub
mkdir -p toolbox/agents toolbox/skills toolbox/commands toolbox/scripts toolbox/config
```

### Step 2: Copy toolbox files

```bash
# Agent definitions
cp ../agents/*.md toolbox/agents/ 2>/dev/null

# Skill directories (each skill is a folder with SKILL.md inside)
cp -r ../skills/* toolbox/skills/ 2>/dev/null

# Slash commands
cp ../commands/*.md toolbox/commands/ 2>/dev/null

# Project hook scripts (if they exist)
cp ../scripts/*.sh ../scripts/*.js toolbox/scripts/ 2>/dev/null

# Project settings (hook registrations)
cp ../settings.json toolbox/config/settings.json 2>/dev/null
```

### Step 3: Export config data

Copy the config files into `toolbox/config/` to avoid .gitignore blocks:

```bash
cp dispatch.json toolbox/config/dispatch.json 2>/dev/null
cp workstreams.json toolbox/config/workstreams.json 2>/dev/null
cp sources.json toolbox/config/sources.json 2>/dev/null
cp mc-backlog.json toolbox/config/mc-backlog.json 2>/dev/null
```

### Step 4: Verify the export

```bash
echo "=== Agents ==="
ls toolbox/agents/
echo "=== Skills ==="
ls toolbox/skills/
echo "=== Commands ==="
ls toolbox/commands/
echo "=== Scripts ==="
ls toolbox/scripts/
echo "=== Config ==="
ls toolbox/config/
```

Tell me what's in each directory before pushing.

### Step 5: Commit and push

```bash
git add toolbox/
git status  # should ONLY show new files in toolbox/
git commit -m "sync: export work laptop toolbox and config data"
git push origin main
```

### What NOT to do
- Do NOT run `git add .` or `git add -A` — only add `toolbox/`
- Do NOT modify server.js or any HTML page files
- Do NOT update .gitignore
- Do NOT push states/, logs/, prompts/, summaries, or .env
- Do NOT restructure or rename any existing files
- If `git push` fails due to diverged branches, tell me — do NOT force push

### Important: use your own judgment
These instructions were written by another Claude session on a different machine. That session did NOT have visibility into this laptop's exact state — file paths, directory structure, what exists or doesn't exist here may differ from what was assumed. If something doesn't match (a directory doesn't exist, a file is in a different location, a command fails, or you notice data that these instructions don't account for), **stop and reason about it**. Don't blindly follow steps that don't make sense for this machine's actual state. Ask the user if you're unsure. The goal is to get ALL unique work laptop data into the `toolbox/` directory and pushed — use whatever approach makes sense to achieve that, even if it deviates from the exact commands above.
