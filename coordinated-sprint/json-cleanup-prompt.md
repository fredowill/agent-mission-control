<!-- PIPELINE: create-agent-prompt | mandated: verification-before-completion | task-type: refactor -->
## Mission: Move 6 stray root-level JSON files in agent-hub into data/ and update all server.js references.

The v2.2 file restructure moved most data files to data/ but missed 6 JSON files still in the agent-hub root. These need to follow the same pattern: move to data/, update all server.js path references.

## Agent Lifecycle (follow in order)

### Stage 1: DEFINE
- **Read:** .claude/agent-hub/server.js — find all references to these 6 files:
  - agent-workstreams.json (1 reference)
  - chains.json (0 references — may be dead, verify)
  - deep-summaries.json (3 references)
  - missions.json (3 references)
  - northstar-cache.json (2 references)
  - summaries.json (5 references)
- **Do NOT move:** mode.json (machine-specific, stays in root), README.md, file-edits.ndjson, .env
- **Success looks like:** All 6 files in data/, all server.js references updated from path.join(__dirname, 'filename.json') to path.join(__dirname, 'data', 'filename.json'), server starts and all API endpoints return 200.
- **Constraints:**
  - Move ONE file at a time, verify server.js still works after each move
  - If chains.json has zero references, move it anyway for consistency but note it may be dead code
  - Do NOT modify any logic — only path references
  - Do NOT touch mode.json, README.md, server.js logic, or any files in pages/, hooks/, scripts/, config/

### Stage 2: DISCOVER (HARD GATE — do not skip)
Run: ls .claude/skills/
**You MUST load at least one skill before proceeding to Stage 3.**
Mandated skills for this task: verification-before-completion
If you skip this stage, your grade caps at C regardless of deliverables.

### Stage 3: EXECUTE
For each of the 6 files, in order:
1. Grep server.js for the filename to find ALL references (not just the const declaration)
2. Move the file: mv .claude/agent-hub/FILENAME .claude/agent-hub/data/FILENAME
3. Update every server.js reference from path.join(__dirname, 'FILENAME') to path.join(__dirname, 'data', 'FILENAME')
4. Verify: node -e "require('.claude/agent-hub/server.js')" or restart server and curl /health

Order: chains.json first (0 refs, safest), then agent-workstreams.json, northstar-cache.json, missions.json, summaries.json, deep-summaries.json (most refs, last).

### Stage 4: REASON
- Are there any non-server.js files that reference these JSONs? (Check hooks/, scripts/, coordinated-sprint/)
- Is chains.json actually unused? If so, note it as dead data for future cleanup.
- Do any of these files get written to by external processes (hooks, scripts)?

### Stage 5: VERIFY
1. Restart MC server: node .claude/agent-hub/server.js
2. Curl /health — expect 200
3. Curl /api/campaigns — expect data (uses campaigns.json, already in data/, but validates server runs)
4. Curl /api/dashboard — expect data (uses missions.json and summaries.json)
5. ls .claude/agent-hub/*.json — should only show mode.json remaining
6. ls .claude/agent-hub/data/*.json — should show all 18+ data files

### Stage 6: DEBRIEF (before you exit)
curl -X POST http://localhost:3033/api/campaigns/agent-debrief \
  -H "Content-Type: application/json" \
  -d '{"campaignId":"campaign-002","slot":"json-cleanup","delivered":["..."],"missed":["..."],"lessons":["..."]}'

## Constraints
- server.js path references only — no logic changes
- Move one file at a time, verify after each
- Do NOT touch mode.json
- Must work on Windows (Git Bash paths)
