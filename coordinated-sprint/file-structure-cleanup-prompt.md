## Mission: Safely reorganize the Mission Control project root from a flat file dump into a clean directory structure with hooks/, scripts/, pages/, data/, and config/ directories, updating all internal references so nothing breaks.

The MC project at `projects/agent-mission-control/` has ~30+ files in the root directory with no organization. HTML pages, JS scripts, JSON data, shell scripts, and config files are all mixed together. This makes it hard to find things and hard for new agents to understand the project. The refactor must be SAFE — every internal file reference (require, readFileSync, path.join) must be updated.

**Deliverable:** Reorganized `projects/agent-mission-control/` directory with clean structure and zero broken references.

## Agent Lifecycle (follow in order)

### Stage 1: DEFINE
- **Read these files first:**
  1. `projects/agent-mission-control/server.js` — THE CRITICAL FILE. This is a ~3000+ line server that references almost every other file. Search for ALL `path.join`, `readFileSync`, `require`, and string path literals. These ALL need updating.
  2. `projects/agent-mission-control/` — run `ls` on the root to see every file that needs organizing
  3. `projects/agent-mission-control/hook.js` — the main MC hook, references state files and other paths
  4. `projects/agent-mission-control/auto-grade.js` and `auto-grade-orchestrator.js` — reference prompt files, campaigns.json, state directories
  5. `projects/agent-mission-control/dispatch.sh` — shell script with file paths
  6. `~/.claude/hooks.json` or `~/.claude/settings.json` — check if hooks reference MC files by absolute or relative path
- **Proposed directory structure:**
  ```
  projects/agent-mission-control/
    pages/           # HTML pages (campaigns-page.html, findings-page.html, etc.)
    scripts/         # JS scripts (auto-grade.js, auto-grade-orchestrator.js, dispatch.sh)
    data/            # JSON data (campaigns.json, dispatch.json, deep-summaries.json, etc.)
    config/          # Config files (.env, machine-config.json)
    hooks/           # Hook scripts (hook.js, prompt-hook.js, etc.)
    coordinated-sprint/  # (keep as-is — agent prompts and research docs)
    toolbox/         # (keep as-is — Git-tracked skill/agent copies)
    server.js        # (stays in root — it's the entry point)
    package.json     # (stays in root)
    README.md        # (stays in root)
  ```
- **Success looks like:**
  1. Files are organized into the directories above
  2. `node server.js` starts without errors
  3. All pages load correctly at localhost:3033
  4. Hooks still fire (hook.js, prompt-hook.js)
  5. Auto-grade still works (`node scripts/auto-grade.js --test` if test mode exists)
  6. `/api/launch` still dispatches agents correctly
- **Constraints:**
  - server.js stays in the root (it's the entry point)
  - coordinated-sprint/ stays as-is (agents reference these paths)
  - toolbox/ stays as-is
  - node_modules/ stays as-is
  - Do NOT rename files — only move them into subdirectories
  - Move ONE file at a time, update ALL references, verify, then move the next

### Stage 2: DISCOVER (HARD GATE — do not skip)
Run: `ls .claude/skills/`
**You MUST load at least one skill before proceeding to Stage 3.**
Mandated skills for this task: `coding-standards`, `verification-before-completion`

### Stage 3: EXECUTE

**SAFETY PROTOCOL: Move one category at a time. Verify after each.**

1. **Catalog all files in root** — run `ls -la` and categorize each file (page, script, data, config, hook, keep-in-root)
2. **Create directories** — `mkdir -p pages scripts data config hooks`
3. **Move HTML pages** — move all `*-page.html` and other HTML files to `pages/`. Update every reference in server.js (search for the filename, update the path). Verify: `curl localhost:3033/campaigns` returns the page.
4. **Move data files** — move `.json` data files (campaigns.json, dispatch.json, deep-summaries.json, summaries.json, missions.json, northstar-cache.json) to `data/`. Update ALL references in server.js, auto-grade.js, auto-grade-orchestrator.js, hook.js. Verify: `curl localhost:3033/api/campaigns` returns data.
5. **Move scripts** — move auto-grade.js, auto-grade-orchestrator.js, dispatch.sh, run-review.sh, play-chime.ps1 to `scripts/`. Update references in server.js, hook.js, and any shell scripts. Verify: auto-grade can find campaigns.json at its new path.
6. **Move hooks** — move hook.js, prompt-hook.js, and any other hook files to `hooks/`. Update references in `~/.claude/hooks.json` or `~/.claude/settings.json`. Verify: make a test tool call and check that hooks fire.
7. **Move config** — move .env, machine-config.json to `config/`. Update references. Verify: server reads env vars correctly.
8. **Final verification** — restart server, test ALL pages, test auto-grade, test /api/launch.

### Stage 4: REASON
- What about files that are referenced by external tools? Hook paths in `~/.claude/settings.json` are absolute or relative — check which and update accordingly.
- dispatch.sh references file paths — these need updating too.
- The coordinated-sprint/ agent prompts reference `projects/agent-mission-control/campaigns.json` — but these are read-time paths, and new agents dispatched AFTER the refactor will use the new paths. Old prompts won't break because they've already been read.
- Should we update the MEMORY.md entry about MC location? Yes, if any paths changed.

### Stage 5: VERIFY
- Run: `node projects/agent-mission-control/server.js` — verify server starts without errors
- Run: `curl -s http://localhost:3033/campaigns` — verify campaigns page loads
- Run: `curl -s http://localhost:3033/api/campaigns` — verify API returns data
- Run: `curl -s http://localhost:3033/api/launch -X POST -H "Content-Type: application/json" -d '{"test": true}'` — verify launch endpoint responds (even if it errors on bad input, it should NOT 500 with "file not found")
- Run: `ls projects/agent-mission-control/` — verify root is clean (only server.js, package.json, README, and directories)
- Verify: no files left in root that should have been moved

### Stage 6: DEBRIEF (MANDATORY — your grade depends on this)
```bash
curl -X POST http://localhost:3033/api/campaigns/agent-debrief \
  -H "Content-Type: application/json" \
  -d '{
    "campaignId": "campaign-002",
    "slot": "file-structure-cleanup",
    "delivered": ["Item 1: pages/ directory with all HTML files", "Item 2: data/ directory with all JSON files", "Item 3: scripts/ directory with auto-grade and dispatch scripts", "Item 4: all internal references updated", "Item 5: server starts and all pages load"],
    "missed": ["Item 1: anything not completed"],
    "lessons": ["Lesson 1: insight about safe file reorganization"]
  }'
```

## Constraints
- SAFETY FIRST: move one category at a time, verify after each
- Do NOT rename files — only move into subdirectories
- server.js stays in root
- coordinated-sprint/ and toolbox/ stay as-is
- If ANY verification step fails after a move, REVERT that move before proceeding
- The server MUST be restarted after moving files that server.js references (CLAUDE.md Rule 6)
