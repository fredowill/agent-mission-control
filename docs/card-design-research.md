# Kanban Card Design Research — CSS & Layout Patterns

**Date:** 2026-03-05
**Status:** Research complete from 6 primary sources + design references

---

## Executive Summary

Modern kanban card design relies on **three core mechanisms**:

1. **Aspect-ratio** (`aspect-ratio: 1/1`) to enforce square geometry without fixed heights
2. **Generous padding** (16px) + layered internal structure (header, title, description, footer)
3. **Subtle visual elevation** (1px border + `shadow-sm`, not heavy shadows)

Cards feel "square, not stretched" because dimension constraints are applied at the **column level** (fixed width, 250–280px), and the card itself uses `aspect-ratio` to fill that space proportionally.

---

## Pattern 1: Square Cards via CSS `aspect-ratio`

### Why `aspect-ratio` Instead of Fixed Heights?

When card titles vary in length, a fixed `height` creates either:
- **Overflow clipping** if too short
- **Wasted whitespace** if too tall

Instead, set **one dimension** (width) and let `aspect-ratio` compute height proportionally:

```css
.kanban-column {
  display: flex;
  flex-direction: column;
  width: 280px; /* Fixed column width */
}

.card {
  aspect-ratio: 1 / 1; /* Square: height = width */
  overflow: hidden; /* Prevents content from expanding beyond bounds */
}
```

### Grid Layout (Responsive Multi-Column)

For 2–3 columns that stack on mobile:

```css
.kanban-board {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 16px;
}

.card {
  aspect-ratio: 1 / 1;
  display: flex;
  flex-direction: column;
}
```

**Key insight:** `minmax(260px, 1fr)` lets cards scale responsively but never collapse below 260px. `aspect-ratio: 1/1` keeps them square at any size.

---

## Pattern 2: Internal Card Structure (Tailwind + CSS)

### HTML Architecture

```html
<div class="card">
  <!-- Header: badges + status dot -->
  <div class="card-header">
    <div class="badge-row">
      <span class="badge badge-low">Low</span>
      <span class="badge badge-done">Done</span>
      <span class="date-small">Mar 5</span>
    </div>
    <div class="status-dot status-active"></div>
  </div>

  <!-- Title: max 2 lines -->
  <div class="card-title">Redesign landing page header</div>

  <!-- Description: lighter, 1–2 lines -->
  <div class="card-description">
    Update navigation and hero section
  </div>

  <!-- Footer: avatars + interaction icons -->
  <div class="card-footer">
    <div class="avatar-stack">
      <img src="..." alt="User 1" class="avatar" />
      <img src="..." alt="User 2" class="avatar" />
    </div>
    <div class="icon-group">
      <span class="icon icon-comment">💬</span>
      <span class="count">2</span>
    </div>
  </div>
</div>
```

### Tailwind + CSS Classes

