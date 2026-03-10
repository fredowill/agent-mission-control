# Agent Card Research: Pain Points & Redesign Proposal

**Agent:** agent-card-research | **Campaign:** campaign-002 | **Sprint:** 2 | **Date:** 2026-03-09

---

## 1. Exhaustive Pain Point Catalog

Sourced from orchestrator sessions v2.1 (6aa7eb5e), v2.2 (240b949b), and handoff documents v2.0/v2.1.

### Category A: Information Architecture

| # | Pain Point | Source | User Quote |
|---|-----------|--------|------------|
| A1 | **VERIFYING/Bash state is meaningless** | v2.1 MSG 34, v2.2 MSG 16 | "I don't need to know if it's doing grep read... that does not help me at all." / "the verifying and all that bullshit that I don't want in there... I don't want to know whether the bash is happening. Verifying this is outdated logic that's heuristic." |
| A2 | **Agent names are opaque** | v2.1 MSG 34, v2.2 MSG 17 | "What would help me is to have an idea" — user wants the WHY (dispatch reason), not just a technical name like "Live Modal Overhaul v2" |
| A3 | **Lifecycle stage reasoning is opaque** | v2.1 MSG 14 | "I would love to see specifically what made it believe that it didn't have it... right now it's just hard coded text" |
| A4 | **Grade doesn't reflect prompt quality** | v2.1 MSG 35 | "maybe Live Agent Modal should not be graded... you should be graded bad because you didn't give a good enough of a prompt" |
| A5 | **Skill usage display is confusing** | v2.1 MSG 45 | "Why did this agent decide not to use a front-end design? Why didn't it decide to use any skills?" |
| A6 | **"No skills used" pill is noise** | v2.1 MSG 45, code review | The gray italic "no skills used" pill adds visual clutter without value. Either hide it or make skill presence meaningful. |
| A7 | **Follow-up agents not linked to parent** | v2.0 handoff | "When dispatching a polish/follow-up agent, link it to the parent agent card instead of creating a new card" |

### Category B: Visual Design

| # | Pain Point | Source | User Quote |
|---|-----------|--------|------------|
| B1 | **Cards look boring** | v2.1 MSG 64 | "these look pretty boring in terms of the colors, and also there's no emojis... I would love to overhaul the colors completely" |
| B2 | **No emojis on cards** | v2.1 MSG 64 | "it'd be cool to add some emojis that kind of insinuates what it's working on because it's kind of hard to read this" |
| B3 | **Orchestrator card has wasted space** | v2.1 MSG 33 | "weird space... empty space here, empty space here, and this can be condensed" |
| B4 | **Mission text styling is weak** | v2.1 MSG 33 | "it should be live and it should be cooler looking, color-coded, bolded. What is that text doing there?" |
| B5 | **Emoji rendering issues (A/B/C)** | v2.1 MSG 44 | "never to use A, B, or C emojis because they don't have color" |
| B6 | **Previous orchestrator mini-cards misaligned** | v2.1 MSG 24 | "they're also not in line with each other, which is kind of funny to me" |

### Category C: Live State Display

| # | Pain Point | Source | User Quote |
|---|-----------|--------|------------|
| C1 | **No cook timer** | v2.1 MSG 68 | "a little cook time that would actually actively update second by second on how long it's been running for" |
| C2 | **Lifecycle dots jump around** | v2.1 MSG 21, MSG 23 | "which bubble is highlighting depends on if it's doing a right vs. a read... these blink back and forth" / "the LiveCardDesigner was pinging around the 6 bubbles until I refreshed" |
| C3 | **Want lifecycle stage, not tool activity** | v2.1 MSG 42 | "I don't care if it's verifying, investigating, whatever. I care what part of the lifecycle is it in?" |
| C4 | **Blinking continues after agent completes** | v2.1 MSG 41 | "the card itself is still having this issue where it'll still be blinking. I have to refresh the page to know whether it's done or not" |
| C5 | **Status labels are wrong/meaningless** | v2.1 MSG 65 | "eventually I'd want a different status right for this right here, like instead of investigating" |

### Category D: Completed State

