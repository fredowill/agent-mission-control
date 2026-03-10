# Kanban & Project Management Filtering Research

**Research Date:** 2026-03-05
**Focus:** UX patterns, filter dimensions, active state display, empty state handling, and dashboard metrics.

---

## Executive Summary

Modern kanban/project tools (Trello, Linear, Jira) converge on these filtering UX principles:

1. **Multiple filter dimensions** combined with AND/OR logic
2. **Always-visible active filters** with clear removal controls
3. **Real-time, dynamic feedback** as filters change
4. **Keyboard shortcuts** for power users (especially single-key toggles)
5. **Sharable, bookmarkable filter states** (URL-driven)
6. **Smart empty states** that suggest next steps, not just silence
7. **Minimal, intentional metrics** — show signal, not noise

---

## 1. Filter Dimensions Offered

### Trello (5 core categories)
- **Keyword** — search card names and custom fields
- **Members** — filter by assigned team members
- **Card Status** — show marked or unmarked complete cards
- **Due Date** — deadline-based filtering
- **Labels** — color-coded tags
- **Activity** — recent activity tracking

### Linear (9+ dimensions)
- **Workflow:** Status, Auto-closed
- **User-related:** Assignee, Created by, Subscribers
- **Priority & Estimates:** Priority, Cycle, Estimate
- **Organization:** Labels, Links
- **Dates:** Completed, Created, Due, Updated
- **Relations:** Blocked, Blocking, Related, Parent, Sub-issue, Duplicate
- **Project & Content:** Project, Project Status, Custom fields

### Jira (Board-specific)
- **Issue Type** — Story, Task, Bug, Epic, etc.
- **Status** — To Do, In Progress, In Review, Done
- **Assignee** — Team members
- **Priority** — Critical, High, Medium, Low
- **Labels/Tags** — Custom categorization
- **Estimate** — Story points
- **Fix Version** — Release/sprint mapping
- **Custom Fields** — User-defined properties

**Key Insight:** All three tools support filtering across **9+ dimensions**. Core dimensions (status, assignee, priority, label, date) are universal. Depth varies by tool maturity.

---

## 2. Filter UI/UX Appearance & Interaction

### Visual Patterns

#### **Sticky Horizontal Filter Bar** (most common)
- Remains visible while scrolling
- Shows **active filters as removable pills** with "X" button
- Resides above the main content area
- Space-efficient and always accessible

#### **Sidebar / Dropdown Menu** (alternative)
- Used when filter options are extensive
- Groups filter categories visually with thin grey divider lines (Linear style)
- Collapses to save horizontal space on mobile
- Often paired with a "Show Filters" toggle button

#### **Search-as-Filter** (Trello, Linear)
- Free-text search combined with structured filter panels
- Offers both broad keyword matching and precision filtering
- Search and filters work together, not as alternatives

### Active Filter Display

**Best Practice Pattern:**
```
[Clear All] ├─ [High Priority ×] ├─ [John ×] ├─ [Due This Week ×]
```

- **Prominent placement** — top of board/list, always visible
- **Pill-style badges** with background color to show active state
- **Individual "X" buttons** to remove each filter
- **"Clear All" button** to reset all filters at once
- **Dynamic count badge** (optional) — "3 filters active"

**Linear approach:** Click the "X" on a filter to remove it; `Backspace/Delete` clears filters when panel is focused.

**Trello approach:** Simple "X" removal buttons + "Clear filters" option to reset all.

---

## 3. Multiple Filters: AND/OR Logic

### Linear's Advanced Filtering
- **Default behavior:** Match ANY selected option within a filter category (OR logic within category)
- **When 2+ filters applied:** Option appears to switch between:
  - **Match any filters** — issues matching ANY filter (board OR logic)
  - **Match all filters** — issues matching ALL filters (AND logic)
- **Nested filter groups** — supported through Advanced Filters for complex queries

### Trello's Behavior
- **Any match within category** returns cards matching that option
- Documentation doesn't explicitly detail AND/OR toggle, but supports multi-filter combinations

### Jira Kanban
- Supports "AND/OR" conditions to join filtering properties
- **Hide function** — shows only matching cards (strict AND)
- **Highlight function** — keeps all cards visible, dims non-matching (visual filter, OR-permissive)
- Example: "Show only high + critical priority AND assignee = Bob AND size > 2"