```css
/* Root card container */
.card {
  aspect-ratio: 1 / 1;
  display: flex;
  flex-direction: column;

  /* Tailwind equivalent */
  /* @apply aspect-square flex flex-col; */

  background-color: #ffffff;
  border: 1px solid #e5e5e5;
  border-radius: 12px; /* 0.75rem in Tailwind: rounded-xl */
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08); /* shadow-sm */
  padding: 16px; /* p-4 in Tailwind, but use px-4 py-4 */

  /* Smooth hover lift */
  transition: box-shadow 0.2s, transform 0.2s;
}

.card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12); /* shadow-md */
  transform: translateY(-2px); /* Subtle lift */
}

/* Header: badges + status */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
}

.badge-row {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;

  /* Tailwind: text-xs font-medium px-2 py-1 rounded */
}

.badge-low {
  background-color: #fef3c7; /* Tailwind: bg-yellow-100 */
  color: #92400e; /* Tailwind: text-yellow-900 */
}

.badge-done {
  background-color: #dcfce7;
  color: #15803d;
}

.date-small {
  font-size: 12px;
  color: #888;
  margin-left: auto;
}

.status-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
}

.status-active {
  background-color: #3b82f6; /* blue-500 */
}

/* Title: bold, primary content */
.card-title {
  font-size: 14px;
  font-weight: 700;
  color: #1f2937; /* gray-900 */
  line-height: 1.3;
  margin-bottom: 4px;

  /* Max 2 lines, ellipsis overflow */
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;

  /* Tailwind: font-bold text-sm text-gray-900 line-clamp-2 */
}

/* Description: lighter, secondary */
.card-description {
  font-size: 13px;
  color: #6b7280; /* gray-500 */
  line-height: 1.4;
  margin-bottom: auto; /* Push footer to bottom */

  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;

  /* Tailwind: text-xs text-gray-500 line-clamp-1 */
}

/* Footer: avatars + count */
.card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #f3f4f6; /* gray-100 */
}

.avatar-stack {
  display: flex;
  margin-right: 8px;
}

.avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 2px solid #ffffff;
  margin-right: -6px;

  /* Overlap effect */
  /* Tailwind: w-6 h-6 rounded-full border-2 border-white -mr-1.5 */
}

.avatar:first-child {
  margin-right: -6px;
}

.icon-group {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #9ca3af; /* gray-400 */
}

.count {
  font-size: 12px;
}
```

---

## Pattern 3: Responsive Grid with Columns

### Full Multi-Column Kanban Board

```html
<div class="kanban-board">
  <div class="kanban-column">
    <h2 class="column-header">To Do</h2>
    <div class="card-stack">
      <div class="card"><!-- Card 1 --></div>
      <div class="card"><!-- Card 2 --></div>
    </div>
  </div>

  <div class="kanban-column">
    <h2 class="column-header">In Progress</h2>
    <div class="card-stack">
      <div class="card"><!-- Card 3 --></div>
    </div>
  </div>

  <div class="kanban-column">
    <h2 class="column-header">Done</h2>
    <div class="card-stack">
      <div class="card"><!-- Card 4 --></div>
    </div>
  </div>
</div>
```

### CSS for Board Layout

```css
.kanban-board {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
  padding: 20px;
  background-color: #f9fafb;

  /* Responsive: 2 columns on tablet, 1 on mobile */
  /* @media (max-width: 1024px) { grid-template-columns: repeat(2, 1fr); } */
  /* @media (max-width: 640px) { grid-template-columns: 1fr; } */
}

.kanban-column {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.column-header {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 8px;
}

.card-stack {
  display: flex;
  flex-direction: column;
  gap: 12px; /* Space between cards in a column */
}
```

---

## Pattern 4: Fixed Width + Aspect Ratio (Recommended for 250–280px Cards)

When you know exact column width:

```css
.kanban-column {
  width: 280px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.card {
  aspect-ratio: 1 / 1;
  min-width: 0; /* Prevents flex shrinking below 280px */
}
```

**Why this works:**
- Column width is fixed at 280px (no scaling)
- Card inherits that width
- `aspect-ratio: 1/1` forces height = 280px
- All cards are perfectly square
- Title/description overflow is handled by `-webkit-line-clamp` in headers/footers

---

## Pattern 5: Spacing & Sizing Scale (Industry Standard)

### Padding & Margin

| Use Case | Value | Tailwind |
|----------|-------|----------|
| **Card internal padding** | 16px | `p-4` |
| **Badge padding** | 4px 8px | `px-2 py-1` |
| **Gap between badges** | 6px | `gap-1.5` |
| **Header to title spacing** | 8px | `mb-2` |
| **Title to description** | 4px | `mb-1` |
| **Description to footer** | auto | `mb-auto` |
| **Footer top border/margin** | 12px | `pt-3 mt-3` |
| **Gap in column** | 12px | `gap-3` |
| **Gap between columns** | 16–24px | `gap-4` or `gap-6` |

### Border Radius

| Element | Value | Tailwind |
|---------|-------|----------|
| **Card** | 12px | `rounded-xl` |
| **Badge** | 6px | `rounded` |
| **Avatar** | 50% (circle) | `rounded-full` |
| **Status dot** | 50% (circle) | `rounded-full` |

