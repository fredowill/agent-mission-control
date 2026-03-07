# MC Evolution Sprint — Campaign Retrospective

**Campaign:** campaign-001 (MC Evolution Sprint)
**Date:** 2026-03-06 to 2026-03-07
**Author:** Retrospector Agent
**Scope:** First coordinated 4-agent campaign. Broadly applicable lessons for all future campaigns.

---

## Executive Summary

The MC Evolution Sprint was a qualified success. 4 agents ran simultaneously, each with a clear brief, and produced 15 wins across infrastructure (terminal identity, /end-session), strategy (value proposition, elevator pitch, 7 ranked recommendations), UX research (inspector panel spec, campaign activity feed concept), and tooling (Campaigns page, Sprint Prompts page, 5 new findings). The campaign also produced 7 losses and 12 new findings (f023-f034), most of which expose coordination failures — not agent quality failures. The agents did their jobs well. The orchestration around them had gaps.

The single most important takeaway: **the orchestrator role is underdefined**. The orchestrator built features AND coordinated agents AND managed the campaign AND handled debrief — too many hats. Future campaigns need a cleaner separation between doing and coordinating.

---

## 1. Patterns That Made This Campaign Succeed

These should become standard practice for every multi-agent campaign.

### 1a. Detailed briefs with exact file paths and deliverables

Every agent received a brief that included:
- Exact file paths to read (not "look at the codebase" but `.claude/agent-hub/server.js`)
- Numbered deliverables with clear output format
- User quotes revealing intent and philosophy
- Working agreements specifying file ownership

**The principle:** An agent's efficiency is proportional to the specificity of its brief. Vague briefs produce vague work. Precise briefs — with paths, quotes, constraints, and output locations — let agents execute without searching, guessing, or stepping on each other.

**Always do this:** Write briefs as if the agent has zero context. Include every file path, every constraint, every user quote. The cost of over-specifying a brief is zero. The cost of under-specifying is a wasted session.

### 1b. Clear ownership boundaries prevented file conflicts

Each brief explicitly stated which files the agent owned and which were off-limits:
- Beacon owned `hook.js`, `prompt-hook.js`, and new commands
- Compass and Overwatch were research-only — no code modifications
- Orchestrator owned `dispatch-page.html`, `server.js`, `findings.json`

**The principle:** In parallel execution, ownership is not a suggestion — it's a mutex. When two agents can edit the same file, they will. Ownership must be declared in the brief, not assumed.

**Always do this:** Before launching agents, map every file that might be touched. Assign exclusive ownership. If two agents need the same file, one of them must describe their changes in their output and let the owner apply them.

### 1c. Research agents produced the highest-value output

Compass (strategic evaluator) and Overwatch (UX researcher) were explicitly told to think, not code. They produced the sprint's most durable artifacts: the value proposition, the elevator pitch ("air traffic control for AI agents"), the inspector panel spec, competitive positioning, and the insight that Findings — not the Dashboard — is MC's killer feature.

**The principle:** Not every agent should write code. Research agents — given permission to read extensively and think deeply — produce strategic clarity that coding agents never will. A session spent thinking is not a session wasted.

**Always do this:** In any campaign with 3+ agents, at least one should be a dedicated thinker/researcher with no code modification permissions. Their output is the campaign's strategic compass.

### 1d. Cross-agent coordination notes enabled async handoffs

The `cross-agent-notes.md` file let Overwatch leave technical notes for Beacon (e.g., "use claudePid as the join key for terminal identity"). Agents couldn't talk to each other in real-time, but they could leave structured notes.

**The principle:** Parallel agents need an async communication channel. A shared file with clear attribution (who wrote it, who it's for, what it's about) is sufficient. It doesn't need to be fancy — it needs to exist.

**Always do this:** Create a `cross-agent-notes.md` at sprint start. Brief every agent on its existence. Any agent that discovers something another agent needs writes it there.

### 1e. Pain points captured as findings during the sprint

The sprint didn't just produce features — it produced 12 findings (f023-f034) that document coordination failures, UX insights, and behavioral principles. These are more valuable than most of the features built, because they prevent future mistakes across all campaigns.

**The principle:** A campaign that produces only features and no findings learned nothing. The meta-learning — what went wrong and why — is the compound interest of the system. Features are spent once. Findings pay dividends forever.

**Always do this:** The orchestrator (or a dedicated retrospector) must capture findings during the campaign, not just after it. Real-time finding capture catches nuance that post-hoc memory misses.

---

## 2. Patterns That Caused Failures

These should be explicitly prevented in every future campaign.

### 2a. Prompts dumped inline instead of served as hotlinks

