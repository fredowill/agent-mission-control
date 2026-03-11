# Session End Retrospective

You are ending this session. Generate a structured mission debrief.

Think "army general getting the mission report" — what happened, what was decided, what's left.

## Steps

1. Get your session ID:
   ```bash
   echo $CLAUDE_SESSION_ID
   ```

2. Reflect on this entire conversation and produce a retrospective covering:
   - **Accomplishments**: What was completed or delivered
   - **Decisions**: Key decisions made and why
   - **Unfinished**: What remains, with enough context for the next session to pick up
   - **Insights**: Patterns noticed, things learned, process improvements
   - **Issues**: Blockers hit, workarounds used

3. Create the retrospectives directory and write the file:
   ```bash
   mkdir -p retrospectives
   ```

   Write to `retrospectives/{sessionId}.json`:
   ```json
   {
     "sessionId": "...",
     "timestamp": "ISO-8601",
     "displayName": "from state file or generated",
     "summary": "1-2 sentence executive summary",
     "accomplishments": ["concise bullet points"],
     "decisions": [{"decision": "...", "rationale": "..."}],
     "unfinished": [{"task": "...", "context": "enough for next session"}],
     "insights": ["..."],
     "issues": ["..."]
   }
   ```

4. Update the state file at `states/{sessionId}.json`:
   - Read existing state
   - Add `lastRetrospective` (ISO timestamp) and `summary` (1-2 sentences)
   - Write it back

5. Set terminal title to indicate completion:
   ```bash
   node -e "process.title='Session Complete'"
   ```

6. Print the retrospective summary inline so the user sees it without opening files.

Keep it concise. No filler. Every line should carry information.

$ARGUMENTS
