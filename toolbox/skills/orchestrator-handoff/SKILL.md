---
name: orchestrator-handoff
description: Orchestrator handoff quality gate enforcement. Use when an orchestrator session is ending and needs to hand off to the next version — enforces 15 quality gates (git committed, JSON valid, open PMs, server check, self-registration, previous orch completed, handoff doc with auto-skeleton, campaign data, prompt review, skills synced, no active agents, hardstop state, toolbox audit) plus push confirmation. Blocks handoff if any hard gate fails.
---

# Orchestrator Handoff — Quality-Gated Transition

This skill enforces a 9-gate quality check before any orchestrator version transition. If a hard gate fails, the handoff is **blocked** until fixed. This prevents the pattern where orchestrators forget steps that previous versions established (v2.0 forgot git commit, missed open PMs, left PM021 open).

**Load `/orchestrator-rules` alongside this skill.**

## How It Works

Run all 9 gates automatically. Print a summary report. Only ask the user one question: "Ready to push to remote?"

---

## Gate Definitions

### Gate 1: Git Committed (HARD BLOCK)

**Check:** Run `git status --porcelain` in the project root.

**Pass:** Output is empty (no uncommitted changes). All work is committed.

**Fail:** List every uncommitted file with its status. Tell the orchestrator:
> "You have uncommitted changes. Commit everything before handoff. Run `git add <files> && git commit -m 'chore: orchestrator vN.N handoff'` to proceed."

**Why:** v2.0 forgot to commit before handoff. Changes were lost. Renamed from "Git Clean" to "Git Committed" (v2.5) — "clean" was ambiguous (could mean "no unstaged" vs "no uncommitted").

---

### Gate 2: JSON Valid (HARD BLOCK)

**Check:** Validate both data files:
```bash
node -e "JSON.parse(require('fs').readFileSync('projects/agent-mission-control/campaigns.json','utf8')); console.log('campaigns.json: valid')"
node -e "JSON.parse(require('fs').readFileSync('projects/agent-mission-control/dispatch.json','utf8')); console.log('dispatch.json: valid')"
```

**Pass:** Both files parse without error.

**Fail:** Show the parse error with line context. Tell the orchestrator to fix the JSON before proceeding.

**Why:** Corrupt JSON breaks the entire MC pipeline. Next orchestrator reads stale or broken data.

---

### Gate 3: Open PMs Listed (WARNING)

**Check:** Parse `projects/agent-mission-control/dispatch.json` for items where `"status": "open"`.

**Pass:** No open PMs, or all open PMs are listed in the handoff doc's "Open Post-Mortems" section.

**Fail:** List every open PM with id, title, and priority. Warn:
> "These open PMs must appear in your handoff doc's Open Post-Mortems section. The next orchestrator needs to know what's unresolved."

**Why:** v2.0 left PM021 open without flagging it in the handoff. v2.1 nearly missed it.

---

### Gate 4: MC Server Running (WARNING)

**Check:**
```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:3033/api/campaigns
```

**Pass:** Returns HTTP 200.

**Fail:** Warn but do NOT block:
> "MC server is not running on port 3033. The next orchestrator will need to start it. This is not a blocker — the server may be intentionally down."

**Why:** Server state is ephemeral. Blocking on it would prevent handoffs when the user has shut down for the day.

---

### Gate 5: Self-Registration Done (HARD BLOCK)

**Check:** Read `projects/agent-mission-control/campaigns.json`. Find the current orchestrator's agent entry (match by slot pattern `orchestrator-v*` in the active campaign). Verify it has `"status": "active"` or `"status": "completed"`.

**Pass:** Current orchestrator exists with a valid status.

**Fail:**
> "You are not registered in campaigns.json. Self-register before handoff — this is mandatory per orchestrator-init Phase 1. Add your agent entry with slot, sprint, focus, and status."

**Why:** v1.5 missed self-registration. The user had to manually add it. Non-negotiable since then.

---

### Gate 6: Previous Orchestrator Completed (HARD BLOCK)

**Check:** In the active campaign's agents array, check for any OTHER orchestrator (slot matches `orchestrator-v*`, not the current one) with `"status": "active"`.

**Pass:** No other orchestrator is active (all previous ones are `"completed"`).

**Fail:** List the still-active orchestrator(s). Tell the orchestrator:
> "Orchestrator [slot] is still marked active. Mark it as completed before proceeding: update its status to 'completed' in campaigns.json."

**Why:** Two active orchestrators in the same campaign creates confusion about who owns what.

