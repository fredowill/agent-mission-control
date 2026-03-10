---
name: skill-mandate
description: >-
  Auto-discover and recommend which skills to mandate for a dispatched agent
  based on task type and scope. Use when creating agent prompts, writing PRDs,
  or preparing dispatch — determines the optimal mandated skills for Stage 2
  DISCOVER. Triggers on: which skills should this agent use, mandate skills,
  skill discovery for agent, what skills to require.
---

# Skill Mandate — Auto-Discovery for Agent Dispatch

Scan available skills, match against the agent's task type and scope, and return a recommended list of mandated skills for the agent's Stage 2: DISCOVER section.

## When to Use

Call this skill BEFORE writing an agent prompt. It determines which skills the dispatched agent should be required to load.

## Step 1: Gather Context

You need two inputs:
1. **Task type** — one of: `performance`, `ui`, `research`, `refactor`, `infrastructure`, `review`, `skill-building`
2. **Scope description** — 1-2 sentences about what the agent will do

If these aren't provided, ask for them.

## Step 2: Scan Available Skills

Run: `ls ~/.claude/skills/`

Read the SKILL.md description (first 5 lines after the frontmatter) for each potentially relevant skill. Don't read ALL 70+ — use the task type to narrow down.

## Step 3: Match Against Task Type

Use this mapping as a starting point, then refine based on scope:

### Performance
- **Always mandate:** `impeccable-optimize`
- **Consider:** `systematic-debugging` (if fixing a perf bug), `verification-before-completion`

### UI / Design
- **Always mandate:** `frontend-design` OR `impeccable-frontend-design`
- **Consider:** `impeccable-polish` (if polish pass), `impeccable-animate` (if animations), `impeccable-colorize` (if color work)

### Research
- **Always mandate:** `brainstorming` (to structure the research approach)
- **Consider:** None — research agents need thinking time, not building skills

### Refactor
- **Always mandate:** `coding-standards`
- **Consider:** `verification-before-completion`, `tdd-workflow` (if tests exist)

### Infrastructure
- **Always mandate:** `coding-standards`
- **Consider:** `backend-patterns` (if API/server), `security-review` (if auth/input handling)

### Review (read-only)
- **Always mandate:** `verification-before-completion`
- **Consider:** `security-review` (if security audit), `coding-standards` (if code quality review)

### Skill-Building
- **Always mandate:** `skill-builder`
- **Consider:** `brainstorming` (if designing from scratch)

## Step 4: Validate Recommendations

For each recommended skill, verify:
1. It exists in `~/.claude/skills/` (run `ls` to confirm)
2. It's relevant to the specific scope (not just the general task type)
3. Maximum 3 mandated skills per agent — more causes confusion and grade inflation

## Step 5: Output

Present the recommendation as:

```
Mandated skills for [agent name]:
1. `skill-name-1` — [why: 1 sentence]
2. `skill-name-2` — [why: 1 sentence]

These will be added to Stage 2: DISCOVER in the agent prompt.
```

Wait for orchestrator approval before proceeding. The orchestrator may add, remove, or override.

## Rules

- **Max 3 mandated skills** — agents with too many mandates get confused
- **"Always mandate" is a default, not a rule** — the orchestrator can override
- **Research tasks get fewer skills** — research agents need to think, not follow skill instructions
- **Never mandate skills the agent can't use** — e.g., don't mandate `frontend-design` for a script-only task
- **Validate against actual directory** — skills get added/removed; always check `ls`
