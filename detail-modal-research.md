# Kanban Detail Modal/Panel Design Research
**Date:** 2026-03-05
**Sources:** Trello, Linear, Wrike, Kanban best practices across industry

---

## 1. Layout Patterns

### Pattern 1: Side Panel (Linear)
- **Layout:** Right-side panel that extends full-height of the screen
- **Width:** Grows proportionally with screen size (responsive)
- **Advantage:** Keeps main list/board visible while showing details
- **CSS approach:** Fixed right-side container with `position: fixed` or `position: absolute` relative to viewport
- **Behavior:** Close button or ESC key to dismiss; can be scrollable independently from main content

### Pattern 2: Modal Overlay (Trello)
- **Layout:** Centered modal with fullscreen option toggle
- **Sizing:** Two variants: `fullscreen: false` (standard width) vs `fullscreen: true` (maximized)
- **Advantage:** Isolates detail view, prevents accidental clicks on background
- **CSS approach:** Overlay backdrop with semi-transparent dark layer; modal container with `max-width` + `z-index`

### Pattern 3: Hybrid (Notion, Asana)
- **Layout:** Modal-like but slides in from side or bottom
- **Advantage:** Middle ground between focus and context preservation
- **CSS approach:** `position: fixed` with `transform: translateX()` animation for slide-in effect

**Recommendation for phredomade:** If your detail modal is currently "lackluster," side panel (Linear style) is the most modern approach. It balances context with focus and feels less disruptive than a full overlay.

---

## 2. Section Structure & Content Organization

### Critical Sections (in order)

1. **Header/Title Area**
   - Card title (editable or inline)
   - Card ID or unique identifier (subtle, gray)
   - Status indicator (colored badge or dropdown)
   - Quick-access buttons (archive, delete, menu)
   - Line separator

2. **Description / Main Content**
   - Markdown rendering with syntax highlighting
   - Rich text editor (not plain text)
   - Editable with clear "edit" state vs "view" state
   - Accepts code blocks, links, embeds
   - Fallback: "No description added" placeholder

3. **Metadata Sidebar** (right side or below, depending on layout)
   - **Assignee:** Avatar + name dropdown
   - **Status:** Colored badge + dropdown
   - **Priority:** Icon + label + dropdown
   - **Due date:** Calendar icon + date + optional time
   - **Labels/Tags:** Multiple tags, collapsible if many
   - **Linked items:** Related cards, issues, dependencies
   - **Custom fields:** Per-team configuration

4. **Activity Log / Comments**
   - Chronological feed below main content
   - Shows: status changes, metadata updates, user activity
   - Separate "Comments" section if company culture emphasizes discussion
   - Add new comment input field at bottom
   - Thread replies (nested comments) for ongoing discussion

5. **Attachments (if used)**
   - Grid or list of file previews
   - Drag-and-drop upload zone
   - File metadata (size, upload date, uploader)

### Detailed Example: Linear's Approach
Linear's redesigned issue view uses:
- Centered title + primary metadata (status, priority) at top
- Full-width description area (markdown with code highlighting)
- Right sidebar showing: assignee, due date, labels, linked issues, custom fields
- Below description: activity feed + comments thread
- Visual hierarchy via typography size, weight, and color (not just color alone)

---

## 3. Color & Contrast Strategy

### Key Principle: LCH Color Space (Linear's approach)
Instead of defining 98 color variables per theme, Linear reduced to **three:**
1. **Base color** (neutral gray for backgrounds)
2. **Accent color** (primary action/link color)
3. **Contrast color** (for important elements requiring visibility)

### Practical Application

**Text & Icons in Light Mode:**
- Primary text: `#1a1a1a` (very dark)
- Secondary text: `#666666` (medium gray)
- Tertiary text: `#999999` (lighter gray, for timestamps, subtitles)
- Icons (neutral): Same as secondary/tertiary text
- Icons (action): Accent color (usually blue or brand color)

**Text & Icons in Dark Mode:**
- Primary text: `#f5f5f5` (very light)
- Secondary text: `#999999` (medium gray)
- Tertiary text: `#666666` (darker gray)

