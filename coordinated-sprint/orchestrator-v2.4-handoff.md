# Orchestrator v2.4 Handoff

**Date:** 2026-03-09 | **Campaign:** campaign-002 (MC Maturity Sprint) | **Machine:** Home PC (ephra)

---

## What v2.4 Did

Interactive session focused on the /why page redesign and systemic research infrastructure. First orchestrator to work directly with user on implementation rather than dispatching agents.

| Component | What It Does |
|-----------|-------------|
| **Sprint 4 agent reviews** | Graded Story Overhaul (C+, wrong target), confirmed Cerebras Migration (B), Why2 Overhaul (B+). All 4 Sprint 4 agents now have grades. |
| **deep-research skill** | Installed standardhuman/deep-research-skill (7-phase: classify, scope, hypothesize, plan, query, triangulate, synthesize). Enforced via skill-rules.json. |
| **PM030 + f106 + f107** | Raw WebSearch banned (PM030). No SVGs ever (f106). Research must use deep-research skill (f107). All three are permanent constraints. |
| **skill-rules.json expanded** | Added research keywords (research, investigate, look into, find out) and animation keywords (animate, motion, scroll effect). Now 9 rules total. |
| **Why2 page rebuilt** | Light mode, GSAP ScrollTrigger via CDN, problem-first content, no GPA/internal metrics. User said "not bad but sucks" -- too generic. |
| **Why3 page built with soul** | Dark warm palette (#111110), Inter + JetBrains Mono, real product screenshots in hero, personal headline ("I got tired of my AI agents making the same mistakes"), contextual quotes next to features, Cursor/Sentry/Linear-inspired patterns. |
| **Static image serving** | Added /pages/*.png route to server.js for product screenshots. |
| **MEMORY.md updated** | No-SVG constraint + raw-WebSearch ban added to Critical Rules. |

---

## Critical Tasks for v2.5

### P0: Why3 needs more soul and iteration
User said current version "lacks soul." Research from Evil Martians, Cursor, Sentry, Linear is documented in this session. Key insight: show the product (screenshots in hero), use problem-first storytelling, contextual social proof. The page needs a proper interactive element -- not just scroll reveals. Consider: animated dashboard mockup, interactive demo, or video walkthrough.

### P0: Orchestrator hard stops
User's original P0 from session start. Never started -- session pivoted to Why page work. v2.2 regression wasted hours. Needs brainstorming + design: context % threshold, token budget, auto-handoff trigger, hard prompt count limit.

### P0: Interactive agents architecture
User pain point discovered this session: all agents run start-to-finish with zero user input. User was told this would be built. Needs design session -- how can dispatched agents pause and ask the user questions mid-run?

### P1: Demo sprint preparation
User wants to show MC to friends. Why3 is the showpiece but needs iteration. Prerequisites: finalize Why3, verify all pages render, test end-to-end.

### P1: Handoff gate updates (from v2.3)
- Gate 1 rename: "Git committed" not "Git clean"
- Gate 10 (toolbox sync): don't skip
- New gate: Toolbox install audit
- Gate 9: Check "not done" table

---

## Open Post-Mortems

| PM | Title | Status | Priority |
|----|-------|--------|----------|
| PM008 (dispatch) | Subagent flight search exposed 3 gaps | open | p1 |
| PM007 (dispatch-home) | Agent waited for input with no notification | open | p0 |
| PM008 (dispatch-home) | Dashboard blank -- server-side code in client HTML | open | p0 |
| PM009 (dispatch-home) | Toolbox utilization blind spot | open | p0 |
| PM011 (dispatch-home) | Dashboard blank card -- empty box | open | p0 |
| PM012 (dispatch-home) | Morning Brief written as markdown -- user can't find | open | p0 |
| PM013 (dispatch-home) | Campaign debrief losses column crushed | open | p1 |
| PM026 (dispatch-home) | Skill activation hook overwritten | open | p1 |
| PM029 (dispatch-home) | 13 agents + 18 skills missing from toolbox | open | p0 |
| PM030 (dispatch-home) | Raw WebSearch kitchen-sink queries | open | p0 |

**Note:** Many dispatch-home PMs are from earlier sessions and may be stale. v2.5 should audit and close resolved ones.

---

## Gaps Left

1. **Why3 soul** -- user said "it lacks soul." Research done (Evil Martians study, Cursor/Sentry/Linear patterns), product shots added, but page still needs interactive elements, better animations, more personality.
2. **Orchestrator hard stops** -- not started. User's original P0.
3. **Interactive agents** -- user discovered agents can't ask questions mid-run. Architectural gap.
4. **Demo sprint** -- not formally planned.
5. **.claude/rules/ directory** -- carried from v2.3, not started.
6. **CLAUDE.md review skill** -- carried from v2.3, not started.
7. **Sound Design System** -- carried from v2.2, not started.
8. **Close-out tab update** -- stale, carried from v2.1.

---

## User Preferences Reinforced This Session

1. **No SVGs. Ever.** (f106) User hates SVGs. Component-based animations only. PERMANENT.
2. **No raw WebSearch for research.** (f107/PM030) Always use deep-research skill. Kitchen-sink queries are banned.
3. **Use skills, not raw tools.** User caught orchestrator doing raw WebSearch instead of loading a research skill. "I'm glad I caught you doing that bullshit."
4. **Test skills after installing.** PM028 applies to skills too -- don't install and claim done without running it.
5. **Self-review before showing user.** User said "do a pass thru or assign an agent to review so you can internalize and not waste my time looking at it."
6. **Show the product.** The #1 thing missing from soulless pages is an actual product screenshot. Cursor, Linear, every good dev tool page shows the product immediately.
7. **Work interactively on design.** User explicitly said "I want to work with you, Orchestrator" on the Why page -- not dispatch an agent. Interactive agents architecture is a real gap.
8. **Look online and steal.** User said to look at real pages with soul and steal patterns. Deep research on Evil Martians study, Cursor, Sentry, Linear, Warp yielded concrete stealable patterns.

---

## v2.3 Items Still Not Done

| Item | Priority | v2.4 Status |
|------|----------|-------------|
| Orchestrator hard stops | P0 | NOT STARTED -- user pivoted to Why page work |
| Demo sprint preparation | P0 | Partially -- Why3 built but needs iteration |
| Update handoff gates | P0 | NOT STARTED |
| .claude/rules/ directory | P1 | NOT STARTED |
| CLAUDE.md review skill | P1 | NOT STARTED |
| Close-out tab update | P1 | NOT STARTED |
| Sound Design System | P1 | NOT STARTED |
| Viewable skill content on agent cards | P1 | NOT STARTED |
| Cross-device handoff skill | P1 | NOT STARTED |

---

## Key Research from This Session

### Evil Martians: 100 Dev Tool Landing Pages Study
- Problem-first messaging creates emotional resonance
- "No salesy BS" and "clever and simple wins"
- Centered hero with big bold headline + product shot below
- Contextual social proof (quotes next to features, not separate section)
- Specific CTAs ("Download for macOS" not "Get started")
- Signals of life (changelog, milestones, live data)

### Pages with Soul (stealable patterns)
- **Cursor**: Interactive product demo in hero, 60% of page is product shots, warm dark palette
- **Sentry**: Self-deprecating humor ("considered not bad by 4M devs")
- **Linear**: Inter Display + refined animations, warm dark mode, "flows like water"
- **Warp**: Warm dark (#121212), warm taupe accents, 4 fonts for personality

### Technology Decision
- **GSAP + ScrollTrigger via CDN** -- confirmed best option for vanilla HTML pages
- **Motion.dev** -- works vanilla JS too, lighter but less powerful
- Both load via 2 script tags, no build step needed

---

## How to Resume

1. Open a new Claude Code terminal
2. Start with: "You are Orchestrator v2.5. Read `.claude/agent-hub/coordinated-sprint/orchestrator-v2.4-handoff.md` then run /orchestrator-init"
3. **MANDATORY:** Load /orchestrator-rules FIRST.
4. **First tasks (in order):**
   - Iterate on Why3 with user (the soul gap)
   - Design orchestrator hard stops (user's original P0)
   - Design interactive agents architecture (user pain point)
   - Audit and close stale PMs in dispatch-home.json
5. **Context:** Home machine. MC server at localhost:3033. Campaign-002 active (Sprint 5). 10 open PMs (many stale). 77 agents, 62+ skills. deep-research skill installed. skill-rules.json has 9 rules. /why3 route live with product screenshots.
