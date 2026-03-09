Great work on the grading skill and score breakdown bars — those are exactly right. Three things need fixing:

## 1. Modal size / scrolling

The report card modal is too tall and gets cut off on smaller screens. Fix:
- Set max-height to 85vh with overflow-y: auto
- The modal content should scroll smoothly, not get clipped

## 2. Lifecycle card expansion is finicky

When I click a lifecycle stage card, it expands awkwardly. Make this cleaner:
- The expansion should be a smooth dropdown below the card, not a pop-out
- The expanded text should have a light background (surface color) with padding
- Click again to collapse. Simple toggle, no animation jank.

## 3. Delivered/missed text needs bold-lead + color coding

Currently the delivered and missed items are plain text with just a checkmark/X. This is not readable enough.

Fix delivered items: Green checkmark + **bold first few words** (the key deliverable name) + lighter description text. Example:
✅ **4-tab workflow page** — How Agents Start, How Agents Work, How We Coordinate, How We Learn

Fix missed items: Red X + **bold first few words** (what was missed) + lighter description. Example:
✗ **Orchestrator swimlane visually flat** — same colors, hard to follow, needs top-down flowchart

The bold part should be the scannable keyword. The rest is detail. This is the bold-lead text pattern (f059) that's used everywhere else in MC.

Use /impeccable-polish after fixing and take a Playwright screenshot of the report card for at least 2 agents.