**Backgrounds:**
- Modal/panel background: Use base color (not pure white or pure black)
- Card backgrounds: Slightly darker than panel background for definition
- Hover states: 2-5% darker (or lighter in dark mode)
- Focus states: Accent color outline + 5% background tint

### Anti-Pattern: "Gray on Gray"
❌ Medium gray text on medium gray background = illegible
✅ Dark text (in light mode) on light gray background = readable
✅ Light text (in dark mode) on dark gray background = readable

**Test:** Use a contrast checker tool (WebAIM) — aim for WCAG AA minimum (4.5:1 for text).

---

## 4. Editing Patterns: Inline vs Modal

### Pattern A: Inline Editing (Linear's preference)
- Click on any field (title, description, metadata) to enter edit mode
- Field becomes highlighted with a light background
- Submit by pressing Enter or clicking outside; Cancel by ESC
- No separate "Edit" button needed
- **CSS:** Add focus state, input styling, submit/cancel feedback

```css
/* Inline editable field */
.editable-field {
  padding: 8px 12px;
  border-radius: 4px;
  transition: background-color 150ms ease;
}

.editable-field:hover:not(:focus-within) {
  background-color: var(--bg-hover); /* 2-5% darker */
}

.editable-field:focus-within {
  background-color: var(--accent-soft); /* 10% tint of accent color */
  outline: 2px solid var(--accent-color);
  outline-offset: -2px;
}
```

### Pattern B: Separate Edit Mode
- Click "Edit" button to open a form/edit panel
- All fields become editable in a dedicated UI
- Save/Cancel buttons at bottom
- **Advantage:** Clear boundaries, less risk of accidental changes
- **Disadvantage:** Extra click to start editing

### Pattern C: Hybrid (Notion)
- Some fields (title, key metadata) are inline-editable
- Description and complex fields require clicking into an editor panel
- Best of both worlds

**Recommendation:** For your detail modal, inline editing (Pattern A) is most modern. Reduces friction, feels snappier. Reserve modal editors for complex rich text (description) or multi-field forms.

---

## 5. Metadata Fields: What to Show

### Standard Set (most kanban tools use these)
```
Assignee        → Avatar + name dropdown
Status          → Colored badge + dropdown
Priority        → Icon + label (1-5 scale, Low/Medium/High, etc.)
Due Date        → Calendar icon + date (with relative time: "Due in 3 days")
Labels/Tags     → Multiple colored chips, add/remove inline
Created Date    → Gray text, not editable
Updated Date    → Gray text, shows timestamp + user who last edited
```

### Advanced/Optional
```
Linked Issues   → "Blocks", "Is blocked by", "Duplicates", "Related to"
Parent Issue    → For sub-tasks or nested cards
Custom Fields   → Team-specific (e.g., effort estimate, affected area)
Watchers        → Users following this item
Time Logged     → Aggregated hours spent
Attachments     → Files, screenshots, links
```

### Layout: Sidebar vs Stacked
- **Sidebar layout (Linear style):** Metadata in a right column, description takes left 2/3
  - Works best on screens ≥1200px wide
  - Keeps all metadata visible without scrolling

- **Stacked layout (mobile/narrow):** Metadata below description
  - Better for mobile devices
  - Single-column responsive design

---

## 6. Action Buttons & Context Menu Patterns

### Top-Level Actions (Header)
- **Status change:** Prominent dropdown or button (often uses accent color)
- **Priority:** Icon button or dropdown
- **Archive/Delete:** Hidden in overflow menu (...) to reduce clutter
- **Share/Export:** Optional, for collaboration features

### Hidden Details (Linear's "Invisible Details" philosophy)
- Don't show every action button simultaneously
- Use overflow menu (...) to hide destructive or less-common actions
- Reveal contextual actions on hover

```css
/* Contextual menu - reveal on hover */
.card-actions {
  position: relative;
}

.card-actions-menu {
  opacity: 0;
  pointer-events: none;
  position: absolute;
  right: 0;
  top: 100%;
  transition: opacity 150ms ease;
}

.card-actions:hover .card-actions-menu {
  opacity: 1;
  pointer-events: auto;
}
```

### Safe Navigation Zone (Linear's clip-path trick)
For dropdown menus that don't disappear when you move the cursor, use a triangular safe zone:

