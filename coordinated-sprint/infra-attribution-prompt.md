## Mission: Add an Infrastructure section to the Orchestrator tab showing skills, hooks, and rules with version attribution, staleness badges, and clickable content modals.

The Orchestrator tab on the campaigns page (`campaigns-page.html`) shows the current orchestrator, dispatched agents, and the execution plan. What's missing: a view of **what each orchestrator actually built** — which skills, hooks, and rules, who created them, and whether they're stale. The data already exists in `campaigns.json` under `campaign.infrastructure`. CSS classes are already added. Your job is to write the JS rendering logic and click handlers.

## Agent Lifecycle (follow in order)

### Stage 1: DEFINE

- **Read:** `.claude/agent-hub/campaigns-page.html` — understand:
  - The Orchestrator tab rendering (search for `tab-orchestrator`, starts around line 1624)
  - The modal system (`openReportCard`, `modalBg`, `closeModal`)
  - The existing `/api/skill/<name>` and `/api/hook-file/<path>` endpoints (used by Toolbox page)
  - The CSS classes already added: `.infra-section`, `.infra-row`, `.infra-version`, `.infra-stale`, `.infra-modal-content` (search for "Infrastructure Section" in the CSS)
- **Read:** `.claude/agent-hub/campaigns.json` — find the `infrastructure` object under campaign-001. It has three arrays: `skills`, `hooks`, `rules`.
- **Success looks like:** A new section on the Orchestrator tab (below the hero card, above the execution plan) showing three groups (Skills, Hooks, Rules). Each item shows: name, creating orchestrator version (purple pill), and staleness badge (Current/Review/Stale). Clicking any item opens a modal with the file content.
- **Constraints:**
  - ONLY modify `campaigns-page.html`. Do NOT touch server.js or campaigns.json.
  - Reuse existing modal pattern — do NOT create a new modal system.
  - Match the Apple-inspired light mode design: Plus Jakarta Sans for titles, DM Sans for body, DM Mono for code.
  - The CSS classes for this section already exist in the file. Use them.

### Stage 2: DISCOVER (HARD GATE — do not skip)

Run: `ls .claude/skills/`
**You MUST load at least one skill before proceeding to Stage 3.**
Mandated skills for this task: `frontend-design`
If you skip this stage or proceed without loading skills, your grade caps at C regardless of deliverables.

### Stage 3: EXECUTE

1. **Find the insertion point** in the `renderCampaign` function — between the hero card closing `</div>` (around line 1680) and the execution plan section (around line 1682). Insert the infrastructure rendering there.

2. **Read infrastructure data** from the campaign object:
   ```js
   const infra = c.infrastructure;
   ```

3. **Determine staleness** — parse the current orchestrator version (e.g., "v1.8" → 1.8) and each item's `createdBy` version. Calculate the gap:
   - Gap 0-2 versions → "Current" (green)
   - Gap 3-4 versions → "Review" (amber)
   - Gap 5+ versions → "Stale" (red)

4. **Render three groups** inside one `.infra-section` container:
   - 🔧 **Skills** — each row: skill name (clickable), version pill, staleness badge
   - 🪝 **Hooks** — each row: hook name + description, version pill, staleness badge
   - 📏 **Rules** — each row: rule name, version pill, staleness badge
   - Each group title should be collapsible (click to toggle)
   - Sort items within each group: stale first, then review, then current

5. **Add click handler for skills** — on row click, fetch `/api/skill/<name>` and show content in a modal:
   ```js
   async function openInfraModal(type, name) {
     let content = '';
     if (type === 'skill') {
       const r = await fetch('/api/skill/' + encodeURIComponent(name));
       const d = await r.json();
       content = d.content || 'Not found';
     } else if (type === 'hook') {
       // hooks have file paths — construct from name
       // Try .claude/scripts/ first, then .claude/hooks/, then .claude/agent-hub/
       // Use /api/hook-file/ endpoint
     } else {
       content = 'Rules are defined in CLAUDE.md and orchestrator-rules skill.';
     }
     // Show in modal using existing modalBg pattern
   }
   ```

6. **Render the modal** — reuse `modalBg` overlay. Show a simple modal with:
   - Purple top bar (orchestrator color)
   - Title: item name + version pill
   - Content in `.infra-modal-content` (monospace, pre-wrap)
   - Click outside or Escape to close

### Stage 4: REASON

- Does the infrastructure section add too much visual weight above the execution plan? If so, consider starting the groups collapsed.
- What happens if `c.infrastructure` is undefined (older campaigns)? Guard with `if (infra)`.
- Should rules be clickable? They don't have individual files — clicking could show the rule text from CLAUDE.md or link to the orchestrator-rules skill.
- The staleness calculation needs the CURRENT orchestrator version. Get it from `currentOrch.name` (parse "Orchestrator v1.8" → 1.8).

### Stage 5: VERIFY

- Take a Playwright screenshot of `http://localhost:3033/campaigns` showing the Orchestrator tab with the new Infrastructure section visible.
- Verify at least one skill, one hook, and one rule are rendered with correct version pills.
- Click a skill row and take a screenshot of the modal showing SKILL.md content.
- Verify staleness badges show correct colors (skills from v1.0 should show "Stale" or "Review" relative to v1.8).
- Verify the execution plan still renders correctly below the new section.

### Stage 6: DEBRIEF (before you exit)

```bash
curl -s -X POST http://localhost:3033/api/campaigns/agent-debrief \
  -H "Content-Type: application/json" \
  -d '{"campaignId":"campaign-001","slot":"infra-attribution","delivered":["item 1","item 2"],"missed":["item 1"],"lessons":["lesson 1"]}'
```

## Constraints

- **Primary file:** `campaigns-page.html` ONLY.
- **Do NOT modify** server.js, campaigns.json, or any other file.
- **CSS classes already exist** — use `.infra-section`, `.infra-row`, `.infra-name`, `.infra-version`, `.infra-stale`, `.infra-modal-content`, etc. Do NOT add new CSS unless absolutely necessary.
- **Design system:** Apple-inspired light mode. Fonts: Plus Jakarta Sans (titles), DM Sans (body), DM Mono (code/monospace).
- **Scope:** This is a rendering task only. The data is already in campaigns.json. The APIs already exist.
- **No vague language:** Every deliverable is concrete and testable.
