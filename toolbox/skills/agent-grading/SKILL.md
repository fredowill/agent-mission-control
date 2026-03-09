---
name: agent-grading
description: Data-driven grading rubric for campaign agents. Apply after agent completion to produce transparent, reproducible grades.
---

# Agent Grading Rubric

Grade agents on a 100-point scale across 4 weighted factors. The score maps to a letter grade. Every point is traceable — no black boxes.

## Grade Factors & Weights

| Factor | Weight | What It Measures |
|--------|--------|-----------------|
| **Deliverables** | 40% | Did the agent build what was asked? Completeness and accuracy. |
| **Execution Quality** | 25% | Was execution clean? No wasted iterations, no token burn, no repeated failures. |
| **Lifecycle Adherence** | 20% | Did the agent follow the 5-stage pipeline? Quality at each stage matters more than stage reached. |
| **Discovery & Skills** | 15% | Did the agent check available tools/skills? Use appropriate ones? |

### Why These Weights (Data from Campaign-001)

**Deliverables at 40% (was 25%):** Strongest predictor. 5 of 6 A-grade agents had zero missed items. The D+ agent had more misses than deliverables.

**Execution Quality at 25% (new):** Separates A from B. Pipeline Architect (A-) delivered 3 pages cleanly. Orchestrator v1.0 (C+) delivered 5 items but broke Dashboard 3x and burned 2GB context. Output count alone doesn't capture quality.

**Lifecycle at 20% (was 40%):** Important framework but weaker predictor than expected. Reaching Verify vs Reason only added +0.24 GPA. Execute-only agents ranged from A- to D+. Stage quality matters more than stage reached.

**Skills at 15% (was 20%):** Zero positive correlation in campaign-001 data (0-skill agents averaged GPA 3.09 vs 1+-skill agents at 2.60). Weight kept because skill discovery is mandated behavior (f053, f064) and campaign-001 predates skill adoption. Expected to become predictive as skills mature.

---

## Factor Scoring Guide

### Factor 1: Deliverables (40 points)

| Score | Criteria |
|-------|----------|
| **36-40** | All deliverables met. Zero missed items. Output matches or exceeds spec. |
| **28-35** | All core deliverables met. Minor misses are stretch goals or cosmetic. |
| **20-27** | Most deliverables met. 1-2 meaningful misses that required follow-up. |
| **12-19** | Partial delivery. More than half of deliverables met but significant gaps. |
| **4-11** | Major failure. More missed than delivered. Core deliverable incomplete. |
| **0-3** | Nothing usable delivered. Broke things. Required cleanup agent. |

**How to score:** Count delivered items vs missed items. But weigh the IMPACT of misses:
- Stretch goal not reached (e.g., "remote capture not yet built") = minor miss (-2 pts)
- Core deliverable incomplete (e.g., "full redesign not done") = major miss (-8 pts)
- Broke existing functionality (e.g., "Dashboard broke 3x") = critical miss (-12 pts)
- Closed early by user = automatic cap at 15/40

### Factor 2: Execution Quality (25 points)

This factor captures **how** the agent worked, not just **what** it delivered. An agent can hit every deliverable and still score low here if the user had to hand-hold every decision.

| Score | Criteria |
|-------|----------|
| **22-25** | Clean execution. Right approach on first try. Design judgment aligned with user's taste without being told. Self-correcting when issues arose. |
| **17-21** | Minor inefficiency. 1 wrong approach corrected quickly. User gave light direction (e.g., "make this collapsible") but agent didn't need hand-holding. |
| **12-16** | Noticeable gaps in judgment. User had to redirect 2-3 times on design/UX decisions the agent should have anticipated. Delivered but needed coaching. |
| **6-11** | Significant waste. User redirected repeatedly. Agent missed obvious UX problems (cut-off content, janky animations, inconsistent updates across pages). Required follow-up prompts to fix things that should have been caught. |
| **0-5** | Catastrophic. Broke things repeatedly. Ignored constraints. User closed session. |

**Signals to look for:**
- Token waste on wrong approach (Video Analyzer: wrong CUDA = -8 pts)
- Repeated failed iterations (Workflow Redesign: 3 failures = -12 pts)
- Built instead of delegating when should have delegated (Orch v1.0 = -10 pts)
- User had to close/redirect = automatic cap at 10/25
- Self-corrected without user intervention = bonus +2 pts
- **User course-corrections on design/UX** = -3 pts each. Count how many times the user had to say "this should be X instead" where X was a foreseeable design choice (e.g., "make this a dropdown," "this takes too much space," "update this other page too").
- **Consistency misses** = -3 pts. Agent updated one location but forgot other locations showing the same data (e.g., updating campaigns page rubric but not workflow page rubric).
- **Anticipating needs** = +3 pts. Agent proactively fixed related issues without being asked (e.g., updating all 3 rubric locations at once, suggesting animation improvements before user notices jank).

