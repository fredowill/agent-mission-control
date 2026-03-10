# 🏠 Home PC: MC Reorganization + .claude/ Sync

## Context

The work machine has a junction-based sync system: `~/.claude/skills/`, `agents/`, `commands/`, `hooks/`, `rules/`, `scripts/` are all NTFS junctions pointing to the MC repo's `toolbox/` directory. This means `git pull` in MC instantly updates everything Claude Code sees.

Your job: reorganize this home machine's file structure AND set up the same junction system. **Home's hooks, skills, and formatting rules are the authoritative versions — they must be preserved, not overwritten.**

## ⚠️ CRITICAL RULES

1. **HOME WINS on conflicts.** Home has better hooks (v2.7 forced-eval), better session-context.js (original), and better formatting. When merging, home's version always wins.
2. **Back up EVERYTHING before moving anything.** Create timestamped backups.
3. **Don't break phredomade.** The photography portfolio project must still work after MC is extracted.
4. **Don't break running sessions.** Check for active Claude sessions before moving directories.
5. **Test after every major step.** Don't proceed if something breaks.

---

## Phase 1: Audit current state

Before touching anything, understand what's where.

```bash
# Find where things currently live
echo "=== User home ==="
ls ~/

echo "=== Phredomade structure ==="
ls ~/phredomade/ 2>/dev/null || ls ~/PHREDOMADE/ 2>/dev/null

echo "=== .claude location ==="
ls ~/.claude/skills/ 2>/dev/null | head -3 && echo "skills in ~/.claude/"
ls ~/phredomade/.claude/skills/ 2>/dev/null | head -3 && echo "skills in phredomade/.claude/"

echo "=== MC repo location ==="
ls ~/.claude/agent-hub/server.js 2>/dev/null && echo "MC at ~/.claude/agent-hub/"
ls ~/phredomade/.claude/agent-hub/server.js 2>/dev/null && echo "MC at phredomade/.claude/agent-hub/"

echo "=== Git remotes ==="
cd ~/.claude/agent-hub 2>/dev/null && git remote -v
cd ~/phredomade/.claude/agent-hub 2>/dev/null && git remote -v
```

**Record the actual paths.** The rest of this prompt uses variables — fill them in based on what you find:
- `CLAUDE_DIR` = where Claude Code currently reads skills from
- `MC_DIR` = where the MC repo currently lives
- `PHREDOMADE_DIR` = where the phredomade project lives

---

## Phase 2: Back up everything

```bash
BACKUP_DIR=~/backup-$(date +%Y%m%d)
mkdir -p "$BACKUP_DIR"

# Back up the .claude directory (wherever it is)
cp -r "$CLAUDE_DIR" "$BACKUP_DIR/dot-claude-backup"

# Back up the MC repo (preserves git history)
cp -r "$MC_DIR" "$BACKUP_DIR/mc-backup"

echo "✅ Backups at $BACKUP_DIR"
ls "$BACKUP_DIR"
```

---

## Phase 3: Pull work machine changes into MC repo

This is SAFE — git pull only changes files inside the MC repo folder.

```bash
cd "$MC_DIR"
git pull origin main
```

This brings in:
- `toolbox/rules/` (new — 10 rule files)
- `toolbox/hooks/session-context.js` (work's recreation — you'll overwrite with yours)
- `toolbox/config/machine-config.json` (needs your paths)
- `toolbox/config/settings.template.json`
- `toolbox/setup.sh`

---

## Phase 4: Merge home content INTO toolbox (HOME WINS)

This is the critical step. Copy home's authoritative files into the toolbox so they become the git-tracked source of truth.

For EACH of these directories, diff home vs toolbox and merge:

### Skills
```bash
# Find skills on home that aren't in toolbox
diff <(ls "$CLAUDE_DIR/skills/" | sort) <(ls "$MC_DIR/toolbox/skills/" | sort)

# Copy any home-only skills to toolbox (especially deep-research)
# For each home-only skill:
cp -r "$CLAUDE_DIR/skills/<skill-name>" "$MC_DIR/toolbox/skills/"
```

