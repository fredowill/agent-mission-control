# Agent A: Terminal Identity & Session Lifecycle

## The Big Picture — You're Part of a Coordinated Sprint

You're part of a coordinated multi-agent sprint on Mission Control (MC), Ephratah's agent orchestration platform built on top of Claude Code. MC has reached v1.0 — all core pages exist (Dashboard, Dispatch, Findings, Workflow, Post-Mortems, Toolbox, Logic, Radar), hooks track agent state, and the dispatch board manages tasks across workstreams. But there's a LOT of friction in the actual multi-agent workflow, and this sprint is about fixing that.

Right now, **4 parallel workstreams are running simultaneously**:

| Agent | Focus | Key Files |
|-------|-------|-----------|
| **You (Agent A)** | Terminal Identity + Session Retrospective | hook.js, prompt-hook.js, commands/ |
| **Agent B** | Strategic Evaluator — MC state assessment, value prop, /why page | Research + planning, no code overlap |
| **Agent C** | Agent Interface Investigation — agent manager UI | Research + prototyping |
| **Orchestrator (main session)** | Dispatch improvements + Campaigns page + coordination | dispatch-page.html, server.js, findings |

### Why This Sprint Exists

This came from a long conversation where Ephratah described his biggest friction points running MC at scale. Here are his exact words on the problems you're solving:

> "A huge issue for me now would make my productivity much much better — being able to know which terminal is which or being able to look at the dashboard and having this CLI color coded in some way or some name that I'm like 'okay that's what this is.'"

> "Something I really want to work on is enriching the data that I keep for each agent card. Adding insights and a retrospective that an agent, by default, always gives whenever I say 'alright we're ending the session.'"

> "Imagine Mission Control, right? Imagine we're an army general and I'm coming back to home base and I'm getting the mission report. I'm too high level to want to look at all these tiny details unless I truly need to."

> "It's kind of hard when I have one task and I'm trying to navigate between different terminal windows, who's who."

### Post-Sprint Findings Card

After all agents complete, a coordinated findings card will document:
- What each agent accomplished
- What worked about the coordinated sprint approach
- What was hard or went wrong
- Lessons for future multi-agent orchestration

**Track your progress, decisions, and any blockers as you work.** Your notes feed into this retrospective. When you finish, include a summary section in your final response.

### Campaigns Page (New Concept)

The orchestrator is building a new "Campaigns" page in MC — a dedicated view for coordinated multi-agent efforts like this one. Think of it as the "war room" vs the Dashboard's "overview screen." Your work directly feeds this: the Campaign page will show which agents are active, what they're working on, and their status. The terminal identity work you do will make agents identifiable both in the Campaign view AND in the physical terminal windows.

---

## Your Mission

### 1. Terminal Identity — "Which window is which?"

**The Problem**: When Ephratah runs 3-5 Claude Code sessions simultaneously, every PowerShell/Windows Terminal tab looks identical — they all show "Claude Code" with the same icon. He can't tell which window is working on what without clicking into each one. This is his #1 productivity pain point.

**What he wants**:
- Glance at taskbar/tab bar and immediately know which agent is which
- Agent card tagline or mission visible in the window title
- Some visual marker (color, emoji, name) that maps to what the Dashboard shows
- Being able to think "that's the Dispatch agent" without clicking in

**Technical approaches to investigate**:

1. **Windows Terminal title via PowerShell**: `$host.UI.RawUI.WindowTitle = "text"` sets the tab title. A hook could inject this.

2. **ANSI escape title**: `\x1b]0;Title\x07` (or `\e]0;Title\a`) sets the terminal title in many terminals. Could be output via `process.stdout.write()` from hook.js.

3. **hook.js integration**: The PostToolUse hook (`hook.js`) fires on every tool call. On first fire for a session, it could set the terminal title based on the agent's mission/tagline. The hook already resolves PIDs and writes state files — it has the context needed.

4. **prompt-hook.js integration**: The PromptSubmit hook fires when the user sends a message. Could set the title on first interaction based on the initial prompt content (first ~50 chars or extracted topic).

5. **State file enrichment**: Add a `displayName` or `tagline` field to the state JSON. The Dashboard and Campaign page can use this. The hook could auto-generate it from the first user message.

6. **Dashboard mapping**: Add a "terminal identifier" column to the Dashboard that shows a short code (e.g., "A1", "B2") or color dot that maps to terminal markers.

**Key constraint**: Hooks must NEVER crash — they're in the critical path of every agent. Always wrap in try/catch. Test on Windows Terminal (PowerShell). Don't break existing hook behavior.

**Start here**: Read `hook.js` and `prompt-hook.js` to understand the current hook architecture. Then try the simplest approach first — setting the terminal title via ANSI escape on first hook fire.

