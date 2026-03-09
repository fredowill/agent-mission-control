## Mission: Break the monolithic orchestrator skill into phase-specific loadable skills

The orchestrator skill at `.claude/skills/orchestrator/SKILL.md` has 8 phases in one 260-line file. Each phase should become its own loadable skill so agents can load only what they need.

## Context
- **Current skill:** `.claude/skills/orchestrator/SKILL.md` — 8 phases, 16 rules
- **Skills directory:** `.claude/skills/` — each skill is a directory with a `SKILL.md`
- **Goal:** An orchestrator loads the base skill, then can load phase-specific skills as needed
- **Phases to extract:** Initialize, Ask Questions, Execution Plan, Update Data, Dispatch, Monitor & Grade, Findings, Sprint Transition

## Agent Lifecycle (follow in order)

### Stage 1: DEFINE
Read `.claude/skills/orchestrator/SKILL.md` fully. Understand:
- The 8 phases and what each contains
- The 16 rules at the bottom
- Which phases reference each other (dependencies)
- The PRD template in Phase 5

Success = orchestrator skill becomes a lean hub file + 4-8 phase skills that can be loaded independently.

### Stage 2: DISCOVER (HARD GATE — do not skip)
Run: `ls .claude/skills/`
**You MUST load at least one skill before proceeding to Stage 3.**
Mandated skills for this task: `skill-builder` or `skill-creator`
If you skip this stage or proceed without loading skills, your grade caps at C regardless of deliverables.

### Stage 3: EXECUTE
1. Create phase-specific skill directories:
   - `.claude/skills/orchestrator-init/SKILL.md` — Phase 1: Initialize
   - `.claude/skills/orchestrator-plan/SKILL.md` — Phase 3: Execution Plan
   - `.claude/skills/orchestrator-dispatch/SKILL.md` — Phase 5: Dispatch (includes PRD template + checklist)
   - `.claude/skills/orchestrator-grade/SKILL.md` — Phase 6: Monitor & Grade (includes grading rubric)
2. Keep the main `orchestrator/SKILL.md` as a lean hub that references the phase skills
3. Move the 16 rules to a shared `orchestrator-rules/SKILL.md` or keep them in the hub
4. Ensure the PRD template (Phase 5) is self-contained in the dispatch skill

### Stage 4: REASON
- Can each phase skill be loaded independently without the others?
- Does the hub file clearly point to which phase skill to load?
- Are cross-references between phases preserved?

### Stage 5: VERIFY
- Verify each new skill file exists and is valid markdown
- Verify the hub file references all phase skills
- Run `ls .claude/skills/orchestrator*` to confirm the directory structure

### Stage 6: DEBRIEF (before you exit)
Before exiting, call the debrief API:
```bash
curl -s -X POST http://localhost:3033/api/campaigns/agent-debrief -H "Content-Type: application/json" -d '{"campaignId":"campaign-001","slot":"orchestrator-skill-split","delivered":["item 1"],"missed":["item 1"],"lessons":["lesson 1"]}'
```

## Constraints
- Do NOT delete the original SKILL.md — transform it into a hub.
- Each phase skill must have proper frontmatter (name, description).
- The dispatch phase skill must include the full PRD template with 6-stage lifecycle.
- Do NOT modify server.js or any HTML files.
