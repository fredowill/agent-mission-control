## Mission: Build auto-grade-orchestrator.js — a grading script specifically for orchestrator agents, separate from the sub-agent auto-grade.js.

The current `auto-grade.js` (346 lines) grades all agents identically using a sub-agent rubric: Deliverables 40%, Execution 25%, Lifecycle 20%, Skills 15%. This doesn't work for orchestrators — they coordinate, not build. A research agent has produced a complete orchestrator grading specification at `coordinated-sprint/orchestrator-lifecycle-research.md` (in the project root `C:\Users\emeskel\Claude\`). Your job is to implement that spec as a grading script, AND fix 4 known bugs in the current auto-grader that also affect orchestrator grading.

**Deliverable:** `projects/agent-mission-control/auto-grade-orchestrator.js` — a standalone Node.js script that:
- Uses the 4-factor orchestrator rubric (Coordination 35%, Planning 25%, Lifecycle 20%, Knowledge Continuity 20%)
- Uses the 6-stage orchestrator lifecycle (Orient, Plan, Dispatch, Monitor, Synthesize, Handoff)
- Provides specific REASONING for each lifecycle stage rating (not generic text)
- Fixes 4 known auto-grade bugs (see below)

## Agent Lifecycle (follow in order)

### Stage 1: DEFINE
- **Read these files first:**
  - `C:\Users\emeskel\Claude\coordinated-sprint\orchestrator-lifecycle-research.md` — THE spec. Contains grading weights, lifecycle stages, passed/partial/failed criteria, mapping table. This is your primary reference.
  - `projects/agent-mission-control/auto-grade.js` — current sub-agent grader. Understand the structure, then build a separate orchestrator-specific version.
  - `projects/agent-mission-control/campaigns.json` — search for orchestrator entries (slot starts with "orchestrator-v") to see real data you'll grade against.
- **Success looks like:** A script that, when run against an orchestrator's campaign data, produces an accurate grade with stage-by-stage reasoning that explains WHY each stage is passed/partial/failed.
- **Constraints:**
  - New file `auto-grade-orchestrator.js` — do NOT modify `auto-grade.js`
  - Must be callable from the existing dispatch pipeline (same interface as auto-grade.js)
  - Output format must match what the campaigns page expects (grade, gradeReason, scoreBreakdown, lifecycle)

### Stage 2: DISCOVER (HARD GATE — do not skip)
Run: `ls .claude/skills/`
**You MUST load at least one skill before proceeding to Stage 3.**
Mandated skills for this task: `coding-standards` (Node.js best practices)

Also read the research methodology at `memory/research-methodology.md` if you need to search online.

### Stage 3: EXECUTE

1. Read the lifecycle research doc completely
2. Read auto-grade.js to understand the current grading interface
3. Build `auto-grade-orchestrator.js` with these sections:

**A. Orchestrator Detection**
- Detect if an agent is an orchestrator by checking `slot.startsWith('orchestrator-v')`
- When the dispatch pipeline runs, route to this script instead of auto-grade.js for orchestrators

**B. 4-Factor Grading Rubric**

| Factor | Weight | Inputs |
|--------|--------|--------|
| Coordination Quality (35%) | Agent outcomes from `delivered`/`missed` arrays of dispatched agents, conflict/duplicate detection | Read campaigns.json for agents dispatched during this orchestrator's sprint |
| Planning Quality (25%) | Execution plan completeness, task decomposition quality, user approval evidence | Read executionPlan from campaigns.json |
| Lifecycle Adherence (20%) | 6-stage orchestrator lifecycle (Orient/Plan/Dispatch/Monitor/Synthesize/Handoff) | Read lifecycle field from agent entry |
| Knowledge Continuity (20%) | Handoff doc existence + completeness, findings captured, debrief API data | Check handoff doc, findings count, delivered/missed arrays |

