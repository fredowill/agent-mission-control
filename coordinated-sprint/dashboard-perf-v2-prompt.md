## Mission: Fix the 7-second /api/cost endpoint that blocks the Dashboard

The MC Dashboard at `http://localhost:3033` takes ~10 seconds to load. The bottleneck is **not** the page HTML or /api/agents (both respond in <2ms). It is `/api/cost`, which reads and parses 164 transcript files (657MB total) every 5 minutes. This CPU-blocking JSON parsing stalls the single-threaded Node.js event loop, making ALL concurrent requests hang until cost computation finishes.

## Profiling Data (already measured — do NOT re-profile from scratch)

| Endpoint | Response Time | Size | Notes |
|----------|--------------|------|-------|
| `GET /` (Dashboard HTML) | **1ms** | 42KB | Fast, no issue |
| `GET /api/agents` | **1ms** | 51KB | Cached (2s TTL), fast |
| `GET /api/northstar` | **1ms** | 672B | Fast |
| `GET /api/workstreams` | **1ms** | 731B | Fast |
| `GET /api/campaigns` | **1ms** | 47KB | Fast |
| `GET /api/cost` | **7,015ms** | 37KB | **THE BOTTLENECK** |

- **State files:** 90 files in `.claude/agent-hub/states/`
- **Transcript files:** 164 `.jsonl` files in `~/.claude/projects/C--Users-ephra-phredomade/`, totaling **657MB**
- **Cost cache TTL:** 5 minutes (`COST_CACHE_TTL = 300_000`)
- **Batch size:** 10 files per async batch in `computeCostData()`

## Root Cause

`computeCostData()` (server.js ~line 1839) reads ALL 164 transcript files, parses every line looking for `"type":"assistant"` entries with usage data, deduplicates, and aggregates. Even with async batches of 10, the JSON parsing is CPU-intensive and blocks the event loop for ~7 seconds. During this time, ALL other HTTP requests (including the 4 parallel fetches in the Dashboard's `refresh()`) are stalled.

The cost cache warms on startup (line 3855: `computeCostData(false).catch(() => {})`), so the FIRST load after server start is fast. But after 5 minutes the cache expires and the next `/api/cost` request triggers a full 657MB re-parse.

## The Fix: Per-Session Cost Cache

Instead of re-parsing all 164 files every 5 minutes, cache each session's cost result and only recompute sessions whose transcript file has changed.

### Implementation Steps:

1. **Add a per-session cost cache file** — `cost-session-cache.json` in the agent-hub directory
   - Structure: `{ "session-id": { mtime: <epoch-ms>, calls: N, tokens: {...}, models: {...}, daily: {...}, session: {...} } }`

2. **Modify `computeCostData()`** to:
   - Load the per-session cache from disk
   - For each transcript file, check its `mtime` (via `fs.statSync` or `fs.promises.stat`)
   - If `mtime` matches the cached value, use the cached result (skip file read entirely)
   - If `mtime` is newer or not cached, read and parse that file only, update cache
   - Write the updated per-session cache back to disk

3. **Expected result:** After the initial full computation, subsequent calls process only new/changed transcript files. With 164 files, checking 164 mtimes takes <10ms. Parsing 1-2 changed files takes <100ms. Total: **<200ms** vs current 7,000ms.

4. **Keep the existing 5-minute global cache** — it still prevents redundant recomputation from concurrent requests. The per-session cache is the persistence layer that survives cache expiry.

## Agent Lifecycle (follow in order)

### Stage 1: DEFINE
Read these files to understand the cost computation:
- `server.js` lines 1823-1960 — `computeCostData()` and `processTranscriptAsync()`
- `server.js` line 3853-3856 — startup cache warming
- `server.js` line 676-688 — `readAgents()` cache pattern (reference for how caching is done here)
- `dashboard-page.html` line 1096 — where `/api/cost` is called

**Success criteria:** `/api/cost` responds in <500ms after initial computation. Dashboard loads in <2 seconds consistently.

### Stage 2: DISCOVER (HARD GATE — do not skip)
Run: `ls .claude/skills/`
**You MUST load at least one skill before proceeding to Stage 3.**
Mandated skills for this task: `impeccable-optimize`, `systematic-debugging`
If you skip this stage or proceed without loading skills, your grade caps at C regardless of deliverables.
To load a skill: use the Skill tool or read the SKILL.md file in the skill directory.

### Stage 3: EXECUTE
1. Add a `COST_SESSION_CACHE_F` constant pointing to `cost-session-cache.json`
2. Create a `loadSessionCostCache()` / `saveSessionCostCache()` pair
3. Modify `computeCostData()` to check mtimes and skip unchanged files
4. Ensure `processTranscriptAsync()` return value is cacheable (it already returns a clean object)
5. After the loop, save the updated per-session cache to disk
6. Measure with: `curl -w "%{time_total}" http://localhost:3033/api/cost`

**Important constraints:**
- Do NOT touch `dashboard-page.html` or any other HTML file
- Do NOT change the `/api/cost` response shape — same JSON contract
- Do NOT remove the existing `_costCache` (5-min TTL) — it's still useful for concurrent request dedup
- The per-session cache is additive, not a replacement

### Stage 4: REASON
- Does the mtime check handle deleted sessions? (File no longer exists = remove from cache)
- Does it handle growing transcripts? (Active session's file grows = mtime changes = recompute)
- Is the cache file too large? (164 entries with aggregated data should be <100KB)
- Could two server instances corrupt the cache? (Not an issue — single server)

### Stage 5: VERIFY
Run these commands and include the output in your debrief:
```bash
# Before fix (baseline) — should be ~7 seconds
curl -w "\nTime: %{time_total}s" http://localhost:3033/api/cost > /dev/null

# Restart server to clear in-memory cache
# (kill and restart: node .claude/agent-hub/server.js from phredomade root)

# After fix — first load (builds per-session cache)
curl -w "\nTime: %{time_total}s" http://localhost:3033/api/cost > /dev/null

# After fix — second load (uses per-session cache, should be <500ms)
# Wait 6 minutes for the 5-min global cache to expire, then:
curl -w "\nTime: %{time_total}s" http://localhost:3033/api/cost > /dev/null

# Verify response shape unchanged
curl -s http://localhost:3033/api/cost | node -e "const d=[];process.stdin.on('data',c=>d.push(c));process.stdin.on('end',()=>{const j=JSON.parse(d.join(''));console.log('Keys:',Object.keys(j));console.log('Sessions:',j.sessions.length);console.log('Cost:','$'+j.totalCost.toFixed(2))})"
```

### Stage 6: DEBRIEF (before you exit)
Before exiting, call the debrief API:
```bash
curl -s -X POST http://localhost:3033/api/campaigns/agent-debrief \
  -H "Content-Type: application/json" \
  -d '{"campaignId":"campaign-001","slot":"dashboard-perf-v2","delivered":["item 1","item 2"],"missed":["item 1"],"lessons":["lesson 1"]}'
```
Keep items concise: **bold keyword** — short description. Max 8 words each.

## Constraints
- Only modify `server.js`. Do NOT touch HTML pages or campaigns.json.
- Do NOT break existing API contracts — `/api/cost` must return the same JSON shape.
- Do NOT remove features to improve performance — optimize, don't cut.
- Do NOT add npm dependencies — this is a zero-dependency server.
- The server must still be launchable with `node .claude/agent-hub/server.js` from project root.
