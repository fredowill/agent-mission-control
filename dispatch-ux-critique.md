# Dispatch Page UX Critique

**Date**: 2026-03-05
**File**: `.claude/agent-hub/dispatch-page.html`
**Reviewed by**: Critic agent
**Method**: Code review + Playwright interactive testing (screenshots + automated interaction verification)

---

## What it does well

- Clean, Apple-inspired visual design. Card elevation, color-coded priority bars, workstream pills -- all polished.
- Workstream grouping in Todo/Backlog columns gives good visual hierarchy with tinted containers.
- Custom dropdowns in the modal look great and work correctly.
- Inline editing for title and description avoids navigation away from context.
- Filter bar is clean and the Clear button appears contextually.
- Search with highlighted matches is a nice touch.
- Good use of `esc()` HTML escaping throughout to prevent XSS.

---

## P0 -- Must Fix

### 1. Escape key saves edits instead of canceling them
**Verified empirically.** When editing a description in the modal, pressing Escape:
1. Fires the global keydown handler (line 1015) which calls `closeDetail()`
2. This hides the modal, which triggers `blur` on the textarea
3. The `blur` handler (line 836-839) calls `save()`, which persists the edit

**The input guard on line 1016 runs AFTER the Escape handler on line 1015**, so it never gets a chance to prevent it. The user expects Escape to mean "cancel my edit", but the edit is saved.

This affects both description editing (textarea has no Escape handler) and title editing (title input has an Escape handler at line 822 that resets value, but closeDetail() fires first anyway, and blur still fires save()).

**Lines**: 1014-1018 (global keydown), 836-839 (desc blur save), 816-822 (title blur save)

---

### 2. 'n' key fires while modal is open, creating phantom items
**Verified empirically.** Pressing 'n' while viewing a card in the detail modal triggers `openForm()` (line 1018), which immediately creates a new "Untitled" item via `POST /api/dispatch` (line 887-893). The user was just reading a card, not intending to create anything.

The guard on line 1016 (`if (e.target.closest('input,textarea,select')) return`) only blocks shortcuts when an input is focused. When the modal is open but no input is focused, 'n' and '/' still fire.

**Items before pressing 'n' in modal: 21. After: 22.** An orphaned "Untitled" item was created with no cancel mechanism.

**Lines**: 1014-1019

---

### 3. 'Add' button creates an item before the user types anything
**Lines 883-903.** `openForm()` does a `POST` to create a real "Untitled" item in the database, THEN opens the detail modal for editing. If the user:
- Clicks "+ Add" accidentally
- Opens the modal then immediately presses Escape
- Has a network hiccup after the POST but before loadItems()

...an orphaned "Untitled" item is left in the database with no way to undo. The expected pattern for "Add" is: open a blank form, let the user fill it in, save only when they explicitly confirm.

The old form-based flow (saveItem, lines 918-939) still exists in the code but is unreachable since openForm() was rewritten.

---

### 4. Dead space when Done column is collapsed: 413px gap on the right
**Verified empirically.** The grid uses `grid-template-columns: auto 1fr 1fr 1fr` (line 59). When the Done column collapses to 36px width, it still occupies a full `1fr` grid cell. The content shrinks but the cell does not.

Measurements at 1440px viewport with both Backlog and Done collapsed:
- Backlog: 47px (collapsed, `auto` column -- works correctly)
- Todo: 434px (1fr)
- In Progress: 434px (1fr)
- Done: 47px content inside 334px cell
- **Dead space on right: 413px** (from last column content edge to kanban edge)

The transition animation on grid-template-columns (line 59) was probably intended to make this smooth, but the grid definition never actually changes -- `backlogCollapsed` and `doneCollapsed` toggle CSS classes, not the grid template.

**Lines**: 59, 128-141, 545-561

---

## P1 -- Should Fix

### 5. Description editing uses a raw textarea with no Markdown preview
When the user clicks the description area, the rendered Markdown (bold, code, headers, lists via `renderDesc()` at line 664-671) is replaced by a raw textarea showing the source text. There is no visual feedback about what formatting is supported. The user sees `**bold**` and backtick-wrapped code in plain text.

