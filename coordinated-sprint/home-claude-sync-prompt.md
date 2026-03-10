# Home Machine: .claude/ Git Sync Setup

You are setting up git tracking for `~/.claude/` to sync skills, agents, commands, hooks, and rules between home and work machines. A work machine has already committed 225 files to `fredowill/.claude` (private repo). Your job is to MERGE home's content with work's — home wins on any conflicts.

## CRITICAL: Do NOT overwrite home files with work versions

Home has the authoritative versions of:
- `hooks/skill-activation-hook.sh` (v2.7 forced-eval rewrite — BETTER than work's)
- `hooks/session-context.js` (v2.7 original — work has a recreation)
- `skills/deep-research/` (has actual SKILL.md — work has empty stub)
- Any other hooks or skills that exist on home but not on work

## Step-by-step (execute in order, pause between steps):

### Step 1: Understand home's .claude/ location

Home's `.claude/` with skills/agents/hooks is at one of:
- `~/.claude/` (user-level)
- `~/phredomade/.claude/` (project-level)

Run `ls ~/.claude/skills/ | head -5` and `ls ~/phredomade/.claude/skills/ | head -5` to find which one has all the skills. That's the PRIMARY location we'll git-track.

If the primary is `~/phredomade/.claude/`, we need to decide: move everything to `~/.claude/` (canonical) or track `~/phredomade/.claude/`. The user-level `~/.claude/` is the right long-term home — it works globally across all projects.

### Step 2: Backup

```bash
CLAUDE_DIR="<primary .claude/ path from step 1>"
cp -r "$CLAUDE_DIR" "${CLAUDE_DIR}.backup.$(date +%Y%m%d)"
echo "Backup created"
```

### Step 3: Create the GitHub repo

The work machine couldn't create it (enterprise PAT restriction). Create it now:

```bash
gh repo create fredowill/.claude --private --description "Claude Code config: skills, agents, commands, hooks, rules. Git-synced across machines."
```

If `gh` isn't available, create it manually at https://github.com/new — name: `.claude`, private, no README.

### Step 4: Init git and pull work's commit (WITHOUT overwriting)

```bash
cd "$CLAUDE_DIR"
git init
git remote add origin https://github.com/fredowill/.claude.git

# Fetch work's commit but DON'T merge yet
git fetch origin

# Stage ALL current home files first (home wins on conflicts)
# Copy the .gitignore from the fetched version first
git show origin/master:.gitignore > .gitignore

# Now add everything that's not gitignored
git add .
git commit -m "feat: home machine initial state — preserving home-authoritative files"

# Now merge work's commit, keeping HOME's version on any conflict
git merge origin/master --allow-unrelated-histories -X ours -m "merge: incorporate work machine files, home wins on conflicts"
```

The `-X ours` flag means: on ANY conflict, keep home's version. Work-only files (like `00-topic-context.md`, `00-agent-lifecycle.md`) get added automatically since there's no conflict.

### Step 5: Verify the merge

```bash
# Check that home's hooks survived
head -5 hooks/skill-activation-hook.sh
head -5 hooks/session-context.js

# Check that work-only files were added
ls rules/00-topic-context.md
ls rules/00-agent-lifecycle.md
ls skills/filing-postmortems/SKILL.md
ls skills/skill-index.md

# Check deep-research has content
ls skills/deep-research/
cat skills/deep-research/SKILL.md | head -3
```

### Step 6: Update machine-config.json with correct home paths

Read `machine-config.json` and update the `ephra` entry with the actual paths on this machine:
- `claudeDir` should be the ACTUAL path to this `.claude/` directory
- `mcDir` should be the path to agent-mission-control (currently `~/.claude/agent-hub/` — rename if needed, see Step 7)

### Step 7: MC repo rename (optional but recommended)

The work machine uses `agent-mission-control` as the folder name (matches GitHub). Home uses `agent-hub`. To unify:

```bash
# Only if home MC is at ~/.claude/agent-hub/
mv ~/.claude/agent-hub ~/.claude/agent-mission-control
# Update any symlinks, junctions, or references
```

Then update `machine-config.json` with the new path.

### Step 8: Generate settings.json

```bash
bash setup.sh --dry-run  # Preview first
bash setup.sh            # Generate settings.json with correct home paths
```

Review the generated `settings.json` — make sure all hook paths are correct for this machine.

### Step 9: Push

```bash
git add .
git commit -m "feat: merge home content — deep-research, v2.7 hooks, machine-config update"
git push -u origin master
```

### Step 10: Verify on work machine

After this push, the work machine can:
```bash
cd ~/.claude && git pull
bash setup.sh  # Regenerate settings.json with work paths
```

## What this achieves

After both machines complete this:
- `git pull` on either machine gets ALL skills, agents, commands, hooks, rules
- `bash setup.sh` generates the correct machine-specific `settings.json`
- `settings.json` is gitignored — never conflicts between machines
- Any new skill/hook/rule committed on either machine is available everywhere after `git pull`
- The MC toolbox becomes REDUNDANT for skill/hook sync (it was a workaround for this exact gap)

## Post-mortems this closes

- **PM029** (13 agents + 18 skills invisible to sessions) — systemic fix: everything is now tracked
- Partially addresses **PM032** (orchestrator regression on machine transitions) — setup.sh ensures hooks are always wired correctly
