# 🏠 Home PC: MC Reorganization + .claude/ Sync

## Known Paths (confirmed by user)

| What | Current Path |
|------|-------------|
| 🏠 **Phredomade root** | `~/phredomade/` (C:/Users/ephra/phredomade/) |
| 📁 **MC repo** | `~/phredomade/.claude/agent-hub/` |
| ⚙️ **MC server** | `~/phredomade/.claude/agent-hub/server.js` |
| 🔗 **Git remote** | `fredowill/agent-mission-control` |
| 🛠️ **Claude config** | `~/phredomade/.claude/` (project-level — skills, hooks, rules live here) |

## What we're doing

1. Extracting MC from inside phredomade → its own project at `~/projects/agent-mission-control/`
2. Setting up NTFS junctions so `~/.claude/skills/` etc. point to MC's `toolbox/`
3. Preserving ALL of home's hooks, skills, and formatting — home is authoritative

## ⚠️ CRITICAL: HOME WINS

Home has the better hooks, better formatting, better emoji standards. When merging home content into the toolbox, **always keep home's version** over work's. The work machine explicitly defers to home on conflicts.

---

## Phase 1: Back up (do this FIRST, before anything else)

```bash
mkdir -p ~/backup-$(date +%Y%m%d)
cp -r ~/phredomade/.claude ~/backup-$(date +%Y%m%d)/dot-claude-backup
echo "✅ Backup done"
ls ~/backup-$(date +%Y%m%d)/
```

---

## Phase 2: Pull work's changes into MC repo

This is SAFE — only touches files inside `agent-hub/`. Does NOT touch your skills, hooks, or rules.

```bash
cd ~/phredomade/.claude/agent-hub
git pull origin main
```

You'll get new files in `toolbox/`: rules/, setup.sh, machine-config.json, settings.template.json. These sit harmlessly inside the repo until you explicitly use them.

---

## Phase 3: Merge home content INTO toolbox (HOME WINS)

Home has authoritative versions. Copy them INTO `toolbox/` so they become the git-tracked source of truth.

### 3a: Skills

```bash
# Diff home skills vs toolbox skills — find what's only on home
diff <(ls ~/phredomade/.claude/skills/ | sort) <(ls ~/phredomade/.claude/agent-hub/toolbox/skills/ | sort)
```

For every skill that exists on home but NOT in toolbox (especially `deep-research`):
```bash
cp -r ~/phredomade/.claude/skills/<name> ~/phredomade/.claude/agent-hub/toolbox/skills/
```

### 3b: Hooks (HOME WINS — these are better)

```bash
# Copy home's hooks into toolbox, overwriting work's versions
cp ~/phredomade/.claude/hooks/* ~/phredomade/.claude/agent-hub/toolbox/hooks/
```

### 3c: Rules

```bash
# Diff and merge — work added 00-topic-context.md and 00-agent-lifecycle.md which home doesn't have
# Home may have rules that work doesn't — copy those too
diff <(ls ~/phredomade/.claude/rules/ 2>/dev/null | sort) <(ls ~/phredomade/.claude/agent-hub/toolbox/rules/ | sort)

# Copy any home-only rules into toolbox
# Keep work's 00-topic-context.md and 00-agent-lifecycle.md (home doesn't have these)
```

### 3d: Scripts, Agents, Commands

Same pattern — diff, copy home-only files into toolbox. Home wins on conflicts.

### 3e: Commit the merge

```bash
cd ~/phredomade/.claude/agent-hub
git add toolbox/
git commit -m "feat: merge home-authoritative content — hooks, deep-research, formatting"
git push origin main
```

---

## Phase 4: Move MC out of phredomade

MC is currently buried inside phredomade's `.claude/` directory. It should be its own project.

```bash
# Create projects directory
mkdir -p ~/projects

# Move the MC repo
mv ~/phredomade/.claude/agent-hub ~/projects/agent-mission-control

# Verify git still works
cd ~/projects/agent-mission-control
git status
git remote -v
# Should show: fredowill/agent-mission-control

# Verify server starts
node server.js &
sleep 2
curl -s http://localhost:3033/ | head -c 100
kill %1
```

---

## Phase 5: Update machine-config.json

```bash
cat ~/projects/agent-mission-control/toolbox/config/machine-config.json
```

Update the `ephra` entry with the ACTUAL paths:
```json
{
  "ephra": {
    "name": "home",
    "claudeDir": "C:/Users/ephra/.claude",
    "mcDir": "C:/Users/ephra/projects/agent-mission-control",
    "pathStyle": "msys"
  }
}
```

Adjust `claudeDir` if `~/.claude/` is not at `C:/Users/ephra/.claude/` — check with `echo $HOME`.

---

## Phase 6: Create junctions

The setup script creates NTFS junctions: `~/.claude/skills/` → `toolbox/skills/`, etc.

```bash
cd ~/projects/agent-mission-control
bash toolbox/setup.sh --dry-run
```

**Review the dry run carefully.** It should show:
- Each dir being backed up + junctioned
- settings.json being generated

If it looks right:
```bash
bash toolbox/setup.sh
```

If setup.sh fails (permissions, path issues), create junctions manually via PowerShell:
```powershell
# For each dir: skills, agents, commands, hooks, rules, scripts
Remove-Item -Path "C:\Users\ephra\.claude\skills" -Recurse -Force
New-Item -ItemType Junction -Path "C:\Users\ephra\.claude\skills" -Target "C:\Users\ephra\projects\agent-mission-control\toolbox\skills"
# Repeat for agents, commands, hooks, rules, scripts
```

---

## Phase 7: Verify EVERYTHING

```bash
# Skills visible through junction
ls ~/.claude/skills/ | head -5

# Specific skill has content
cat ~/.claude/skills/skill-index.md | head -3

# Hooks visible
ls ~/.claude/hooks/

# Rules visible
ls ~/.claude/rules/

# MC server works from new location
cd ~/projects/agent-mission-control
node server.js &
sleep 2
curl -s http://localhost:3033/api/campaigns | head -c 200
kill %1

# Open a NEW Claude Code session and test:
# - /plan command works
# - Skill-activation hook fires on prompt submit
# - Emoji formatting is correct
```

---

## Phase 8: Clean up phredomade

MC has been extracted. Clean up the old location.

```bash
# Check what's left in phredomade/.claude/
ls ~/phredomade/.claude/

# agent-hub/ should be GONE (we moved it)
# If there are phredomade-specific .claude/ files (project settings, etc.), leave them
# If .claude/ is now empty or only has stale stuff, you can remove it:
# rmdir ~/phredomade/.claude  (only works if empty)
```

---

## Phase 9: Push

```bash
cd ~/projects/agent-mission-control
git add .
git commit -m "feat: home reorg complete — MC extracted, junctions live, home-authoritative content merged"
git push origin main
```

---

## After this, on EITHER machine:

```bash
cd <mc-repo> && git pull && bash toolbox/setup.sh
```

One repo. One command. Full sync. No more regressions.

## Summary of what changed

| Before | After |
|--------|-------|
| MC buried at `phredomade/.claude/agent-hub/` | MC at `~/projects/agent-mission-control/` |
| Skills/hooks/rules as loose files in `phredomade/.claude/` | Junctions: `~/.claude/*` → `MC/toolbox/*` |
| No sync mechanism | `git pull + setup.sh` = full sync |
| Home ↔ work transitions break everything | Same toolbox, same junctions, same setup.sh |