```css
.dropdown-menu {
  clip-path: polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% -50px, 20px -50px);
  /* Invisible triangle extends from menu back to parent button */
  /* Prevents menu from closing on diagonal movement */
}
```

---

## 7. Activity Log & Comments Section

### Structure
- **Timeline:** Vertical list of events
- **Event types:**
  - Status changes (card moved from "Todo" to "In Progress")
  - Assignee changes
  - Metadata updates (priority, due date changed)
  - Comments added
  - Attachments uploaded
- **Display:** Timestamp + actor avatar + action description

```html
<!-- Example activity feed structure -->
<div class="activity-log">
  <div class="activity-item">
    <img class="avatar" src="..." alt="User" />
    <div class="activity-content">
      <p class="activity-action">
        <strong>Jane Smith</strong> changed status to <code>In Progress</code>
      </p>
      <time class="activity-time">2 hours ago</time>
    </div>
  </div>

  <!-- Comment section -->
  <div class="activity-item comment">
    <img class="avatar" src="..." alt="User" />
    <div class="activity-content">
      <p class="comment-author"><strong>John Doe</strong></p>
      <p class="comment-text">This looks good, let's ship it!</p>
      <time class="activity-time">1 hour ago</time>
    </div>
  </div>
</div>
```

### Comment Editor
- Text input with markdown preview toggle
- "Mention" autocomplete (@username)
- Emoji picker (optional, adds visual flair)
- Submit button (disabled until text entered)

---

## 8. Responsive & Mobile Considerations

### Desktop (≥1200px)
- Side panel layout (Linear style)
- Sidebar with metadata on right
- Full description in center/left

### Tablet (768px - 1200px)
- Stacked layout begins (metadata below description)
- Panel width adjusts to 90% of viewport
- Still sufficient space for good readability

### Mobile (<768px)
- Full-screen modal (no background visible)
- Single column: Title → Description → Metadata → Activity
- Bottom sheet approach (slides up from bottom) for better thumb accessibility
- Metadata as collapsible sections to save vertical space

```css
@media (max-width: 768px) {
  .detail-panel {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    top: auto;
    height: 90vh;
    border-radius: 16px 16px 0 0;
    /* Prevents scrolling background on mobile */
    overflow-y: auto;
    overflow-x: hidden;
  }

  .detail-panel-metadata {
    display: block; /* Stacked, not sidebar */
  }
}
```

---

## 9. Typography & Visual Hierarchy

### Hierarchy Levels (use size + weight, not just size)

| Level | Size | Weight | Color | Use Case |
|-------|------|--------|-------|----------|
| H1 (Card Title) | 24px | 600 (semibold) | Primary text | Card heading |
| H2 (Section Header) | 14px | 600 | Primary text | "Description", "Activity", "Metadata" labels |
| Body (Default) | 14px | 400 | Primary/secondary text | Descriptions, comments, metadata values |
| Caption | 12px | 400 | Tertiary text | Timestamps, helper text |
| Monospace (Code) | 13px | 400 | Different color (gray or accent) | Code blocks, inline code |

### Line Height
- Headings: 1.2 (tighter, more impact)
- Body text: 1.5 (loose, easier to read)
- Code: 1.4 (helps distinguish from prose)

### Text Colors in Light Mode
```
Primary:   #1a1a1a (99% black, softer than pure #000)
Secondary: #666666 (middle gray for less critical info)
Tertiary:  #999999 (light gray for timestamps, helper text)
Accent:    #0066FF (or brand color, for links and primary actions)
```

---

## 10. Practical CSS Patterns to Steal

### Pattern 1: Clean Card Layout with Metadata Sidebar
```css
.detail-panel {
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 32px;
  max-width: 1200px;
  margin: 0 auto;
  padding: 32px;
}

.detail-main {
  min-width: 0; /* Prevents grid items from overflowing */
}

.detail-sidebar {
  border-left: 1px solid #e0e0e0;
  padding-left: 32px;
  max-height: 100vh;
  overflow-y: auto;
}

@media (max-width: 1024px) {
  .detail-panel {
    grid-template-columns: 1fr;
    gap: 24px;
  }
  .detail-sidebar {
    border-left: none;
    border-top: 1px solid #e0e0e0;
    padding-left: 0;
    padding-top: 24px;
  }
}
```

