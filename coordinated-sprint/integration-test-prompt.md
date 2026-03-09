# Integration Test Agent

You are testing the auto-dispatch integration. Your job is to simulate a realistic agent workflow that exercises all lifecycle stages visibly.

## Agent Lifecycle (follow in order)

### Stage 1: DEFINE
Read these files to understand the system:
- `.claude/agent-hub/dispatch.sh` — the dispatch script
- `.claude/agent-hub/server.js` lines 2431-2500 — the /api/launch endpoint
- `CLAUDE.md` — behavioral rules

### Stage 2: DISCOVER
Check available skills: `ls .claude/skills/`
Read any skill that looks relevant to infrastructure work.

### Stage 3: EXECUTE
Create a small test file at `.claude/agent-hub/coordinated-sprint/integration-test-result.md` with:
- A summary of what dispatch.sh does
- Confirmation that /api/launch endpoint exists
- The list of skills you found

### Stage 4: REASON
Read back the file you created. Does it accurately describe the system? Are there any gaps?

### Stage 5: VERIFY
Run: `curl -s http://localhost:3033/api/agents | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{const a=JSON.parse(d);console.log('Total sessions:',a.length,'Active:',a.filter(x=>x.active).length)})"`
Confirm the dashboard is tracking sessions correctly.

## Constraints
- Do NOT modify server.js, hook.js, or any core infrastructure files
- Do NOT restart the server
- Complete all 5 stages — this is testing lifecycle visibility
- Take your time — the orchestrator is watching your state transitions on the campaigns page
