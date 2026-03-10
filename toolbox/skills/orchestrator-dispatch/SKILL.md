---
name: orchestrator-dispatch
description: Orchestrator agent dispatch phase with PRD template, dispatch checklist, and follow-up prompt patterns. Use when writing agent PRDs, dispatching agents to campaigns, or sending follow-up prompts to running agents. Covers Phase 5 (Dispatch Agents) including the full 6-stage Agent Lifecycle template. Load orchestrator-rules alongside this skill.
---

# Orchestrator Dispatch (Phase 5)

## Agent Prompt Template

Every agent prompt MUST include the Agent Lifecycle. This is non-negotiable.

```markdown
## Mission: [Clear one-line goal]

[2-3 sentences of context: what exists, what's wrong, what the deliverable is]

## Agent Lifecycle (follow in order)

### Stage 1: DEFINE
[What to read, what success looks like, constraints]

### Stage 2: DISCOVER (HARD GATE — do not skip)
**Skills:** Run `ls .claude/skills/` — load at least one skill before Stage 3.
Mandated skills for this task: [list specific skills]
Grade caps at C if you skip this.

**Research:** Use the Deep Research pattern — outline what you need to know, search one question at a time with short targeted queries, synthesize. Never use internal jargon in searches.

### Stage 3: EXECUTE
[Specific steps, files to modify, architecture decisions]

### Stage 4: REASON
[What to evaluate: does it match requirements? Edge cases?]

### Stage 5: VERIFY
[How to verify: Playwright screenshot, run tests, curl endpoint, etc.]

### Stage 6: DEBRIEF (before you exit)
Before exiting, write your self-report to campaigns.json via the API:
```
curl -X POST http://localhost:3033/api/campaigns/agent-debrief -H "Content-Type: application/json" -d '{
  "campaignId": "campaign-001",
  "slot": "[your-agent-slot]",
  "delivered": ["item 1", "item 2"],
  "missed": ["item 1"],
  "lessons": ["what you learned"]
}'
```
Keep items concise: **bold keyword** — short description. Max 2-3 words bold, then context.

## Constraints
- [Scope boundaries — what NOT to touch]
- [Time/context expectations]
- [Output format requirements]
```

## Dispatch Checklist (every agent, no exceptions)

For EACH agent being dispatched, complete ALL of these steps in order:

**Step 1: Write the prompt file (f067)**
- Load the `create-agent-prompt` skill and use it to generate the prompt file
- Path: `.claude/agent-hub/coordinated-sprint/<agent-name>-prompt.md`
- The skill enforces quality gates, task-type requirements, and research-first (Rule 16)
- NEVER dump prompts inline in chat. This has failed 3 times. The file IS the deliverable.

**Step 2: Add agent card to campaigns.json**
- Include: slot, name, focus, sprint number, status "ready", brief path, empty lifecycle/skills/delivered/missed
- The brief field must point to the prompt file from Step 1

**Step 3: Add agent to /prompts page**
- Add entry to the `prompts` array in `.claude/agent-hub/prompts-page.html`
- Include: name, focus description, full prompt text
- This gives the user a one-click "Copy Prompt" button

**Step 4: Verify campaigns page renders the agent**
- Check that the sprint number has a phase header in campaigns-page.html (the `phases` array)
- If the sprint is new, add it with a label and CSS gradient color
- Curl or check `/api/campaigns` to confirm the agent appears

**Step 5: Launch via /api/launch (MANDATORY — PM031)**
- Launch EVERY agent programmatically via the API. NEVER tell the user to copy-paste or manually open terminals.
- API call: `curl -X POST http://localhost:3033/api/launch -H "Content-Type: application/json" -d '{"campaignId":"<id>","slot":"<slot>","agentName":"<name>","promptFile":"<path>"}'`
- Verify the response contains `{"ok":true,"sessionId":"..."}` before proceeding to the next agent.
- If /api/launch fails, investigate the error. Do NOT fall back to manual dispatch.
- This is a hard gate. Manual dispatch instructions = graded failure. (PM023, PM031 — regressed twice.)

## Follow-up Prompts (f072)

When an agent finishes but needs a polish pass or small revisions, do NOT create a new agent. Send a follow-up to the SAME terminal session — they have the context.

1. Write follow-up to `.claude/agent-hub/coordinated-sprint/<agent-name>-followup.md`
2. Add `"followUpBrief": "coordinated-sprint/<agent-name>-followup.md"` to the agent's campaigns.json entry
3. The campaigns page modal will show a "Copy Follow-up" button alongside "Copy Initial Prompt"
4. User pastes the follow-up into the agent's existing terminal

**New agent vs follow-up:** New agent = completely separate task. Follow-up = extension of what the agent just built. If the agent has context that would be lost by starting fresh, use a follow-up.

## Other Dispatch Rules

- **One deliverable per agent.** If a task has two unrelated outputs, split into two agents.
- **Include file paths.** Agents waste tokens discovering what you already know.
- **Name agents descriptively.** "Campaign Page Builder" not "Agent 3."
- **Check for conflicts** before dispatching — verify no other agent is editing the same files.
- **NEVER use the Agent tool.** (f068) The orchestrator must not spawn sub-agents via the Agent tool — they are invisible to the Dashboard, have no campaign card, no grade, no accountability. Every piece of work gets its own prompt file and user-dispatched session. If you are tempted to use the Agent tool, that is a signal to write a prompt file instead.

## Next Phase

After agents are dispatched, load `orchestrator-grade` for Phase 6 (Monitor & Grade).