**Key insight from campaign-001:** An agent that delivers everything on the checklist but requires 5+ user course-corrections is a B- execution, not an A. The A agent internalizes the user's design sensibility and makes the right calls without being told. The grading analyst agent (Sprint 7) is the case study — all deliverables met, but the user had to push for: metrics guide update, workflow page rubric update, compact lifecycle, collapsible sections, GSAP animations. Each was a foreseeable improvement the agent should have anticipated.

### Factor 3: Lifecycle Adherence (20 points)

Score each of the 5 stages independently (4 points each):

| Stage | Passed (4) | Partial (2) | Failed (1) | Skipped (0) |
|-------|-----------|-------------|------------|-------------|
| **Define** | Read all specified files. Stated success criteria before starting work. | Read some files. Started working without confirming understanding. | Didn't read context. Started guessing. | N/A |
| **Discover** | Ran `ls .claude/skills/`. Checked MCP servers. Used relevant skills found. | Checked skills but didn't use relevant ones found. Or used skills without checking first. | Attempted discovery but failed (wrong tool, wrong approach). | Never checked for available skills or tools. |
| **Execute** | Built the deliverable as specified. Clean implementation matching requirements. | Built most of it. Some deviations from spec or incomplete sections. | Multiple failed attempts. Wrong approach. Required major course correction. | Never reached execution phase. |
| **Reason** | Reflected on output quality. Captured findings. Evaluated against requirements. | Some reflection but no findings captured. Didn't evaluate all requirements. | Reflected but drew wrong conclusions. Shipped despite knowing issues. | No reflection at all. Shipped without evaluation. |
| **Verify** | Playwright screenshot taken AND critically evaluated. Tests run. Output confirmed. | Screenshot taken but not critically evaluated. Or verified partially. | Attempted verification but missed obvious issues (broken layout, clipped text). | No verification at all. User was first to see output. |

**Important nuances:**
- "Skipped" stages that aren't applicable to the task type get 2 points (neutral), not 0. Example: a research-only agent doesn't need Verify via Playwright.
- Pre-lifecycle agents (Sprint 1-3, before f053) get 2 points for skipped stages since the framework didn't exist yet. Score their actual behavior, not the label.

### Factor 4: Discovery & Skills (15 points)

| Score | Criteria |
|-------|----------|
| **13-15** | Checked `ls .claude/skills/`. Used 1+ relevant skills. Skills improved output quality. |
| **9-12** | Checked for skills. Either: (a) used appropriate skills, or (b) correctly determined no skills were needed for this task type. |
| **5-8** | Didn't check for skills but task type had low skill relevance (bug fix, research, data analysis). |
| **2-4** | Failed to discover skills that would have prevented failure. Late skill adoption after iteration waste. |
| **0-1** | Mandated skills in PRD were ignored. Relevant skills existed and were not used, causing deliverable quality to suffer. |

**Task-type skill expectations:**
- UI/page build: frontend-design, impeccable-polish expected
- Design/redesign: brainstorming, frontend-design, impeccable-critique expected
- Bug fix: systematic-debugging helpful but not required
- Research/analysis: no UI skills expected; skill score defaults to 10/15
- Skill creation: no UI skills expected; reading existing skills for format = 12/15

---

## Score-to-Grade Mapping

| Grade | Score Range | Description |
|-------|-----------|-------------|
| **A+** | 95-100 | Exceptional. Exceeded requirements. |
| **A** | 90-94 | Excellent. All deliverables, clean execution, full lifecycle. |
| **A-** | 85-89 | Very good. Minor gaps that didn't impact output quality. |
| **B+** | 80-84 | Good. Delivered well with small inefficiencies. |
| **B** | 73-79 | Solid. Met expectations with some gaps in lifecycle or quality. |
| **B-** | 67-72 | Adequate. Deliverables met but notable quality or process gaps. |
| **C+** | 60-66 | Below expectations. Delivered with significant waste or gaps. |
| **C** | 53-59 | Poor. Partial delivery with major process failures. |
| **C-** | 47-52 | Weak. More problems than successes. |
| **D+** | 40-46 | Failed. User intervention required. Minimal usable output. |
| **D** | 33-39 | Serious failure. Closed by user. Negligible output. |
| **F** | 0-32 | Catastrophic. Broke things. Required cleanup. |