The orchestrator produced 3 multi-paragraph agent briefs as inline code blocks in the conversation. The user had to drag-select each one in the terminal, couldn't tell where one ended and the next began, and accidentally pasted the wrong prompt into two terminals — wasting an entire agent session.

**The principle:** Terminal text is not a delivery mechanism. Anything the user needs to copy-paste must be served through a clickable interface with one-button copy. The terminal scrolls, text blurs together, and mistakes are invisible until they've already caused damage.

**Never do this again:** Never dump copy-paste content inline in a terminal session. Always create a hotlink page (e.g., `/prompts`) with isolated, labeled, one-click-copy blocks. This is mandatory for coordinated sprints.

### 2b. Orchestrator flew past deliverables without pausing

The orchestrator produced the agent briefs (the deliverable the user asked for) and immediately launched into follow-up work. The briefs scrolled off-screen. The user couldn't find them, couldn't act on them, and had to wonder whether the agent had even done what was asked.

**The principle:** A deliverable that scrolls off-screen may as well not exist. When the user asks for something, produce it and stop. Let them see it, copy it, act on it. Do not immediately start the next phase of work.

**Never do this again:** After producing a requested deliverable, pause and wait for user acknowledgment before continuing. The user is the rate limiter in a coordinated sprint — they need to dispatch prompts to other terminals before the orchestrator moves on.

### 2c. No setup-phase checklist led to missed objectives

Agents launched without a verified list of what the user actually asked for. The original prompt contained objectives that were paraphrased, reduced, or dropped during brief creation. The 44-minute demo video dissection was never set up. The /why page was created but never wired to a route. These weren't agent failures — they were orchestration failures. Nobody checked the original list against the briefs.

**The principle:** The moment between "user describes what they want" and "agents start working" is the highest-leverage moment of the entire campaign. A 5-minute setup phase that maps user requests to agent assignments, with explicit checkboxes, would have caught every missed item.

**Never do this again:** Before launching any agent, the orchestrator must produce a Setup Checklist:
1. List every objective from the user's original request (verbatim, not paraphrased)
2. Map each objective to an agent assignment
3. Flag any objective that has NO agent assignment
4. Get user confirmation before launching

### 2d. Agent deliverables existed as files but weren't accessible

Compass created `why-page.html`. The orchestrator never audited agent outputs to check if they needed wiring (server routes, nav links). The file sat on disk for the entire sprint with no route. The user had to discover it was missing and ask why.

**The principle:** A file on disk is not a deliverable. A deliverable is something the user can reach — a routed page, a linked document, a visible artifact. The gap between "file exists" and "user can access it" is the orchestrator's responsibility.

**Never do this again:** After a coordinated sprint, the orchestrator must audit every agent's output files and verify each is accessible. Routes wired, links added, pages loading. If an agent's brief says "create X," the orchestrator's post-sprint checklist must say "verify X is reachable."

### 2e. Data changes presented as UI changes

The orchestrator updated `campaigns.json` with new status fields, agent names, and debrief data. But the Campaigns page HTML was not updated to render that data. The page looked identical. The user asked for an improved page and got an improved JSON file — invisible work.

**The principle:** The user sees the screen, not the data file. Updating backend data without updating the frontend that displays it is not a deliverable. Always close the loop: data change + UI change + visual verification. If the page looks the same after your work, you did nothing from the user's perspective.

**Never do this again:** Every data change must be paired with its rendering change. If you edit a JSON file, check: does any page display this data? If yes, update the page. If no, question whether the data change matters.

### 2f. Campaign tasks created outside the campaign tracking

New tasks (profile-v2, demo-guide) were created during campaign review and added to Dispatch but NOT to the campaign's remaining list. The campaign is the user's primary tracking view during a sprint. Tasks that emerge from a campaign but don't appear in the campaign are invisible in context.

**The principle:** During a campaign, the campaign is the source of truth. Every task born from the campaign must appear in the campaign's remaining list and the global backlog. Both. In the same edit. Sync is not optional — it's the same action.

**Never do this again:** Any task created BECAUSE of a campaign must be added to that campaign's remaining list in the same operation that creates the dispatch item.

---

## 3. The Single Biggest Insight

**The orchestrator pattern should be: 1 long-lived coordinator + many short-lived executors.**

