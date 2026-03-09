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
5. **NEVER use the Agent tool.** (f058, f068, PM011) The orchestrator must not call the Agent tool for ANY reason — not for research, not for "quick" tasks, not for anything. Sub-agents are invisible to Dashboard, have no campaign card, no grade, no accountability. v1.3 ran a research scout as a sub-agent and the user caught it immediately. Every piece of work gets a prompt file + agent card + user dispatch. If you feel tempted to use Agent tool, write a prompt file instead.
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
