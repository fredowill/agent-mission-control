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

## 😤 Why we're doing this (user pain points)

The user has been dealing with these regressions for WEEKS:

1. **Every orchestrator transition between home ↔ work loses skills, hooks, and rules.** v2.7 built a SessionStart hook, skill-index, skill-activation rewrite, topic-context rules — NONE of it made it to the work machine. Every session starts degraded.
2. **Home has better formatting and presentation** — emoji-coded tables, forced skill evaluation, stale-knowledge web search reminders. Work sessions feel dumber because they're missing these hooks.
3. **File structure on home is messy** — MC is buried inside phredomade's `.claude/` directory. The user can't even find MC easily. Everything is tangled together.
4. **Moving files breaks syncing** — the old "toolbox copy" approach never actually synced to `~/.claude/`. It was a manual process nobody ran.
5. **The user is afraid this migration will break what's working** — home's hooks and formatting are GOOD. They must survive this migration intact.

## ⚠️ CRITICAL: HOME WINS

Home has the better hooks, better formatting, better emoji standards. When merging home content into the toolbox, **always keep home's version** over work's. The work machine explicitly defers to home on conflicts.

**What's good about home that MUST be preserved:**
- `skill-activation-hook.sh` — v2.7 forced-eval rewrite with "name 3 skills you considered" requirement + stale-knowledge web search reminder
- `session-context.js` — v2.7 original SessionStart hook that injects session catalog + skill index
- Emoji formatting standards — semantic emojis, bold-lead text, emoji-coded tables
- Any skills that only exist on home (especially `deep-research`)

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

## Phase 6: Review and fix setup.sh BEFORE running it

**Do NOT blindly run setup.sh.** It was written on the work machine and may have wrong assumptions for home. Read it first and fix anything that won't work here.

```bash
cat ~/projects/agent-mission-control/toolbox/setup.sh
```

**Check these specifically:**
1. Does the hostname detection work? Run `hostname` and verify it matches an entry in `machine-config.json`
2. Does `cygpath` exist on this machine? If not, the path conversion will fail — fix the script
3. Are the PowerShell junction commands correct for this machine's paths?
4. Does `node` resolve the machine-config.json path correctly from bash?

**Test the dry run:**
```bash
cd ~/projects/agent-mission-control
bash toolbox/setup.sh --dry-run
```

**If the dry run fails or shows wrong paths:** Edit `setup.sh` to fix the issues. The script uses `machine-config.json` for paths — if those are wrong, fix `machine-config.json` first (Phase 5), then re-run dry-run.

**Only when dry run shows correct paths for every junction**, run it for real:
```bash
bash toolbox/setup.sh
```

If setup.sh still fails (permissions, NTFS issues), create junctions manually via PowerShell:
```powershell
# For each dir: skills, agents, commands, hooks, rules, scripts
Remove-Item -Path "C:\Users\ephra\.claude\skills" -Recurse -Force
New-Item -ItemType Junction -Path "C:\Users\ephra\.claude\skills" -Target "C:\Users\ephra\projects\agent-mission-control\toolbox\skills"
# Repeat for agents, commands, hooks, rules, scripts
```

---

## Phase 7: Verify EVERYTHING (most important phase)

### 7a: Junctions work
```bash
# Skills visible through junction
ls ~/.claude/skills/ | head -5

# Specific skill has content (not empty)
cat ~/.claude/skills/skill-index.md | head -3

# Hooks visible
ls ~/.claude/hooks/

# Rules visible
ls ~/.claude/rules/

# Write test: edit in toolbox, read from .claude
echo "junction-test" > ~/projects/agent-mission-control/toolbox/rules/test.txt
cat ~/.claude/rules/test.txt  # Should show "junction-test"
rm ~/projects/agent-mission-control/toolbox/rules/test.txt
```

### 7b: settings.json hook paths are correct
This is critical — hooks reference absolute paths. After moving MC, ALL hook paths must point to the new locations.

```bash
cat ~/.claude/settings.json | grep -i "command"
```

**Check every path.** They should reference:
- `~/.claude/scripts/` or `~/.claude/hooks/` for claude-dir hooks (these go through junctions → toolbox)
- `~/projects/agent-mission-control/hooks/` for MC-specific hooks (hook.js, prompt-hook.js)
- `~/projects/agent-mission-control/scripts/` for MC scripts (play-chime.ps1)

**If any path still references the OLD location** (`phredomade/.claude/agent-hub/`), the settings.json generation failed. Fix `machine-config.json` and re-run `bash toolbox/setup.sh` to regenerate.

### 7c: MC server works from new location
```bash
cd ~/projects/agent-mission-control
node server.js &
sleep 2
curl -s http://localhost:3033/api/campaigns | head -c 200
kill %1
```

### 7d: Live test in a NEW Claude Code session
Open a fresh session and verify:
- Skill-activation hook fires on your first prompt (you'll see "SKILL ACTIVATION CHECK" in the response)
- Emoji formatting is correct (tables, bold-leads, semantic emojis)
- Try `/plan` or another slash command — it should load
- The session should feel the same as before the migration

**If anything is wrong, DO NOT PROCEED.** Fix it first, or restore from backup.

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
