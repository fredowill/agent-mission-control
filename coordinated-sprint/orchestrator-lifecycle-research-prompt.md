## Mission: Research and define the optimal lifecycle stages for orchestrator agents, distinct from sub-agent lifecycle.

Orchestrators coordinate work — they don't build. Our current 6-stage lifecycle (Define, Discover, Execute, Reason, Verify, Debrief) was designed for builder agents. The orchestrator skill has 8 phases (Init, Questions, Plan, Update Data, Dispatch, Monitor/Grade, Findings, Handoff). We need a researched, evidence-based lifecycle that captures what orchestrators actually do, suitable for grading and visual tracking on the campaigns page.

**Deliverable:** A markdown document at `coordinated-sprint/orchestrator-lifecycle-research.md` with:
- Recommended lifecycle stages (with rationale from external sources)
- Mapping table: orchestrator phases → lifecycle stages
- Grading criteria per stage (what "passed" vs "failed" looks like for each)
- Visual representation suitable for a progress bar on the campaigns page

## Agent Lifecycle (follow in order)

### Stage 1: DEFINE
- **Read these files first:**
  - `projects/agent-mission-control/coordinated-sprint/orchestrator-v2.0-handoff.md` — context on what orchestrators do
  - `projects/agent-mission-control/campaigns.json` — search for `orchestrator` entries to see current lifecycle fields
  - `.claude/skills/orchestrator-init/SKILL.md` — Phase 1-2 of orchestrator workflow
  - `.claude/skills/orchestrator-plan/SKILL.md` — Phase 3-4
  - `.claude/skills/orchestrator-dispatch/SKILL.md` — Phase 5
  - `.claude/skills/orchestrator-grade/SKILL.md` — Phase 6-7
  - `.claude/skills/orchestrator-sprint/SKILL.md` — Phase 8-9
  - `.claude/skills/agent-grading/SKILL.md` — current sub-agent grading rubric
- **Success looks like:** A document with 6-10 lifecycle stages backed by external research, with clear grading criteria for each
- **Constraints:**
  - This is RESEARCH ONLY. Do not modify any code or config files.
  - Output must reference at least 5 external sources with URLs
  - Consider: should orchestrator lifecycle stages be the same labels as sub-agents (for visual consistency) or completely different (for accuracy)?

### Stage 2: DISCOVER (HARD GATE — do not skip)
Run: `ls .claude/skills/`
**You MUST load at least one skill before proceeding to Stage 3.**
Mandated skills for this task: `brainstorming` (to structure your research approach)

Use the **Deep Research three-phase pattern:**

**Phase 1: Outline** — Before searching, write down:
- What we know about orchestrator workflows from the files above
- What questions need external research (list 5-7 specific questions)
- Present this outline and proceed

**Phase 2: Focused search** — One search per question. Short queries like:
- "multi-agent coordinator evaluation criteria"
- "orchestration agent lifecycle stages"
- "AI agent handoff quality metrics"
- "coordinator vs worker agent grading differences"
- "agentic workflow evaluation rubric 2025"
Do NOT use internal jargon like "dispatched agents" or "campaign sprint" in searches.

**Phase 3: Synthesize** — Combine findings into the deliverable document.

### Stage 3: EXECUTE
1. Read all files listed in Stage 1
2. Complete Deep Research Phase 1 (outline what you know + questions)
3. Complete Deep Research Phase 2 (focused searches, one per question)
4. Complete Deep Research Phase 3 (synthesize into document)
5. Write the document to `coordinated-sprint/orchestrator-lifecycle-research.md`

Structure the document with these sections:
- **Current State** — what our orchestrator lifecycle looks like today (from files)
- **External Research** — what other frameworks do (with source citations)
- **Recommended Lifecycle** — proposed stages with rationale
- **Stage-by-Stage Grading Criteria** — for each stage, what "passed", "partial", "failed" means for an orchestrator
- **Mapping Table** — how orchestrator skill phases map to lifecycle stages
- **Visual Design Notes** — how this looks as a progress bar (6 dots? 8 dots? grouped?)

### Stage 4: REASON
- Should the lifecycle be 6 stages (matching sub-agents for visual consistency) or 8 stages (matching orchestrator phases for accuracy)?
- If 6: how do you map 8+ orchestrator activities into 6 buckets without losing meaning?
- If 8: does the campaigns page progress bar get cluttered?
- Is there a hybrid approach? (e.g., 6 high-level stages with orchestrator-specific substages)
- What do the best multi-agent frameworks use for coordinator evaluation?

### Stage 5: VERIFY
- Document has at least 5 external source URLs cited
- Each recommended lifecycle stage has clear passed/partial/failed criteria
- Mapping table covers all 8 orchestrator skill phases
- No internal jargon used in research queries (check your search history)
- Run: `cat coordinated-sprint/orchestrator-lifecycle-research.md | head -5` to verify file exists

### Stage 6: DEBRIEF (MANDATORY — your grade depends on this)
```bash
curl -X POST http://localhost:3033/api/campaigns/agent-debrief \
  -H "Content-Type: application/json" \
  -d '{
    "campaignId": "campaign-002",
    "slot": "lifecycle-research",
    "delivered": ["Item 1: orchestrator lifecycle research document with N stages recommended", "Item 2: grading criteria per stage", "Item 3: mapping table from orchestrator phases to lifecycle", "Item 4: N external sources cited"],
    "missed": ["Item 1: anything from the prompt not completed"],
    "lessons": ["Lesson 1: what you learned about orchestrator evaluation"]
  }'
```

**Rules for debrief arrays:**
- `delivered` MUST have at least 1 item. List specific outputs.
- `missed` MUST honestly list anything not completed. Empty is OK only if everything done.
- `lessons` at least 1 insight.
- Skipping this call or empty delivered[] = grade capped at C-.

## Constraints
- RESEARCH ONLY. Do not modify code, config, or campaign data.
- Minimum 5 external sources with URLs.
- Use Deep Research three-phase pattern (outline → focused search → synthesize).
- Short, targeted search queries — one concept per search.
- Save output to `coordinated-sprint/orchestrator-lifecycle-research.md`
