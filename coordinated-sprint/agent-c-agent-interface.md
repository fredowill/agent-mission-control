# Agent C: Agent Interface & Multi-Agent UX Investigation

## The Big Picture — You're Part of a Coordinated Sprint

You're part of a coordinated multi-agent sprint on Mission Control (MC), Ephratah's agent orchestration platform built on top of Claude Code. MC has reached v1.0 — all core pages exist, hooks track agent state, and the dispatch board manages work. But the experience of actually USING multiple agents simultaneously is painful. This sprint addresses that.

Right now, **4 parallel workstreams are running simultaneously**:

| Agent | Focus | Nature |
|-------|-------|--------|
| **Agent A** | Terminal Identity + Session Retrospective | Infrastructure / hooks |
| **Agent B** | Strategic Evaluation + Value Prop | Thinking / research |
| **You (Agent C)** | Agent Interface Investigation + Dashboard improvements | Research / prototyping |
| **Orchestrator (main session)** | Dispatch improvements + Campaigns page | Direct code changes |

### Why This Sprint Exists

Ephratah described the core problem vividly:

> "It's kind of hard when I have one task and I'm trying to navigate between different terminal windows, who's who. Maybe I might make an interface that would allow me to have agents within a ChatGPT type of style where you can just click on one and it'll summarize it for me. Maybe having that interface would be super nice."

> "The dashboard is good at serving its purpose — it's like, okay I know overall what's happening. But what if I want to become more specialized somewhere? How can I see a dashboard, a real life dashboard?"

> "Being able to know which terminal is which or being able to look at the dashboard and having this CLI color coded in some way or some name."

The orchestrator is also building a **Campaigns page** — a new MC page for coordinated multi-agent efforts (like this sprint). Think of it as a "war room" focused on one specific coordinated effort, vs. the Dashboard's general overview. Your investigation feeds directly into how the Campaigns page should work and what the future of multi-agent UX looks like.

### Post-Sprint Findings Card

After all agents complete, a findings card documents the whole effort. **Track your research, prototypes, and recommendations.** Your investigation shapes MC's future direction.

---

## Your Mission

You are the **UX researcher and investigator** for multi-agent workflows. Your job is to deeply understand the problem, research approaches, and produce actionable recommendations (and optionally prototypes).

### 1. Investigate: ChatGPT-style Agent Manager Interface

