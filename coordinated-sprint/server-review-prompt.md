## Mission: Review server.js diff (1,637 lines) for safety before restart

Dashboard Perf v2 agent modified `.claude/agent-hub/server.js` with 1,637 lines changed (498 insertions). The changes include two distinct features: (1) per-session cost cache with mtime-based invalidation, and (2) `/api/launch` auto-creation of agent cards in campaigns.json. The agent was flagged for scope creep. This review must determine: is it safe to restart the MC server with these changes?

## Agent Lifecycle (follow in order)

### Stage 1: DEFINE
- **Read:** `.claude/agent-hub/server.js` (the current working copy with changes)
- **Read:** Run `cd .claude/agent-hub && git diff server.js` to see exactly what changed
- **Success looks like:** A structured review with clear PASS/FAIL per feature, specific line references for any issues, and a restart recommendation
- **Constraints:** Do NOT modify any files. This is a read-only review. Output goes to the debrief API only.

### Stage 2: DISCOVER (HARD GATE — do not skip)
Run: `ls .claude/skills/`
**You MUST load at least one skill before proceeding to Stage 3.**
Mandated skills for this task: `systematic-debugging` (for tracing data flow), `verification-before-completion` (for evidence-based conclusions)
If you skip this stage or proceed without loading skills, your grade caps at C regardless of deliverables.

### Stage 3: EXECUTE
Review the diff in two distinct sections:

**Section A: Cost Cache (Dashboard Perf v2)**
1. Trace the data flow: How does the cost endpoint work before vs after?
2. Check the mtime-based cache invalidation: Is it correct? Race conditions?
3. Check for memory leaks: Does the cache grow unbounded?
4. Check error handling: What happens if file reads fail?
5. Verify the cache is per-session, not global (as intended)
6. Flag any code that touches endpoints OUTSIDE of /api/cost (scope creep)

**Section B: /api/launch auto-card-creation (v1.6 enhancement)**
1. Verify the API accepts: agentName, promptFile, campaignId, slot, sprint, focus
2. Check that it correctly creates a new agent card in campaigns.json
3. Check for JSON corruption risks (concurrent writes, missing fields)
4. Verify it doesn't overwrite existing cards
5. Check the response format

**Section C: Scope Creep Audit**
1. List ALL endpoints/functions that were modified
2. Flag any changes NOT related to cost cache or /api/launch
3. For each unrelated change: is it harmless, risky, or blocking?

### Stage 4: REASON
- Does the cost cache actually solve the performance problem (7-second /api/cost response)?
- Are there simpler approaches that were missed?
- Is the /api/launch enhancement complete enough to close PM015?
- Overall: SAFE TO RESTART or NOT SAFE?

### Stage 5: VERIFY
- Run `node -c .claude/agent-hub/server.js` to syntax-check the file
- Check for any obvious runtime errors (undefined variables, missing requires)
- Verify the JSON structure of campaigns.json is valid after /api/launch would write to it

### Stage 6: DEBRIEF (before you exit)
Before exiting, write your self-report:
```
curl -X POST http://localhost:3033/api/campaigns/agent-debrief -H "Content-Type: application/json" -d '{
  "campaignId": "campaign-001",
  "slot": "server-review",
  "delivered": ["item 1", "item 2"],
  "missed": ["item 1"],
  "lessons": ["what you learned"]
}'
```
Keep items concise: **bold keyword** — short description.

Also output a clear **RESTART VERDICT:** SAFE / SAFE WITH CAVEATS / NOT SAFE — with reasoning.

## Constraints
- **Read-only review.** Do NOT modify server.js or any other file.
- **Evidence-based.** Every finding must reference specific line numbers in the diff.
- **Time-boxed.** This should take 10-15 minutes max. Don't over-analyze — focus on safety-critical issues.
- **Scope:** Only review server.js changes. Don't review other modified files in the agent-hub repo.