**Key Insight:** Provide an AND/OR toggle when multiple filters are active. Hide vs. Highlight (Jira's approach) is a powerful UX pattern for users who want context without elimination.

---

## 4. Empty State UX: "No Results" Behavior

### What NOT to Do
- **Silent empty state** — blank screen with no explanation
- **Orphaned filter pills** — show filters but nothing else
- **No path back** — don't explain how to reset

### Best Practice Pattern
1. **Affirm the filter state** — "Showing issues with: High Priority, Assigned to John"
2. **Show the result count clearly** — "0 issues match these filters"
3. **Provide next steps:**
   - Suggest removing filters one by one
   - Offer a "Clear All Filters" button prominently
   - Show most recent/popular alternative filters
4. **Optional: Contextual suggestions** — "Try removing 'John' or 'Due This Week'"

### Real-time Feedback
- **Display matching count dynamically** as user adjusts filters
- **Disable/blur unavailable filter combinations** instead of showing empty board
- **Interactive filtering** (instant results) beats batch filtering (apply/submit)

**LogRocket Best Practice:** Make all applied filters visible so users understand how filters affect results. Prevent cognitive friction by showing real-time impact.

---

## 5. Keyboard Shortcuts for Filtering

### Trello
- **Q key** — quick filter to show only YOUR cards (power user shortcut)
- Mouse-driven by default; Q is the exception

### Linear
- **Backspace/Delete** — clear filters (when filter panel focused)
- Keyboard support integrated into advanced filter panel navigation

### Jira
- Standard keyboard nav through filter dropdowns (tab, arrow keys)
- No single-key power shortcuts documented, but tab/enter flow available

**Insight:** Single-key shortcuts (Trello's "Q") are powerful for frequent, binary filters. Reserved for top-use actions.

---

## 6. Sharable & Persistent Filter State

### Trello (Gold Standard)
- **URL-driven filters** — filter state encoded in URL
- **Copy/bookmark filtered URL** — share view with teammates
- **Filter persistence** — remains active even after navigating away or switching to Calendar view
- **Exact reproduction** — URL can be emailed/shared and reopens identical filtered view

### Linear
- **Dashboard-level filters** — apply globally to all insights on that dashboard
- Filters automatically persist in context

### Jira
- **Saved filters** — create named, reusable filter sets
- **Issue navigator** — filters encoded in JQL (Jira Query Language)

**Key for phredomade:** If you implement filters, make them URL-shareable. This is a must for collaborative tools. `?filters=priority:high&assignee:john` is standard pattern.

---

## 7. Metrics & Stats Above the Board

### What Works (Signal, Not Noise)

#### Linear's Approach
- **Velocity tracking** — issues completed per cycle with trend line
- **Cycle progress bars** — visual % complete toward sprint goal
- **Time-series mini-charts** — "this week vs. last week vs. highs/lows"
- **Clear owners & purposes** — each metric answers a specific question

#### Jira's Core Metrics
- **Issue count by status** — "3 To Do, 5 In Progress, 2 Done" (pie chart or counter)
- **Work In Progress (WIP)** — current count in active columns to spot overload
- **Cumulative Flow Diagram (CFD)** — flow of work over time, reveals bottlenecks
- **Burndown / Sprint progress** — story points or task count trending toward completion

#### Trello's Approach
- **Card counts per list** — visible in list headers "(5 cards)"
- Minimal stats; focuses on card visibility

### Anti-patterns (Noise)
- Too many concurrent metrics (overwhelming)
- Metrics not tied to actionable decisions
- Vanity metrics (total cards ever created, etc.)
- Metrics that don't update in real-time

### Best Practice Design
**Pair every metric with context:**
- Chart showing this week, last week, trailing average
- Single metric + trend indicator (green ↑, red ↓)
- Metric should answer: "Is this good, bad, or normal?"
- Owner & review cadence — dashboards must stay relevant

**Linear's principle:** Make each dashboard intentional with clear purpose and regular review cycles.

---

## 8. Filter Bar CSS & Component Structure

### Recommended HTML Structure
```html
<!-- Filter Container -->
<div class="filter-bar sticky top-0 bg-white border-b border-gray-200 shadow-sm px-4 py-3">
  <div class="flex items-center justify-between gap-4">

    <!-- Left: Filter Button + Active Filters -->
    <div class="flex items-center gap-2">
      <button id="filter-toggle" class="btn btn-outline">
        Filters (3)
      </button>

      <!-- Active Filter Pills -->
      <div class="flex flex-wrap gap-2">
        <span class="filter-pill bg-blue-100 text-blue-900 px-3 py-1 rounded-full text-sm">
          High Priority
          <button class="ml-2 font-bold">×</button>
        </span>
        <span class="filter-pill bg-blue-100 text-blue-900 px-3 py-1 rounded-full text-sm">
          John Smith
          <button class="ml-2 font-bold">×</button>
        </span>
      </div>
    </div>

    <!-- Right: Clear All & Result Count -->
    <div class="flex items-center gap-4">
      <span class="text-gray-600 text-sm">12 issues</span>
      <button class="btn btn-ghost">Clear All</button>
    </div>
  </div>
</div>

<!-- Filter Panel (hidden by default, shown on toggle) -->
<div id="filter-panel" class="hidden absolute top-16 left-0 bg-white border border-gray-200 rounded-lg shadow-lg w-80 z-50">
  <!-- Filter categories grouped with dividers -->
  <div class="filter-category px-4 py-3 border-b border-gray-100">
    <h3 class="text-sm font-semibold text-gray-700 mb-2">Status</h3>
    <label class="block"><input type="checkbox" /> To Do</label>
    <label class="block"><input type="checkbox" /> In Progress</label>
    <label class="block"><input type="checkbox" /> Done</label>
  </div>

  <div class="filter-category px-4 py-3 border-b border-gray-100">
    <h3 class="text-sm font-semibold text-gray-700 mb-2">Assignee</h3>
    <label class="block"><input type="checkbox" /> John Smith</label>
    <label class="block"><input type="checkbox" /> Jane Doe</label>
  </div>
</div>
```

### Tailwind CSS Classes (Reference)
```css
.filter-bar {
  @apply sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm px-4 py-3;
}

.filter-pill {
  @apply inline-flex items-center gap-2 bg-blue-100 text-blue-900 px-3 py-1 rounded-full text-sm font-medium;
}

.filter-pill:hover button {
  @apply opacity-100;
}

.filter-pill button {
  @apply opacity-75 hover:opacity-100 cursor-pointer;
}

.filter-category {
  @apply border-b border-gray-100 px-4 py-3;
}

.filter-category h3 {
  @apply text-sm font-semibold text-gray-700 mb-2;
}

.filter-category label {
  @apply flex items-center gap-2 text-sm text-gray-700 py-1;
}

.filter-panel {
  @apply absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg w-80 z-50;
}
```

---

## 9. Recommended Filter Feature Checklist

- [ ] **Multiple filter dimensions** (at least 5: status, priority, assignee, label, date)
- [ ] **AND/OR toggle** when 2+ filters active
- [ ] **Always-visible active filter pills** with individual "X" remove buttons
- [ ] **"Clear All" button** for quick reset
- [ ] **Dynamic result count** ("12 issues match")
- [ ] **URL-shareable filter state** (persist in query string)
- [ ] **Real-time filter updates** (no submit/apply button needed)
- [ ] **Empty state messaging** with suggestions to clear filters
- [ ] **Keyboard support** (Tab/Enter/Backspace navigation)
- [ ] **Sticky filter bar** that remains visible while scrolling
- [ ] **Disable/blur unavailable filter combinations** to prevent dead ends
- [ ] **Search-as-filter** (free-text + structured filters working together)
- [ ] **Dashboard metrics** (paired with context: this week vs. last week, trend indicator)
- [ ] **Hide vs. Highlight option** (strict filtering vs. visual filtering for context)

---

## 10. Sources & References

- [Trello Filtering Documentation](https://support.atlassian.com/trello/docs/filtering-for-cards-on-a-board/)
- [Trello Keyboard Shortcuts](https://support.atlassian.com/trello/docs/filtering-vs-searching/)
- [Linear Filters Documentation](https://linear.app/docs/filters)
- [Linear Dashboards & Best Practices](https://linear.app/now/dashboards-best-practices)
- [LogRocket: Filtering UX/UI Design Patterns](https://blog.logrocket.com/ux-design/filtering-ux-ui-design-patterns-best-practices/)
- [Jira Kanban Filtering Guide](https://support.freshservice.com/support/solutions/articles/50000003269-setting-up-kanban-board-using-filters-and-groups)
- [Jira Performance Metrics](https://jellyfish.co/library/jira-performance-metrics/)
- [Jira Cumulative Flow Diagram](https://support.atlassian.com/jira-software-cloud/docs/track-and-analyze-your-teams-work-with-reports/)

---

## 11. Next Steps for phredomade

If implementing filtering in a kanban or project management view:

1. **Start small:** status, priority, assignee, label (4 core dimensions)
2. **Test with real data** — identify which filters your users actually need
3. **URL-encode filter state** — enable sharing from day one
4. **Prioritize real-time feedback** over batch filtering
5. **Design empty state messaging** before building the feature
6. **Keyboard shortcuts later** — add after core filtering is stable (Q for quick view)
7. **Dashboard metrics intentionally** — don't add metrics just because tools like Linear have them

