# Agent Lifecycle — Quick Reference

Every agent follows 6 stages in order. Skipping a stage caps your grade.

## 🎯 Stage 1: DEFINE
**Do:** Read all specified files. State success criteria and constraints before writing code.
**Passed:** Read every file listed in the prompt, confirmed understanding of scope.
**Failed:** Jumped to execution without reading context. Started guessing.

## 🔍 Stage 2: DISCOVER (HARD GATE)
**Do:** Run `ls .claude/skills/` and load mandated skills. Check agents and MCP servers.
**Passed:** Loaded at least one mandated skill before Stage 3.
**Failed:** Skipped skill discovery entirely. Grade caps at C.
```bash
ls .claude/skills/
```

## ⚡ Stage 3: EXECUTE
**Do:** Follow the numbered steps in the prompt. Include file paths. Stay in scope.
**Passed:** All primary deliverables completed. No scope creep.
**Failed:** Core deliverable missing or wrong. Significant scope creep.

## 🧠 Stage 4: REASON
**Do:** Evaluate your work. Check edge cases. Ask "does this match requirements?"
**Passed:** Identified at least one issue or confirmed correctness with evidence.
**Failed:** Skipped evaluation. Shipped without thinking.

## ✅ Stage 5: VERIFY
**Do:** Run the specific verification commands in the prompt (Playwright, curl, tests, grep).
**Passed:** Ran all verification steps. Screenshots taken for UI changes. Fixed issues found.
**Failed:** No verification evidence. Claimed "done" without proof.

## 📝 Stage 6: DEBRIEF (MANDATORY — before you exit)
**Do:** Call the debrief API to self-report delivered items, missed items, and lessons.
**Passed:** Called the API with accurate, concise items.
**Failed:** Exited without debriefing. Grade loses 5 points.
```bash
curl -s -X POST http://localhost:3033/api/campaigns/agent-debrief \
  -H "Content-Type: application/json" \
  -d '{
    "campaignId":"<campaign-id>",
    "slot":"<your-slot>",
    "delivered":["**keyword** — description"],
    "missed":["**keyword** — description"],
    "lessons":["what you learned"]
  }'
```

---

## Campaign-001 Data (37 completed agents)

| Stage | Pass Rate | Biggest Problem |
|-------|-----------|-----------------|
| Define | 100% | None — every agent reads context |
| Discover | 35% | 49% failed or skipped skill loading |
| Execute | 89% | 2 agents delivered nothing |
| Reason | 65% | 24% skipped evaluation entirely |
| Verify | 16% | 44% failed or skipped verification |
| Debrief | 60%* | Only tracked for 10 agents |

*Discover and Verify are the critical failure points.*

## Enforcement Mechanisms
1. **Prompt structure** — `create-agent-prompt` skill includes all 6 stages
2. **Skill-activation hook** — `UserPromptSubmit` hook injects skill check reminder
3. **Auto-grading** — `auto-grade.js` scores lifecycle compliance (20% weight)
4. **CLAUDE.md rule** — every agent sees the lifecycle mandate on init
