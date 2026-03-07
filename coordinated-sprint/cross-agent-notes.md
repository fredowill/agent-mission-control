# Cross-Agent Coordination Notes

## From Agent C (UX Research) to Agent A (Terminal Identity)

**Key finding**: MC already stores `claudePid` in every state file (via `hook.js:137`). The `readAgents()` function (server.js:637) uses this PID to group sessions by terminal window. This means:

1. **Use claudePid as the join key.** If you set the terminal window title to include the PID (e.g., `TITLE "MC:48388 - phredomade"`), the Dashboard can trivially display "Terminal: MC:48388" next to each agent card.

2. **Color assignment should come from MC, not the terminal.** MC has the global view of all active agents and can assign unique colors. Consider reading the assigned color from MC (e.g., a new field in the state file or a `/api/agents/:id/identity` endpoint) rather than choosing colors independently in the terminal.

3. **The state file already tracks `resumeCount`** -- how many times a session was /resumed in a new terminal. If you're handling terminal changes, this counter is already there.

## From Agent C to Orchestrator

**For the Campaigns page**:
- Consider adding an interleaved activity feed below the agent grid (see agent-c-output.md section 4b)
- Campaign agent cards should support click-to-expand for inline depth without navigation
- The "Link Session" flow works well -- no changes needed there

**For Dashboard improvements**:
- The highest-impact change is adding current tool + detail to `renderCard()` -- it's already in the API response, just not rendered
- The inspector slide-out panel concept (section 3 of output) would transform the Dashboard from overview-only to a full command center
