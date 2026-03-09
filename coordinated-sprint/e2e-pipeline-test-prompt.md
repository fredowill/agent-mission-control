## Mission: End-to-end pipeline validation — verify dispatch, skill discovery, debrief, and auto-grading all work correctly.

This is a test agent that validates the full MC dispatch pipeline on the work laptop. You must exercise every lifecycle stage and produce a proper debrief with populated arrays.

## Agent Lifecycle (follow in order)

### Stage 1: DEFINE
- **Read:** `C:\Users\emeskel\Claude\projects\agent-mission-control\campaigns.json` (verify your own agent card exists with status=active)
- **Success looks like:** All 6 lifecycle stages completed. Debrief posted with populated delivered/missed arrays. Auto-grade produces a grade >= B.
- **Constraints:** Do NOT modify any production files. This is a validation test only.

### Stage 2: DISCOVER (HARD GATE — do not skip)
Run: `ls ~/.claude/skills/`
**You MUST load at least one skill before proceeding to Stage 3.**
Mandated skills for this task: `verification-before-completion`
If you skip this stage, your grade caps at C regardless of deliverables.

### Stage 3: EXECUTE
1. Read your own agent card in campaigns.json — confirm it has sessionId, status=active, sprint=12
2. Read the dispatch.sh file — confirm auto-grade.js path uses $SCRIPT_DIR (not .claude/agent-hub/)
3. Read the create-agent-prompt SKILL.md — confirm Stage 6 debrief template has populated example arrays
4. Write a small test file: `coordinated-sprint/e2e-pipeline-validation.md` with a summary of what you verified

### Stage 4: REASON
- Is your agent card correctly linked?
- Does the auto-grade path look correct for the work laptop?
- Does the debrief template clearly require populated arrays?

### Stage 5: VERIFY
1. Run: `curl -s http://localhost:3033/api/campaigns | node -e "const d=JSON.parse(require('fs').readFileSync('C:/Users/emeskel/Claude/tmp-check.json','utf8'));..."` — verify your card exists
2. Confirm the file you wrote in Stage 3 exists

### Stage 6: DEBRIEF (MANDATORY — your grade depends on this)
Before exiting, you MUST call this API with POPULATED arrays. Empty arrays = auto-grade scores you 15/40 on deliverables (instant C-).

```bash
curl -X POST http://localhost:3033/api/campaigns/agent-debrief \
  -H "Content-Type: application/json" \
  -d '{
    "campaignId": "campaign-001",
    "slot": "e2e-pipeline-test",
    "delivered": ["Verified agent card auto-creation via /api/launch", "Verified dispatch.sh uses $SCRIPT_DIR paths", "Verified create-agent-prompt debrief template has populated arrays", "Wrote e2e-pipeline-validation.md summary"],
    "missed": [],
    "lessons": ["The debrief must always have populated delivered arrays to avoid C- auto-grade"]
  }'
```

## Constraints
- Do NOT modify production files (server.js, campaigns-page.html, campaigns.json)
- This is a READ + VALIDATE mission, not a build mission
- You may create files only in coordinated-sprint/ directory
