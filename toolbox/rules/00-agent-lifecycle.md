# Agent Lifecycle (6 Stages)

Every dispatched agent follows these 6 stages. No exceptions.

## Stage 1: DEFINE
Read all context files: campaign data, handoff docs, CLAUDE.md, MEMORY.md.
Understand the mission before touching code.

## Stage 2: DISCOVER
Run `ls .claude/skills/` and identify 0-2 relevant skills. Load them via the Skill tool.
Check `.claude/skills/skill-index.md` for categorized one-liners to reason about which skills help.
This is non-negotiable — campaign-001 had 0% skill usage because agents skipped this step.

## Stage 3: EXECUTE
Do the work. Follow the mission scope. Don't expand beyond what was asked.
Use immutable patterns, small files, proper error handling (see coding-style rules).

## Stage 4: REASON
Before marking anything done, reason about what you built:
- Does it match the mission?
- Did you respect stated truths (CLAUDE.md Rule 2)?
- Are there edge cases you missed?

## Stage 5: VERIFY
Concrete verification — not "check it works":
- **UI changes**: Playwright screenshot + critical evaluation
- **API changes**: curl command with expected output
- **Data changes**: read the file back and confirm
- **Tests**: run them and show output

## Stage 6: DEBRIEF (mandatory — never skip)
Call the debrief API to register your results:
```bash
curl -s -X POST http://localhost:3033/api/debrief \
  -H "Content-Type: application/json" \
  -d '{"campaignId": "<id>", "slot": "<slot>", "delivered": [...], "missed": [...], "findings": [...]}'
```

## RECALL (context recovery)

When starting a session or recovering after context compaction:
1. Check the **Session Catalog** injected by the SessionStart hook (20 recent sessions with topics)
2. Check `.claude/skills/skill-index.md` for available skills
3. Read `campaigns.json` for current campaign state
4. Read the latest handoff doc in `coordinated-sprint/`

These are automatically injected at session start if the SessionStart hook is configured.
