# Dispatch Page V2 Design Review

**Date:** 2026-03-05
**Reviewed at:** 1440px and 1920px viewports, plus modal detail view
**Reference bar:** Linear, Notion, Apple HIG

---

## Executive Summary

The Dispatch page is a solid functional kanban board with good bones: workstream grouping, drag-and-drop reorder, inline editing, collapsible columns, and custom dropdowns. The information architecture is sound. However, it currently reads as a **well-built prototype** rather than a **premium product**. The gap is not in features — it is in refinement. The visual system lacks the restraint, rhythm, and precision that separates Linear from Trello. Below are findings ranked by impact.

---

## Findings (Ranked by Visual Impact)

### 1. CRITICAL — Card Density Is Too High, Vertical Rhythm Is Broken

**Problem:** The Todo column (the heaviest) shows 12+ cards with only 4px gap between workstream groups and 8px gap between cards inside groups. At 1440px the column is a wall of cards — your eye has no resting place. The workstream group containers (`ws-group`) have 8px padding and 6px margin-bottom, creating a claustrophobic stacked effect.

**Comparison to Linear:** Linear uses ~12px between cards and ~20px between group separators. The breathing room makes each card a distinct scannable unit rather than a row in a spreadsheet.

**Fix:** Increase `ws-group` margin-bottom to 12px. Increase `.ws-group-cards` gap from 8px to 10px. Increase `.col-body` padding from `6px 8px 10px` to `10px 10px 14px`. The goal: each card should feel like it is floating, not stacked on a pile.

**Impact:** High. This single change would make the entire board feel more premium.

---

### 2. HIGH — Workstream Group Tinted Containers Are Too Saturated

**Problem:** The workstream group backgrounds use 10% opacity (`rgba(139,92,246,0.1)` for purple, etc.). The system prompt's Apple Design Principles specify **7-8% opacity** for tinted glass. At 10%, the purple and amber groups read as colored blocks rather than subtle organizational hints. The border at 12% opacity compounds this — it creates a double-emphasis that fights the cards inside for attention.

**Comparison to Linear:** Linear does not use colored containers around groups. It uses a thin left-side color indicator or colored text. The container approach can work, but only if the tint is barely perceptible.

**Fix:** Drop all `ws-group` backgrounds to 4-5% opacity. Drop borders to 6-7% opacity. The tint should be "is that colored or is that just my screen?" subtle. The workstream pill on each card already communicates the grouping — the container is redundant emphasis.

**Alternative:** Remove the tinted containers entirely. Use only a workstream label row above the card cluster with a dot + text, separated by a thin 1px divider. This is the Linear approach and it is cleaner.

**Impact:** High. The colored blocks are the most visually aggressive element on the page.

---

### 3. HIGH — Priority Color Bars on Cards Are Too Thin to Register, or Absent for P2/P3

**Problem:** The `.k-bar` is 4px tall and only renders for P0 (rose) and P1 (amber). P2 and P3 cards have an invisible empty 4px div. This creates an inconsistent visual weight — P0/P1 cards have a colored top edge and P2/P3 do not, but the difference is so subtle you barely notice it. The priority signal is underdelivering.

**Comparison to Linear:** Linear uses a small colored priority icon (4 bars, 3 bars, etc.) inline with the card title. The priority is communicated through an icon, not a decorative bar.

**Fix (Option A — enhance the bar):** Make the bar 3px (slightly thinner but crisper). Add a blue bar for P2 and a gray bar for P3. Every card gets a colored top — the color IS the priority. This creates consistent visual rhythm.

**Fix (Option B — remove the bar, use inline priority):** Remove `.k-bar` entirely. Add a small priority badge or icon next to the workstream pill. This saves 4px of vertical space per card and moves priority information to where the eye already scans (the label row).

**Impact:** High. Priority is a core data dimension and it currently has almost no visual presence.

---

### 4. HIGH — Column Headers Are Undersized and Lack Visual Authority

**Problem:** Column headers use 12px font-size with 7px dots. At 1440px+, these feel like footnotes rather than section titles. The padding is `10px 12px 6px` — asymmetric and tight. The count badge (10px mono) is useful but gets lost.

**Comparison to Linear:** Linear column headers are ~13-14px, semibold, with generous horizontal padding (~16px) and a clear separator (either a bottom border or significant whitespace) between the header and the first card.

