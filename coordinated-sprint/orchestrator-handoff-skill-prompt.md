## Mission: Build the `/orchestrator-handoff` skill with 9 quality gates that enforce clean orchestrator transitions.

Orchestrators currently hand off via unstructured markdown docs. v2.0 forgot to git commit, missed open PMs, and left gaps in campaign data. This skill makes every handoff quality-gated — if a gate fails, the handoff is blocked until fixed.

**Deliverable:** A complete skill at `.claude/skills/orchestrator-handoff/SKILL.md` that:
- Enforces 9 quality gates (git, JSON, PMs, server, registration, previous orch, handoff doc, campaign data, prompt review)
- Generates a standardized handoff document template
- Blocks handoff if any gate fails
- Bundles PM021 fix (push confirmation gate)

## Agent Lifecycle (follow in order)

### Stage 1: DEFINE
- **Read these files first:**
  - `projects/agent-mission-control/coordinated-sprint/orchestrator-v2.0-handoff.md` — what a handoff doc looks like + gaps
  - `projects/agent-mission-control/coordinated-sprint/orchestrator-v1.9-handoff.md` — the "golden standard" handoff
  - `.claude/skills/orchestrator-init/SKILL.md` — what the next orchestrator needs to see
  - `.claude/skills/orchestrator-rules/SKILL.md` — rules the handoff must enforce
  - `projects/agent-mission-control/campaigns.json` — search for orchestrator entries to understand data structure
  - `projects/agent-mission-control/dispatch.json` — search for `pm021` to understand the push-without-consent issue
- **Success looks like:** A skill file that, when loaded by an orchestrator, walks it through a quality-gated handoff with zero missed steps
- **Constraints:**
  - Output is a SKILL.md file only — no scripts, no server changes
  - The skill must work on both Windows and macOS (the user works on both machines)
  - Must reference existing infrastructure (campaigns.json, dispatch.json, /api/campaigns endpoints)
  - Do NOT create new API endpoints

### Stage 2: DISCOVER (HARD GATE — do not skip)
Run: `ls .claude/skills/`
**You MUST load at least one skill before proceeding to Stage 3.**
Mandated skills for this task: `skill-builder` (to follow proper skill file conventions)

Also search online for:
- "Claude Code skill file structure best practices" (short, focused query)
- "orchestrator handoff checklist multi-agent" (short, focused query)

### Stage 3: EXECUTE
1. Read all files listed in Stage 1
2. Load `skill-builder` skill
3. Search online per Stage 2
4. Design the skill structure:

**Quality Gates (all must pass to proceed):**

| # | Gate | Check Command | Failure Action |
|---|------|---------------|----------------|
| 1 | Git clean | `git status --porcelain` returns empty | List uncommitted files, tell orchestrator to commit first |
| 2 | JSON valid | `node -e "JSON.parse(fs.readFileSync('campaigns.json'))"` for campaigns.json and dispatch.json | Show parse error, tell orchestrator to fix |
| 3 | Open PMs listed | Parse dispatch.json for `"status": "open"` items | List open PMs, require them in handoff doc |
| 4 | MC server running | `curl -s http://localhost:3033/api/campaigns` returns 200 | Warn but don't block (server may be intentionally down) |
| 5 | Self-registration done | Current orchestrator exists in campaigns.json with `"status": "active"` | Tell orchestrator to self-register |
| 6 | Previous orchestrator completed | No other orchestrator with `"status": "active"` in same campaign | Mark previous as completed |
| 7 | Handoff doc written | File exists at `coordinated-sprint/orchestrator-v{N}-handoff.md` | Generate template, tell orchestrator to fill it |
| 8 | Campaign data updated | `delivered` and `missed` arrays are non-empty for current orchestrator in campaigns.json | Tell orchestrator to populate |
| 9 | Session prompts reviewed | Handoff doc contains a "What I Learned From Previous Prompts" section | Add section with last 10 prompt summary |

**Push confirmation gate (PM021 fix):**
- After all 9 gates pass, ask: "Ready to push to remote? (y/n)"
- If the orchestrator hasn't been explicitly told to push, DO NOT push
- This closes PM021

**Handoff doc template:**
```markdown
# Orchestrator v{N} Handoff

**Date:** [date] | **Campaign:** [campaign-id] | **Machine:** [hostname]

## What v{N} Did
[Summary table of key deliverables]

## Critical Tasks for v{N+1}
[Prioritized list with P0/P1/P2]

## Open Post-Mortems
[List from dispatch.json with status]

## Gaps Left
[Honest accounting of what wasn't finished]

## User Preferences Reinforced This Session
[Feedback patterns to carry forward]

## v{N-1} Items Still Not Done
[Cross-reference against previous handoff]

## How to Resume
[Exact steps for starting the next orchestrator]
```

5. Write the skill to `.claude/skills/orchestrator-handoff/SKILL.md`

### Stage 4: REASON
- Should the skill be interactive (ask questions) or automated (run all checks silently)?
  - Recommendation: automated with a summary report. Only ask for push confirmation.
- Should gates be hard-blocks or warnings?
  - Recommendation: Gates 1, 2, 5, 6, 7, 8 are hard blocks. Gates 3, 4, 9 are warnings.
- How does this interact with the orchestrator-sprint skill (Phase 8)?
  - The handoff skill REPLACES the sprint skill's handoff section. They should not overlap.

### Stage 5: VERIFY
- Verify skill file structure matches existing skills: `ls .claude/skills/orchestrator-init/`
- Verify all 9 gates are documented with check commands and failure actions
- Verify the handoff doc template has all required sections
- Verify PM021 push confirmation is included
- Run: `cat .claude/skills/orchestrator-handoff/SKILL.md | head -10` to confirm file exists
- Check no vague language: search the file for "improve", "optimize", "enhance" without specifics

### Stage 6: DEBRIEF (MANDATORY — your grade depends on this)
```bash
curl -X POST http://localhost:3033/api/campaigns/agent-debrief \
  -H "Content-Type: application/json" \
  -d '{
    "campaignId": "campaign-002",
    "slot": "handoff-skill-builder",
    "delivered": ["Item 1: orchestrator-handoff SKILL.md with 9 quality gates", "Item 2: handoff doc template", "Item 3: PM021 push confirmation gate", "Item 4: gate classification (hard-block vs warning)"],
    "missed": ["Item 1: anything from the prompt not completed"],
    "lessons": ["Lesson 1: what you learned about skill design"]
  }'
```

**Rules for debrief arrays:**
- `delivered` MUST have at least 1 item. List specific outputs.
- `missed` MUST honestly list anything not completed. Empty is OK only if everything done.
- `lessons` at least 1 insight.
- Skipping this call or empty delivered[] = grade capped at C-.

## Constraints
- Output is `.claude/skills/orchestrator-handoff/SKILL.md` — one file only
- Must work on Windows and macOS
- Use existing infrastructure (campaigns.json, dispatch.json, /api/campaigns)
- Do NOT create new API endpoints or scripts
- Do NOT modify existing skills — this is a new, standalone skill
