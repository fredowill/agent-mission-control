## Mission: Profile and fix the 10-second Dashboard page load

The MC Dashboard at `http://localhost:3033` takes ~10 seconds to load. This is likely caused by synchronous file reads, expensive API calls, or blocking operations in server.js. Profile the bottleneck and fix it.

## Context
- **Server:** `.claude/agent-hub/server.js` — zero-dependency Node.js, port 3033
- **Dashboard page:** `.claude/agent-hub/dashboard-page.html` — served by readPage() which reads from disk
- **API endpoints:** `/api/agents` reads state files from `.claude/agent-hub/states/`, `/api/campaigns` reads campaigns.json
- **Known suspect:** The Cerebras API call or sync file reads in the states directory (could be 50+ state files)

## Agent Lifecycle (follow in order)

### Stage 1: DEFINE
Read `server.js` — focus on:
- The Dashboard route handler
- `/api/agents` endpoint (likely reads all state files synchronously)
- Any external API calls (Cerebras, etc.)
- The `readPage()` function

Success = Dashboard loads in under 2 seconds.

### Stage 2: DISCOVER (HARD GATE — do not skip)
Run: `ls .claude/skills/`
**You MUST load at least one skill before proceeding to Stage 3.**
Mandated skills for this task: `impeccable-optimize`, `systematic-debugging`
If you skip this stage or proceed without loading skills, your grade caps at C regardless of deliverables.

### Stage 3: EXECUTE
1. Add timing instrumentation to key server endpoints (console.time/timeEnd)
2. Identify the slowest operation
3. Fix it — likely candidates:
   - Async file reads instead of sync
   - Cache state files with TTL
   - Lazy-load expensive data
   - Skip external API calls on page load
4. Measure after fix — must be under 2 seconds

### Stage 4: REASON
- Is the fix sustainable or will it regress as more state files accumulate?
- Did you introduce any caching bugs (stale data)?
- Does the Dashboard still show accurate live data?

### Stage 5: VERIFY
- Measure load time with `curl -w "%{time_total}" http://localhost:3033`
- Take a Playwright screenshot to confirm the page renders correctly
- Compare before/after load times

### Stage 6: DEBRIEF (before you exit)
Before exiting, call the debrief API:
```bash
curl -s -X POST http://localhost:3033/api/campaigns/agent-debrief -H "Content-Type: application/json" -d '{"campaignId":"campaign-001","slot":"dashboard-perf","delivered":["item 1","item 2"],"missed":["item 1"],"lessons":["lesson 1"]}'
```
Keep items concise: **bold keyword** — short description. Max 8 words each.

## Constraints
- Only modify `server.js`. Do NOT touch HTML pages or campaigns.json structure.
- Do NOT break existing API contracts — all endpoints must return the same data shape.
- Do NOT remove features to improve performance — optimize, don't cut.
