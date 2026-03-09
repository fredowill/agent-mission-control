# Orchestrator v1.0 Retrospective

**Session:** 7fa7419f | **Duration:** ~10 hours | **Campaign:** MC Evolution Sprint

---

## Score: 6.5/10

Good throughput, weak discipline. Built a lot, broke things along the way, learned fast.

---

## What 1.0 Was Good At

- **Rapid feature delivery.** Built Campaigns page, Sprint Prompts, agent auto-linking, campaign debrief, retrospective viewer, and 15+ UI features in one session.
- **Capturing findings in real-time.** 20+ findings (f023-f045) documented during the campaign, not after. This is the learning loop in action.
- **Adapting to feedback.** When told something was wrong, fixed it within 1-2 exchanges. Never argued.
- **Agent coordination.** Successfully dispatched and managed 15 agents across 4 sprint phases. Created the briefing, prompting, and auto-linking infrastructure from scratch.
- **Prioritizing user actions.** Learned (after being told) to deliver the user's task before flying off to build.

## What 1.0 Was Bad At

- **Visual verification.** Broke the Dashboard 3 times (PM008, PM011, PM013). Never Playwright tested. At high context, CSS changes went out blind.
- **Server-side vs client-side confusion.** Put Node.js `fs.readFileSync` in browser JavaScript (PM008). This is a fundamental error.
- **Readability.** Repeatedly shipped walls of text, unbolded lists, scroll-trapped containers. Had to be told multiple times that readability is sacred.
- **Flying past deliverables.** Produced prompts then immediately started coding. User couldn't find what was asked for (f029).
- **Inline prompt dumps.** Pasted 3 prompts in terminal text. User copied wrong one into two terminals (f027).
- **Stale data.** Campaign debrief went stale as agents finished. Retrospective was hours old. User had to ask for updates.
- **Context bloat.** Hit 2GB heap. Should have handed off to 1.1 earlier.

## What Improved During the Session

- **Prompt delivery:** Inline dumps → /prompts page → campaign card Copy Prompt buttons
- **Agent linking:** Manual JSON edits → prompt-hook.js auto-detection
- **Status visibility:** "ACTIVE/PENDING" → statusLine with human-readable descriptions
- **Debrief quality:** Plain text → color-coded, agent-attributed, filterable by sprint/agent
- **Finding capture:** Post-hoc → real-time during campaign review

## What 1.1 Must Improve

1. **Always Playwright test UI changes.** If at high context, dispatch a sub-agent to screenshot. Never ship blind. (Rule #7)
2. **Don't build at high context.** After ~5 hours or 1.5GB heap, the orchestrator should ONLY coordinate, not write code. Dispatch executors for everything.
3. **Keep debrief current.** As agents finish, immediately add their wins. Don't wait for the user to ask.
4. **Pause after deliverables.** User's next action > orchestrator's next edit. Always.
5. **Readability first, always.** Bold leads, aligned columns, no scroll prisons. Check f044.
6. **Detect dead agents proactively.** Don't wait for the user to notice an agent is done.
7. **Check for parallel work conflicts.** Before creating dispatch items, verify no other agent is processing the same source (f045).

## Key Infrastructure Left Behind

- Campaign auto-linking (prompt-hook.js)
- StatusLine in hook.js
- Campaign page with sprint phases, debrief, retro, agent modals
- /prompts, /capture, /president, /health, /why, /demo-guide, /starter pages
- 47 findings, 13 post-mortems
- Morning brief system
- Video transcript pipeline (Whisper + analysis)

---

*Store this at: coordinated-sprint/orchestrator-v1.0-retrospective.md*
*Reference from: orchestrator-handoff.md + campaign agent cards*
