---
name: creating-agents
description: >-
  Complete pipeline for creating and dispatching campaign agents. Orchestrates
  skill discovery, prompt writing, and quality validation in one flow. Use
  when the orchestrator needs to dispatch a new agent — replaces manual
  prompt writing. Triggers on: create agent, dispatch agent, new agent,
  build agent prompt, prepare agent for dispatch.
---

# Creating Agents — Full Dispatch Pipeline

This is the parent skill for creating campaign agents. It chains three steps:
1. Gather inputs
2. Auto-discover mandated skills (via `skill-mandate`)
3. Write the prompt file (via `create-agent-prompt`)

**This skill replaces calling `create-agent-prompt` directly.** Always use this as the entry point.

## Step 1: Gather Inputs

Collect from the orchestrator or infer from context:

| Input | Required | Example |
|-------|----------|---------|
| **Mission** | Yes | "Build auto-grade-orchestrator.js with 4-factor rubric" |
| **Agent name** | Yes | `grading-script-builder` (kebab-case) |
| **Task type** | Yes | One of: `performance`, `ui`, `research`, `refactor`, `infrastructure`, `review`, `skill-building` |
| **Scope** | Yes | What files/systems to touch, what NOT to touch |
| **Campaign & sprint** | Yes | `campaign-002`, Sprint 2 |

If any are missing, ask. Do not guess.

## Step 2: Discover Mandated Skills

**Invoke the `skill-mandate` skill.**

Pass it the task type and scope. It will:
- Scan `~/.claude/skills/`
- Match against task type
- Return 1-3 recommended mandated skills with reasoning

**Wait for the skill-mandate output before proceeding.** The orchestrator may override.

## Step 3: Write the Prompt

**Invoke the `create-agent-prompt` skill.**

Pass it all inputs from Step 1 PLUS the mandated skills from Step 2. The create-agent-prompt skill will:
- Apply the Deep Research pattern (Rule 16)
- Write the 6-stage lifecycle prompt
- Validate against quality gates
- Save to `coordinated-sprint/<agent-name>-prompt.md`

## Step 3.5: Stamp the Pipeline Watermark (MANDATORY)

After `create-agent-prompt` writes the prompt file, YOU (creating-agents) must add the watermark as the FIRST line:

```
<!-- PIPELINE: create-agent-prompt | mandated: skill1,skill2 | task-type: tasktype -->
```

**Only this skill adds the watermark.** `create-agent-prompt` does NOT add it — by design. This means:
- Calling `create-agent-prompt` directly = no watermark = `/api/launch` rejects it
- Only the full pipeline (creating-agents → skill-mandate → create-agent-prompt → watermark) produces launchable prompts
- This is the PM025 enforcement mechanism (f104)

Read the prompt file, prepend the watermark line with the correct mandated skills and task type from Steps 1-2, and write it back.

## Step 4: Confirm Before Dispatch

Present the completed prompt summary to the orchestrator:

```
Agent ready for dispatch:
  📋 Name: [agent-name]
  🎯 Mission: [1 sentence]
  🔧 Task type: [type]
  📦 Mandated skills: [skill-1], [skill-2]
  📁 Prompt: coordinated-sprint/[agent-name]-prompt.md
  🏷️ Campaign: [id] Sprint [N]

Approve dispatch? (The orchestrator will use /api/launch)
```

**Do NOT dispatch.** This skill only writes the prompt. The orchestrator handles /api/launch.

## Dependencies

This skill chains:
1. `skill-mandate` — must be loaded in Step 2
2. `create-agent-prompt` — must be loaded in Step 3

Both must exist in `~/.claude/skills/`.

## Rules

- **Always start here** — never call `create-agent-prompt` directly without skill discovery
- **Max 3 mandated skills** — enforced by skill-mandate
- **Orchestrator approves before dispatch** — this skill writes, the orchestrator launches
- **Task type is mandatory** — it drives the entire skill selection