More critically, the textarea has no `Escape` handler to cancel, no save button, and no visual indicator that it auto-saves on blur. The user has to click outside to "save" -- the only affordance is the textarea itself.

Contrast this with the title editing, which at least has Enter-to-save and Escape-to-cancel (line 822).

**Lines**: 827-843

---

### 6. No confirmation or undo for destructive status changes
The "Complete" / "Start" / "Move to Todo" action button in the modal (line 868-870) fires immediately on click with no confirmation. Combined with issue #1 (Escape saving edits), a user could accidentally change the status while trying to close the modal.

The Delete button does use `confirm()` (line 954), but it is a native browser dialog that feels jarring compared to the polished custom UI.

**Lines**: 868-870, 953-960

---

### 7. Filter bar overflows on mobile (600px)
**Verified empirically.** At 600px width, the filter bar's `scrollWidth > clientWidth`. The pills overflow horizontally but the filter bar has no `overflow-x: auto` or scroll indicator. The "+ Add" button (pushed to the right with `margin-left: auto`) may be unreachable.

The media query at 600px (lines 271-277) handles column layout but does not address the filter bar.

**Lines**: 49-56, 271-277

---

### 8. Drag-and-drop reorder with workstream groups is ambiguous
In Todo and Backlog columns, cards are grouped by workstream inside `.ws-group` containers (lines 494-516). When dragging, the drop indicator calculates position based on `.k-card` elements in the `.col-body` (line 587-601), but the sortOrder it computes doesn't account for group boundaries.

If a user drags a "Mission Control" card into the "Work" group's visual space, the card won't change workstream -- it just gets a new sortOrder. On next render, it goes back to its original group. The drag appears to work but the card "snaps back" after reload.

Additionally, the dragging state (line 109) sets `height:0; padding:0; overflow:hidden` on the original card, which causes the column to visually collapse during drag -- other cards jump up to fill the gap.

**Lines**: 109, 494-516, 584-601, 627-659

---

### 9. Modal re-render on every dropdown change is disorienting
When the user changes Status, Priority, or Workstream in a dropdown (line 796-798):
```
setTimeout(() => { const fresh = items.find(...); if (fresh) openDetail(fresh.id); }, 100);
```
The entire modal is torn down and rebuilt after a 100ms delay. This causes:
- A visible flash/flicker
- Loss of scroll position in the modal
- Any open dropdown closes (expected) but the animation replays

A more typical pattern would be to update just the changed field in-place.

**Lines**: 796-798

---

### 10. Reorder API silently succeeds with invalid IDs
**Verified empirically.** `POST /api/dispatch/reorder` with `{ orderedIds: ['fake-id-1', 'fake-id-2'] }` returns 200 OK. The server doesn't validate that the IDs exist. This is unlikely to cause real problems in normal use, but it means drag-and-drop reorder errors are silently swallowed.

---

## P2 -- Nice to Have

### 11. Keyboard shortcuts are undiscoverable
The page has three keyboard shortcuts: `/` (search), `n` (new item), `Escape` (close modals). None are documented in the UI. There is no `?` shortcut to show a help overlay, no tooltip on the search input, no hint text anywhere.

**Lines**: 1014-1019

---

### 12. No loading state
`loadItems()` (line 907-916) fetches data and calls `render()`. During the fetch, the board shows stale data (or the error state if it fails). There is no spinner, skeleton, or loading indicator. On slow connections or server restarts, the board appears frozen.

---

### 13. No tag removal mechanism
Tags can be added via the `+ tag` button in the modal (lines 846-864), but there is no way to remove a tag. Each `m-tag` span is purely display -- no click handler, no X button. The only way to remove a tag would be through the API directly.

**Lines**: 719, 846-864

---

### 14. Card click target includes the entire card area
The entire `.k-card` is both `draggable="true"` and has a click handler for opening the detail modal (line 530). There is no distinction between "I want to drag this" and "I want to view this". A quick click opens the modal; a click-and-hold starts a drag. But if the user's click is slightly too long (e.g., on a touchpad), it registers as a drag start instead of a click, and the modal never opens.

