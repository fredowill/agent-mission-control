## Mission: Fix the auto-grade bug where the execute lifecycle stage always scores as "partial" instead of reading actual execution quality from the agent's debrief data.

The auto-grade system in `auto-grade.js` assigns lifecycle stage scores. The execute stage consistently gets marked as "partial" even when agents have strong deliverables and clean execution. This docks every agent's score unfairly. The root cause is likely that the execute stage inference logic defaults to "partial" when it can't determine pass/fail, rather than using the delivered/missed data to make a judgment.

**Deliverable:** Updated `projects/agent-mission-control/auto-grade.js` where the execute lifecycle stage is scored accurately based on agent output (delivered vs missed, execution quality indicators), not defaulted to "partial."

## Agent Lifecycle (follow in order)

### Stage 1: DEFINE
- **Read these files first:**
  1. `projects/agent-mission-control/auto-grade.js` — the ENTIRE file. Find the lifecycle scoring logic. Look for where each stage (define, discover, execute, reason, verify, debrief) gets assigned passed/partial/failed. Find the execute stage specifically.
  2. `projects/agent-mission-control/auto-grade-orchestrator.js` — compare how the orchestrator grader handles lifecycle stages vs the sub-agent grader
  3. `projects/agent-mission-control/campaigns.json` — look at 5-10 recent agents' lifecycle fields. Count how many have execute: "partial" vs "passed" vs "failed". If most are "partial," that confirms the bug.
  4. `.claude/skills/agent-grading/SKILL.md` — understand the grading rubric and what execute "passed" vs "partial" should mean
- **Success looks like:**
  1. Agents with 5+ delivered items and 0-1 missed items get execute: "passed"
  2. Agents with significant missed items or user-closed sessions get execute: "partial" or "failed"
  3. The execute stage score accurately reflects work quality, not a hardcoded default
  4. Re-running auto-grade on recent agents produces different (more accurate) execute scores
- **Constraints:**
  - ONLY modify `auto-grade.js` (and `auto-grade-orchestrator.js` if the same bug exists there)
  - Do NOT modify campaigns.json, server.js, or campaigns-page.html
  - The fix must be backward-compatible — re-grading old agents should not break their data
  - Test with `node auto-grade.js --test` if a test mode exists

### Stage 2: DISCOVER (HARD GATE — do not skip)
Run: `ls .claude/skills/`
**You MUST load at least one skill before proceeding to Stage 3.**
Mandated skills for this task: `coding-standards`, `verification-before-completion`

### Stage 3: EXECUTE

1. **Find the execute scoring logic** — in auto-grade.js, locate where `lifecycle.execute` gets assigned. It's likely in a function that walks through transcript/debrief data and assigns pass/partial/fail per stage.

2. **Diagnose the default** — check if there's a fallback like `execute: 'partial'` or `if (!condition) return 'partial'` that fires too broadly.

3. **Implement accurate execute scoring** — the execute stage should be scored based on:
   - **passed**: delivered array has items, delivered count >= missed count, no user-closed indicators
   - **partial**: delivered array has items but missed count is significant (>= 50% of delivered), or agent required multiple course-corrections
   - **failed**: no delivered items, or user closed the session early, or agent failed to produce output

4. **Check other stages too** — while you're in there, verify that define, discover, reason, verify, and debrief aren't similarly defaulting to "partial." Fix any you find.

5. **Validate against known agents** — pick 3 agents from campaigns.json:
   - One with grade A+ (should have execute: passed)
   - One with grade C (might have execute: partial legitimately)
   - One with grade F (should have execute: failed)
   Verify the fix produces the right result for each.

### Stage 4: REASON
- Is delivered.length alone sufficient to determine execute quality? Consider: an agent could deliver 5 items but all be wrong. However, we don't have quality data beyond the arrays — so delivered count vs missed count is our best proxy.
- Should execute scoring weight the type of items? Probably not — keep it simple. Count-based is good enough.
- What about agents that have zero delivered AND zero missed? These are likely agents that didn't debrief properly. Default to "partial" for these (genuinely uncertain).

### Stage 5: VERIFY
- Run `node auto-grade.js --test` if available, or manually test by re-grading a known agent
- Compare before/after: pick an agent that currently has execute: "partial" but delivered 5+ items. After fix, it should show execute: "passed"
- Verify: agents with F grades still get execute: "failed"
- Verify: the total score changes appropriately (lifecycle factor is 20% of total)

### Stage 6: DEBRIEF (MANDATORY — your grade depends on this)
```bash
curl -X POST http://localhost:3033/api/campaigns/agent-debrief \
  -H "Content-Type: application/json" \
  -d '{
    "campaignId": "campaign-002",
    "slot": "execute-partial-fix",
    "delivered": ["Item 1: accurate execute stage scoring based on delivered/missed data", "Item 2: fixed other stages if similarly bugged"],
    "missed": ["Item 1: anything not completed"],
    "lessons": ["Lesson 1: insight about auto-grade lifecycle scoring"]
  }'
```

## Constraints
- ONLY modify auto-grade.js (and auto-grade-orchestrator.js if same bug)
- Backward-compatible with existing agent data
- Test mode must still work if it exists
- Do NOT re-grade all agents automatically — just fix the logic. Manual re-grades can happen later.
