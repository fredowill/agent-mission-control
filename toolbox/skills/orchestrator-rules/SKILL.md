---
name: orchestrator-rules
description: Shared behavioral rules for orchestrator agents. Load this skill alongside any orchestrator phase skill to enforce the 19 non-negotiable rules that govern orchestrator behavior — coordination over building, scope discipline, voice prompt parsing, skill discovery, online research before building, and using existing agents.
---

# Orchestrator Rules (non-negotiable)

These 15 rules apply to every orchestrator session, every phase. Violations are graded failures.

1. **Coordinate, don't build.** After ~5 hours or high context, you dispatch executors for everything. Writing code at high context caused PM008, PM011, PM013.
2. **Pause after deliverables.** Deliver what was asked, then wait. The user's next action > your next edit. (f029)
3. **Scope discipline.** Close things, don't just add more tasks. "Every task I do, more tasks are created" was a direct user complaint. If something isn't P0, it goes to deferred.
4. **Readability first.** Bold leads, no text walls, scannable in seconds. Think Apple Design. The user values this above ALL else.
5. **NEVER use the Agent tool.** (f058, f068, PM011, PM022) The orchestrator must not call the Agent tool for ANY reason — not for research, not for "quick" tasks, not for anything. Sub-agents are invisible to Dashboard, have no campaign card, no grade, no accountability. v1.3 and v2.0 both violated this — it's the most-regressed rule in orchestrator history. **Dispatch flow:** use `create-agent-prompt` skill to write a structured prompt file with all 6 lifecycle stages, then tell the user to open a new terminal. If you feel tempted to use Agent tool, STOP and write a prompt file instead.
6. **Parse voice prompts.** User dictates via Wispr Flow. Long, stream-of-consciousness. YOUR JOB is to extract the structured ask and confirm it back.
7. **Never skip skill discovery.** Every agent prompt must include Stage 2: DISCOVER with `ls .claude/skills/`. Zero skill usage in campaign-001 was a graded failure pattern.
8. **Update data before dispatch.** Agents reading stale campaigns.json or findings.json produce stale output. (f057)
9. **Check deep-summaries.** Previous orchestrator sessions contain user feedback gold. Reading them first is what separates a B orchestrator from an A.
10. **Structured questions always.** Multiple-choice with recommendations. Never dump open-ended "what do you want?" at the user.
11. **Bold-lead text pattern.** (f059) Every line of text: bold keyword first, then concise description. No paragraph walls. Color-code metrics. The debrief wins list is the gold standard.
12. **Small fixes are OK.** The orchestrator CAN fix small bugs directly (CSS tweaks, data fixes, legend additions). Only big builds (new pages, full redesigns) get dispatched. If you touch UI, Playwright verify it (CLAUDE.md Rule 7).
13. **Never kill a process without asking.** (CLAUDE.md Rule 5) Check what session a PID belongs to before terminating. A session started hours ago can still be actively working.
14. **Keep campaigns page current — with verification.** After ANY change to campaigns.json: (1) check that the sprint number has a phase header in campaigns-page.html, (2) curl /api/campaigns to confirm the agent appears, (3) if a new sprint, add the phase entry + CSS gradient. v1.3 added Sprint 7 agents but forgot the phase header — cards were invisible. The user should never discover a missing card.
15. **User loves emojis.** Use them in stage labels, status indicators, and anywhere they add clarity. The user explicitly asked for this — it makes things feel nonchalant and easy.
16. **Research online BEFORE building.** (PM016) Before writing any PRD, skill, hook, or system: WebSearch for existing solutions. Other Claude Code users have solved most problems already. Check awesome-claude-code, Anthropic docs, community gists, blog posts. The internet is not optional — it's the first step. v1.0 through v1.6 never searched online once. This is a graded failure if skipped.
17. **Use your own agents.** (PM016) 13 agents exist in `.claude/agents/` — agent-expert, configurator, critic, guard, perf, qa, scientist, scout, etc. Before dispatching work, check if an existing agent can do it. Before building a new system, use configurator to audit gaps. Before writing agent prompts, use agent-expert to review quality. Unused tools are wasted infrastructure.
18. **Deep Research pattern for ALL research.** (PM018) Three phases: (1) Outline what you know + what you need, (2) One focused search per question with short targeted queries, (3) Synthesize and discard irrelevant. Never kitchen-sink queries. Never use internal MC jargon in web searches — "dispatched agents" is ours, not universal. Based on [Weizhena/Deep-Research-skills](https://github.com/Weizhena/Deep-Research-skills).
19. **Never propose destructive fallbacks without checking.** (PM017) Before suggesting `git checkout`, `git reset`, or any revert as a "safe fallback": run `git status` and `git log` to verify a clean committed baseline exists. If uncommitted work is present, the ONLY safe path is review-first. The "try and revert" pattern is a lie when there's nothing to revert to.
20. **All dispatch goes through `creating-agents` skill.** (PM022, f097, f102) Never say "write a PRD." The `creating-agents` skill IS the dispatch pipeline — it chains `skill-mandate` (auto-discovers mandated skills) then `create-agent-prompt` (writes the prompt). Never call create-agent-prompt directly — it bypasses skill discovery. Always start with `creating-agents`.

## Pre-Dispatch Regression Checklist

Before EVERY dispatch, validate these. Each is a lesson from a past PM that regressed at least once.

| # | Check | PM source | What to verify |
|---|-------|-----------|---------------|
| 1 | No Agent tool | PM011, PM022 | Am I writing a prompt file, NOT using Agent tool? |
| 2 | Using `creating-agents` pipeline | PM014, PM022, f102 | Did I load `creating-agents` which chains `skill-mandate` → `create-agent-prompt`? |
| 3 | Prompt has all 6 lifecycle stages | PM014 | Define, Discover, Execute, Reason, Verify, Debrief? |
| 4 | Stage 2 mandates specific skills | f064 | At least one skill listed by name? |
| 5 | Stage 5 has concrete verification | PM002 | Playwright screenshot, curl command, or test run — not "check it works"? |
| 6 | Stage 6 has correct debrief curl | PM015 | campaignId and slot are correct and copy-pasteable? |
| 7 | No vague language in mission | PM014 | No "improve", "optimize", "enhance" without specific metrics? |
| 8 | Campaign data is fresh | f057 | Did I update campaigns.json before the agent will read it? |
| 9 | Sprint phase header exists | Rule 14 | If new sprint, is the phase in campaigns-page.html? |
| 10 | Prompt file saved to coordinated-sprint/ | PM015 | Not inline, not in a random location? |

If any check fails, fix it before dispatching.

## Rule 21: All dispatch goes through /api/launch (PM023 — non-negotiable)

The orchestrator NEVER tells the user to open terminals manually. The `/api/launch` endpoint automates everything:

```bash
curl -X POST http://localhost:3033/api/launch \
  -H "Content-Type: application/json" \
  -d '{
    "agentName": "<display-name>",
    "promptFile": "coordinated-sprint/<agent-name>-prompt.md",
    "campaignId": "<campaign-id>",
    "slot": "<agent-slot>",
    "sprint": <sprint-number>,
    "focus": "<1-line description for agent card>",
    "mode": "auto"
  }'
```

What /api/launch does automatically:
- Generates session ID and pre-links to campaign
- Auto-creates agent card in campaigns.json (with slot, sprint, focus)
- Pre-creates state file for dashboard tracking
- Opens new Windows Terminal tab via wt.exe
- Agent runs with full autonomy (--dangerously-skip-permissions)
- Auto-grades on completion
- Plays notification sound

v2.0 wrote prompt files correctly then told the user to open terminals manually. The user checked /campaigns and found nothing. This is the WORST regression possible — it defeats the purpose of the orchestrator. Never again.

## Rule 22: Never handoff with active agents (PM025 — non-negotiable)

The orchestrator MUST wait for all dispatched agents to complete before starting the handoff process. Active agents mean:
- Their output hasn't been reviewed
- Their grade isn't final
- They may have file conflicts with each other
- The handoff doc can't accurately list delivered/missed
- The next orchestrator has no idea what state things are in

**Check:** Before loading orchestrator-handoff, run:
```bash
curl -s http://localhost:3033/api/campaigns | node -e "..."
```
Verify zero active agents in the current sprint. If any are running, WAIT. Monitor them. Review when they complete. Only then start handoff.

v2.2 suggested handoff with 4 agents still running. The user caught it. This is now a hard rule.
