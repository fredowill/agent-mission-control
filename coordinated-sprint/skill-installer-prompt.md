## Mission: Install the ui-ux-pro-max-skill into the Claude Code skills directory, configure it for Apple-only aesthetic, and sync to the toolbox.

The user wants the [nextlevelbuilder/ui-ux-pro-max-skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) installed. It's a design intelligence skill with 50+ UI styles, palettes, font pairings, and chart types. A research agent already evaluated it (see evaluation notes below). The skill must be scoped to our Apple-inspired aesthetic — not all 67 styles.

**Deliverable:** Working skill in `~/.claude/skills/ui-ux-pro-max/`, Apple aesthetic override configured, and skill copied to `projects/agent-mission-control/toolbox/skills/` for Git tracking.

## Context from Research Agent

- The skill complements our existing stack (frontend-design, impeccable-* skills) — it fills a different layer (searchable database vs behavioral prompts)
- Python 3.x dependency for the search scripts (search.py uses BM25 + regex hybrid)
- 67 styles available but we only want Apple-inspired aesthetic by default
- Install methods: npm CLI (`uipro-cli`), Claude Code plugin marketplace, or manual Git clone
- Skill file lives at `.claude/skills/ui-ux-pro-max/SKILL.md` with `data/`, `scripts/`, `templates/` subdirs
- Can generate `design-system/MASTER.md` for persistent design rules

## Agent Lifecycle (follow in order)

### Stage 1: DEFINE
- **Read these files first:**
  - `C:\Users\emeskel\Claude\apple-design-template.md` — our existing Apple design system spec (Plus Jakarta Sans, DM Sans, CSS vars, 1200px max, etc.)
  - `~/.claude/skills/frontend-design/SKILL.md` — understand what we already have for UI work
  - The repo README at https://github.com/nextlevelbuilder/ui-ux-pro-max-skill — get the latest install instructions
- **Success looks like:**
  1. Skill installed and loadable via `/ui-ux-pro-max` or auto-triggered on UI keywords
  2. Default style scoped to Apple aesthetic (our Plus Jakarta Sans + DM Sans, light mode, clean spacing)
  3. Skill synced to `projects/agent-mission-control/toolbox/skills/ui-ux-pro-max/` for Git tracking
  4. No conflicts with existing frontend-design or impeccable-* skills
- **Constraints:**
  - Only install to user-level skills (`~/.claude/skills/`), not project-level
  - Do NOT modify any existing skills
  - Do NOT modify server.js or campaigns-page.html
  - If Python 3 is not available, document that as a limitation but still install the skill files

### Stage 2: DISCOVER (HARD GATE — do not skip)
Run: `ls ~/.claude/skills/`
**You MUST load at least one skill before proceeding to Stage 3.**
Mandated skills for this task: `coding-standards`, `verification-before-completion`

### Stage 3: EXECUTE

1. **Clone or download the skill repo** — use `git clone https://github.com/nextlevelbuilder/ui-ux-pro-max-skill.git` to a temp location
2. **Copy the skill directory** — move `.claude/skills/ui-ux-pro-max/` from the cloned repo to `~/.claude/skills/ui-ux-pro-max/`
3. **Verify Python availability** — run `python3 --version` or `python --version`. If not available, note it.
4. **Configure Apple aesthetic override** — edit the SKILL.md or create a project-level override that sets:
   - Default style: Apple/minimal
   - Default fonts: Plus Jakarta Sans (headings), DM Sans (body)
   - Default palette: Light mode, our CSS custom properties (--text, --text2, --surface, etc.)
   - Default spacing: 8/12/16/24px rhythm
   - This should NOT modify the upstream SKILL.md — create an override or wrapper instead
5. **Sync to toolbox** — copy the installed skill to `C:\Users\emeskel\Claude\projects\agent-mission-control\toolbox\skills\ui-ux-pro-max\`
6. **Test the skill** — try loading it with a test prompt to verify it activates on UI keywords

### Stage 4: REASON
- Should the Apple override go in the SKILL.md itself or as a separate config file? Consider: we want to pull upstream updates without losing our customization. A separate override file or a CLAUDE.md rule is better.
- Does the skill conflict with frontend-design? They should coexist — ui-ux-pro-max is a database, frontend-design is behavioral instructions.
- If Python is unavailable on this machine, the search scripts won't work but the SKILL.md instructions and data files are still valuable as context.

### Stage 5: VERIFY
- Run: `ls ~/.claude/skills/ui-ux-pro-max/` — confirm SKILL.md and supporting files exist
- Run: `ls C:\Users\emeskel\Claude\projects\agent-mission-control\toolbox\skills\ui-ux-pro-max\` — confirm toolbox sync
- Test: start a new Claude Code prompt about "build a card component" and verify the skill auto-activates
- Check: the Apple aesthetic override is applied (not defaulting to random styles)

### Stage 6: DEBRIEF (MANDATORY — your grade depends on this)
```bash
curl -X POST http://localhost:3033/api/campaigns/agent-debrief \
  -H "Content-Type: application/json" \
  -d '{
    "campaignId": "campaign-002",
    "slot": "skill-installer",
    "delivered": ["Item 1: ui-ux-pro-max-skill installed to ~/.claude/skills/", "Item 2: Apple aesthetic override configured", "Item 3: toolbox sync completed"],
    "missed": ["Item 1: anything not completed"],
    "lessons": ["Lesson 1: insight about skill installation"]
  }'
```

## Constraints
- Only modify files in `~/.claude/skills/ui-ux-pro-max/` and `toolbox/skills/ui-ux-pro-max/`
- Do NOT touch existing skills, server.js, or campaign data
- If git clone fails, try downloading the files manually via curl/wget
- Apple aesthetic override must survive upstream skill updates (don't modify upstream SKILL.md directly)
