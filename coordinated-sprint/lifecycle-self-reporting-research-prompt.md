## Mission: Research how to implement agent lifecycle self-reporting via hooks to replace heuristic inference (~70% accuracy) with ~95% accuracy.

Currently, the campaigns page infers an agent's lifecycle stage (Define/Discover/Execute/Reason/Verify/Debrief) from its tool state (investigating/developing/verifying). This heuristic is ~70% accurate — "investigating" always maps to Define even during Execute. We need agents to self-report their stage transitions so the page shows accurate lifecycle progress.

**Deliverable:** Research document at `coordinated-sprint/lifecycle-self-reporting-research.md` with: recommended implementation approach, hook design, state file changes, and effort estimate.

## Agent Lifecycle (follow in order)

### Stage 1: DEFINE
- **Read these files first:**
  - `projects/agent-mission-control/toolbox/hooks/hook.js` — current PostToolUse/Stop hook that writes state files. Understand the existing state tracking.
  - `projects/agent-mission-control/toolbox/config/memory-files/auto-dispatch-research.md` — documents state file format and hook architecture
  - `C:\Users\emeskel\Claude\coordinated-sprint\orchestrator-lifecycle-research.md` — the 6-stage lifecycle definition and stage detection criteria
  - `projects/agent-mission-control/campaigns-page.html` — search for `inferLifecycleStage` to see the current heuristic
  - `.claude/settings.json` — understand how hooks are configured
- **Success looks like:** A clear recommendation document answering: what hook changes are needed, what the state file additions look like, how the campaigns page reads the self-reported stage, and estimated effort (hours, not days).
- **Constraints:** RESEARCH ONLY — do NOT modify any code or config.

### Stage 2: DISCOVER (HARD GATE — do not skip)
Run: `ls .claude/skills/`
**You MUST load at least one skill before proceeding to Stage 3.**
Mandated skills for this task: `brainstorming`

Use Deep Research pattern:
- Phase 1: Outline what we know + questions
- Phase 2: Focused online searches (short queries)
- Phase 3: Synthesize into recommendation

### Stage 3: EXECUTE

Research these specific questions:

1. **Can PostToolUse hooks detect lifecycle transitions?**
   - When an agent loads a skill (Skill tool) → Discover stage
   - When an agent starts writing (Write/Edit tool) → Execute stage
   - When an agent runs Bash (tests, curl) → Verify stage
   - When an agent calls the debrief API → Debrief stage
   - How reliable is this detection? What are the false positive scenarios?

2. **Should agents write their own lifecycle stage to the state file?**
   - Option A: Hook infers from tool pattern → writes `lifecycleStage` to state file
   - Option B: Agent explicitly writes stage (e.g., via a special tool call or convention)
   - Option C: Hybrid — hook infers by default, agent can override
   - Which is most reliable? Which requires least agent cooperation?

3. **What do other multi-agent frameworks do?**
   - Search: "multi-agent lifecycle tracking progress reporting"
   - Search: "Claude Code hook PostToolUse state tracking"
   - Search: "agent progress monitoring real-time"

4. **What state file changes are needed?**
   - Current format: `{state, tool, detail, statusLine, ts, claudePid, ...}`
   - Proposed addition: `{lifecycleStage: "execute", lifecycleHistory: ["define", "discover", "execute"], ...}`
   - How does the campaigns page read this?

5. **Modal auto-refresh — how to update modal content without close/reopen?**
   - The 5-second polling fetches data but the modal DOM isn't updated
   - Should the modal re-render its content on each poll?
   - How to avoid flicker/layout jump?

Write the document with these sections:
- Current State (how it works today)
- Options Assessed (A/B/C with pros/cons)
- Recommended Approach (with implementation steps)
- State File Schema Changes
- Modal Auto-Refresh Solution
- Effort Estimate
- Risk Assessment

### Stage 4: REASON
- The hook fires on EVERY tool call — performance impact of adding lifecycle logic?
- False positives: an agent reading files during Execute stage would be detected as Define. How to handle?
- Should lifecycle stage be monotonic (only moves forward) or can it go back?

### Stage 5: VERIFY
- Document has all 7 sections listed above
- At least 3 online sources cited
- Implementation steps are concrete enough for a builder agent to follow
- Run: `cat coordinated-sprint/lifecycle-self-reporting-research.md | head -5` to confirm file exists

### Stage 6: DEBRIEF (MANDATORY)
```bash
curl -X POST http://localhost:3033/api/campaigns/agent-debrief \
  -H "Content-Type: application/json" \
  -d '{
    "campaignId": "campaign-002",
    "slot": "lifecycle-self-reporting-research",
    "delivered": ["Item 1: research doc with recommended approach", "Item 2: state file schema changes", "Item 3: modal auto-refresh solution"],
    "missed": ["Item 1: anything not completed"],
    "lessons": ["Lesson 1: insight"]
  }'
```

## Constraints
- RESEARCH ONLY — do NOT modify code, hooks, or config
- Save to `coordinated-sprint/lifecycle-self-reporting-research.md`
- Minimum 3 online sources
- Use Deep Research pattern (outline → focused search → synthesize)
