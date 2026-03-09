---
name: orchestrator-sprint
description: Orchestrator sprint transition, handoff, and version upgrade phases. Use when a sprint completes and you need to generate the next execution plan, or when context is heavy and you need to write a handoff doc for the next orchestrator session. Covers Phase 8 (Sprint Transition) and Phase 9 (Handoff & Version Upgrade). Load orchestrator-rules alongside this skill.
---

# Orchestrator Sprint (Phases 8 & 9)

## Phase 8: Sprint Transition & Execution Plan Pipeline (f061)

**After agents complete a sprint, the orchestrator auto-generates the next execution plan. This is not manual.**

Pipeline:
1. **Debrief** — update campaigns.json: mark agents completed, record wins/losses, grade agents
2. **Categorize** — sort remaining items into priority groups (P0/P1/P2) and task buckets
3. **Present to user** — show the categorized plan as a table. Ask: "This is what I see. What's the next sprint focus?"
4. **User confirms direction** — which groups to tackle, what to defer
5. **Generate execution plan** — build the table (# | Task | Priority | Sprint | Status)
6. **Update campaigns page** — hero execution plan reflects the new table
7. **Update morning brief** — if one exists, regenerate with current state

**The orchestrator does steps 1-2 proactively.** Don't wait for the user to organize. You have the data — use it.

## Phase 9: Handoff & Version Upgrade

**Two triggers for upgrading to the next orchestrator version:**

1. **Context limit** — memory is heavy (~60%+ or ~5 hours). Performance degrades.
2. **Capability upgrade** — the orchestrator skill itself was modified this session, multiple new findings changed operating behavior, user feedback shifted the approach, or the session crossed a sleep boundary. A fresh session loads the latest skill from disk.

**If either trigger fires, write a handoff doc and recommend upgrade.**

When upgrading:

**Path:** `.claude/agent-hub/coordinated-sprint/orchestrator-v[N]-handoff.md`

**Must include:**
1. What this session built/did (bullet list)
2. What's next (prioritized, grouped)
3. Key user preferences learned this session
4. Active P0s
5. Data file current state (campaigns, findings count, memory files)
6. User work style reminders

Then tell the user: "Context is getting large. I've written a handoff at [path]. Recommend starting a fresh orchestrator session with `/orchestrator` and pointing it at this handoff."