### Hooks
```bash
# Compare hooks — HOME WINS
diff "$CLAUDE_DIR/hooks/skill-activation-hook.sh" "$MC_DIR/toolbox/hooks/skill-activation-hook.sh"
# If different, copy home's version:
cp "$CLAUDE_DIR/hooks/skill-activation-hook.sh" "$MC_DIR/toolbox/hooks/"

diff "$CLAUDE_DIR/hooks/session-context.js" "$MC_DIR/toolbox/hooks/session-context.js" 2>/dev/null
# If home's exists and is different:
cp "$CLAUDE_DIR/hooks/session-context.js" "$MC_DIR/toolbox/hooks/"
```

### Rules, Scripts, Agents, Commands
Same pattern — diff, copy home-only files into toolbox. Home wins on conflicts.

### Commit the merge
```bash
cd "$MC_DIR"
git add toolbox/
git commit -m "feat: merge home-authoritative content into toolbox"
```

---

## Phase 5: Move MC out of phredomade

MC should be its own project, not buried inside phredomade's .claude/ directory.

**Target structure:**
```
~/projects/
  agent-mission-control/     ← MC repo (own project, matches GitHub name)
  phredomade/                ← photography portfolio (own project)
  vietnam-trip/              ← if this exists as separate project
```

```bash
# Create projects directory
mkdir -p ~/projects

# Move MC repo to its new home
mv "$MC_DIR" ~/projects/agent-mission-control

# Verify git still works
cd ~/projects/agent-mission-control
git status
git remote -v

# Move phredomade if it should live under projects/ too
# (only if you want — this is optional)
# mv ~/phredomade ~/projects/phredomade
```

**Update MC_DIR variable for the rest of this prompt:**
```bash
MC_DIR=~/projects/agent-mission-control
```

---

## Phase 6: Update machine-config.json

```bash
# Read and update the machine config with correct home paths
cat "$MC_DIR/toolbox/config/machine-config.json"
```

Update the `ephra` entry:
- `claudeDir`: should be the USER-LEVEL `~/.claude` (we'll junction it next)
- `mcDir`: should be `~/projects/agent-mission-control` (or wherever you put it)
- Fix the `pathStyle` if needed (msys vs windows)

---

## Phase 7: Create junctions

Now create the junctions from `~/.claude/` → MC toolbox, just like the work machine.

```bash
bash "$MC_DIR/toolbox/setup.sh" --dry-run
```

Review the dry run. If it looks right:

```bash
bash "$MC_DIR/toolbox/setup.sh"
```

This will:
- Back up existing `~/.claude/skills/`, `agents/`, etc. to `.setup-backup.<timestamp>`
- Replace them with NTFS junctions → `toolbox/`
- Generate `~/.claude/settings.json` from template with correct home paths

---

## Phase 8: Verify EVERYTHING

```bash
# 1. Skills are visible
ls ~/.claude/skills/ | head -5

# 2. A specific skill has content
cat ~/.claude/skills/skill-index.md | head -3

# 3. Hooks are visible
ls ~/.claude/hooks/

# 4. Rules are visible
ls ~/.claude/rules/

# 5. MC server starts
cd ~/projects/agent-mission-control
node server.js &
sleep 2
curl -s http://localhost:3033/api/campaigns | head -c 100
kill %1

# 6. Open a NEW Claude Code session and verify:
#    - Skills load (try /plan)
#    - Emoji formatting works
#    - Skill-activation hook fires on prompt submit
```

---

## Phase 9: Clean up phredomade

After MC is extracted, phredomade's `.claude/` directory may have a dangling reference to `agent-hub/`. Clean it up:

```bash
# If agent-hub was a symlink/junction in phredomade, remove the broken link
# If it was the actual directory, it's already been moved — just remove the empty parent if needed

# Check if phredomade still has its own project-level .claude/ stuff
ls ~/phredomade/.claude/ 2>/dev/null
# If it's empty or only has the old agent-hub reference, it can be removed
# If it has phredomade-specific config, leave it
```

---

## Phase 10: Push

```bash
cd ~/projects/agent-mission-control
git add .
git commit -m "feat: home reorganization — MC extracted from phredomade, junctions created, home-authoritative content merged"
git push origin main
```

---

## After this, on EITHER machine:
```
git pull && bash toolbox/setup.sh
```
One repo. One command. Full sync. No more regressions.