**Lines**: 529-536

---

### 15. Empty columns show "No items" without visual affordance
When filtered to P0 (screenshot verified), empty columns display "No items" in italic gray text (line 143, 475-476). There is no drop-target indicator, no "drag items here" hint, and no visual cue that you can drop cards into the empty column. The empty state is purely passive.

**Lines**: 142-143, 475-476

---

### 16. Search is for prompts, not dispatch items
The search input in the header (line 295) searches `/api/search/prompts` (line 980), not dispatch items. On a page called "Dispatch", the user would expect search to filter the kanban cards. The search results link to `/session/{id}` which navigates away from Dispatch entirely.

This might be intentional as a global search feature, but it is surprising on this page.

**Lines**: 962-998

---

### 17. Accessibility gaps
- **No ARIA roles on the kanban board.** 22 draggable cards have `draggable="true"` but zero have `role` or `aria-label` attributes. Screen readers cannot distinguish cards or understand the board structure.
- **No focus trap in modals.** When the detail modal opens, focus is not moved into it. Tab from the page goes to nav links, not modal content.
- **No aria-live region** for status updates after drag-and-drop or filter changes.
- **Color contrast**: The date text (`--text3: #a1a1aa` on `--bg: #fff`) and column count pill (same colors) have contrast ratios below WCAG AA. The 9.5px date font size compounds the issue.

**Lines**: 106, 146-148, 529

---

### 18. Done column collapses differently from Backlog
The Done column name uses `writing-mode: vertical-lr` without `transform: rotate(180deg)` (line 137), while Backlog uses `writing-mode: vertical-lr` WITH `transform: rotate(180deg)` (line 83). This means the collapsed Done column text reads top-to-bottom, while Backlog reads bottom-to-top. An inconsistency that is visually minor but noticeable side by side.

**Lines**: 83 vs 137

---

### 19. The old form modal (formBg) is unused dead code
`openForm()` was rewritten to create items via API and open the detail modal (lines 883-903). The original form modal (`#formBg`) and its handlers (`saveItem`, `closeForm`, lines 918-939) are still in the HTML and JavaScript. The form's workstream `<select>` (`#f-workstream`) is never populated because the code that used to fill it was presumably removed.

**Lines**: 318-366 (HTML), 904, 918-939 (JS)

---

## Summary of Priority Ranking

| # | Issue | Severity | Verified |
|---|-------|----------|----------|
| 1 | Escape saves instead of canceling edits | P0 | Yes -- empirically confirmed data was saved |
| 2 | 'n' key creates phantom items when modal is open | P0 | Yes -- item count increased by 1 |
| 3 | 'Add' creates item before user types anything | P0 | Yes -- code path confirmed |
| 4 | 413px dead space when Done column collapsed | P0 | Yes -- measured at 1440px viewport |
| 5 | Raw textarea for description with no save/cancel UX | P1 | Yes -- screenshot confirmed |
| 6 | No confirmation for status changes | P1 | Code review |
| 7 | Filter bar overflow on mobile | P1 | Yes -- scrollWidth > clientWidth confirmed |
| 8 | Drag reorder ignores workstream group boundaries | P1 | Code review (visual snap-back on re-render) |
| 9 | Modal re-render flash on dropdown change | P1 | Code review (100ms setTimeout + full rebuild) |
| 10 | Reorder API accepts invalid IDs silently | P1 | Yes -- returned 200 OK |
| 11 | Keyboard shortcuts undiscoverable | P2 | Code review |
| 12 | No loading state | P2 | Code review |
| 13 | No tag removal | P2 | Code review |
| 14 | Click vs drag ambiguity | P2 | Code review |
| 15 | Empty column has no drop affordance | P2 | Yes -- screenshot |
| 16 | Search searches prompts, not dispatch items | P2 | Code review |
| 17 | Accessibility gaps (ARIA, focus trap, contrast) | P2 | Yes -- 0 ARIA attributes on 22 draggable cards |
| 18 | Collapsed text direction inconsistency (Backlog vs Done) | P2 | Code review |
| 19 | Dead code: unused form modal | P2 | Code review |
