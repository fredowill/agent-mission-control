## Mission: Ensure the 6-stage Agent Lifecycle is structurally enforced in all agent-facing documents, with a reference card and prompt audit scorecard.

The Agent Lifecycle (Define → Discover → Execute → Reason → Verify → Debrief) exists in the orchestrator skill and create-agent-prompt skill, but agents still skip stages. In campaign-001, only 4/30+ agents loaded skills (Discover), and only a handful reached Verify. The lifecycle needs structural enforcement — not just text in prompts but measurable gates.

## Agent Lifecycle (follow in order)

### Stage 1: DEFINE

- **Read:** `.claude/skills/orchestrator-dispatch/SKILL.md` — the dispatch phase skill with the PRD template
- **Read:** `.claude/skills/create-agent-prompt/SKILL.md` — the prompt generation skill with quality gates
- **Read:** `CLAUDE.md` — check if lifecycle is referenced
- **Read:** `.claude/agent-hub/campaigns.json` — look at lifecycle data per agent. Count how many passed each stage.
- **Read:** 3-4 existing prompts in `.claude/agent-hub/coordinated-sprint/` — compare old-style (pre-v1.7) vs new-style (infra-attribution, infra-polish)
- **Success looks like:** (1) Lifecycle reference card created, (2) CLAUDE.md updated with lifecycle rule, (3) Audit scorecard of all existing prompts, (4) Concrete data on which stages agents fail most
- **Constraints:** Do NOT modify existing agent prompts retroactively. Audit them, don't rewrite them.

### Stage 2: DISCOVER (HARD GATE — do not skip)

Run: `ls .claude/skills/`
**You MUST load at least one skill before proceeding to Stage 3.**
Mandated skills for this task: `agent-development` (for agent prompt best practices)
If you skip this stage, your grade caps at C regardless of deliverables.

### Stage 3: EXECUTE

1. **Audit all existing prompts** — read every `*-prompt.md` in `coordinated-sprint/`. For each, check:
   - Has 6-stage lifecycle? (yes/no)
   - Stage 2 mandates specific skills? (yes/no)
   - Stage 5 has concrete verification? (yes/no)
   - Stage 6 has debrief API curl? (yes/no)
   - Output as a markdown table

2. **Analyze campaigns.json lifecycle data** — for all 30+ agents:
   - Count: how many passed/partial/failed/skipped each stage
   - Identify the weakest stage (likely Discover or Verify)
   - Output as a summary table

3. **Create lifecycle reference card** — write to `.claude/agent-hub/coordinated-sprint/lifecycle-reference.md`:
   - 6 stages with emoji, name, what to do, what "passed" means, what "failed" means
   - Include the exact `ls .claude/skills/` command for Discover
   - Include the exact debrief curl template for Debrief
   - Keep under 80 lines — a quick reference, not a novel

4. **Update CLAUDE.md** — add a concise rule (3-5 lines):
   - Every agent prompt MUST include the 6-stage lifecycle
   - Stage 2 (Discover) MUST mandate at least one skill
   - Stage 6 (Debrief) MUST include the debrief API curl
   - Reference the `create-agent-prompt` skill as the canonical prompt generator

### Stage 4: REASON

- After these changes, what's the enforcement mechanism? Text in CLAUDE.md is necessary but not sufficient — the skill-activation-hook already enforces skill checking. What else could enforce lifecycle compliance?
- Which stages need the most help based on the data?

### Stage 5: VERIFY

- Verify CLAUDE.md has the new lifecycle rule — `grep "lifecycle" CLAUDE.md`
- Verify the reference card exists and is under 80 lines — `wc -l coordinated-sprint/lifecycle-reference.md`
- Verify the audit scorecard covers all prompts — count entries vs files
- Verify the scorecard table renders correctly

### Stage 6: DEBRIEF (before you exit)

```bash
curl -s -X POST http://localhost:3033/api/campaigns/agent-debrief \
  -H "Content-Type: application/json" \
  -d '{"campaignId":"campaign-001","slot":"lifecycle-enforcer-v2","delivered":["item 1"],"missed":["item 1"],"lessons":["lesson 1"]}'
```

## Constraints

- **Modify:** CLAUDE.md (add lifecycle rule, 3-5 lines max), create lifecycle-reference.md
- **Do NOT modify:** existing agent prompts, campaigns.json, server.js, any MC page
- **Do NOT modify:** orchestrator skills or create-agent-prompt skill — those are managed by the orchestrator
- **Output:** audit scorecard as a table in the debrief, not a separate file