**Fix:** Bump `.col-name` to 13px. Increase `.col-header` padding to `12px 14px 10px`. Add a subtle `border-bottom: 1px solid var(--sep)` to the header or increase the gap between header and card body. The column header should feel structural — it is the anchor for the entire column.

**Impact:** Medium-high. Headers set the visual framework. Undersized headers make the whole board feel small.

---

### 5. MEDIUM — Card Typography Hierarchy Needs Sharpening

**Problem:** Card titles are 13.5px at weight 700 with -0.02em tracking. The workstream pill is 10.5px at weight 600. The date is 9.5px mono. These are all within a narrow band — there is not enough contrast between the primary content (title) and the metadata (pill, date).

**Fix:** Bump card title to 14px, keep 700 weight but tighten tracking to -0.025em. Drop workstream pill to 10px at weight 500 (less visual competition with the title). Keep date at 9.5px. The title should dominate; metadata should be peripheral.

**Impact:** Medium. Better type hierarchy makes cards scannable in a fraction of a second.

---

### 6. MEDIUM — Modal Detail View Needs More Structural Separation

**Problem:** The modal is functional but feels flat. The description box (`m-desc-box`) blends into the background. The sidebar fields stack vertically with only 14px gap and 4px between label and value — the sections don't feel distinct. The action bar at the bottom has the "Move to Todo" primary button and "Delete" danger button at opposite ends, which is good for safety but the bar itself feels tacked on.

**Specifics observed:**
- The title at 22px/800 weight is appropriate but the `2px 4px` padding with `-2px -4px` margin creates a hoverable zone that is slightly misaligned with the description section below.
- The description box border-radius (10px) and padding (16px 18px) is good, but the 1px border at `var(--sep)` color is identical to the modal close button background — everything is the same shade of gray.
- The tags section uses a `+ tag` button with dashed border that feels like a wireframe placeholder.

**Comparison to Linear:** Linear's detail view uses clear section dividers (either whitespace or subtle lines), and metadata fields in the sidebar have slightly larger touch targets with more vertical spacing.

**Fix:**
- Increase sidebar `.m-field` gap from 14px to 18px.
- Give the description section a slightly stronger visual container — perhaps a 0.5px border increase or a subtle inner shadow.
- Replace the dashed border `+ tag` button with a solid pill-shaped button matching the tag style but in a lighter shade.
- Add `padding-top: 4px` to the action bar to give it more breathing room from the scroll content.

**Impact:** Medium. The modal is where users spend focused time. Every rough edge is amplified.

---

### 7. MEDIUM — Filter Bar Feels Crowded at 1440px

**Problem:** The filter bar contains: "Workstream" label, All pill, 4 workstream pills, "Priority" label, All pill, 3 priority pills, and the + Add button. At 1440px this all fits on one line, but the pills are tightly packed with only 6px gap. The filter labels ("Workstream", "Priority") at 11px feel small relative to the pills.

**Fix:** Increase pill gap to 8px. Add a vertical divider (1px, 16px tall, var(--sep)) between the workstream and priority filter groups instead of relying on the "Priority" text label to create visual separation. This is how Linear and Notion separate filter groups.

**Impact:** Medium. The filter bar is used frequently and should feel effortless to parse.

---

### 8. MEDIUM — Backlog Column Is Visually Disconnected

**Problem:** The backlog column has a different visual treatment — white background with border instead of the surface gray of Todo/In-Progress/Done. Cards inside are at 60% opacity. This dimming is a good instinct (backlog is lower priority) but the combination of white-bg + border + faded cards makes the column look like it belongs to a different app.

**Fix:** Use the same `var(--surface)` background as other columns, but apply the 60% opacity to the entire column content (not individual cards). Or keep the white background but remove the border — the opacity reduction on cards is sufficient to signal "this is the backlog."

**Impact:** Medium. Visual consistency across columns reinforces the kanban mental model.

---

### 9. LOW-MEDIUM — Card Hover State Is Good but Could Be More Refined

**Problem:** Cards hover with `translateY(-2px)` and `box-shadow: 0 4px 12px rgba(0,0,0,.12)`. This is close to the Apple guideline (they specify -2px lift, barely-there shadow). However, the shadow jump from `0 1px 3px rgba(0,0,0,.08)` to `0 4px 12px rgba(0,0,0,.12)` is noticeable — the spread increases 4x. Linear uses a more gradual shadow transition.

