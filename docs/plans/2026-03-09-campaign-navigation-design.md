# Campaign Navigation Landing Page Design

**Date:** 2026-03-09 | **Campaign:** campaign-001 Sprint 12 | **Workstream:** mission-control

## Problem

`/campaigns` currently renders a single campaign view with small pill buttons to switch between campaigns. With 3+ campaigns across different workstreams, this doesn't scale. Users need a landing page that gives an at-a-glance view of all campaigns before drilling in.

## Design

### Route structure

- `/campaigns` = landing page (card gallery)
- `/campaigns?id=campaign-001` = full campaign detail view (current page content)
- Clicking a card navigates to the detail view

### Landing page layout

1. **Header area:** "Campaigns" title + workstream filter pills (All / MC / CARES / Personal)
2. **Card grid:** responsive, 2-3 columns on wide screens, 1 on narrow
3. **Sort order:** Active campaigns first, then by date descending

### Campaign card anatomy

```
+-------------------------------------------+
| gradient bar (workstream-colored)          |
|  [status pill]    [workstream badge]       |
|                                            |
|  Campaign Name (large, bold)               |
|  1-2 line description text...              |
|                                            |
|  +------+------+------+------+             |
|  | GPA  |Agents|Sprints| Done |            |
|  | 2.97 |  40  |  11  | 85%  |            |
|  +------+------+------+------+             |
|  [progress bar] 23/27                      |
|                                            |
|  Started Mar 6, 2026                       |
+-------------------------------------------+
```

### Card elements

| Element | Details |
|---------|---------|
| Gradient bar | 4px top bar, workstream-colored (purple=MC, blue=CARES, green=personal) |
| Status pill | Emoji-coded: active, draft, retrospective, closed |
| Workstream badge | Color-coded pill with workstream name |
| Name | Plus Jakarta Sans, 24px, bold |
| Description | 1-2 lines, truncated with ellipsis |
| Stats row | 4 compact stats: GPA, agent count, sprint count, % done |
| Progress bar | Execution plan completion (done/total items) |
| Date | Subtle, DM Mono, bottom of card |

### Workstream colors

| Workstream | Gradient | Badge color |
|------------|----------|-------------|
| mission-control | purple (#8b5cf6) | purple-bg |
| cares | blue (#3b82f6) | blue-bg |
| personal | green (#22c55e) | green-bg |

### Status emoji mapping

| Status | Emoji | Badge style |
|--------|-------|-------------|
| active | pulsing green dot | green-bg |
| draft | purple circle | purple-bg |
| retrospective | amber circle | amber-bg |
| closed | gray circle | surface |

### Interactions

- Hover: subtle lift + shadow (existing agent-card hover pattern)
- Click: navigate to `/campaigns?id={campaign-id}`
- Filter pills: toggle workstream visibility (client-side filter)

### Data source

Reads from `/api/campaigns`. No new API needed. The `workstream` field was added to campaign schema.

### Empty states

- No campaigns: "No campaigns yet" with create guidance
- Filtered to empty workstream: "No {workstream} campaigns"

### Responsive

- Desktop (>1024px): 3-column grid
- Tablet (768-1024px): 2-column grid
- Mobile (<768px): 1-column stack

## Implementation notes

- Modify `campaigns-page.html` to add landing view
- Keep existing campaign detail rendering as the drill-in view
- Use URL query param to toggle between landing and detail
- Reuse existing CSS variables and component patterns
- Follow Apple design template (Plus Jakarta Sans + DM Sans, 1200px max-width)

## Future iterations

- Quick Links section on cards
- Orchestrator version badge
- Mini activity feed (last 3 agent actions)
- Create campaign button on landing page