| # | Pain Point | Source | User Quote |
|---|-----------|--------|------------|
| D1 | **MISSED section shows when empty** | v2.1 MSG 69 | "Why is there a missed section if no items are missed?" |
| D2 | **Delivered/Missed counts lack detail** | v2.1 MSG 14 | User wants to understand reasoning behind lifecycle pass/fail, not just counts |
| D3 | **"Status: Completed" text is low-value** | Code review | The `.focus-closed` div just says "Status: Completed" — adds nothing the user can't already see from the grade badge |
| D4 | **Skills stripping shows raw output** | v2.1 MSG 30 | "how we're stripping skills is not working... it has the two stars, it has grep blah blah, it's reading commands" |

### Category E: Interactivity

| # | Pain Point | Source | User Quote |
|---|-----------|--------|------------|
| E1 | **Dropdown auto-close** | v2.1 MSG 28, MSG 31 | "after like 5 seconds it closes... This is a problem that I've been having a lot" / "shows for like 5 seconds before automatically closing back again, which is pissing me the fuck off" |
| E2 | **New agents don't auto-appear** | v2.1 MSG 34 | "the Orchestrator card Polish v2 didn't go out until I refreshed, which is a gap" |
| E3 | **Skill pills not clickable** | v2.0 handoff | "Viewable Skill Content on Cards — Click skill pills to view SKILL.md" — skill pills are decorative, not interactive |
| E4 | **Agents appearing in wrong sprint** | v2.1 MSG 29 | "the Polish agent is in Campaign 2, Sprint 1, showing us compli- I don't see the Polish agent here" |

**Total: 22 distinct pain points across 5 categories.**

---

## 2. Current Card Anatomy

```
+------------------------------------------+
| ████████████████████████ (4px color bar)  |
|                                           |
|  Agent Name                    Grade [A+] |
|                                           |
|  [Live: pulse + VERIFYING Bash]           |
|  OR                                       |
|  check 3 delivered  x 1 missed            |
|  Status: Completed                        |
|                                           |
|  ○ ○ ● ○ ○ ○  (lifecycle dots)           |
|                                           |
|  [brainstorming] [coding-standards]       |
|  OR [no skills used]                      |
|                                           |
|  [Review agent analyzing...]              |
+------------------------------------------+
```

**What's wrong with this:**
- Top bar is thin (4px) — barely visible, doesn't convey task type
- Agent name is the technical name, not the user's intent
- Live state shows tool names (Bash, Grep) — meaningless to the user
- Lifecycle dots are small, jump around, and lack labels
- Skill pills at the bottom are noise for most users
- No cook timer, no emoji, no visual personality
- Completed cards just say "Status: Completed" — wastes space

---

## 3. External Research: Card UX Best Practices

### Linear (Project Management)
- **Minimal information per card**: title, status icon, assignee avatar, priority indicator
- **Color coding**: left border or icon color signals status
- **Principle**: scan fast, click for details
- **Takeaway**: card face should have 3-4 pieces of info max

### Jira (Project Management)
- **Three layers**: summary at top, 1-3 custom fields, then metadata (type, priority, assignee)
- **Customizable card fields**: users choose which 3 fields appear
- **Principle**: configurable density
- **Takeaway**: let the most important data surface, hide the rest

### Monitoring Dashboards (PatternFly, Geckoboard)
- **Live status indicators prominent at top**: color + icon convey state instantly
- **Limit to ~5 visible elements per card** to prevent overload
- **Data freshness indicators**: show when data was last updated
- **Principle**: alerts and anomalies surface first; healthy state is quiet
- **Takeaway**: active cards should visually dominate; completed ones should be visually quieter

### AI Agent Interfaces (Fuselab Creative, AufaitUX)
- **Progressive disclosure**: summary view with expand-for-details
- **Transparency**: show lifecycle stage ("Thinking...", "Searching...")
- **Actionable inline**: buttons to intervene, not just observe
- **Takeaway**: users want to know WHAT the agent is doing (stage), not HOW (tool)

