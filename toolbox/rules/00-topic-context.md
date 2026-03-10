# Topic Context (cross-machine knowledge)

This file travels via git sync. It provides essential context that every session needs regardless of which machine it runs on.

## Active Projects

| Project | Location | What It Is |
|---------|----------|------------|
| **Agent Mission Control** | `~/Claude/projects/agent-mission-control/` (work) / `~/.claude/agent-hub/` (home) | Zero-dependency Node.js dashboard for orchestrating Claude Code agents. Server at localhost:3033. |
| **CARES Guide** | `~/Claude/cares-guide/` | Vite + React app for MAPI evaluation workflow. Dev server at localhost:5173. |

## Active Campaigns

| ID | Name | Status | Sprint |
|----|------|--------|--------|
| campaign-001 | MC Evolution Sprint | retrospective | done |
| campaign-002 | MC Maturity Sprint | active | 8 |
| campaign-003 | CARES Sprint | active (deferred) | — |

## MC Architectural Decisions

- **Server caches are gone** — `readPage()` reads HTML from disk on each request. No restart needed for page changes.
- **External HTML pages** — dispatch, findings, tools, logic, radar are separate .html files in `pages/`.
- **CSS zoom 1.35** — applied to all external HTML pages for multi-monitor readability.
- **campaigns.json is the source of truth** — all agent cards, grades, lifecycle data live here.
- **dispatch.json tracks post-mortems** — separate files for home (`dispatch-home.json`) and work (`dispatch.json`).
- **Hooks live in settings.json** — machine-specific paths. Never copy settings.json between machines directly.

## User Preferences

- Apple-inspired clean UI (light mode, Plus Jakarta Sans + DM Sans)
- Emoji standard: semantic, not decorative (see `memory/emoji-standard.md`)
- Bold-lead text pattern: bold keyword first, then concise description
- Emoji-coded tables over text walls
- Voice input via Wispr Flow — parse stream-of-consciousness into structured decisions
- Research online before building (Rule 16/18)
- Never patronize about hardware — investigate deeper

## Setup Requirements (per machine)

- `uv tool install claude-code-tools` — installs aichat CLI for session search
- SessionStart hook in settings.json — injects session catalog + skill index
- skill-activation-hook.sh — forced eval pattern for skill discovery
- skill-index.md in .claude/skills/ — categorized one-liners for LLM reasoning
