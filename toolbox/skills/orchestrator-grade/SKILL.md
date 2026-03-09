---
name: orchestrator-grade
description: Orchestrator monitoring, grading, and findings capture phases. Use when agents are running and need monitoring, when grading completed agents, or when capturing findings from a campaign session. Covers Phase 6 (Monitor & Grade) and Phase 7 (Findings Capture) including the full grading rubric and findings JSON format. Load orchestrator-rules alongside this skill.
---

# Orchestrator Grade (Phases 6 & 7)

## Phase 6: Monitor and Grade

### While agents are running:
- Capture findings in real-time. Don't wait for the user to ask.
- Keep debrief current — as agents finish, immediately record wins/losses.
- Detect dead agents proactively. If a PID is gone, update status.
- Report progress to user in scannable format (bold leads, no walls of text).

### Grading Rubric

When an agent completes, grade it:

| Grade | Criteria |
|-------|----------|
| **A** | Reached Verify (required). All deliverables met. Skills discovered and used. Clean execution. |
| **B** | Reached Execute/Reason. Deliverables met. Minor gaps in Discover or Verify. |
| **C** | Reached Execute with waste. Skipped Discover + Verify. Partial deliverables. |
| **D** | Failed at Execute or Discover. Closed early by user. Major misses. |
| **F** | Broke things. Ignored constraints. Required cleanup by another agent. |

**Grade factor weights:** 40% lifecycle reached, 25% deliverables, 20% skills used, 15% autonomy

Record in campaigns.json per agent:
```json
{
  "grade": "B+",
  "gradeReason": "[1 sentence]",
  "lifecycle": { "define": "passed", "discover": "partial", "execute": "passed", "reason": "passed", "verify": "skipped" },
  "skillsUsed": ["brainstorming"],
  "delivered": ["item 1", "item 2"],
  "missed": ["item 1"]
}
```

## Phase 7: Findings Capture

Capture findings as they emerge, not post-hoc. Format matches `findings.json`:

```json
{
  "id": "f0XX",
  "tier": "tier1",
  "tag": "principle | concept | pain-point",
  "title": "[Short title]",
  "quote": "[User's exact words if available]",
  "body": "[What happened, why it matters]",
  "lesson": "[What to do about it — the actionable takeaway]",
  "meta": "Session: orchestrator-v[N], campaign-[ID]",
  "context": "campaign-[ID]"
}
```

- `tier1` + `principle` tag = CLAUDE.md-level behavioral rule
- `concept` tag = reusable pattern (Agent Lifecycle, Calibration)
- Assign the next sequential f-number (check last ID in findings.json first)

## Next Phase

After agents are graded and findings captured, load `orchestrator-sprint` for Phase 8 (Sprint Transition).
