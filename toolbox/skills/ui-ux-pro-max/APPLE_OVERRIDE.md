# Apple Aesthetic Override

> This file overrides the default ui-ux-pro-max skill behavior to scope all design output to our Apple-inspired aesthetic. This is a LOCAL override — do not commit upstream. Survives upstream SKILL.md updates.

## Default Style: Apple Minimal

When this skill activates, apply these defaults BEFORE consulting the data files:

### Typography (Non-negotiable)

| Role | Font | Weight Range |
|------|------|-------------|
| Headings / UI Labels | `Plus Jakarta Sans` | 400-800 |
| Body / Descriptions | `DM Sans` | 300-600 |
| Code / Paths | `SF Mono, Consolas, monospace` | - |

**Google Fonts import:**
```html
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300;1,9..40,400&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
```

### Color Palette (CSS Custom Properties)

```css
:root {
  --bg-primary: #ffffff;
  --bg-secondary: #f5f5f7;
  --bg-card: #f9f9fb;
  --bg-card-hover: #f0f0f3;
  --text-primary: #1d1d1f;
  --text-secondary: #6e6e73;
  --text-tertiary: #a1a1a6;
  --accent: #0071e3;
  --accent-secondary: #147ce5;
  --accent-green: #1b9e3e;
  --accent-red: #de3730;
  --accent-orange: #c55a11;
  --accent-purple: #8944ab;
  --border: #e0e0e5;
  --border-subtle: #ececf0;
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 24px;
}
```

### Color Rules

- Colored backgrounds use semantic color at **7-8% opacity** (tinted glass effect)
- White dominates. Color appears only to encode status, interactivity, or emphasis
- No saturated backgrounds. Ever.

### Default Mode: Light

- Always default to light mode unless user explicitly requests dark
- Background: `#ffffff` primary, `#f5f5f7` secondary
- Text: near-black `#1d1d1f`, not pure black

### Spacing Rhythm

```
8px   - small gaps, pill gaps
12px  - medium gaps, between icon and text
16px  - grid gaps, standard margin-bottom
24px  - card padding (compact)
32px  - large card padding, horizontal page padding
```

### Layout

- Max content width: `1200px`
- Centered: `margin: 0 auto`
- Horizontal padding: `32px`

### Component Signatures

- **Buttons**: `border-radius: 980px` (full pill, Apple signature)
- **Cards**: `border-radius: 16px`, `background: var(--bg-card)`, `border: 1px solid var(--border)`
- **Nav**: Fixed glassmorphic bar, `backdrop-filter: blur(20px)`, semi-transparent white
- **Badges**: 9-10px uppercase, 700 weight, pill-shaped

### Animation

- **Only** CSS transitions + IntersectionObserver
- No animation libraries
- Fade-in: `opacity 0.6s ease, transform 0.6s ease`
- Hover: `transition: all 0.2s ease`
- Motion is subtle. No bouncing, sliding panels, or parallax.

### Anti-Patterns (NEVER use with this override)

- Glassmorphism with heavy blur on cards (reserved for nav only)
- Claymorphism, neumorphism, skeuomorphism
- Brutalism, bento grid with mismatched colors
- Dark mode by default
- Tailwind utility classes (we use pure CSS)
- Emojis as icons
- Inter, Roboto, Arial, system fonts
- Purple gradients on white backgrounds

## How to Apply

When the ui-ux-pro-max skill activates:
1. Read this file FIRST
2. Use the data files for supplementary information (chart types, UX guidelines, accessibility rules)
3. Override any style/color/typography recommendation from the data files with the values above
4. The skill's UX guidelines, accessibility rules, and pre-delivery checklist still apply in full