**Fix:** Intermediate shadow: `0 2px 8px rgba(0,0,0,.10)`. The lift should feel like the card is breathing, not jumping.

**Impact:** Low-medium. Hover states are felt subconsciously but they set the tone.

---

### 10. LOW — Header Navigation Pills Are Too Small

**Problem:** The header nav uses 12px font-size with 5px 12px padding. With 8 navigation items (Dashboard, Dispatch, Findings, Workflow, Post-Mortems, Toolbox, Logic, Radar), this creates a long row of tiny pills. The active state (white bg + shadow) is clear, but the inactive items at 12px in `var(--text3)` are hard to read.

**Fix:** Bump to 12.5px with 6px 14px padding. The active shadow can be slightly more pronounced: `0 1px 4px rgba(0,0,0,.08)`.

**Impact:** Low. The nav works, it just doesn't feel generous.

---

### 11. LOW — "Dispatch" Title Area Lacks Breathing Room

**Problem:** Page header has `padding: 20px 20px 0`. The title row margin-bottom is 14px. Between the header bar (56px) and the filter bar, there is very little breathing room. The "Dispatch" h1 at 28px/800 weight is good but feels like it starts immediately below the header.

**Fix:** Increase page header top padding to 28px. Increase title-to-filter gap to 18px. This is the "whitespace is content" principle — the page title area should feel expansive.

**Impact:** Low. Subtle but contributes to overall spaciousness.

---

### 12. LOW — DM Mono for Dates and Counts Creates Visual Noise

**Problem:** Monospace fonts are great for code but create uneven rhythm in UI contexts. The date ("Mar 5") in DM Mono on every single card creates a jagged right edge in the card header. The column count badges also use mono, which is fine in isolation but adds to the overall "lots of different type treatments" feeling.

**Fix:** Use DM Sans at weight 500 for dates. Keep DM Mono only for session IDs and hex codes where monospace is functionally useful.

**Impact:** Low. Typography coherence compounds — fewer font treatments = more professional.

---

### 13. NITPICK — Card Border Radius Mismatch with Group Container

**Problem:** Cards use `border-radius: 12px`. Workstream group containers use `border-radius: 10px`. This 2px mismatch means the card corners and container corners don't align when a card is near the edge of its group. Linear uses consistent 8px throughout.

**Fix:** Unify at 10px for both, or 12px for both. Pick one radius and use it everywhere in the card area.

**Impact:** Nitpick. But this is the kind of thing that separates "designed" from "styled."

---

## Score Card

| Dimension | Current | Target (Linear/Apple) |
|-----------|---------|----------------------|
| Visual hierarchy | 6/10 | 9/10 |
| Typography | 6/10 | 8/10 |
| Spacing/rhythm | 5/10 | 9/10 |
| Color system | 7/10 | 9/10 |
| Card polish | 6/10 | 9/10 |
| Modal quality | 6/10 | 8/10 |
| Information density | 5/10 | 8/10 |
| Interaction feel | 7/10 | 9/10 |
| **Overall** | **6/10** | **9/10** |

---

## Top 5 Changes for Maximum Impact

1. **Increase spacing everywhere** — card gaps, column padding, group margins, page header breathing room. This single principle would move the score from 6 to 7.5.
2. **Desaturate workstream group containers** to 4-5% opacity (or remove them entirely and use divider rows). This removes the visual noise floor.
3. **Strengthen column headers** — larger text, bottom border, more padding. These are the visual anchors of the entire layout.
4. **Unify card priority signal** — either every card gets a colored top bar (thin, consistent) or no card does (use inline priority badges instead). The current half-and-half approach is the worst option.
5. **Refine the modal** — more sidebar spacing, stronger description container, better tag add affordance.

---

## What Already Works Well

- **Workstream pill design** on cards — color dot + label in a tinted pill is clean and scannable.
- **Drag and drop** with drop indicator line is a nice touch.
- **Collapsible backlog/done columns** — good information architecture decision.
- **Inline editing** in the modal (click-to-edit title, description, tags) — this is a Linear-tier interaction pattern.
- **Filter bar pill design** — the active state with purple border + background is clear.
- **Custom dropdowns** in the modal sidebar replace native selects well.
- **Modal animation** (translateY + scale spring) feels smooth.
- **Color palette** — the purple/blue/green/amber/rose system is coherent.

The foundation is strong. The V2 iteration is about precision, not reinvention.