### Shadow & Elevation

| State | Shadow | Tailwind |
|-------|--------|----------|
| **Rest** | `0 1px 3px rgba(0,0,0,0.08)` | `shadow-sm` |
| **Hover** | `0 4px 12px rgba(0,0,0,0.12)` | `shadow-md` |
| **Active/Drag** | `0 10px 25px rgba(0,0,0,0.15)` | `shadow-lg` |

---

## Pattern 6: CSS Grid Layout Technique

### Flexible Column Flow

```css
.kanban-board {
  display: flex;
  gap: 16px;
  overflow-x: auto;
  padding: 20px;
}

.kanban-column {
  width: 280px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.card {
  aspect-ratio: 1 / 1;
  /* ... rest of card styles ... */
}
```

**Advantage:** Horizontal scrolling for overflow, each column exactly 280px.

---

## What Makes Cards Feel "Square" vs "Stretched"

### ❌ Don't Do This

```css
.card {
  width: 100%;
  height: 280px; /* Fixed height + variable width = stretched */
}
```

Result: On narrow screens, cards become wide and short. On wide screens, they're wide and tall.

### ✅ Do This

```css
.card {
  width: 280px; /* Fixed width OR inherited from column */
  aspect-ratio: 1 / 1; /* Height follows width */
}
```

Result: Cards are always square, regardless of viewport or text length.

---

## Implementation Checklist

- [ ] **Container:** Fixed column width (280px) OR responsive with `minmax(260px, 1fr)`
- [ ] **Card:** Apply `aspect-ratio: 1/1` + `overflow: hidden`
- [ ] **Header:** Flex row, space-between, gap 6–12px
- [ ] **Title:** Font-weight 700, font-size 14px, `-webkit-line-clamp: 2`
- [ ] **Description:** Font-size 13px, lighter color, `-webkit-line-clamp: 1`
- [ ] **Footer:** Flex row, justify-between, border-top separator
- [ ] **Padding:** 16px internal, 12px footer spacing
- [ ] **Border-radius:** 12px for card, 6px for badges
- [ ] **Shadow:** `shadow-sm` resting, `shadow-md` on hover
- [ ] **Transition:** `transition: box-shadow 0.2s, transform 0.2s;`

---

## Tools & References

- [CSS-Tricks: aspect-ratio](https://css-tricks.com/almanac/properties/a/aspect-ratio/)
- [MDN: Aspect Ratios](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Box_sizing/Aspect_ratios)
- [web.dev: Aspect Ratio Pattern](https://web.dev/patterns/layout/aspect-ratio-image-card/)
- [GeeksforGeeks: Kanban Board CSS](https://www.geeksforgeeks.org/build-a-drag-drop-kanban-board-using-html-css-javascript/)
- [SitePoint: Trello Layout with CSS Grid](https://www.sitepoint.com/building-trello-layout-css-grid-flexbox/)
- [shadcn/ui Card Docs](https://ui.shadcn.com/docs/components/card)
- [Tailwind CSS Rounded Corners](https://tailwindcss.com/docs/border-radius)

---

## Production Examples

**Trello-like simplicity:**
```css
.card {
  aspect-ratio: 1 / 1;
  padding: 16px;
  background: white;
  border: 1px solid #e5e5e5;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.08);
  display: flex;
  flex-direction: column;
  gap: 8px;
}
```

**Minimal Tailwind:**
```html
<div class="aspect-square p-4 bg-white border border-gray-200 rounded-xl shadow-sm
            flex flex-col gap-2 hover:shadow-md transition-shadow">
  <!-- Content -->
</div>
```

---

## Key Takeaway

**Cards feel square because their container (column) has fixed width, and the card uses `aspect-ratio` to scale height proportionally.** Text overflow is handled by `-webkit-line-clamp` and ellipsis, not by stretching the card. Padding is consistent (16px), borders are subtle (1px), and shadows are minimal (0 1px 3px). This creates the "card" feeling: distinct, tangible, and proportional.

