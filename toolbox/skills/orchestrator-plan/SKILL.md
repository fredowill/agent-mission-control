---
name: orchestrator-plan
description: Orchestrator execution planning and data update phases. Use when building an execution plan table for a campaign and updating reference data before agent dispatch. Covers Phase 3 (Execution Plan) and Phase 4 (Update Reference Data). Load orchestrator-rules alongside this skill.
---

# Orchestrator Plan (Phases 3 & 4)

## Phase 3: Execution Plan

Present the plan as a **clean table** — reviewable in CLI, straight from source. The user explicitly praised this format.

```
## Execution Plan: [Campaign Name]

| # | Task                          | Priority | Sprint | Agent Type     | Dependencies |
|---|-------------------------------|----------|--------|----------------|--------------|
| 1 | [Task description]            | P0       | 1      | Builder        | None         |
| 2 | [Task description]            | P0       | 1      | Research        | None         |
| 3 | [Task description]            | P1       | 2      | Builder        | #1           |
```

Rules:
- P0 = must-close before campaign ends. P1 = important. P2 = can-wait.
- Sprint 1 tasks have no dependencies and run in parallel.
- Each task must be one clear deliverable. Not "improve the dashboard" but "add collapsible debrief sections to campaign page."
- Mark tasks that can be background-dispatched.
- **Get user approval on the plan before dispatching anything.**

## Phase 4: Update Reference Data (f057)

**Before dispatching agents, enrich the data they depend on.** This is a learned pattern — agents that read stale data produce stale output.

Checklist:
- [ ] `campaigns.json` — new campaign entry with objectives, or update existing
- [ ] `findings.json` — any new findings from Phase 1-3 discussions
- [ ] Handoff docs — update if prior orchestrator left stale info
- [ ] Close-out items — reconcile with campaign remaining items

Do NOT modify data files outside the campaign scope. Only update what dispatched agents will read.

## Next Phase

After the plan is approved and data is updated, load `orchestrator-dispatch` for Phase 5 (Dispatch Agents).
