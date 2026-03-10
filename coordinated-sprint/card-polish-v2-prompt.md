## Mission: Polish agent cards to be visually stunning — redesign the lifecycle progress bar from chunky segments to something beautiful, bold/color-code the focus text with visual hierarchy, and make the dispatch reason readable and expandable.

The card builder agent (A+ grade) implemented the functional card redesign — task-type colors, segmented lifecycle bar, cook timer, dispatch reason line. But the visual execution needs polish: the progress bar segments are too chunky and take up too much screen space, the focus/dispatch text is gray italic wall-of-text that nobody reads, and the overall design doesn't make you go "wow." This agent's job is to make the cards genuinely impressive using the ui-ux-pro-max design database for inspiration.

**Deliverable:** Updated `projects/agent-mission-control/campaigns-page.html` with polished agent cards that look genuinely beautiful — not just functional.

## Research Context

Progress bar design best practices (from web research):
- ClickUp uses small circles instead of bars — minimalist "ball progress" that stays unobtrusive
- Circular progress indicators work well when space is tight and you want more visual impact
- Thin line bars (2-3px) with gentle glow or smooth fill animation feel less tedious than chunky segments
- Material Design uses a thin determinate linear indicator (4px height) with rounded caps
- The key principle: progress tracking should be unobtrusive — focus stays on content, not the mechanism

## Agent Lifecycle (follow in order)

### Stage 1: DEFINE
- **Read these files first:**
  1. `projects/agent-mission-control/campaigns-page.html` — find the card rendering code. Look at the current lifecycle progress bar CSS (`.lifecycle-progress`, `.lifecycle-segment`), the focus text rendering, and the dispatch reason line.
  2. `coordinated-sprint/agent-card-research.md` — sections 4.4 (Lifecycle Progress Bar) and 4.6 (Dispatch Reason Line) for the original design intent
  3. `C:\Users\emeskel\Claude\apple-design-template.md` — our design system. Note: Apple uses very thin progress bars, subtle animations, lots of whitespace.
- **Success looks like:**
  1. Lifecycle progress bar is thin (3-4px), elegant, with subtle animation on the active segment — NOT chunky blue blocks
  2. Focus/dispatch text has bold leads, color-coding by keyword type, and visual hierarchy — NOT a gray italic wall
  3. Text that's too long is elegantly handled (ellipsis with expand on hover/click, or 2-line max with tooltip)
  4. The overall card makes you think "wow, this looks professionally designed"
  5. No regressions — cook timer, task-type colors, grade badges all still work
- **Constraints:**
  - ONLY modify `campaigns-page.html`
  - Build ON TOP of the card builder's work — don't rewrite the card from scratch
  - Apple Design aesthetic (Plus Jakarta Sans, light mode, thin/subtle/elegant)
  - Must work with 5-second polling refresh
  - Python path for ui-ux-pro-max: `C:\Users\emeskel\AppData\Local\Programs\Python\Python313\python.exe`

### Stage 2: DISCOVER (HARD GATE — do not skip)
Run: `ls .claude/skills/`
**You MUST load at least one skill before proceeding to Stage 3.**
Mandated skills for this task: `impeccable-polish`, `ui-ux-pro-max`, `impeccable-bolder`

**CRITICAL: Use ui-ux-pro-max search to find design inspiration:**
```bash
"C:\Users\emeskel\AppData\Local\Programs\Python\Python313\python.exe" ~/.claude/skills/ui-ux-pro-max/scripts/search.py "thin progress bar minimal" --domain style --max-results 5
"C:\Users\emeskel\AppData\Local\Programs\Python\Python313\python.exe" ~/.claude/skills/ui-ux-pro-max/scripts/search.py "status card elegant" --domain style --max-results 5
"C:\Users\emeskel\AppData\Local\Programs\Python\Python313\python.exe" ~/.claude/skills/ui-ux-pro-max/scripts/search.py "apple minimalist dashboard" --domain style --max-results 3
```
Use the CSS variables, implementation checklists, and design system variables from the search results to inform your design choices.

### Stage 3: EXECUTE

**Phase 1: Progress Bar Redesign**
1. Replace the chunky segmented bar with a thin, elegant alternative. Options to consider:
   - **Thin continuous bar** (3-4px) with a colored fill that grows left-to-right, small dots or notches at stage boundaries
   - **Micro-dots** (6 small dots, 4-5px each) with filled/empty states — more like the original dots but refined
   - **Thin bar + stage label** — single thin line with a text label underneath showing current stage
   Whatever you choose, it must: (a) show 6 stages, (b) indicate current position, (c) pulse/animate on the active stage, (d) be thin and unobtrusive
2. Remove the "DONE" label underneath completed bars — the full green fill is sufficient
3. Active stage should have a subtle glow or pulse, not a harsh blink

**Phase 2: Focus Text Visual Hierarchy**
4. The dispatch reason line (currently gray italic truncated text) needs:
   - **Bold first phrase** (before the first comma or period) as the headline
   - Key terms color-coded: tool names in accent color, user quotes in italic, action verbs bolded
   - 2-line max with CSS `line-clamp`, full text visible on hover (title attribute or tooltip)
5. Remove "User: " prefix if present — it's noise. The content speaks for itself.

**Phase 3: Overall Card Polish**
6. Tighten vertical spacing — the card has too much dead space between elements
7. Grade badge should have a subtle colored glow/shadow matching its grade color (A=green glow, B=blue, etc.)
8. The emoji next to agent name should be slightly larger (16-18px) for visual weight
9. Hover state on the card — subtle lift (translateY -2px) with shadow increase for depth

### Stage 4: REASON
- Thin bars vs micro-dots: which is more Apple-like? Apple uses thin continuous bars (iOS progress, Safari loading). Micro-dots are more playful (Notion, Linear). Given our Apple design system, thin bar is probably right — but check what ui-ux-pro-max suggests.
- How much color-coding in the text is too much? One or two highlights is elegant; rainbow text is garish. Less is more.
- The card needs to work at both 1x zoom and 1.35x zoom (user's preference). Test at both.

### Stage 5: VERIFY
- Playwright screenshot of campaign-002 Sprint 3 cards at default zoom — verify progress bars are thin and elegant
- Playwright screenshot at 1.35x zoom — verify nothing breaks at the user's preferred zoom
- Playwright screenshot of an active agent card (if any) — verify pulse animation
- Compare before/after: the new cards should feel notably more polished
- Verify: clicking cards still opens report card modal
- Verify: cook timer still updates, task-type colors still show

### Stage 6: DEBRIEF (MANDATORY — your grade depends on this)
```bash
curl -X POST http://localhost:3033/api/campaigns/agent-debrief \
  -H "Content-Type: application/json" \
  -d '{
    "campaignId": "campaign-002",
    "slot": "card-polish-v2",
    "delivered": ["Item 1: thin elegant progress bar replacing chunky segments", "Item 2: focus text with bold leads and visual hierarchy", "Item 3: card hover states and grade badge glow"],
    "missed": ["Item 1: anything not completed"],
    "lessons": ["Lesson 1: insight about card visual polish"]
  }'
```

## Constraints
- ONLY modify `campaigns-page.html`
- Apple Design aesthetic — thin, subtle, elegant. Not chunky, not flashy.
- Must work with 5-second polling refresh
- No external libraries (zero-dependency project)
- Build on card builder's work — don't rewrite from scratch