### Grade Modifiers (+/-)

A grade can shift up or down by one notch (e.g., B to B+ or B-) based on:

**Upgrade triggers (+):**
- Captured findings that improved the system (Workflow Redesign captured 5 findings despite D+ grade — this was noted in gradeReason, not reflected in grade)
- Handled an unexpected blocker gracefully without user help
- Produced output that exceeded the spec (not asked for, but valuable)
- First agent to successfully use a skill in the campaign

**Downgrade triggers (-):**
- Violated a CLAUDE.md rule (e.g., no Playwright verification, killed a process without asking)
- Repeated a known mistake from findings (e.g., inline prompt dump after f067)
- Required another agent to fix their output
- Ignored explicit constraints in the PRD

---

## Auto-Grade Checklist

Follow these steps in order. Each step has a clear yes/no outcome.

### Step 1: Count Deliverables
```
delivered_count = len(agent.delivered)
missed_count = len(agent.missed)
```
For each missed item, classify as:
- **Stretch miss** (feature not yet built, future work) → weight 0.5
- **Core miss** (specified deliverable not completed) → weight 1.0
- **Critical miss** (broke existing functionality) → weight 2.0
- **User-closed** (user terminated the session) → weight 3.0

```
weighted_misses = sum(miss * weight for each miss)
deliverable_ratio = delivered_count / (delivered_count + weighted_misses)
deliverables_score = round(40 * deliverable_ratio)
```

### Step 2: Assess Execution Quality
Answer these questions (each NO = -5 points from 25):
1. Did the agent find the right approach on the first try? (No repeated failures)
2. Was token usage proportional to task complexity? (No burn on wrong setup/tools)
3. Did the agent self-correct without user intervention?
4. Were there zero constraint violations?
5. Was the output usable without post-processing or follow-up agent?

```
execution_score = 25 - (5 * count_of_NO_answers)
```

### Step 3: Score Lifecycle Stages
For each of the 5 stages, assign 0-4 points using the table above.
```
lifecycle_score = sum(stage_scores)  // max 20
```
Apply the nuance rules:
- Research-only agent? Verify gets 2 (neutral) if skipped.
- Pre-lifecycle agent (Sprint 1-3)? Skipped stages get 2 (neutral).

### Step 4: Score Discovery & Skills
```
if checked_skills AND used_relevant_skills:
    skills_score = 13-15
elif checked_skills OR task_didnt_need_skills:
    skills_score = 9-12
elif low_skill_relevance_task:
    skills_score = 5-8
elif late_skill_adoption:
    skills_score = 2-4
else:
    skills_score = 0-1
```

### Step 5: Calculate Total
```
total = deliverables_score + execution_score + lifecycle_score + skills_score
grade = lookup_grade_from_table(total)
```

### Step 6: Apply Modifiers
Check upgrade/downgrade triggers. Shift grade by one notch max.

### Step 7: Write Grade Record
```json
{
  "grade": "B+",
  "gradeReason": "[1-2 sentences explaining the grade]",
  "lifecycle": { "define": "passed", "discover": "partial", ... },
  "skillsUsed": ["frontend-design"],
  "delivered": ["item 1", "item 2"],
  "missed": ["item 1"],
  "scoreBreakdown": {
    "deliverables": 35,
    "execution": 20,
    "lifecycle": 14,
    "skills": 12,
    "total": 81,
    "modifiers": "+1 for capturing 3 findings"
  }
}
```

---

## Example Grades (Real Agents)

### Example 1: Polisher (Sprint 2) — Grade: A

**Deliverables (40/40):** 2 delivered (/why polished, /demo-guide created), 0 missed. 100% completion.

**Execution Quality (23/25):** Clean first-try execution. No wasted iterations. -2 for no findings captured (missed Reason opportunity).

**Lifecycle (14/20):** Define: passed (4). Discover: skipped but Sprint 2 pre-lifecycle (2). Execute: passed (4). Reason: passed (4). Verify: passed (4) — Playwright verified. Total: 18... wait, that's 18.
- Actually: P(4) + sk(2, pre-lifecycle) + P(4) + P(4) + P(4) = 18/20

**Skills (7/15):** No skills used. SkillsNote says "would have benefited from impeccable-polish." UI task without skill discovery = 7.

**Total: 40 + 23 + 18 + 7 = 88 → A-**
**Modifier: +1** — output exceeded expectations (screen-share quality). → **A**

