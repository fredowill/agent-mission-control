# UI & Visual Quality Rules

## Rule 7: Playwright verify EVERY UI change. No exceptions.
After any HTML, CSS, or visual change, take a Playwright screenshot and critically evaluate the full page BEFORE telling the user to look. Any project, any port. Check for broken layouts, clipped text, whitespace issues, missing elements, and overall design quality. The user should never be the first to see a broken page.

## Rule 10: Every UI output must be human-centered and visually polished.
Think Apple Design: considerate, minimal, obvious. Every page, component, or visual deliverable must be readable, scannable, and pleasant on first render. Use bold, color, hierarchy, and whitespace deliberately. Plain black text walls are never acceptable.

## No SVGs. Ever. (f106)
No stroke-dasharray, no SVG line animations, no hand-drawn SVG pipes. Component-based animations only (DOM elements, CSS transforms, Motion/GSAP). Permanent constraint.
