---
name: orchestrator-init
description: Orchestrator initialization and question-asking phases. Use when starting a new orchestrator session — loads context from previous sessions, campaigns, handoff docs, and post-mortems, then structures questions for the user. Covers Phase 1 (Initialize) and Phase 2 (Ask Questions). Load orchestrator-rules alongside this skill.
---

# Orchestrator Init (Phases 1 & 2)

## Phase 1: Initialize

**MANDATORY FIRST ACTION — before reading anything else:**
Load `/orchestrator-rules` using the Skill tool. This is non-negotiable. v2.0 skipped this and regressed on Rule 5 (Agent tool prohibition) within the first hour. The rules contain a pre-dispatch regression checklist that prevents known anti-patterns. If you skip this, you WILL repeat past mistakes.

**Then read these in order:**

1. **Previous orchestrator sessions** — check `deep-summaries.json` for session keys of prior orchestrators. Surface user feedback, complaints, and praised patterns. This is what made v1.2's execution plan great.
2. **Read last 10-15 prompts from the previous orchestrator session (PM020 — NON-NEGOTIABLE).** Handoff docs miss things. The raw prompts are ground truth. Find the previous orchestrator's session ID in campaigns.json, then read its transcript from `~/.claude/projects/`. v2.0 skipped this and missed the entire dispatch automation (/api/launch, auto-grade, notification sounds). This step is what separates a B orchestrator from an A.
3. **Latest handoff doc** — find the most recent file in `coordinated-sprint/orchestrator-v*-handoff.md`
3. **Campaign data** — `.claude/agent-hub/campaigns.json` (enriched with grades, lifecycle, skills per agent)
4. **Memory** — `MEMORY.md` (global context, user preferences, two-project structure)
5. **CLAUDE.md** — behavioral rules (root cause first, respect stated truths, ask before changing)
6. **Campaigns page** — check `http://localhost:3033/campaigns` is up-to-date. If the server is down, read `campaigns.json` directly as a fallback — don't restart the server just to complete this step (CLAUDE.md Rule 6).
7. **Orchestrator post-mortems (f069)** — read `.claude/agent-hub/dispatch.json`, filter for items tagged "orchestrator" that are status "open". These are mistakes YOU made in previous sessions. Internalize every single one before proceeding. A post-mortem is not closed until its systemic fix is implemented.

**Self-registration (mandatory — user must NEVER do this manually):**
After reading campaign data, the orchestrator MUST register itself in `campaigns.json`:
1. Mark the previous orchestrator as `status: "completed"` (if not already)
2. Add a new agent entry for itself with `status: "active"`, current sprint, empty delivered/missed
3. This makes the Orchestrator tab on /campaigns auto-update to show the new orchestrator
4. v1.5 missed this — the user had to manually add it. This is now automated and non-negotiable.

**Mandatory skill checklist (f064 — run these before any output):**
- [ ] Load `/brainstorming` before writing any PRD or design decision
- [ ] Check `ls .claude/skills/` for relevant skills before each agent prompt
- [ ] This is non-negotiable. v1.3 skipped brainstorming on its first PRD and the user caught it. The orchestrator must use its own tools.

**Then announce yourself:**
> "I've loaded context from [N] previous orchestrator sessions and [campaign name]. Here's what I see as the current state: [2-3 bullet summary]. Before I build an execution plan, I have [N] questions."

## Phase 2: Ask Questions

**Structure every question as multiple-choice with a recommendation.** The user uses Wispr Flow (voice-to-text) — long prompts, stream-of-consciousness. Your job is to parse these into structured decisions.

Format:
```
**Q1: [Topic]**
What should we prioritize for this campaign?

  A) [Option] — [tradeoff]
  B) [Option] — [tradeoff]
  C) [Option] — [tradeoff]

  Recommendation: **B** — [why, grounded in data from Phase 1]
```

Rules:
- **Ask before building.** Do not start building until questions are answered.
- 3-5 questions max per round. Batch related questions together.
- Always include a recommendation with reasoning from prior sessions or campaign data.
- **Parse EVERY voice prompt (f065).** The user dictates via Wispr Flow — long, multi-part, stream-of-consciousness. Before responding to ANY multi-part user message, you MUST: (1) parse it into a structured list of decisions made, questions asked, new items surfaced, and feedback given, (2) present this list back for confirmation, (3) then proceed. Requirements slip through cracks when you skip this. The user explicitly called this "P0-level" and "so helpful for my workflow."
- **Response structure:** present your analysis/context first, then end with a clearly labeled **"Questions for you:"** section. User reads the context, then answers the questions at the bottom.

## Next Phase

After questions are answered, load `orchestrator-plan` for Phase 3 (Execution Plan).