### Pattern 2: Hover States on Metadata Fields
```css
.metadata-field {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 4px;
  transition: background-color 150ms ease;
}

.metadata-field:hover {
  background-color: #f5f5f5; /* 2-5% darker than normal */
  cursor: pointer;
}

.metadata-field:hover .metadata-edit-icon {
  opacity: 1; /* Show edit icon on hover */
}

.metadata-edit-icon {
  opacity: 0;
  transition: opacity 150ms ease;
}
```

### Pattern 3: Activity Timeline with Icons
```css
.activity-feed {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.activity-item {
  display: grid;
  grid-template-columns: 32px 1fr;
  gap: 12px;
  padding: 8px 0;
}

.activity-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
}

.activity-content {
  min-width: 0;
}

.activity-action {
  font-size: 14px;
  color: #666;
  margin: 0;
}

.activity-time {
  display: block;
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}
```

### Pattern 4: Status Badge with Color Coding
```css
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.status-badge.todo {
  background-color: #f0f0f0;
  color: #333;
}

.status-badge.in-progress {
  background-color: #fff3cd;
  color: #856404;
}

.status-badge.done {
  background-color: #d4edda;
  color: #155724;
}

.status-badge.blocked {
  background-color: #f8d7da;
  color: #721c24;
}
```

---

## 11. Key Takeaways

1. **Layout:** Side panel is the modern standard. Linear's approach (responsive right sidebar) beats centered modals for maintaining context.

2. **Reduce Visual Noise:** Use overflow menus (...) to hide destructive actions. Don't show every button at once.

3. **Inline Editing:** Click-to-edit for metadata fields feels snappier than modal editors. Reduces cognitive friction.

4. **Color Strategy:** Use LCH color space principles (base + accent + contrast). Never rely on color alone for information.

5. **Text & Contrast:** Avoid gray-on-gray. Use dark text in light mode, light text in dark mode. Test with WCAG contrast tools.

6. **Metadata Priority:** Always show: Assignee, Status, Priority, Due Date, Labels. Optional: Linked issues, custom fields, time logged.

7. **Activity Feed:** Chronological timeline with event types (status change, comment, attachment). Include actor avatar + timestamp.

8. **Typography:** Use size + weight for hierarchy, not just size. 24px semibold for title, 14px semibold for section headers, 14px regular for body.

9. **Safe Menus:** Use CSS `clip-path` polygon to create invisible safe zones preventing accidental menu closure (Linear's trick).

10. **Responsive:** Stacked layout on mobile (full-screen bottom sheet), side panel on desktop (≥1200px).

---

## 12. Quick Implementation Checklist

- [ ] Choose layout: Side panel (Linear) vs. modal (Trello) vs. hybrid (Notion)
- [ ] Define color palette: Base, accent, contrast (3 variables)
- [ ] Test contrast ratios: Minimum 4.5:1 for text (WCAG AA)
- [ ] Design metadata sidebar: Assignee, status, priority, due date, labels
- [ ] Build inline edit mode for metadata fields
- [ ] Design activity feed: Timeline with event types + avatars + timestamps
- [ ] Create status badges with color coding
- [ ] Implement hover states on metadata fields (show edit icon)
- [ ] Add responsive grid: 2-column desktop, 1-column mobile
- [ ] Test on: Desktop (1200px+), Tablet (768px-1200px), Mobile (<768px)

---

## Sources
- [How we redesigned the Linear UI (part II) - Linear](https://linear.app/now/how-we-redesigned-the-linear-ui)
- [Invisible details: Building contextual menus - Linear](https://linear.app/now/invisible-details)
- [Linear Issue view layout – Changelog](https://linear.app/changelog/2021-06-03-issue-view-layout)
- [Kanban cards: Definition, anatomy, best practices - Wrike](https://www.wrike.com/kanban-guide/kanban-cards/)
- [Modal - Trello Developer](https://developer.atlassian.com/cloud/trello/power-ups/ui-functions/modal/)
- [Understanding Kanban & Scrum Tactics for UX Designers - Slickplan](https://slickplan.com/blog/understanding-kanban-scrum-tactics-for-ux-designers)
