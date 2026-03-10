# Home PC Setup: .claude/ junction sync

The work machine just set up a system where `~/.claude/skills`, `agents`, `commands`, `hooks`, `rules`, `scripts` are all NTFS junctions pointing to `agent-mission-control/toolbox/`. This means `git pull` in the MC repo instantly updates everything Claude Code sees.

Your job: do the same on this home machine.

## Step 1: Pull the MC repo

```bash
cd <wherever agent-mission-control lives>  # probably ~/.claude/agent-hub/
git pull origin main
```

## Step 2: Update machine-config.json

Read `toolbox/config/machine-config.json`. The `ephra` entry needs to have the correct paths for THIS machine:
- `claudeDir`: where `~/.claude/` is (or wherever Claude Code reads skills/agents from — check with `ls ~/.claude/skills/ | head -3`)
- `mcDir`: where THIS repo lives on disk

Update the paths if they're wrong. Then commit + push so work machine gets the update too.

## Step 3: Merge home-only content into toolbox

Before running setup.sh, make sure any skills/hooks/rules that ONLY exist on home get copied INTO `toolbox/`:

1. **deep-research skill** — if `~/.claude/skills/deep-research/SKILL.md` exists, copy it to `toolbox/skills/deep-research/SKILL.md`
2. **skill-activation-hook.sh** — compare your `~/.claude/hooks/skill-activation-hook.sh` with `toolbox/hooks/skill-activation-hook.sh`. If yours is newer/better, overwrite the toolbox version.
3. **session-context.js** — compare your `~/.claude/hooks/session-context.js` with `toolbox/hooks/session-context.js`. Keep whichever is better (yours is the v2.7 original).
4. **Any other home-only files** — check each dir for files that exist in `~/.claude/` but not in `toolbox/`.

Commit the merged content to the repo.

## Step 4: Run setup.sh

```bash
bash toolbox/setup.sh --dry-run  # Preview what will happen
bash toolbox/setup.sh            # Create junctions + generate settings.json
```

This will:
- Back up your current `~/.claude/skills/`, `agents/`, etc. to a timestamped `.setup-backup` dir
- Replace them with NTFS junctions pointing to `toolbox/`
- Generate `settings.json` from the template with your machine's paths

## Step 5: Verify

```bash
# Check junctions exist
ls -la ~/.claude/ | grep -i junction  # or check with PowerShell

# Check Claude Code still sees skills
ls ~/.claude/skills/ | head -5

# Check a skill loads
# Open a new Claude Code session and try /plan or any slash command
```

## Step 6: Push

```bash
git add toolbox/ && git commit -m "feat: home machine merge — deep-research, v2.7 hooks, machine-config" && git push
```

## After this, on EITHER machine:
```bash
git pull && bash toolbox/setup.sh
```
That's it. Full sync. One repo. One command.