Running 4 large-context agents simultaneously burns tokens across all of them. Each agent builds up context independently, and much of that context is duplicated (they all read CLAUDE.md, they all read findings.json, they all understand MC's architecture).

The efficient pattern discovered during this campaign:
- **One orchestrator** with full context (1M tokens, long-lived) that holds the big picture, writes briefs, dispatches agents, audits output, and manages the campaign lifecycle
- **Many short-lived agents** that receive narrow briefs, execute one focused task, write their output to a known location, and close

This saves tokens, reduces context pollution, and keeps each agent focused. The orchestrator pays the context cost once. The executors are cheap and disposable.

This insight also resolves the "orchestrator wore too many hats" problem: the orchestrator should coordinate, not build. If the orchestrator needs features built, it dispatches an executor for that too. The orchestrator's deliverable is the campaign itself — the briefs, the checklist, the debrief, the remaining items — not code.

---

## 4. How the Orchestrator Role Should Work Differently

### What went wrong this time

The orchestrator simultaneously:
- Wrote 3 agent briefs (a coordination task)
- Built the Campaigns page (a development task)
- Improved the Dispatch page (a development task)
- Managed findings (a curation task)
- Ran the debrief (an evaluation task)
- Fixed a 13x page load regression (an emergency task)

This is too many responsibilities. The orchestrator's development work competed with coordination work. When the orchestrator was deep in Campaigns page code, nobody was checking whether agents had delivered what was asked, whether output files were wired, or whether the setup checklist was complete.

### What should change

The orchestrator's job in future campaigns is strictly:

**Before sprint:**
1. Translate user's stream-of-consciousness into discrete objectives
2. Map objectives to agent assignments (Setup Checklist)
3. Write briefs with exact file paths, deliverables, ownership, and working agreements
4. Serve briefs via hotlink page — never inline
5. Get user confirmation on the checklist before launching agents

**During sprint:**
6. Monitor agent progress (via MC Dashboard/Campaigns page)
7. Answer agent questions or unblock them
8. Handle emergencies only — do not build features
9. Capture findings in real-time as coordination issues emerge

**After sprint:**
10. Audit every agent's output files for accessibility (routes, links, loading)
11. Compile wins, losses, remaining into the campaign record
12. Add all newly spawned tasks to both campaign remaining AND dispatch
13. Run or dispatch a retrospective

**If the orchestrator also needs to build things**, it dispatches a separate executor agent for its own development tasks — and treats itself as a coordinator, not a doer.

---

## 5. What the Campaign Setup Phase Should Look Like

The sprint's biggest preventable failures (missed video dissection, unwired /why page, wrong prompt dispatched) all stem from the same root cause: no structured setup phase between "user describes goals" and "agents start executing."

### The Setup Checklist Protocol

**Step 1: Capture (2 minutes)**
Listen to the user's full request. Don't interrupt, don't start planning mid-stream. Record every objective mentioned — verbatim phrases, not paraphrases.

**Step 2: Enumerate (3 minutes)**
Produce a numbered list of every discrete objective. Each one should be testable: "Did we do this? Yes or no."

Example from this sprint (what should have been produced):
```
[ ] 1. Dispatch UX: priority sorting, backlog collapse, mission report panel
[ ] 2. Campaigns page: coordinated sprint tracking with agent slots
[ ] 3. Terminal identity: know which terminal is which at a glance
[ ] 4. Session retrospective: structured end-of-session capture
[ ] 5. Value proposition: articulate what MC is and why it matters
[ ] 6. /why page: hidden URL explaining MC to someone new
[ ] 7. Agent interface: investigate ChatGPT-style agent manager
[ ] 8. Video dissection: adapt dissect-video for home, process 44-min demo
```

**Step 3: Assign (2 minutes)**
Map each objective to an agent. Flag any objective with no assignment.

```
[Orchestrator] 1. Dispatch UX
[Orchestrator] 2. Campaigns page
[Beacon]       3. Terminal identity
[Beacon]       4. Session retrospective
[Compass]      5. Value proposition
[Compass]      6. /why page
[Overwatch]    7. Agent interface
[???]          8. Video dissection  <-- NO AGENT ASSIGNED, FLAGGED
```

**Step 4: Confirm (1 minute)**
Show the checklist to the user. Ask: "Is this everything? Anything missing? Any priority order?" Do not proceed until confirmed.

**Step 5: Write briefs (10 minutes)**
Only after confirmation, write the agent briefs. Each brief references the checklist items it covers.

**Step 6: Serve and dispatch (2 minutes)**
Serve briefs via hotlink page. User copies and pastes into terminals. Orchestrator confirms each agent received the correct brief.

**Total setup time: ~20 minutes.** This sprint's missed items would have cost far more to recover than 20 minutes of setup.

---

## 6. Campaign Rating: Was It Worth Running 4 Agents Simultaneously?

### Rating: 7/10 — Worth it, but the coordination overhead was underestimated.

**The case FOR (why it scored above 5):**

- **Throughput was real.** 4 agents produced 15 wins in a single sprint session. A sequential approach would have taken 4 separate sessions across multiple days. The parallelism compressed a week of work into hours.

- **Research quality was exceptional.** Compass and Overwatch — the two research agents — produced deeply thoughtful analysis that a coding agent would never have produced. The value proposition, the competitive positioning, the inspector panel spec, the "Findings is the killer feature" insight — these came from agents given permission to think instead of code. Running them in parallel with coding agents meant strategic clarity arrived alongside implementation, not after it.

- **The meta-learning was the most valuable output.** 12 new findings (f023-f034) document coordination patterns that will make every future campaign better. These findings exist because the campaign exposed failure modes that single-agent sessions never would. The sprint was worth running for the findings alone.

- **It proved the concept.** Before this sprint, "coordinated multi-agent campaign" was a theoretical idea. Now it's a tested pattern with a data structure (campaigns.json), a page (Campaigns), a prompt delivery system (/prompts), and documented lessons. Future campaigns start from this foundation, not from zero.

**The case AGAINST (why it didn't score higher):**

- **Coordination overhead was significant.** The orchestrator spent substantial time writing briefs, managing agent assignments, running the debrief, and handling emergencies — time that could have been spent on the objectives themselves. For small campaigns (2-3 items), a single agent with sequential focus may be more efficient.

- **User bandwidth was the bottleneck.** Running 4 agents means 4 terminals needing attention. When multiple agents finish simultaneously, the user can only debrief one at a time. The others wait. Agent parallelism doesn't help when the human is the serialization point.

- **Prompt logistics caused a real error.** The wrong brief was pasted into two terminals, wasting a session. This was a pure coordination failure — not an agent failure. Multi-agent campaigns amplify logistics errors because there are more moving parts.

- **Some objectives were dropped silently.** The video dissection was never assigned. The /why page was created but never wired. These misses would not have happened in a single-agent session where the user and agent maintain continuous dialogue about what's been done.

### When to run multi-agent campaigns:

- **Yes:** When work is naturally parallelizable (research + code + infrastructure), when at least one agent should be a pure thinker, when the campaign has 5+ discrete objectives, when time compression matters
- **No:** When objectives are deeply interdependent, when the user can only monitor 1-2 agents, when the campaign is small enough for one focused session

### Bottom line:

The first campaign is always the most expensive because you're building the pattern itself, not just executing it. Campaign-002 will be cheaper, faster, and better because the setup checklist, the /prompts page, the findings, and the orchestrator protocol now exist. The investment was front-loaded. The returns compound.

---

## Appendix: Findings Generated by This Campaign

| ID | Title | Tier | Key Lesson |
|----|-------|------|------------|
| f023 | Terminal Identity Crisis | Pain Point | Multi-agent workflows need visual identity per terminal |
| f024 | Prompt Format Friction | Pain Point | Prompts must be self-contained and copy-pasteable |
| f025 | No Session Retrospective | Pain Point | Session lifecycle needs a structured close ritual |
| f026 | Multi-Agent Coordination is Manual | Pain Point | MC should support coordinated sprints as first-class |
| f027 | Never dump prompts inline | Principle | Use hotlink pages with 1-click copy, never terminal text |
| f028 | Memory must be high-level | Principle | Only save what serves all future agents; no implementation details |
| f029 | Pause after delivering | Principle | Present deliverables and wait for acknowledgment before continuing |
| f030 | Data change is not UI change | Principle | The user sees the screen, not the JSON file |
| f031 | Agent deliverables not wired | Pain Point | Orchestrator must audit all output files for accessibility |
| f032 | Campaign tasks must sync | Principle | Tasks born from a campaign go in campaign remaining AND dispatch |
| f033 | MC is an interface layer | Principle | Every feature must work without opening files or an IDE |
| f034 | One long + many short | Principle | One orchestrator with full context, many focused short-lived executors |

---

## Appendix: Campaign Scorecard

| Dimension | Score | Notes |
|-----------|-------|-------|
| Brief quality | 9/10 | Detailed, specific, with file paths and user quotes. Model for future campaigns. |
| Agent output quality | 8/10 | Research agents were exceptional. Beacon delivered solid infrastructure. |
| Orchestrator effectiveness | 5/10 | Too many hats. Built features while coordinating. Missed wiring and checklist items. |
| Coordination mechanics | 4/10 | Inline prompts caused errors. No setup checklist. No post-sprint audit. |
| User experience during sprint | 6/10 | User was the bottleneck. Had to discover missed items. But throughput was real. |
| Meta-learning captured | 10/10 | 12 findings is exceptional. This is the sprint's most durable output. |
| Repeatability | 7/10 | The patterns discovered (setup checklist, orchestrator protocol, /prompts) make campaign-002 significantly easier. |
| **Overall** | **7/10** | **Worth it. The coordination tax was high but the patterns + findings make it a net positive investment.** |
