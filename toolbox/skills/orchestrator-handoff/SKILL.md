---
name: orchestrator-handoff
description: Orchestrator handoff quality gate enforcement. Use when an orchestrator session is ending and needs to hand off to the next version — enforces 9 mandatory quality gates (git clean, JSON valid, open PMs, server check, self-registration, previous orchestrator completed, handoff doc, campaign data, prompt review) plus push confirmation. Blocks handoff if any hard gate fails. Replaces orchestrator-sprint Phase 9 handoff section.
---

# Orchestrator Handoff — Quality-Gated Transition

This skill enforces a 9-gate quality check before any orchestrator version transition. If a hard gate fails, the handoff is **blocked** until fixed. This prevents the pattern where orchestrators forget steps that previous versions established (v2.0 forgot git commit, missed open PMs, left PM021 open).

**Load `/orchestrator-rules` alongside this skill.**

## How It Works

Run all 9 gates automatically. Print a summary report. Only ask the user one question: "Ready to push to remote?"

---

## Gate Definitions

### Gate 1: Git Clean (HARD BLOCK)

**Check:** Run `git status --porcelain` in the project root.

**Pass:** Output is empty (no uncommitted changes).

**Fail:** List every uncommitted file with its status. Tell the orchestrator:
> "You have uncommitted changes. Commit or stash everything before handoff. Run `git add <files> && git commit -m 'chore: orchestrator vN.N handoff'` to proceed."

**Why:** v2.0 forgot to commit before handoff. Changes were lost.

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

**Fail:** Generate the handoff doc template (see Template section below) and write it to the expected path. Tell the orchestrator:
> "Handoff doc template written to [path]. Fill in every section before proceeding. Empty sections are not acceptable."

**Why:** The handoff doc is the primary context transfer mechanism. A missing or stub doc means the next orchestrator starts blind.

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

## Gate Summary Report

After running all 9 gates, print a summary table:

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