**The Vision**: Instead of juggling terminal windows, imagine a web interface where:
- You see all active agents as cards/tabs (like ChatGPT's conversation sidebar)
- Click on any agent to see a real-time summary of what it's doing
- See its current state (investigating, developing, idle, needs input)
- Get a quick summary without context-switching to its terminal
- Maybe even send it messages or prompts from the interface

**Research Questions**:
- What would the architecture look like? (WebSocket from MC server to agent states? Polling? SSE?)
- How does the MC Dashboard currently show agent state? (Read server.js to understand)
- What's the gap between current Dashboard and this vision?
- Is this a separate page or an evolution of the Dashboard?
- What data is already available in session state files that could power this?
- What data is MISSING that would need new hook integration?

**Technical Context**: MC already has:
- Session state files (`.claude/agent-hub/states/{id}.json`) updated by hook.js on every tool call
- Activity logs (`.claude/agent-hub/logs/{id}.ndjson`) with timestamped events
- A Dashboard page that shows agent cards with current state
- The server polls state files to build the Dashboard

Read these to understand current capabilities:
```
MC server:            .claude/agent-hub/server.js
Hook (state writer):  .claude/agent-hub/hook.js
Prompt hook:          .claude/agent-hub/prompt-hook.js
Sample state files:   .claude/agent-hub/states/ (read 2-3 recent ones)
Sample log files:     .claude/agent-hub/logs/ (read 2-3 recent ones)
```

### 2. Dashboard Deep Dive — What's Missing?

The current Dashboard serves a purpose but Ephratah wants MORE:
- **Current**: Shows active agent cards with state (investigating, developing, idle)
- **Missing**: Can't map a Dashboard card to a physical terminal window
- **Missing**: No click-to-summarize functionality
- **Missing**: No "specialized view" — it's one-size-fits-all
- **Missing**: No history of what each agent accomplished

Investigate:
- What does the Dashboard HTML look like currently? (It's embedded in server.js — search for the root route handler)
- What improvements would give the most value?
- How would the Campaigns page (new, being built by orchestrator) relate to the Dashboard?

### 3. Terminal-to-Dashboard Mapping

Agent A is working on making terminals identifiable (setting window titles, etc.). Your angle is the OTHER side: how does the Dashboard help you find the RIGHT terminal?

Ideas to evaluate:
- Dashboard cards could show a terminal identifier (color dot, number, emoji)
- Hovering over a card could highlight what to look for in the terminal
- A "locate" button that... does what exactly? (Think creatively)
- Terminal session could report its PID, and Dashboard could show which PID maps to which card (hook.js already resolves PIDs)

### 4. Multi-Agent Workflow Patterns

Research broader patterns for how multi-agent workflows should feel:
- How do other tools handle multi-agent coordination? (e.g., CrewAI, AutoGen, LangGraph)
- What UX patterns exist for managing multiple concurrent workers? (CI/CD dashboards, Kubernetes dashboards, deployment tools)
- What makes a "war room" / "campaign view" effective?
- How should progress be visualized for a coordinated effort?

This research feeds the Campaigns page design.

### 5. Prototype or Recommend

Based on your investigation, either:
- **Prototype**: Build a simple HTML page that demonstrates the agent manager concept (self-contained, matching MC's design language)
- **Or Recommend**: Write a detailed spec for what should be built, with wireframe descriptions

---

## Ephratah's Work Style & Preferences

- **Organization is priority #1**: Being able to quickly understand what's going on is always his top concern.
- **Apple-level design**: Clean, minimal, well-spaced. If you prototype, make it look good.
- **The army general metaphor**: MC = headquarters. He wants command-level visibility, not information overload.
- **Practical over theoretical**: He values working prototypes over abstract architecture diagrams.
- **Pain points are sacred**: If something causes daily friction, it gets P0 priority regardless of technical complexity.
- **Evidence before assertions**: Show him, don't tell him.

---

## MC Design Language (if prototyping)

```
Fonts:        Plus Jakarta Sans (headings), DM Sans (body), DM Mono (code/data)
Primary:      #8b5cf6 (purple)
Background:   #fff (cards), #fafafa (page bg), #f4f4f5 (surfaces)
Text:         #09090b (primary), #52525b (secondary), #a1a1aa (tertiary)
Borders:      #e4e4e7
Border radius: 12px (cards), 8px (buttons), 6px (small elements)
Style:        Apple-inspired, light mode, minimal shadows, subtle animations
```

---

## Key Deliverables

By the end of your session, produce:

1. **Current State Analysis**: How the Dashboard/agent visibility works now
2. **Gap Analysis**: What's missing for effective multi-agent UX
3. **Agent Manager Concept**: Either a prototype or detailed spec
4. **Campaigns Page Input**: Recommendations for the Campaigns page the orchestrator is building
5. **Multi-Agent UX Research**: Key patterns from other tools/domains
6. **Sprint Retrospective Notes**: Your observations for the findings card

Write your outputs to: `.claude/agent-hub/coordinated-sprint/agent-c-output.md`

---

## Working Agreements

- **You are primarily a researcher/investigator** — read extensively, research broadly, recommend clearly
- **If you prototype**, create self-contained HTML files in the `coordinated-sprint/` directory
- **Don't modify any existing MC code** — dispatch-page.html, server.js, hook.js, findings.json are all owned by other agents
- **Read CLAUDE.md first**: It has non-negotiable behavioral rules. Follow them.
- **Coordinate with Agent A**: Your terminal-to-dashboard mapping work complements their terminal identity work. If you discover something they need to know, write it to `.claude/agent-hub/coordinated-sprint/cross-agent-notes.md`
