## Mission: Polish campaign landing page cards with richer metrics, better tagline styling, and visual refinement.

The campaign navigation landing page (`/campaigns`) was just built. It works — 3 cards render with status, workstream badges, stats, and progress bars. But the cards need polish: taglines should be bolded and color-coded, additional metrics would help at-a-glance understanding, and the overall card design needs refinement to match Apple-quality standards.

## Agent Lifecycle (follow in order)

### Stage 1: DEFINE
- **Read:**
  - `C:\Users\emeskel\Claude\projects\agent-mission-control\campaigns-page.html` (the full file — CSS, HTML template, JS)
  - `C:\Users\emeskel\Claude\projects\agent-mission-control\campaigns.json` (data structure — see what fields are available)
  - `C:\Users\emeskel\Claude\projects\agent-mission-control\docs\plans\2026-03-09-campaign-navigation-design.md` (original design spec)
  - `C:\Users\emeskel\Claude\reference\apple-design-template.md` (design system reference)
- **Success looks like:** Campaign cards that tell a rich story at a glance — bolded/color-coded taglines, 2-3 additional metrics, improved visual hierarchy. Cards should make you NOT want to click in because the surface tells you enough.
- **Constraints:**
  - Only modify the landing page card rendering (`renderLanding()` function and its CSS)
  - Do NOT modify the detail view (everything under the `?id=` code path)
  - Do NOT modify server.js
  - All new CSS must use `.cl-` prefix (campaign-landing namespace)

### Stage 2: DISCOVER (HARD GATE — do not skip)
Run: `ls ~/.claude/skills/`
**You MUST load at least one skill before proceeding to Stage 3.**
Mandated skills for this task: `impeccable-polish`
Also consider: `frontend-design`
If you skip this stage, your grade caps at C regardless of deliverables.

### Stage 3: EXECUTE
1. Read `campaigns-page.html` fully to understand current card structure
2. Read `campaigns.json` to see all available data fields per campaign
3. Load mandated skills
4. Improve card taglines:
   - Campaign description should have the first sentence bolded
   - Workstream badge should be color-coded with stronger contrast
   - Status text should use workstream accent color
5. Add richer metrics to the stats row. Consider:
   - Findings count (if available in data)
   - Active vs completed agent ratio
   - Latest sprint number
   - Post-mortem count
   - Carry items count
6. Improve visual hierarchy:
   - Card hover could show a subtle workstream-colored border glow
   - Stats that are zero or N/A should be visually muted
   - Active campaign cards should feel more "alive" than retrospective ones
7. Ensure all text is properly truncated (no overflow, no clipping)

### Stage 4: REASON
- Are the additional metrics actually useful, or do they add clutter?
- Does the bolded tagline feel natural or forced?
- Do retrospective/draft cards look different enough from active cards?
- Is the information hierarchy clear: name > status > description > stats > progress?

### Stage 5: VERIFY
1. Take a Playwright screenshot of `http://localhost:3033/campaigns` and critically evaluate
2. Verify no text is clipped or overflowing
3. Verify the detail view still works: screenshot `http://localhost:3033/campaigns?id=campaign-001`
4. Test the workstream filter pills still work (click MC, click CARES, click All)
5. Check responsive: screenshot at 800px width

### Stage 6: DEBRIEF (before you exit)
```bash
curl -X POST http://localhost:3033/api/campaigns/agent-debrief \
  -H "Content-Type: application/json" \
  -d '{"campaignId":"campaign-001","slot":"campaign-card-polish","delivered":["...list what you delivered..."],"missed":["...list what you missed..."],"lessons":["...list lessons learned..."]}'
```

## Constraints
- UI task — visual quality is the primary metric
- Do not over-engineer — this is polish, not a rewrite
- Server reads HTML from disk on each request — no restart needed
- The page already works — your job is to make it beautiful
