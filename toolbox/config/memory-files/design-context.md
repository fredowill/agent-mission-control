# Design Context — phredomade

> Durable file. Saves important design feedback and product vision so conversation
> compaction never loses critical context. Updated as design decisions are made.

---

## Mission Control (localhost:3033)

### What It Is
A zero-dependency Node.js dashboard at `.claude/agent-hub/server.js` that shows:
- P0 project status (secured items, open items, priorities)
- Live agent activity (state, tools used, activity trail)
- Editable "mission" labels per agent (what they're working on)

### User Feedback (2026-02-25)
Direct quotes from the user's design critique:

1. **"The P0 status in open/watch doesn't really make sense."**
   - Items like "rate limiting not distributed" are too technical
   - "This should be way more broad and way easier to comprehend"

2. **"I just want to understand what are the bigger picture ideas of design"**
   - Wants to see product/design vision, not tech debt lists
   - "I see seven small texts. I see 'the gallery.json'. Do I need to know that?"

3. **"What is the agent working on? I can't see anything there."**
   - Every card shows "What is this agent working on?" with no context
   - Wants: "Okay this agent needs to work on that. This agent is free.
     What should be contextually next?"

4. **"The UI is very small; it's not very legible."**
   - "This is a desktop tool so please make it way more UI friendly"
   - "Way more cool looking, like Apple design"

5. **"Too much like raw markdown dumped into HTML."**
   - Needs to feel like a designed product, not a debug panel

### Design Direction — Apple-Inspired PM Tool
- **Dark mode**: True black bg, frosted glass cards, vibrancy
- **Typography**: System font at generous sizes (titles 28-32px, body 15-17px)
- **Spacing**: 32-40px section padding, 24px card padding
- **Cards**: Large rounded corners (20-24px), subtle inner glow, no harsh borders
- **Agent cards**: Mission label is the hero element (large, bold, top of card)
- **Sidebar**: Broad product priorities, not technical minutiae
- **Overall**: Clean, spacious, legible from arm's length

---

## phredomade Site — Design Aesthetic

### Brand Voice
- Feels like a designed product, not a template site
- Every interaction should feel intentional and slightly surprising
- Typography: riant-display (logo) + Now 2025 (nav/body) — distinctive, not generic

### Home Page (PocHomeCard)
- Home card with parallax tilt, custom cursor, logo style switcher
- Logo "phredomade." links to Instagram (target=_blank)
- @phredomade badge links to Instagram
- Nav links (Book/Contact/Work): animated underline on hover, subtle persistent
  underline on mobile for tap affordance
- Active states: scale(0.97) + opacity on tap for responsive feel
- Logo hover: subtle -1px lift on desktop

### Page Transitions
- GSAP curtain: 1.15s exit, 0.7s reveal
- Curtain syncs with gallery stagger via TransitionContext

### Gallery
- Masonry grid with priority loading (first 4 eager+high, next 4 eager, rest lazy)
- Per-image fade-in on load
- Stagger gated by `revealed` from transition context

### Mobile
- GSAP clip-path circle reveal from hamburger button origin
- Spindle/arc drag physics for nav items
- SVG X close button with 90deg hover rotation
- All touch targets 44px+ via invisible ::before overlays