### 2. Session End Retrospective — "What just happened?"

**The Problem**: When a session ends, all context disappears. The agent card just shows "IDLE" and eventually goes stale. There's no structured summary of what was accomplished, what decisions were made, what's unfinished.

**What he wants**: When Ephratah types "ending the session" (or similar trigger), a hook or command fires and the agent automatically produces:
- Key accomplishments this session
- Decisions made and their rationale
- Unfinished work / what to pick up next
- Insights or patterns noticed
- Any issues encountered

This data enriches the agent card with permanent session history.

**Technical approaches**:

1. **Stop hook enhancement**: `hook.js` already fires on Stop events (when the agent turn ends). Could detect certain phrases in the transcript context and trigger enrichment. BUT — the Stop hook has limited context (it only gets tool_name, session_id, etc., not the conversation content).

2. **Dedicated `/end` command**: A slash command at `.claude/commands/end-session.md` that prompts the agent to generate a structured retrospective. The agent would output JSON or structured markdown, and the command could instruct it to write to a specific file. This is probably the simplest approach.

3. **State file enrichment**: Add a `retrospectives` array to the state JSON:
   ```json
   {
     "retrospectives": [
       {
         "timestamp": "2026-03-06T...",
         "accomplishments": ["..."],
         "decisions": ["..."],
         "unfinished": ["..."],
         "insights": ["..."]
       }
     ]
   }
   ```

4. **Separate retrospective file**: `.claude/agent-hub/retrospectives/{sessionId}.json` for richer data that doesn't bloat the state file.

**Recommended approach**: Start with option 2 (slash command). Create `.claude/commands/end-session.md` that instructs the agent to:
1. Summarize the session
2. Write a structured retrospective to the state file or a dedicated file
3. The Dashboard/Campaign page can then display this data

---

## Ephratah's Work Style & Preferences

Understanding how he works will help you make better decisions:

- **Stream of consciousness**: He thinks out loud, jumping between ideas. Every tangent has weight — don't dismiss them.
- **Organization is priority #1**: His top concern is always being able to quickly understand what's going on across all his work.
- **Apple-level design quality**: Everything should be clean, minimal, well-spaced. "Think Apple." Functional but ugly is not acceptable.
- **Prompts, not file paths**: When producing output for the user, give self-contained text he can copy-paste, not "see file X." Include context inline.
- **Evidence before assertions**: Never claim something works without proving it. Screenshot, test output, actual verification.
- **Ask before overriding**: If existing code seems wrong, ask "is this by design?" before changing it. See CLAUDE.md Rule #3.
- **Keep it simple**: The simplest solution that works wins. Complexity must be justified by a concrete failure of the simple approach.
- **One failure = measure, not retry**: When something breaks, instrument and identify the layer before trying again. Never iterate blindly.

---

## Key File Paths

```
Mission Control root:       C:\Users\ephra\phredomade\.claude\agent-hub\
MC server:                  .claude/agent-hub/server.js (port 3033)
PostToolUse + Stop hook:    .claude/agent-hub/hook.js
Prompt hook:                .claude/agent-hub/prompt-hook.js
Session states:             .claude/agent-hub/states/{sessionId}.json
Activity logs:              .claude/agent-hub/logs/{sessionId}.ndjson
Hook settings:              C:\Users\ephra\phredomade\.claude\settings.json
Commands dir:               C:\Users\ephra\phredomade\.claude\commands\
Toolbox commands:           .claude/agent-hub/toolbox/commands/
Dashboard HTML:             Embedded in server.js (search for "readPage" pattern)
Dispatch page:              .claude/agent-hub/dispatch-page.html
Findings:                   .claude/agent-hub/findings.json
Workstreams:                .claude/agent-hub/workstreams.json
CLAUDE.md (project rules):  C:\Users\ephra\phredomade\CLAUDE.md
Memory:                     C:\Users\ephra\.claude\projects\C--Users-ephra-phredomade\memory\MEMORY.md
```

---

## Working Agreements

- **Don't modify dispatch-page.html** — the orchestrator is actively editing it
- **Don't modify findings.json or findings-page.html** — the orchestrator handles findings
- **Don't modify server.js routes** — the orchestrator is adding the Campaigns page there
- **You own**: hook.js, prompt-hook.js, new commands in `.claude/commands/`, state file schema
- **If you need server.js changes** (e.g., new API endpoint for retrospectives): describe what you need in your final summary and the orchestrator will add it
- **Test hooks carefully**: A crashing hook breaks every agent session. Always wrap in try/catch. Test by running `node .claude/agent-hub/hook.js` with mock input if possible.
- **Read CLAUDE.md first**: It has non-negotiable behavioral rules. Follow them.
