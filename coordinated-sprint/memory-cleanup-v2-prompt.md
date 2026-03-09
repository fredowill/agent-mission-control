## Mission: Strip stale content from memory files and reorganize around stable patterns only.

Memory files in `.claude/projects/C--Users-ephra-phredomade/memory/` contain MEMORY.md (always loaded, 200-line limit) plus topic files. They've accumulated volatile data, CLAUDE.md duplicates, and stale references over 10 sprints. A new session should get clean, accurate context — nothing stale, nothing duplicated.

## Agent Lifecycle (follow in order)

### Stage 1: DEFINE

- **Read:** `.claude/projects/C--Users-ephra-phredomade/memory/MEMORY.md` — the main memory file
- **Read:** All topic files in the same directory: `principles.md`, `design-context.md`, `mcp-setup.md`, `local-ports.md`, and any others
- **Read:** `CLAUDE.md` — behavioral rules. Memory must NOT duplicate these.
- **Read:** `.claude/agent-hub/campaigns.json` — understand current state (campaign-001, sprint 10, 41 agents)
- **Read:** `.claude/skills/orchestrator/SKILL.md` — memory should reference this, not duplicate it
- **Success looks like:** MEMORY.md under 150 lines, zero volatile data (agent counts, GPA, finding counts), zero CLAUDE.md duplication, all topic files accurate or removed
- **Constraints:** Only modify files in `.claude/projects/C--Users-ephra-phredomade/memory/`. Do NOT touch CLAUDE.md, campaigns.json, server.js, or any MC page.

### Stage 2: DISCOVER (HARD GATE — do not skip)

Run: `ls .claude/skills/`
**You MUST load at least one skill before proceeding to Stage 3.**
Mandated skills for this task: `writing-plans` (for structured content organization)
If you skip this stage, your grade caps at C regardless of deliverables.

### Stage 3: EXECUTE

1. **Audit MEMORY.md** — identify every line that is: (a) volatile data that changes per sprint, (b) duplicated from CLAUDE.md, (c) duplicated from orchestrator skill, (d) stale/wrong
2. **Strip volatile data** — remove agent counts, finding counts, GPA, "as of" timestamps. If it changes every sprint, it belongs in the data file, not memory.
3. **Strip duplicates** — if a rule is in CLAUDE.md, replace with "see CLAUDE.md Rule N". If a process is in the orchestrator skill, replace with "see orchestrator skill Phase N".
4. **Update stale references** — campaign-001 is at sprint 10, 41 agents. Auto-dispatch pipeline exists. Orchestrator is at v1.8. Infrastructure attribution section is live.
5. **Keep stable architecture** — two-project structure, orchestrator pattern, dispatch checklist, lifecycle stages, key concepts, environment setup, MC page registry
6. **Audit topic files** — for each: is it accurate? Is it duplicated elsewhere? Should it be removed or updated?
7. **Add if missing** — hook summary (which hooks, which events, one line each), design doc locations
8. **Line count** — MEMORY.md must be under 150 lines (200 hard limit, 150 gives headroom)

### Stage 4: REASON

- Would a brand new orchestrator session get the right context from this memory?
- Is anything in memory going to be wrong in 2 weeks?
- Did I remove anything important that's not available elsewhere?

### Stage 5: VERIFY

- `wc -l` on MEMORY.md — must be under 150
- `grep -c` for numbers that will change (agent counts, finding counts, dates with specific values)
- Compare MEMORY.md against CLAUDE.md — zero duplicated rules
- Read each topic file and confirm it's accurate

### Stage 6: DEBRIEF (before you exit)

```bash
curl -s -X POST http://localhost:3033/api/campaigns/agent-debrief \
  -H "Content-Type: application/json" \
  -d '{"campaignId":"campaign-001","slot":"memory-cleanup-v2","delivered":["item 1"],"missed":["item 1"],"lessons":["lesson 1"]}'
```

## Constraints

- **Only modify** files in `.claude/projects/C--Users-ephra-phredomade/memory/`
- **Do NOT modify** CLAUDE.md, campaigns.json, findings.json, server.js, or any MC page
- **Do NOT add volatile data.** If you're tempted to write a number, ask: "Will this be wrong next week?" If yes, don't write it.
- **Principle (f071):** Memory = stable patterns only. Architecture, conventions, principles. Never volatile state.