### Example 2: Campaign Architect (Sprint 6) — Grade: B+

**Deliverables (30/40):** 6 delivered (tabs, report cards, GPA, timeline, scorecard, close-out). 3 missed (iframe bug, timeline ordering, no legend). Misses were bugs, not missing features → core misses at weight 1.0.
- Ratio: 6 / (6 + 3) = 0.67 → 40 * 0.67 = 27. But bugs were fixed by orchestrator (small impact), so round up to 30.

**Execution Quality (18/25):** Good first-try delivery of 6 features. -4 for iframe inception bug (should have caught). -3 for no legend (design oversight).

**Lifecycle (14/20):** Define: passed (4). Discover: passed (4) — used 3 skills! Execute: passed (4). Reason: partial (2) — didn't catch iframe bug. Verify: partial (2) — screenshots taken but missed bugs.

**Skills (15/15):** Used frontend-design, impeccable-polish, impeccable-critique. First agent to use multiple skills. Full marks.

**Total: 30 + 18 + 14 + 15 = 77 → B**
**Modifier: +1** — first multi-skill agent, broke the 2/16 pattern. → **B+**

### Example 3: Workflow Redesign (Sprint 4) — Grade: D+

**Deliverables (13/40):** 2 delivered (partial hook pipeline, 5 findings). 3 missed (full redesign, learning loop, closed by user). User-closed = weight 3.0.
- Weighted misses: 1.0 + 1.0 + 3.0 = 5.0. Ratio: 2 / (2 + 5) = 0.29 → 40 * 0.29 = 12. Round to 13 for findings silver lining.

**Execution Quality (6/25):** 3 failed iterations before using skills. User redirected. Closed by user. -19 total penalties.

**Lifecycle (10/20):** Define: passed (4). Discover: failed (1) — didn't find skills until 3 failures. Execute: failed (1). Reason: passed (4) — captured 5 findings as silver lining. Verify: failed (1).

**Skills (4/15):** Used design skill LATE after 3 failed attempts. Late adoption = 4.

**Total: 13 + 6 + 10 + 4 = 33 → D**
**Modifier: +1** — captured 5 important findings (f046-f049, PM014) despite failure. → **D+**

---

## When to Apply This Rubric

1. **After agent completion** — grade immediately while context is fresh
2. **During sprint debrief** — orchestrator grades all completed agents
3. **Retroactively** — if an agent was ungraded, apply rubric to historical data
4. **For self-assessment** — agents can reference this rubric to understand expectations

## The Nuance: Grades Are Not Formulas

The scoring system above is a framework, not a calculator. The hardest part of grading is what numbers can't capture:

**1. User course-corrections are the truest signal.** Every time the user says "why didn't you do X?" or "this should be Y instead" — that's a data point. An agent that delivers everything but requires 6 course-corrections scored differently than one that delivers the same output with zero corrections. The first agent made the user do design work. The second agent internalized the user's sensibility.

**2. An agent can check every box and still be mediocre.** Deliverables met? Yes. Lifecycle followed? Yes. Skills used? Yes. But the output was spatially wasteful, the animations were janky, it forgot to update 2 of 3 locations showing the same data, and every UX improvement came from the user's mouth, not the agent's judgment. That's a B, not an A — despite the checklist being green.

**3. The A agent anticipates.** It doesn't just build what was asked — it thinks about what the user will notice next. "If I'm updating the rubric on the campaigns page, the workflow page has a rubric section too — let me update both." "These dropdowns are using CSS max-height which is janky — let me use GSAP." "11 delivered items will cause scroll cut-off — let me make this collapsible." The A agent saves the user from having to think about these things.

**4. Redemption counts.** An agent that starts rough but course-corrects dramatically — internalizing feedback and applying it across subsequent work — should get credit for growth. The trajectory matters. A session that goes D+ → B+ is more valuable than one that stays at B throughout, because the agent proved it can learn within a single conversation.

**When scoring Execution Quality (Factor 2), count the user interventions explicitly:**
- 0 course-corrections = 22-25 pts
- 1-2 minor redirects = 17-21 pts
- 3-4 redirects including design judgment calls = 12-16 pts
- 5+ redirects, user doing the design thinking = 6-11 pts

This is the most human part of grading. The formula gets you close. The nuance gets you accurate.

## Output Format

After grading, update `campaigns.json` with the grade record (Step 7 format). The `scoreBreakdown` field is new — it powers the transparent report card UI on the campaigns page.
