# MEMORY — phredomade

## Critical Rules (every agent, every session)
- **Playwright verify every UI change.** Screenshot + critically evaluate. DOM assertions miss clipping, overflow, misalignment.
- **No auto-commit** unless explicitly asked.
- **One failure = measure, not retry.** Instrument, identify the layer, measure the gap, then fix.
- **If you skipped verification, say so.** User prefers honesty over false "done."
- **Agent Lifecycle (6 stages, mandatory):** 🎯 Define → 🔍 Discover → ⚡ Execute → 🧠 Reason → ✅ Verify → 📝 Debrief. See f053, f085.
- **Don't wing it.** Check `.claude/skills/`, `.claude/agents/`, and web for tools before freeballing.
- **Parse every voice prompt (f065).** User dictates via Wispr Flow. Parse multi-part messages into structured decisions, confirm back, THEN act. Requirements slip when you skip this.
- **🔴 RESEARCH ONLINE FIRST (PM016).** Before building ANYTHING: WebSearch for existing solutions. Check awesome-claude-code, Anthropic docs, community gists. The internet is mandatory, not optional. v1.0-v1.6 never searched online — this caused massive gaps.
- **🔴 Search smarter, not harder.** Short, targeted queries — one concept per search. Don't kitchen-sink. Use universal language, NOT internal MC jargon ("dispatched agents", "loading enforcement"). After building, search to review against external patterns.
- **🔴 Use Deep Research pattern for ALL research.** Three phases: (1) Outline from model knowledge + web search supplement, (2) Focused deep search per item, (3) Structured output. Based on [Weizhena/Deep-Research-skills](https://github.com/Weizhena/Deep-Research-skills). Human approves outline before deep dive. Never do freeform "let me search 4 things at once" — always outline first.
- **🔴 USE YOUR OWN AGENTS (PM016).** 13 agents in `.claude/agents/`: agent-expert, configurator, critic, guard, perf, qa, scientist, scout, a11y, competitive-analyst, orchestrator, skills-guide, design. USE THEM.
- **🔴 Skill activation hook installed.** `UserPromptSubmit` hook at `.claude/hooks/skill-activation-hook.sh` injects mandatory skill check into every prompt. Based on community pattern (umputun gist + claudefast).
- **Enabled plugins (v1.6):** frontend-design, security-guidance, code-review, pr-review-toolkit.

## Two Projects, One Repo

### 1. phredomade (Photography Portfolio)
- **Status: LIVE and SHIPPED** at `phredomade.com`. Dev port: `3002`. Next.js 14 / React 18 / TypeScript / Tailwind.
- See `docs/phredomade-architecture.md` for details. Not the active focus — MC is.

### 2. Mission Control (Agent Dashboard) — ACTIVE FOCUS
- Zero-dependency Node.js server at `.claude/agent-hub/server.js` → `http://localhost:3033`
- **SEPARATE GIT REPO**: `.claude/agent-hub/` tracks to `fredowill/agent-mission-control`.
- **RESTART COMMAND (PM009)**: Always `node .claude/agent-hub/server.js` from phredomade root.
- Design: Apple-inspired **light mode**. Fonts: Plus Jakarta Sans, DM Sans, DM Mono.

**MC Pages:**
- Core nav: Dashboard, Dispatch, Campaigns, Findings, Workflow, Post-Mortems, Toolbox, Logic, Radar
- Also: /health, /close-out, /president, /capture, /story, /prompts

**MC Data Files:**
- `campaigns.json` — campaigns with 30 agents (grades, lifecycle, skills, delivered/missed, lessons)
- `dispatch.json` / `dispatch-home.json` / `dispatch-work.json` — task backlog + post-mortems
- `findings.json` — 76+ findings (f001-f082)
- `sources.json`, `workstreams.json`, `areas.json`, `mode.json`

## Orchestrator Pattern (as of v1.4)
- **1 long-lived coordinator (Opus) + many short-lived executors**
- **Skill:** `.claude/skills/orchestrator/SKILL.md` — hub file referencing 6 phase skills (init, plan, dispatch, grade, sprint, rules)
- **Latest handoff:** `.claude/agent-hub/coordinated-sprint/orchestrator-v1.6-handoff.md`

### Auto-Dispatch Pipeline (v1.5)
- **`POST /api/launch`** — dispatches agent in new terminal tab (passes slot for review agent)
- **`dispatch.sh`** — runs in new tab, supports auto/interactive modes, 6-stage trigger message
- **`auto-grade.js`** — grades agent on completion, writes to campaigns.json (academic scale: 80+=B)
- **`run-review.sh`** — NEW: mini review agent runs after main agent, reads logs + PRD, calls debrief API
- **`POST /api/campaigns/agent-debrief`** — NEW: agents self-report delivered/missed/lessons
- **`POST /api/campaigns/plan`** — NEW: update execution plan items live
- **`validate-html-js.js`** — NEW: PostToolUse hook validates JS in HTML files
- **`notify-ping.wav`** — LoL Enemy Missing ping on agent finish
- **`guard-destructive.sh`** — PreToolUse safety hook
- Full pipeline: dispatch → execute → auto-grade → review agent → LoL ping
- **Known gap:** auto-grade defaults fixed in v1.6 (empty deliverables → 5-15/40, not 30/40)

### Dispatch Checklist (updated for auto-dispatch)
1. Write PRD to `.claude/agent-hub/coordinated-sprint/<agent-name>-prompt.md`
2. Add agent card to `campaigns.json` (slot, name, focus, sprint, brief path)
3. Call `/api/launch` with agentName, promptFile, campaignId, slot
4. Agent auto-launches in new tab, auto-grades on completion
5. Campaigns page shows live state + grade automatically
**Orchestrator can now self-dispatch via `/api/launch`.**

### Orchestrator Init Checklist (f064)
- Load `/brainstorming` before any PRD or design decision
- Read open orchestrator post-mortems from dispatch.json (f069)
- Check `ls .claude/skills/` for relevant skills

## Key Concepts
- **Self-evolving loop** (f036): mistake → PM → finding → rule → hook → prevention
- **Calibration** (f054): phase between campaigns for system improvement
- **Agent Lifecycle** (f053): 5-stage pipeline. Only 4/21 agents reached Verify in campaign-001.
- **Prompt parsing** (f065): parse voice prompts into structured decisions before acting
- **Dispatch checklist** (f070): 5 steps, verified via API calls, never skipped

## Key Findings (stable patterns, not session-specific)
- **f064:** Orchestrator must use skills on init — brainstorming mandatory before PRDs
- **f065:** Parse every voice prompt into structured decisions before acting
- **f067:** PRDs go in files, never inline — enforced in orchestrator skill Phase 5
- **f068:** Orchestrator must NEVER use Agent tool — sub-agents are invisible
- **f069:** Orchestrator PMs must feed back into skill automatically
- **f070:** 5-step dispatch checklist — codify as standalone skill

## Environment
- Windows 11, bash shell. Home/Work toggle via mode.json + localStorage.
- MC is **personal IP**, not Microsoft work product.
- MCP servers need `cmd /c` wrapper on Windows. See `mcp-setup.md`.
- Port 3002 stuck: `netstat -ano | grep :3002` → `taskkill //PID <pid> //F`

## Detailed Notes (memory files)
- `principles.md` — engineering principles + Agent Lifecycle
- `design-context.md` — MC design system (light mode, fonts, colors)
- `mcp-setup.md` — MCP server setup on Windows
- `local-ports.md` — port registry

## Repo-local docs
- `docs/phredomade-architecture.md` — portfolio architecture
- `docs/security-audit.md` — security findings
- `docs/plans/2026-03-08-workflow-page-redesign-design.md` — workflow page design
- `docs/plans/2026-03-08-campaigns-page-overhaul-design.md` — campaigns page design
