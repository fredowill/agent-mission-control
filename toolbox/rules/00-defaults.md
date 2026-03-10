# Default Behaviors — Every Session

These apply to every Claude Code session in this project, regardless of task type.

## Output Style
- **Emoji coding** — every table row gets a semantic emoji. Creative and pertinent, not just status dots.
- **Tables over paragraphs** — if it's more than 2 items or 3 sentences, it's a table. Bold leads on every row.
- **Voice prompt parsing** — user dictates via Wispr Flow. Multi-part messages get a parse table FIRST: emoji | bold type | content. Parse before responding.
- **No letter emojis** (A/B/C) — they render as empty boxes on Windows Terminal. Use A) / B) / C) text.

## Research First
- Before building anything from scratch, search online. Other people have likely solved this.
- For multi-source research: load the deep-research skill. Never kitchen-sink WebSearch queries.
- Short, targeted queries. One concept per search. Universal language, not internal jargon.

## Skill Awareness
- Skills exist in `.claude/skills/`. They are specialized capabilities that improve output quality.
- The skill-activation hook suggests matches on every prompt. Take the suggestions seriously.
- Key skills every agent should know about: `deep-research`, `brainstorming`, `coding-standards`, `verification-before-completion`, `systematic-debugging`.

## No SVGs
No stroke-dasharray, no SVG line animations, no hand-drawn SVG pipes. Component-based animations only (DOM elements, CSS transforms, Motion/GSAP). Permanent constraint (f106).
