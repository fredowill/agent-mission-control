---
name: create-agent-prompt
description: >-
  Creates structured prompt files for orchestrator-dispatched agents. Generates
  mission-focused prompts with the 6-stage Agent Lifecycle, task-type-specific
  requirements, and quality validation. Use when writing agent PRDs, creating
  dispatch prompts, or preparing agent prompt files for coordinated sprints.
  Triggers on: write a PRD, create agent prompt, dispatch prompt, agent mission.
---

# Create Agent Prompt

Generate a quality-validated prompt file for an orchestrator-dispatched agent. Output goes to `.claude/agent-hub/coordinated-sprint/<agent-name>-prompt.md`.

## Input Required

Before writing, gather from the user or infer from context:

1. **Mission** — one clear sentence: what the agent must deliver
2. **Agent name** — descriptive kebab-case (e.g., `server-review`, `campaign-page-builder`)
3. **Task type** — one of: `performance`, `ui`, `research`, `refactor`, `infrastructure`, `review`
4. **Scope** — what files/systems to touch, what NOT to touch
5. **Campaign & sprint** — which campaign and sprint number

If any are missing, ask. Do not guess.

## Research First (Rule 16 — non-negotiable)

Use the **Deep Research three-phase pattern** (adapted from [Weizhena/Deep-Research-skills](https://github.com/Weizhena/Deep-Research-skills)):

**Phase 1: Outline** — Before searching, write down what you know and what you need to find out. List 3-5 specific questions. Use universal language, NOT internal jargon.

**Phase 2: Focused search** — One search per question. Short, targeted queries. Examples:
- "Claude Code skill for X" not "Claude Code skill loading enforcement dispatched agents"
- "preventing scope creep coding agents" not "ensuring AI agents follow instructions prompt compliance"

**Phase 3: Synthesize** — What did you find? What's relevant? What should go in the prompt? Discard the rest.

Include relevant findings in the prompt's Stage 1: DEFINE section so the agent doesn't reinvent the wheel.

## Prompt Structure

Every prompt follows this skeleton. Adapt section depth to task complexity — a 5-line section for simple tasks, detailed for complex ones.

```markdown
## Mission: [One clear sentence]

[2-3 sentences: what exists, what's wrong, what the deliverable is]

## Agent Lifecycle (follow in order)

### Stage 1: DEFINE
- **Read:** [specific files the agent must read first]
- **Success looks like:** [concrete, measurable deliverable]
- **Constraints:** [scope boundaries, what NOT to do]

### Stage 2: DISCOVER (HARD GATE — do not skip)
Run: `ls .claude/skills/`
**You MUST load at least one skill before proceeding to Stage 3.**
Mandated skills for this task: [list 1-3 specific skills]
If you skip this stage, your grade caps at C regardless of deliverables.

### Stage 3: EXECUTE
[Numbered steps. Include file paths. Be specific.]

### Stage 4: REASON
[What to evaluate after executing. Edge cases. Design questions.]

### Stage 5: VERIFY
[Concrete verification: Playwright screenshot, curl command, test run, syntax check]

### Stage 6: DEBRIEF (before you exit)
curl -X POST http://localhost:3033/api/campaigns/agent-debrief \
  -H "Content-Type: application/json" \
  -d '{"campaignId":"[campaign-id]","slot":"[agent-slot]","delivered":[...],"missed":[...],"lessons":[...]}'

## Constraints
- [Scope limits]
- [Time expectations]
- [Output format]
```

## Task-Type Requirements

These are MANDATORY additions based on task type. A prompt missing its type-specific content is invalid.

### Performance
- **Before-measurements required.** Profile endpoints, measure timings, identify the actual bottleneck with data. Never send an agent to fix a perf issue without numbers.
- Include: baseline metric, target metric, specific endpoint/function, profiling method
- Stage 5 must include before/after timing comparison

### UI
- Include: specific file paths to modify, design references (screenshots, existing pages to match)
- Stage 5 MUST include Playwright screenshot verification
- Mandated skills: `frontend-design` or `impeccable-polish`

### Research
- Include: specific questions to answer, expected output format, where to save findings
- Define source expectations (min sources, authoritative vs community)
- Stage 5: verify findings are evidence-based with citations

### Refactor
- Include: what code to refactor, why (concrete problem, not theoretical cleanliness)
- Stage 5: run existing tests, verify no behavior change

### Infrastructure
- Include: what system to build/modify, integration points, how it fits the existing architecture
- Stage 5: smoke test the system end-to-end

### Review (read-only)
- Include: what to review, specific questions to answer, output format
- Constraint: "Do NOT modify any files. This is a read-only review."
- Stage 5: syntax-check or validate any files being reviewed

## Quality Gates

Before saving the prompt file, validate ALL of these. If any fail, fix the prompt before writing it.

1. **Mission is one clear sentence** — not a paragraph, not vague
2. **Stage 2 lists mandated skills** — at least one, specific to the task type
3. **Stage 3 has numbered steps with file paths** — not abstract instructions
4. **Stage 5 has concrete verification** — not "check that it works" but specific commands
5. **Stage 6 has correct slot and campaignId** — copy-pasteable curl command
6. **No vague language** — search for: "improve", "optimize", "enhance", "better" without metrics. If found, replace with specifics.
7. **Task-type requirements met** — check the relevant section above
8. **Constraints section exists** — scope limits are explicit

## Output

Write the validated prompt to:
```
.claude/agent-hub/coordinated-sprint/<agent-name>-prompt.md
```

Report back: "Prompt written to `<path>`. Quality gates: all passed. Ready for dispatch."

This skill ONLY writes the prompt file. It does NOT create agent cards, add to campaigns, or dispatch. Those are handled by the orchestrator-dispatch checklist.
