## Mission: Review the campaign navigation landing page code for quality, security, and correctness.

The campaign navigation landing page was just added to `campaigns-page.html`. It adds ~200 lines of CSS and JS to an already large file. This is a read-only review — identify issues, don't fix them.

## Agent Lifecycle (follow in order)

### Stage 1: DEFINE
- **Read:**
  - `C:\Users\emeskel\Claude\projects\agent-mission-control\campaigns-page.html` (full file — focus on `.cl-` prefixed CSS and `renderLanding()` JS function)
  - `C:\Users\emeskel\Claude\projects\agent-mission-control\docs\plans\2026-03-09-campaign-navigation-design.md` (design spec to verify implementation matches)
  - `C:\Users\emeskel\Claude\projects\agent-mission-control\campaigns.json` (data the page consumes)
- **Success looks like:** A structured review report covering: code quality, XSS risks (the page builds HTML from JSON data), CSS conflicts, edge cases (empty campaigns, missing fields, null workstream), and spec compliance.
- **Constraints:** Do NOT modify any files. This is a read-only review. Output your review as text.

### Stage 2: DISCOVER (HARD GATE — do not skip)
Run: `ls ~/.claude/skills/`
**You MUST load at least one skill before proceeding to Stage 3.**
Mandated skills for this task: `code-review`
If you skip this stage, your grade caps at C regardless of deliverables.

### Stage 3: EXECUTE
1. Read the full campaigns-page.html file
2. Identify all new code added for the landing page (CSS with `.cl-` prefix, `renderLanding()` function, URL routing logic)
3. Review for:
   - **XSS:** Does `renderLanding()` properly escape campaign data before inserting into HTML? Check if the existing `esc()` function is used consistently.
   - **Edge cases:** What happens with 0 campaigns? Campaign with null workstream? Campaign with no agents? Campaign with no execution plan?
   - **CSS conflicts:** Do any `.cl-` classes conflict with existing styles?
   - **URL handling:** Is the `?id=` param properly validated? Can it cause errors with invalid IDs?
   - **Performance:** Any unnecessary re-renders or DOM rebuilds?
   - **Accessibility:** Do cards have proper semantics? Keyboard navigable?
4. Compare implementation against the design spec — are there gaps?
5. Write a structured review with severity levels (CRITICAL / HIGH / MEDIUM / LOW)

### Stage 4: REASON
- Is the landing page code well-separated from the existing detail view code?
- Are there any shared state issues between landing and detail views?
- Would a malicious campaign name cause XSS?

### Stage 5: VERIFY
- Verify the file is valid HTML by loading it in browser (curl http://localhost:3033/campaigns and check for JS errors)
- Verify your review findings are accurate — don't flag false positives

### Stage 6: DEBRIEF (before you exit)
```bash
curl -X POST http://localhost:3033/api/campaigns/agent-debrief \
  -H "Content-Type: application/json" \
  -d '{"campaignId":"campaign-001","slot":"campaign-nav-review","delivered":["...list findings..."],"missed":["...anything you couldn't verify..."],"lessons":["...lessons..."]}'
```

## Constraints
- READ-ONLY review. Do not modify any files.
- Focus on the NEW code (landing page additions), not the entire existing file
- Severity levels: CRITICAL (security), HIGH (functional bug), MEDIUM (quality), LOW (style)
