## Mission: Research and evaluate the ui-ux-pro-max-skill for potential installation into our Claude Code environment.

The user found this project and wants it investigated: https://github.com/nextlevelbuilder/ui-ux-pro-max-skill

**Deliverable:** A research document at `coordinated-sprint/ui-ux-skill-evaluation.md` with:
- What the skill does (design intelligence, style databases, font pairings, etc.)
- How to install it for Claude Code specifically
- How it compares to our existing design skills (frontend-design, impeccable-polish, impeccable-frontend-design, apple-design-template.md)
- Recommendation: install as-is, customize, or skip
- Any conflicts with our existing skill ecosystem

## Agent Lifecycle (follow in order)

### Stage 1: DEFINE
- **Read these files first:**
  - `C:\Users\emeskel\Claude\apple-design-template.md` — our current design system
  - `.claude/skills/frontend-design/SKILL.md` — our existing frontend design skill
  - `.claude/skills/impeccable-polish/SKILL.md` — our existing polish skill
- **Success looks like:** A clear recommendation document the user can read in 2 minutes
- **Constraints:** RESEARCH ONLY — do NOT install anything. Just evaluate and recommend.

### Stage 2: DISCOVER (HARD GATE)
Run: `ls .claude/skills/`
Mandated: `brainstorming` (to structure the evaluation)

Use Deep Research pattern:
- Phase 1: Outline what we know + questions
- Phase 2: Focused searches — fetch the GitHub repo README, SKILL.md, CLAUDE.md, and installation docs
- Phase 3: Synthesize into recommendation

Searches to run:
- Fetch: `https://github.com/nextlevelbuilder/ui-ux-pro-max-skill` (README)
- Fetch: `https://raw.githubusercontent.com/nextlevelbuilder/ui-ux-pro-max-skill/main/.claude/skills/ui-ux-pro-max/SKILL.md`
- Fetch: `https://raw.githubusercontent.com/nextlevelbuilder/ui-ux-pro-max-skill/main/CLAUDE.md`
- Search: "ui-ux-pro-max-skill review claude code 2026"

### Stage 3: EXECUTE
1. Read our existing design skills
2. Fetch and analyze the ui-ux-pro-max-skill repo
3. Write evaluation document covering:
   - Feature comparison table (their skill vs our existing skills)
   - Installation steps for Claude Code
   - Potential conflicts (do they override our Apple Design aesthetic?)
   - Recommendation with reasoning

### Stage 4: REASON
- Does this skill replace or complement our existing frontend-design skill?
- Would it conflict with our apple-design-template.md aesthetic?
- Is the npm install (`uipro-cli`) safe and lightweight?

### Stage 5: VERIFY
- Confirm evaluation doc exists and has all sections
- Confirm at least 3 sources referenced

### Stage 6: DEBRIEF
```bash
curl -X POST http://localhost:3033/api/campaigns/agent-debrief \
  -H "Content-Type: application/json" \
  -d '{
    "campaignId": "campaign-002",
    "slot": "ui-ux-skill-research",
    "delivered": ["Item 1: evaluation document with feature comparison", "Item 2: installation steps", "Item 3: recommendation"],
    "missed": ["Item 1: anything not completed"],
    "lessons": ["Lesson 1: insight"]
  }'
```

## Constraints
- RESEARCH ONLY — do NOT install, modify skills, or change any config
- Save output to `coordinated-sprint/ui-ux-skill-evaluation.md`