**C. Stage-by-Stage Reasoning (Bug Fix #1)**

For EACH lifecycle stage, generate a specific explanation:
- NOT: "Partially executed. 6 delivered, 0 missed." (generic, current behavior)
- YES: "Orient: PASSED — loaded handoff doc, read 41 previous prompts (PM020 compliance), self-registered in campaigns.json, asked 5 structured questions with data-grounded recommendations."
- YES: "Dispatch: PARTIAL — used create-agent-prompt skill correctly, but dispatched via Agent tool instead of /api/launch (PM022 violation)."

The reasoning must reference SPECIFIC data from the agent's campaign entry.

**D. Skills Sanitization (Bug Fix #2)**

Current grader parses skills from the agent's session and sometimes captures shell output (`** 2>`, `| grep -i orchestrator`) as skill names. Fix:
- Only count items that match known skill names from `ls .claude/skills/`
- Strip anything containing shell characters (`|`, `>`, `*`, `2>`)
- Validate each "skill" against the actual skills directory

**E. Relevant Skills Only (Bug Fix #3)**

Current grader marks skills like `frontend-design` and `impeccable-polish` as "missed" even when they're irrelevant to the task. Fix:
- Only flag skills listed in the agent's prompt file (Stage 2: DISCOVER mandated skills) as "missed"
- Skills not mandated in the prompt should NOT appear in the missed list
- Parse the agent's prompt file to extract mandated skills

**F. Score Calibration (Bug Fix #4)**

Current grader gives 97/100 to agents with Execute=partial and Verify=partial. This is inflated. Fix:
- Each "partial" lifecycle stage should dock at least 5 points from the lifecycle factor
- Each "failed" stage should dock at least 10 points
- Two "partial" stages should never result in 97/100 — cap should be ~85 max with any partials

4. Write the script to `projects/agent-mission-control/auto-grade-orchestrator.js`

### Stage 4: REASON
- How does this script get invoked? The dispatch pipeline's Stop hook runs auto-grade.js — should auto-grade.js detect orchestrators and delegate to auto-grade-orchestrator.js? Or should the pipeline be updated to check agent type first?
  - Recommendation: Add a detection check at the top of auto-grade.js that routes to auto-grade-orchestrator.js for orchestrator slots. Minimal change to existing pipeline.
- Should the 4 bug fixes also be applied to auto-grade.js (sub-agent grader)?
  - Recommendation: Yes for bugs #2 and #3 (skills sanitization and relevance). No for #1 and #4 (those are orchestrator-specific calibrations).
- Edge case: orchestrators with no dispatched agents (v1.9 was close-out only). How to grade Coordination Quality when there's nothing to coordinate?
  - Recommendation: If sprint has zero non-orchestrator agents, Coordination Quality evaluates campaign management quality instead (data integrity, status updates, close-out completeness).

### Stage 5: VERIFY
- Run the script against at least 2 orchestrator entries from campaigns.json (e.g., v1.9 and v2.0) and verify:
  - Grade output is a valid JSON object matching campaigns page format
  - Stage-by-stage reasoning includes specific data references
  - Skills list is sanitized (no shell output leaked)
  - Score calibration is reasonable (no 97/100 with partial stages)
- Run: `node projects/agent-mission-control/auto-grade-orchestrator.js --test` to verify it works standalone

### Stage 6: DEBRIEF (MANDATORY — your grade depends on this)
```bash
curl -X POST http://localhost:3033/api/campaigns/agent-debrief \
  -H "Content-Type: application/json" \
  -d '{
    "campaignId": "campaign-002",
    "slot": "grading-script-builder",
    "delivered": ["Item 1: auto-grade-orchestrator.js with 4-factor rubric", "Item 2: stage-by-stage reasoning generation", "Item 3: skills sanitization fix", "Item 4: relevant-skills-only fix", "Item 5: score calibration fix"],
    "missed": ["Item 1: anything not completed"],
    "lessons": ["Lesson 1: what you learned"]
  }'
```

## Constraints
- New file only — do NOT modify auto-grade.js (except the routing check if needed)
- Must work as standalone Node.js script (no external dependencies)
- Output format must match campaigns page expectations
- Cross-platform (Windows + macOS)