---

### Gate 7: Handoff Doc Written (HARD BLOCK)

**Check:** Look for the handoff doc at the expected path:
```
projects/agent-mission-control/coordinated-sprint/orchestrator-v{N}-handoff.md
```
Where `{N}` is the current orchestrator version (extracted from the orchestrator's slot name).

**Pass:** File exists and is non-empty (at least 500 characters — a real doc, not a stub).

**Fail:** First check if a handoff skeleton was auto-generated by the L2 hardstop system at `coordinated-sprint/handoff-draft-*.md`. If found, copy it to the expected handoff path as a starting point. If not found, generate the handoff doc template (see Template section below). Tell the orchestrator:
> "Handoff doc written to [path]. Fill in every [FILL IN] section before proceeding. Empty sections are not acceptable."

**Why:** The handoff doc is the primary context transfer mechanism. A missing or stub doc means the next orchestrator starts blind. f108: auto-generated skeletons reduce handoff context cost by ~60%.

---

### Gate 8: Campaign Data Updated (HARD BLOCK)

**Check:** In `projects/agent-mission-control/campaigns.json`, find the current orchestrator's agent entry. Verify that:
- `delivered` array exists and has at least 1 item
- `missed` array exists (can be empty if everything was delivered, but must be present)

**Pass:** Both arrays exist and `delivered` is non-empty.

**Fail:**
> "Your campaign data is incomplete. Update your agent entry in campaigns.json with delivered[] and missed[] arrays before handoff. Be honest — list what you actually built and what you didn't finish."

**Why:** Campaign data drives the GPA system, the campaigns page, and future orchestrator context. Empty data = invisible work.

---

### Gate 9: Session Prompts Reviewed (WARNING)

**Check:** The handoff doc contains a section titled "What I Learned From Previous Prompts" or "v{N-1} Items Still Not Done" that cross-references the previous handoff.

Specifically, search the handoff doc for:
- A heading containing "Previous Prompts" or "Items Still Not Done" or "Cross-reference"
- At least 3 lines of content under that heading

**Pass:** Section exists with substantive content.

**Fail:** Warn:
> "Your handoff doc is missing a cross-reference section against previous orchestrator items. Add a 'v{N-1} Items Still Not Done' section that lists carry items from the previous handoff. This is what made v1.9's handoff the gold standard."

**Why:** PM020 established this as mandatory. v2.0 skipped reading previous prompts and missed the entire dispatch automation pipeline.

---

### Gate 10: Skills Synced to Toolbox (HARD BLOCK)

**Check:** Compare `~/.claude/skills/` against `projects/agent-mission-control/toolbox/skills/`. For each skill directory that exists in the installed location, check if it also exists in the toolbox with matching content.

```bash
# List installed skills not in toolbox
diff <(ls ~/.claude/skills/ | sort) <(ls projects/agent-mission-control/toolbox/skills/ | sort) | grep "^<"
```

**Pass:** No installed skills are missing from the toolbox, or only non-MC skills (e.g., django-*, springboot-*) are absent.

**Fail:** List every skill that exists in `~/.claude/skills/` but NOT in `toolbox/skills/`. Tell the orchestrator:
> "These skills are installed locally but not synced to the toolbox. The other machine won't have them after git pull. Run: `cp -r ~/.claude/skills/<name> projects/agent-mission-control/toolbox/skills/<name>` for each."

Focus on orchestrator-* skills, agent-grading, creating-agents, skill-mandate, and any skill created or modified this session. Third-party skills (django, springboot, etc.) don't need syncing.

**Why:** v2.1 created 3 skills (creating-agents, skill-mandate, orchestrator-handoff) that almost didn't get pushed. Without toolbox sync, the home machine has no access to new skills.

---

### Gate 11: No Active Agents (HARD BLOCK)

**Check:** Query the campaigns API for the current campaign. Check if any agents have `"status": "active"`.

```bash
curl -s http://localhost:3033/api/campaigns | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{const c=JSON.parse(d).find(c=>c.status==='active'&&c.workstream!=='cares');const active=c?c.agents.filter(a=>a.status==='active'&&!a.slot.startsWith('orchestrator')):[];console.log(active.length?active.map(a=>a.slot).join(', '):'none')})"
```

**Pass:** No active agents (excluding the orchestrator itself).

**Fail:** List every active agent. Tell the orchestrator:
> "These agents are still running: [list]. Wait for them to complete, review their output, then restart handoff. Handing off with active agents means the next orchestrator has no idea what they delivered."

**Why:** v2.2 suggested handoff with 4 agents running. The user caught it. Handoff with active agents means unreviewed output, incomplete grades, and potential file conflicts for the next orchestrator. (PM025)

---

### Gate 12: Hardstop State Clean (WARNING)

**Check:** Read `data/hardstop-state.json`. Check the current level.

**Pass:** Level is "green" or "yellow" (session has headroom).

**Fail:** Warn with the current metrics:
> "Context is at [usedPct]% (level: [level]). The handoff doc may be lower quality due to degraded context. Prioritize brevity and accuracy over completeness. The auto-generated skeleton (if present) has the critical data pre-filled."

**Why:** v2.5 built the hardstop system. The handoff skill should be aware of it — an orchestrator handing off at 85% context is operating at reduced capacity and should be warned.

---

### Gate 13: Toolbox Install Audit (WARNING)

**Check:** Compare agents in `.claude/agents/` against `toolbox/agents/`. Same for skills. Count how many are installed locally but missing from the toolbox.

**Pass:** All locally-installed MC agents and skills exist in the toolbox.

**Fail:** List the missing items:
> "These [N] items are installed locally but not in the toolbox: [list]. The other machine won't have them after pull. Consider syncing before handoff."

**Why:** v2.3 found 13 agents and 18 skills missing from the toolbox (PM029). The toolbox is the cross-machine sync mechanism — missing items break the other machine.

### Gate 14: Dispatch Board Cleanup (WARNING)

**Check:** Sweep `dispatch-home.json` and `dispatch-work.json` for items that were completed by agents this sprint but still marked "todo" or "in-progress". Cross-reference against the agents' `delivered` arrays in `campaigns.json`.

**Pass:** No stale dispatch items found, or all stale items marked done with closure note.

**Fail:** List stale items:
> "These [N] dispatch items appear completed but are still open: [list]. Close them before handoff so the next orchestrator doesn't re-investigate solved problems."

**Why:** v2.6 found 2 stale dispatch items and 4 stale execution plan items at init. Stale boards waste init time and confuse priority assessment.

### Gate 15: All Agents Dispatched via /api/launch (WARNING)

**Check:** For each agent dispatched this sprint, verify it has a `sessionId` in `campaigns.json`. A null sessionId means the agent was never launched via /api/launch (or the launch failed and was not retried).

**Pass:** All sprint agents with status "completed" or "active" have non-null sessionIds.

**Fail:** List agents without sessionIds:
> "These agents have no sessionId: [list]. Were they dispatched via /api/launch or manually? Manual dispatch is a Rule 26 violation (PM023, PM031)."

**Why:** PM023 and PM031 — orchestrators told users to copy-paste instead of using /api/launch. This gate catches it at handoff so the pattern is documented and graded.

---

## Gate Summary Report

After running all 15 gates, print a summary table:

```
## Handoff Quality Gate Report

| # | Gate | Status | Details |
|---|------|--------|---------|
| 1 | Git clean | PASS/FAIL | [uncommitted file count or "clean"] |
| 2 | JSON valid | PASS/FAIL | [which file failed or "both valid"] |
| 3 | Open PMs listed | PASS/WARN | [count of open PMs] |
| 4 | MC server running | PASS/WARN | [HTTP status or "not running"] |
| 5 | Self-registration | PASS/FAIL | [slot name or "not found"] |
| 6 | Previous orch completed | PASS/FAIL | [conflicting slot or "all completed"] |
| 7 | Handoff doc written | PASS/FAIL | [file path or "missing"] |
| 8 | Campaign data updated | PASS/FAIL | [delivered count or "empty"] |
| 9 | Prompts reviewed | PASS/WARN | [section found or "missing section"] |
| 10 | Skills synced to toolbox | PASS/FAIL | [missing count or "all synced"] |
| 11 | No active agents | PASS/FAIL | [active agent list or "none"] |
| 12 | Hardstop state clean | PASS/WARN | [level and usedPct or "green"] |
| 13 | Toolbox install audit | PASS/WARN | [missing items or "all present"] |
| 14 | Dispatch board cleanup | PASS/WARN | [stale count or "clean"] |
| 15 | Agents via /api/launch | PASS/WARN | [missing sessionIds or "all launched"] |

Hard blocks: [count] | Warnings: [count]
```

### If any HARD BLOCK fails:
> "Handoff is BLOCKED. Fix the [N] failing hard gates above, then run `/orchestrator-handoff` again."

Do NOT proceed to push confirmation. Do NOT write the handoff doc template. Fix the gates first.

### If only WARNINGS exist:
> "All hard gates passed. [N] warnings noted — address them in the handoff doc if possible."

Proceed to push confirmation.

### If all gates pass:
> "All 9 gates passed. Handoff is ready."

Proceed to push confirmation.

---

## Push Confirmation Gate (PM021 Fix)

**This gate closes PM021: "Orchestrator v1.9 pushed to GitHub without explicit user approval."**

After all hard gates pass, ask the user exactly this:

> **Ready to push to remote? (y/n)**
>
> This will run `git push` to sync your committed changes with the remote repository.
> If you haven't been explicitly told to push, answer **n** — the handoff is complete without pushing.

**Rules:**
- If the user says **y**: run `git push` and confirm the result.
- If the user says **n**: skip the push. The handoff is still valid — local commits are sufficient for same-machine handoffs.
- If the orchestrator has NOT been explicitly told to push by the user during this session, default to **n** and say: "No explicit push instruction received this session. Skipping push. The next orchestrator can push if needed."
- **NEVER push without this confirmation.** This is the systemic fix for PM021.

After push confirmation (whether y or n), update PM021 in `projects/agent-mission-control/dispatch.json`:
```json
{
  "id": "pm021",
  "status": "closed",
  "resolution": "Systemic fix: orchestrator-handoff skill enforces explicit push confirmation gate. No orchestrator can push without user approval."
}
```

---

## Handoff Doc Template

When Gate 7 fails (no handoff doc exists), generate this template:

```markdown
# Orchestrator v{N} Handoff

**Date:** {YYYY-MM-DD} | **Campaign:** {campaign-id} | **Machine:** {hostname}

---

## What v{N} Did

| Component | What It Does |
|-----------|-------------|
| **[deliverable 1]** | [description] |
| **[deliverable 2]** | [description] |

## Critical Tasks for v{N+1}

### P0: [highest priority item]
[Details — what must happen first and why]

### P1: [important but not blocking]
[Details]

### P2: [nice to have]
[Details]

## Open Post-Mortems

| PM | Title | Status | Priority |
|----|-------|--------|----------|
| [id] | [title] | [open/closed] | [p0/p1/p2] |

## Gaps Left

1. **[gap 1]** — [honest accounting of what wasn't finished]
2. **[gap 2]** — [why it wasn't finished]

## User Preferences Reinforced This Session

1. **[preference]** — [context from this session]
2. **[preference]** — [context from this session]

## v{N-1} Items Still Not Done

| Item | Priority | Notes |
|------|----------|-------|
| [carry item from previous handoff] | [priority] | [status update] |

## How to Resume

1. Open a new Claude Code terminal
2. Start with: "You are Orchestrator v{N+1}. Read `projects/agent-mission-control/coordinated-sprint/orchestrator-v{N}-handoff.md` then run /orchestrator-init"
3. **MANDATORY:** Load /orchestrator-rules FIRST.
4. **MANDATORY:** Read v{N}'s session prompts via deep-summaries.json (PM020 fix).
5. **First tasks:** [ordered list]
6. **Context:** [machine, server state, active campaign, current sprint]
```

**Variables to auto-populate:**
- `{N}` — current orchestrator version number (from slot name)
- `{N+1}` — next orchestrator version
- `{N-1}` — previous orchestrator version
- `{YYYY-MM-DD}` — current date
- `{campaign-id}` — active campaign ID from campaigns.json
- `{hostname}` — from `hostname` command or `$COMPUTERNAME` env var

---

## Cross-Platform Notes

All commands in this skill work on both Windows (Git Bash/MINGW64) and macOS:
- `git status --porcelain` — universal
- `node -e "..."` — universal (Node.js required)
- `curl` — available on both (Windows 10+ ships curl)
- `hostname` — universal; also check `$COMPUTERNAME` on Windows

---

## Interaction with Other Skills

- **Replaces:** orchestrator-sprint Phase 9 handoff section. When this skill is loaded, Phase 9 of orchestrator-sprint should defer to this skill for handoff logic.
- **Requires:** orchestrator-rules (load alongside this skill for behavioral enforcement).
- **Feeds into:** orchestrator-init Phase 1 (the handoff doc this skill produces is what the next orchestrator reads first).
- **Does NOT overlap with:** orchestrator-dispatch, orchestrator-grade, orchestrator-plan.