**Sources:**
- [Smashing Magazine: UX Strategies for Real-Time Dashboards](https://www.smashingmagazine.com/2025/09/ux-strategies-real-time-dashboards/)
- [PatternFly Dashboard Design Guidelines](https://www.patternfly.org/patterns/dashboard/design-guidelines/)
- [Fuselab Creative: UI Design for AI Agents](https://fuselabcreative.com/ui-design-for-ai-agents/)
- [AufaitUX: AI Design Patterns for Enterprise Dashboards](https://www.aufaitux.com/blog/ai-design-patterns-enterprise-dashboards/)
- [Pencil & Paper: Dashboard UX Pattern Analysis](https://www.pencilandpaper.io/articles/ux-pattern-analysis-data-dashboards)
- [Linear vs Jira (Productlane)](https://productlane.com/blog/linear-vs-jira)

---

## 4. Proposed Card Redesign

### Design Philosophy

Inspired by Linear's minimalism + monitoring dashboard live state patterns. The card face shows **5 elements max**. Details are one click away (report card modal).

**Key principle: the card answers 3 questions at a glance:**
1. **What** is this agent doing? (dispatch reason, not technical name)
2. **How** is it going? (lifecycle stage + grade)
3. **Should I pay attention?** (live pulse + cook time, or completed quietly)

### 4.1 Active Card (Agent Running)

```
+------------------------------------------+
| ████████████████████████ (6px bar, task   |
|                          type color)      |
|                                           |
|  🔬 Lifecycle Research         ⏱ 4m 32s  |
|  Dispatch: "research orchestrator stages" |
|                                           |
|  ┃████████░░░░░░░░░░░░░░░┃               |
|  EXECUTE (3/6)                            |
|                                           |
|  ⚡ Reading campaign data...              |
+------------------------------------------+
```

**Element breakdown:**

| Element | Current | Proposed | Pain Points Addressed |
|---------|---------|----------|----------------------|
| **Color bar** | 4px, agent-name derived | 6px, task-type derived (🔬 research = blue, 🛠️ build = green, 🎨 UI = pink, 📋 plan = purple, 🛡️ security = red, ⚡ infra = amber) | B1 (boring colors) |
| **Row 1 left** | Agent name only | Emoji + Agent name | B2 (no emojis) |
| **Row 1 right** | Grade badge | Cook timer (⏱ Xm Xs, live-updating) | C1 (no cook timer) |
| **Row 2** | (nothing) | Dispatch reason in user's words, italic, truncated | A2 (opaque names) |
| **Progress bar** | 6 lifecycle dots, jumping | Segmented progress bar (6 segments), solid fill to current stage, labeled | C2, C3 (dots jump, want lifecycle) |
| **Bottom row** | "VERIFYING Bash" with pulse | One-line natural language: "Reading campaign data..." / "Writing card redesign..." | A1 (meaningless state), C5 (wrong labels) |

**What's removed from the active card face:**
- Skill pills (moved to report card modal)
- Delivered/Missed counts (not applicable while running)
- Grade badge (not assigned yet)
- Tool name display (Bash, Grep, Read — meaningless to user)

### 4.2 Completed Card (Agent Done)

```
+------------------------------------------+
| ████████████████████████ (6px bar, grade  |
|                          tint overlay)    |
|                                           |
|  🔬 Lifecycle Research              [A+]  |
|  Dispatch: "research orchestrator stages" |
|                                           |
|  ✓ 5 delivered                  ⏱ 12m 8s |
|                                           |
|  ┃██████████████████████████████┃ DONE    |
+------------------------------------------+
```

**Element breakdown:**

| Element | Current | Proposed | Pain Points Addressed |
|---------|---------|----------|----------------------|
| **Color bar** | Same as active | Grade-tinted: A = green tint, B = blue, C = amber, D/F = red | B1 (boring) |
| **Row 1 left** | Agent name | Emoji + Agent name (same as active) | B2 |
| **Row 1 right** | Grade badge | Grade badge (same position, now with color bg) | (kept) |
| **Row 2** | (nothing) | Dispatch reason (same as active) | A2 |
| **Row 3** | "✓ 3 delivered ✗ 1 missed" + "Status: Completed" | "✓ 5 delivered" only if clean; "✓ 5 delivered  ✗ 1 missed" only if missed > 0. Plus total cook time. | D1 (empty missed), D3 (useless status text) |
| **Progress bar** | Lifecycle dots (static) | Full progress bar + "DONE" label | C2 |

**What's removed from the completed card face:**
- "Status: Completed" text (redundant with full progress bar)
- MISSED section when empty (D1)
- "no skills used" pill (A6)
- Skill pills (moved to modal)
- Review status indicator (moved to modal)

### 4.3 Color System

Replace the current per-agent-name color mapping with a **task-type color system**:

| Task Type | Bar Color | Emoji | Border Tint |
|-----------|-----------|-------|-------------|
| Research | `#3b82f6 → #1d4ed8` (blue) | 🔬 | `rgba(59,130,246,0.15)` |
| Build / Infrastructure | `#22c55e → #16a34a` (green) | 🛠️ | `rgba(34,197,94,0.15)` |
| UI / Design | `#ec4899 → #db2777` (pink) | 🎨 | `rgba(236,72,153,0.15)` |
| Planning | `#8b5cf6 → #7c3aed` (purple) | 📋 | `rgba(139,92,246,0.15)` |
| Security / Review | `#ef4444 → #dc2626` (red) | 🛡️ | `rgba(239,68,68,0.15)` |
| Performance | `#f59e0b → #d97706` (amber) | ⚡ | `rgba(245,158,11,0.15)` |
| Refactor / Cleanup | `#14b8a6 → #0d9488` (teal) | 🧹 | `rgba(20,184,166,0.15)` |
| Orchestrator | `#a78bfa → #7c3aed` (violet) | 🎛️ | `rgba(139,92,246,0.15)` |

**Grade overlay** for completed cards: the bar gets a subtle grade-colored overlay:
- A/A+: green shimmer
- B/B+: blue shimmer
- C/C+: amber shimmer
- D/F: red shimmer

### 4.4 Lifecycle Progress Bar (Replacing Dots)

Current: `○ ○ ● ○ ○ ○` — six small circles that blink between states randomly based on tool heuristic.

Proposed: **Segmented progress bar with label**

```css
/* 6 equal segments, filled solid to current stage */
.lifecycle-progress {
  display: flex;
  height: 6px;
  border-radius: 3px;
  overflow: hidden;
  gap: 2px;
}
.lifecycle-segment {
  flex: 1;
  background: var(--surface);
  border-radius: 2px;
  transition: background 0.3s;
}
.lifecycle-segment.filled {
  background: var(--agent-color);
}
.lifecycle-segment.current {
  background: var(--agent-color);
  animation: segmentPulse 1.5s ease-in-out infinite;
}
```

**Stage label underneath**: `EXECUTE (3/6)` in small monospace text, showing which lifecycle stage the agent is in.

**Why this is better:**
- Progress bars are universally understood (LinearB, CI/CD pipelines)
- Segments only move forward (fixing C2: dots jumping backwards)
- Label tells the user exactly where the agent is
- No heuristic guessing needed — the agent self-reports its stage

### 4.5 Cook Timer

```javascript
// Live-updating timer, renders as "⏱ 4m 32s"
function renderCookTimer(startTime) {
  const elapsed = Date.now() - new Date(startTime).getTime();
  const mins = Math.floor(elapsed / 60000);
  const secs = Math.floor((elapsed % 60000) / 1000);
  return `⏱ ${mins}m ${secs}s`;
}
// Update every second via setInterval
```

Position: **top-right of card** for active agents, **row 3 right** for completed agents (showing total time).

### 4.6 Dispatch Reason Line

New field in `campaigns.json` agent objects: `"dispatchReason"` — a short phrase in the user's own words.

```json
{
  "slot": "lifecycle-research",
  "name": "Lifecycle Research",
  "dispatchReason": "research orchestrator lifecycle stages",
  "taskType": "research",
  ...
}
```

Displayed on the card as italic row 2:
```html
<div class="dispatch-reason">Dispatch: "research orchestrator stages"</div>
```

Truncated to ~50 chars on the card. Full text visible in the report card modal.

### 4.7 Natural Language Activity Line (Replacing Tool Names)

Instead of `⚡ VERIFYING Bash` or `🔍 INVESTIGATING Read`:

| Old (Heuristic) | New (Natural Language) |
|------------------|-----------------------|
| VERIFYING Bash | Running verification checks... |
| INVESTIGATING Read | Reading source files... |
| DEFINING Read | Loading context... |
| EXECUTING Write | Writing code changes... |
| EXECUTING Edit | Editing files... |
| REASONING (idle) | Thinking... |

This maps tool names to human-readable activity descriptions. The lifecycle stage comes from self-reporting (per the Lifecycle Self-Reporting Research agent's recommendation), not tool heuristics.

### 4.8 What Moves to the Report Card Modal

These elements are removed from the card face but available one click away:

| Element | Why Removed from Card |
|---------|----------------------|
| Skill pills | Low-value for glancing; detailed info for investigation |
| Review agent status | Operational detail, not user-facing |
| Individual delivered/missed items | Card just shows counts; modal shows the list |
| Lifecycle stage reasoning | Card shows the bar; modal explains pass/fail per stage |
| Score breakdown | Card shows letter grade; modal shows rubric scores |

---

## 5. Reasoning (Stage 4)

### Information Density

**Right density for our use case:** The user monitors 5-15 agents concurrently. This means:
- Cards must be **scannable in <2 seconds** — you glance at the grid and know which agents need attention
- Active agents should be visually louder than completed ones
- The grid is a **monitoring dashboard**, not a task board

**Decision:** 5 elements max on card face (name, dispatch reason, progress bar, one status line, grade/timer). This is between Linear (3-4) and Jira (5-7).

### Dispatch Reason vs Technical Name

**Show both.** The agent name (e.g., "Lifecycle Research") is the technical identifier. The dispatch reason ("research orchestrator stages") is the user's intent. The name is bold/prominent; the dispatch reason is secondary italic text.

### Lifecycle Dots vs Progress Bar

**Replace dots with segmented progress bar.** Dots are:
- Ambiguous (which dot = which stage?)
- They jump around due to heuristic inference
- They don't show how far along the agent is

A segmented bar with a label solves all three problems. The label (`EXECUTE 3/6`) makes it unambiguous.

### Grade Colors

**Use color to convey grade at a glance.** Grade badges already have color backgrounds (green A, blue B, amber C, red D). Extend this to the color bar on completed cards so you can see the "grade aura" without reading the letter. This adds meaningful visual information without extra UI elements.

---

## 6. Implementation Notes for Builder Agent

### Data Changes Required
1. Add `taskType` field to agent objects in `campaigns.json` (enum: research, build, ui, plan, security, performance, refactor)
2. Add `dispatchReason` field to agent objects (string, populated at dispatch time)
3. Add `startTime` field to live state data (for cook timer)

### CSS Changes
1. Increase `.agent-bar` height from 4px to 6px
2. Replace `.lifecycle-bar` dots with `.lifecycle-progress` segmented bar
3. Add `.dispatch-reason` style (italic, truncated, `var(--text3)`)
4. Add `.cook-timer` style (monospace, right-aligned)
5. Replace per-agent-name color classes with per-task-type classes
6. Add grade-tint overlay to completed card bars

### JavaScript Changes
1. New `renderCookTimer(startTime)` function + `setInterval` update
2. Rewrite `renderLiveState()` to show natural language instead of tool names
3. Rewrite `renderLifecycleDots()` → `renderLifecycleBar()` with segmented progress
4. Update `renderAgentCard()` to include dispatch reason row and cook timer
5. Remove "no skills used" pill from card face
6. Hide MISSED section when `missed.length === 0` or only contains "no items" text

### What NOT to Change
- Report card modal (separate concern)
- Card click behavior (still opens modal)
- Card hover effect (keep translateY(-2px) + shadow)
- Grid layout (keep CSS grid, responsive)

---

## 7. Current vs Proposed Comparison

### Active Agent Card

| Aspect | Current | Proposed |
|--------|---------|----------|
| **Identity** | Name only | Emoji + Name + Dispatch reason |
| **Live state** | "⚡ VERIFYING Bash" | "⏱ 4m 32s" + "Reading source files..." |
| **Progress** | 6 dots, heuristic-driven | Segmented bar + "EXECUTE (3/6)" |
| **Color** | Per-agent-name | Per-task-type |
| **Skills** | Pills on card | Moved to modal |
| **Personality** | Gray, utilitarian | Task-type emoji, color-coded bar, cook timer |

### Completed Agent Card

| Aspect | Current | Proposed |
|--------|---------|----------|
| **Identity** | Name only | Emoji + Name + Dispatch reason |
| **Status** | "✓ 3 delivered ✗ 0 missed" + "Status: Completed" | "✓ 3 delivered" + "⏱ 12m 8s" (no missed if 0) |
| **Progress** | Static dots | Full bar + "DONE" |
| **Color** | Per-agent-name | Grade-tinted bar |
| **Skills** | Pills or "no skills used" | Moved to modal |
| **Noise** | Shows empty missed, review status | Clean: only shows what matters |

---

## 8. Pain Point Resolution Matrix

| # | Pain Point | Resolution | Status |
|---|-----------|------------|--------|
| A1 | VERIFYING/Bash meaningless | Natural language activity line | Addressed |
| A2 | Agent names opaque | Dispatch reason line | Addressed |
| A3 | Lifecycle reasoning opaque | Segmented bar + label; detail in modal | Addressed |
| A4 | Grade reflects prompt quality | Out of scope (grading rubric issue, not card) | Noted |
| A5 | Skill usage confusing | Moved to modal; card is cleaner | Addressed |
| A6 | "No skills used" is noise | Removed from card | Addressed |
| A7 | Follow-up agents not linked | Requires data model change (parentSlot field) | Deferred |
| B1 | Boring colors | Task-type color system | Addressed |
| B2 | No emojis | Task-type emoji on every card | Addressed |
| B3 | Wasted space | Tighter layout, removed filler elements | Addressed |
| B4 | Mission text weak | Dispatch reason line, styled | Addressed |
| B5 | A/B/C emoji rendering | Use contextual emojis per emoji standard | Addressed |
| B6 | Mini-cards misaligned | CSS alignment fix (not card redesign) | Out of scope |
| C1 | No cook timer | Live-updating cook timer | Addressed |
| C2 | Lifecycle dots jump | Segmented progress bar, forward-only | Addressed |
| C3 | Want lifecycle stage | Stage label under progress bar | Addressed |
| C4 | Blinking after completion | Campaign status override (already fixed v2.1) | Fixed |
| C5 | Status labels wrong | Natural language activity descriptions | Addressed |
| D1 | MISSED shows when empty | Hide when 0 items | Addressed |
| D2 | Delivered/Missed lacks detail | Detail in modal; card shows counts | Addressed |
| D3 | "Status: Completed" useless | Replaced with cook time + full progress bar | Addressed |
| D4 | Skills stripping broken | Separate fix in auto-grade.js sanitization | Out of scope |
| E1 | Dropdown auto-close | Separate interactivity fix, not card design | Out of scope |
| E2 | Agents don't auto-appear | Fixed in v2.1 (liveness fix) | Fixed |
| E3 | Skill pills not clickable | Clickable pills in modal (not card) | Deferred |
| E4 | Agents in wrong sprint | Data issue, not card design | Out of scope |

**Result:** 16 of 22 pain points directly addressed by the redesign. 2 already fixed. 4 out of scope (interactivity/data issues).

---

## 9. Design System Compliance

All proposed changes work within the existing Apple design system:

| Design Token | Usage |
|-------------|-------|
| `font-family: 'Plus Jakarta Sans'` | Agent name, dispatch reason, grade |
| `font-family: 'DM Mono'` | Cook timer, lifecycle label |
| `var(--bg)`, `var(--surface)` | Card background, progress bar unfilled |
| `var(--text)`, `var(--text2)`, `var(--text3)` | Name, reason, activity text |
| `var(--sep)` | Card border |
| `var(--radius)` | Card border-radius |
| `border-radius: 8px` | Grade badge, progress bar |
| `transition: all .2s` | Card hover, progress fill |
| Light mode only | All colors designed for white/light backgrounds |
| `zoom: 1.35` | Preserved across all pages |
