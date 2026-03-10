## Mission: Replace the Cerebras-powered deep summary generation with a Claude Code hook-based approach that captures the full session arc, not just the first few prompts.

The current `generateDeepSummary()` in `server.js` sends all session prompts to Cerebras (a fast but small-context LLM). For large sessions (390 prompts = 234K chars), Cerebras truncates and only summarizes the opening. Result: deep-summaries.json captures "initialized orchestrator" but misses the 11 agents dispatched, 3 skills built, and all user decisions from later in the session. This is a critical gap — orchestrators rely on these summaries to understand previous sessions.

**Deliverable:** A new deep summary generation approach that uses Claude Code (via a hook or direct invocation) instead of Cerebras, producing summaries that capture the FULL session arc including decisions, dispatches, and priorities from the later half of long sessions.

## Agent Lifecycle (follow in order)

### Stage 1: DEFINE
- **Read these files first:**
  1. `projects/agent-mission-control/server.js` — search for `generateDeepSummary` (line ~518). Understand the current flow: read prompts → filter trivial → truncate to 600 chars each → send to Cerebras → parse JSON → cache in deep-summaries.json
  2. `projects/agent-mission-control/deep-summaries.json` — see the current output format (overview, sections with promptRefs, keyDecisions, outcome)
  3. `~/.claude/hooks/` — understand what hooks already exist and how they work
  4. The JSONL session files in `~/.claude/projects/C--Users-emeskel-Claude/` — these are the raw session transcripts. Understand the format (one JSON object per line, `type: "user"` for user messages)
- **Success looks like:**
  1. Deep summaries capture decisions and events from ALL phases of a session, not just the opening
  2. A 390-prompt orchestrator session produces a summary with sections covering early, middle, AND late session events
  3. The output format stays compatible with the existing JSON structure (overview, sections, keyDecisions, outcome)
  4. The approach works for sessions of any length (10 prompts or 500)
- **Constraints:**
  - Modify `server.js` for the generateDeepSummary function
  - You may create new hook files in `~/.claude/hooks/` if needed
  - Keep the existing deep-summaries.json format — don't break the dashboard session detail page
  - The Cerebras `callLLM` function should remain intact (other features still use it) — just stop calling it for deep summaries
  - Must work on Windows (Git Bash / MINGW64)

### Stage 2: DISCOVER (HARD GATE — do not skip)
Run: `ls .claude/skills/`
**You MUST load at least one skill before proceeding to Stage 3.**
Mandated skills for this task: `coding-standards`, `verification-before-completion`

### Stage 3: EXECUTE

**Approach: Chunked summarization using Claude Code**

The key insight: you can't send 390 prompts to any single LLM call. Instead:

1. **Chunk the prompts** — divide into groups of ~30-50 prompts (fits in any context window)
2. **Summarize each chunk** — extract key decisions, events, and topics from each chunk
3. **Merge the chunk summaries** — produce a final summary that covers the full arc

Implementation options (choose the best one):

**Option A: Hook-based (Stop hook)**
- Create a Stop hook that fires when a session ends
- The hook invokes Claude Code with a summarization prompt
- Claude reads the session's prompts and writes the summary
- Pro: automatic, no server dependency
- Con: runs at session end, may miss sessions that crash

**Option B: Server-side chunked (modify generateDeepSummary)**
- Keep the on-demand pattern but chunk the prompts
- For each chunk of ~40 prompts, call the LLM (could still use Cerebras for individual chunks, or use Claude via the Anthropic API if available)
- Merge chunk summaries into the final output
- Pro: works with existing cache/invalidation
- Con: still uses external API

**Option C: Claude Code CLI invocation from server**
- Server spawns `claude` CLI with a summarization prompt and the session prompts piped in
- Claude produces the summary JSON
- Pro: uses the best available model, no external API
- Con: spawning CLI from server is unusual

**Recommendation:** Option A (hook-based) is cleanest. A Stop hook that generates the deep summary when a session ends. Falls back to the existing Cerebras approach if the hook doesn't fire.

3. **Whatever approach you choose, verify it handles:**
   - Short sessions (10 prompts) — summarize directly, no chunking needed
   - Medium sessions (50-100 prompts) — single chunk or 2-3 chunks
   - Long sessions (300+ prompts) — chunk into groups, merge summaries
   - Sessions with skill/tool loading messages (filter these out like the current TRIVIAL filter)

4. **Update the invalidation logic** — the current hash check (`getPromptsHash`) should still work to avoid re-summarizing unchanged sessions

### Stage 4: REASON
- Is a Stop hook reliable enough? What if the user kills the terminal instead of exiting cleanly? Consider: the on-demand server approach is a reliable fallback.
- Should chunk summaries be cached too? Could be useful for very long sessions where re-generating is expensive.
- The current format has `promptRefs` that reference prompt indices — this needs to work across chunks. Consider using absolute prompt indices, not chunk-relative ones.

### Stage 5: VERIFY
- Test with a SHORT session: find a session with <20 prompts in `~/.claude/projects/C--Users-emeskel-Claude/`, generate its summary, verify it captures the key events
- Test with a LONG session: use session `6aa7eb5e` (v2.1 orchestrator, 390 prompts). Generate its summary. Verify the output mentions: creating-agents pipeline, skill-mandate, orchestrator-handoff, 11 dispatched agents, CARES vision — all of which happened in the SECOND HALF of the session
- Compare the new summary against the old one in deep-summaries.json for the same session — the new one should be dramatically more comprehensive
- Verify the dashboard session detail page still renders correctly with the new summary format

### Stage 6: DEBRIEF (MANDATORY — your grade depends on this)
```bash
curl -X POST http://localhost:3033/api/campaigns/agent-debrief \
  -H "Content-Type: application/json" \
  -d '{
    "campaignId": "campaign-002",
    "slot": "deep-summary-fix",
    "delivered": ["Item 1: new deep summary generation approach", "Item 2: full session arc captured for long sessions", "Item 3: backward-compatible output format"],
    "missed": ["Item 1: anything not completed"],
    "lessons": ["Lesson 1: insight about session summarization"]
  }'
```

## Constraints
- Keep existing deep-summaries.json format (overview, sections, keyDecisions, outcome)
- Keep `callLLM` function intact — other features use it
- Must work on Windows (Git Bash)
- MC server is at localhost:3033 — don't restart it unless you change server.js
- If you change server.js, the server DOES need a restart (unlike HTML pages which hot-reload)
