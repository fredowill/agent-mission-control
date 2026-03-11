# MEMORY — Agent Mission Control

## Critical Rules (every agent, every session)
- **Playwright verify every UI change.** Screenshot + critically evaluate. DOM assertions miss clipping, overflow, misalignment.
- **No auto-commit** unless explicitly asked.
- **One failure = measure, not retry.** Instrument, identify the layer, measure the gap, then fix.
- **If you skipped verification, say so.** User prefers honesty over false "done."
- **Agent Lifecycle (6 stages, mandatory):** Define -> Discover -> Execute -> Reason -> Verify -> Debrief. See f053, f085.
- **Don't wing it.** Check `.claude/skills/`, `.claude/agents/`, and web for tools before freeballing.
- **Parse every voice prompt (f065).** User dictates via Wispr Flow. Parse multi-part messages into structured decisions, confirm back, THEN act.
- **RESEARCH ONLINE FIRST (PM016).** Before building ANYTHING: WebSearch for existing solutions. The internet is mandatory, not optional.
- **Search smarter, not harder.** Short, targeted queries -- one concept per search. Don't kitchen-sink. Use universal language, NOT internal MC jargon.
- **Use Deep Research pattern for ALL research.** Three phases: (1) Outline from model knowledge + web search supplement, (2) Focused deep search per item, (3) Structured output. Human approves outline before deep dive.
- **USE YOUR OWN AGENTS (PM016).** 13 agents in `.claude/agents/`: agent-expert, configurator, critic, guard, perf, qa, scientist, scout, a11y, competitive-analyst, orchestrator, skills-guide, design. USE THEM.
- **Skill activation hook installed.** `UserPromptSubmit` hook at `~/.claude/hooks/skill-activation-hook.sh` injects mandatory skill check into every prompt.
- **Enabled plugins:** frontend-design, security-guidance, code-review, pr-review-toolkit.

## Two Projects, Two Repos

### 1. phredomade (Photography Portfolio)
- **Status: LIVE and SHIPPED** at `phredomade.com`. Dev port: `3002`. Next.js 14 / React 18 / TypeScript / Tailwind.
- Repo: `~/phredomade/` on both machines. Not the active focus -- MC is.

### 2. Mission Control (Agent Dashboard) -- ACTIVE FOCUS
- Zero-dependency Node.js server at `server.js` -> `http://localhost:3033`
- **Own git repo**: `fredowill/agent-mission-control`
- **Work path**: `~/projects/agent-mission-control/`
- **Home path**: `~/Claude/projects/agent-mission-control/`
- **RESTART COMMAND**: `node server.js` from the MC repo root.
- Design: Apple-inspired **light mode**. Fonts: Plus Jakarta Sans, DM Sans, DM Mono.

**MC Pages:**
- Core nav: Dashboard, Dispatch, Campaigns, Findings, Workflow, Post-Mortems, Toolbox, Logic, Radar
- Also: /health, /close-out, /president, /capture, /story, /prompts

**MC Data Files (in `data/`):**
- `campaigns.json` -- campaigns with 30+ agents (grades, lifecycle, skills, delivered/missed, lessons)
- `dispatch.json` / `dispatch-home.json` / `dispatch-work.json` -- task backlog + post-mortems
- `findings.json` -- 76+ findings (f001-f082+)
- `sources.json`, `workstreams.json`, `areas.json`, `mode.json`

**MC Hook Architecture (migrated 2026-03-10):**
- **User-level** (`~/.claude/settings.json`): MC hooks -- hook.js, prompt-hook.js, statusline, precompact
- **Project-level** (`~/phredomade/.claude/settings.json`): phredomade-specific hooks only (guard, check-server, etc.)
- MC hooks use `__dirname`-relative paths -- no hardcoded project root in JS files
- `setup-hooks.sh` in `scripts/` regenerates user-level settings for any machine

## Orchestrator Pattern
- **1 long-lived coordinator (Opus) + many short-lived executors**
- **Skill:** `.claude/skills/orchestrator/SKILL.md` -- hub file referencing 6 phase skills
- **Handoffs:** `coordinated-sprint/orchestrator-v*.md` (latest: v2.7)

### Auto-Dispatch Pipeline
- **`POST /api/launch`** -- dispatches agent in new terminal tab
- **`scripts/dispatch.sh`** -- runs in new tab, supports auto/interactive modes, 6-stage trigger message
- **`scripts/auto-grade.js`** -- grades agent on completion, writes to campaigns.json
- **`scripts/run-review.sh`** -- mini review agent after main agent, reads logs + PRD, calls debrief API
- **`POST /api/campaigns/agent-debrief`** -- agents self-report delivered/missed/lessons
- Full pipeline: dispatch -> execute -> auto-grade -> review agent -> LoL ping

### Dispatch Checklist
1. Write PRD to `coordinated-sprint/<agent-name>-prompt.md`
2. Add agent card to `campaigns.json` (slot, name, focus, sprint, brief path)
3. Call `/api/launch` with agentName, promptFile, campaignId, slot
4. Agent auto-launches in new tab, auto-grades on completion
5. Campaigns page shows live state + grade automatically

## Key Concepts
- **Self-evolving loop** (f036): mistake -> PM -> finding -> rule -> hook -> prevention
- **Calibration** (f054): phase between campaigns for system improvement
- **Agent Lifecycle** (f053): 6-stage pipeline. Define -> Discover -> Execute -> Reason -> Verify -> Debrief
- **Prompt parsing** (f065): parse voice prompts into structured decisions before acting
- **Dispatch checklist** (f070): 5 steps, verified via API calls, never skipped

## Key Findings (stable patterns)
- **f064:** Orchestrator must use skills on init -- brainstorming mandatory before PRDs
- **f065:** Parse every voice prompt into structured decisions before acting
- **f067:** PRDs go in files, never inline
- **f068:** Orchestrator must NEVER use Agent tool -- sub-agents are invisible
- **f069:** Orchestrator PMs must feed back into skill automatically
- **f070:** 5-step dispatch checklist

## Environment
- Windows 11, bash shell. Home/Work toggle via mode.json + localStorage.
- MC is **personal IP**, not Microsoft work product.
- MCP servers need `cmd /c` wrapper on Windows. See `mcp-setup.md`.
- Port 3002 stuck: `netstat -ano | grep :3002` -> `taskkill //PID <pid> //F`

## Detailed Notes (memory files)
- `principles.md` -- engineering principles + Agent Lifecycle
- `design-context.md` -- MC design system (light mode, fonts, colors)
- `mcp-setup.md` -- MCP server setup on Windows
- `local-ports.md` -- port registry
