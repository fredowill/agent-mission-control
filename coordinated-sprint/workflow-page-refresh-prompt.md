<!-- PIPELINE: create-agent-prompt | mandated: frontend-design,impeccable-polish | task-type: ui -->

## Mission: Update the Workflow page to reflect all systems built in v2.3-v2.5 (hardstop, rules directory, new hooks, security tools)

The Workflow page (`pages/workflow-page.html`) hasn't been updated since early campaign-002. It's missing: the triple-layer hardstop system, .claude/rules/ directory (7 files), checkpoint counter hook, stop-gate hook, precompact-handoff hook, statusline-hardstop hook, Lasso (removed -- should show as removed), Dippy (active), interactive dispatch system, and the handoff auto-skeleton. The user said it hasn't been "touched in eons." This is a trust issue -- if the pages don't reflect reality, the user loses confidence in MC.

## Agent Lifecycle (follow in order)

### Stage 1: DEFINE
- **Read:** `.claude/agent-hub/pages/workflow-page.html` (current state)
- **Read:** `.claude/agent-hub/server.js` (workflow API endpoint, understand what data it serves)
- **Read:** `.claude/settings.json` (project hooks) AND `~/.claude/settings.json` (user hooks) -- these are the SOURCE OF TRUTH for what hooks exist
- **Read:** `.claude/rules/` directory -- `ls .claude/rules/` to see all 7 rule files
- **Read:** `.claude/agent-hub/scripts/statusline-hardstop.js`, `.claude/agent-hub/scripts/precompact-handoff.js`, `.claude/agent-hub/hooks/checkpoint-counter.js`, `.claude/agent-hub/scripts/stop-gate.js` -- understand the hardstop system
- **Read:** `.claude/agent-hub/coordinated-sprint/orchestrator-v2.5-handoff.md` for what v2.5 built
- **Success looks like:** Workflow page accurately shows ALL current hooks (categorized), the .claude/rules/ directory, the hardstop system, and removed tools (Lasso). Apple Design quality. Scannable, not a text wall.
- **Constraints:** Do NOT modify server.js unless the workflow API endpoint needs new data. Do NOT change any hook behavior. This is a UI-only refresh.

### Stage 2: DISCOVER (HARD GATE -- do not skip)
Run: `ls .claude/skills/`
**You MUST load at least one skill before proceeding to Stage 3.**
Mandated skills for this task: `frontend-design`, `impeccable-polish`
If you skip this stage, your grade caps at C regardless of deliverables.

### Stage 3: EXECUTE
1. Read both settings.json files and build a complete hook inventory with categories:
   - **MC Telemetry:** hook.js (PostToolUse + Stop), prompt-hook.js (UserPromptSubmit)
   - **Safety Guards:** guard-destructive.sh (PreToolUse Bash), guard-claude-md.sh (PreToolUse Edit/Write), check-file-conflict.js (PostToolUse Edit/Write), validate-html-js.js (PostToolUse Edit/Write)
   - **Code Quality:** check-code-change.sh (PostToolUse Edit/Write), check-server.sh (PostToolUse Bash), verify-deploy.sh (PostToolUse Bash)
   - **Context Management:** statusline-hardstop.js (StatusLine), precompact-handoff.js (PreCompact), session-start-compact.js (SessionStart compact)
   - **Agent Workflow:** skill-activation-hook.sh (UserPromptSubmit), checkpoint-counter.js (PostToolUse -- interactive agents), stop-gate.js (Stop -- interactive agents)
   - **Security:** Dippy (PreToolUse Bash -- user settings), Lasso prompt-injection-defender (REMOVED -- was PostToolUse Read|WebFetch|Bash|Grep)
   - **Notifications:** play-chime.ps1 (Stop)
   - **Verification:** "VERIFY BEFORE DONE" echo (Stop)
2. Add a section for .claude/rules/ directory showing all 7 rule files with their purpose
3. Add a section for the Hardstop System: triple-layer (StatusLine monitors %, prompt-hook injects warnings at 60/75/85%, PreCompact creates emergency handoff)
4. Add a section for the Interactive Dispatch System: AUQ MCP server, mode flag, checkpoint counter, stop gate
5. Show removed/deprecated tools clearly (Lasso: removed -- false positive rate too high, no path config)
6. Maintain the existing Apple Design aesthetic (Plus Jakarta Sans, DM Sans, light mode, CSS vars)
7. Use the existing page structure/patterns -- update content, don't rebuild from scratch

### Stage 4: REASON
- Is every hook in settings.json accounted for on the page?
- Are categories logical and scannable?
- Does the hardstop system explanation make sense to someone seeing it for the first time?
- Is the removed tools section clear (not confusing -- removed means removed)?

### Stage 5: VERIFY
- Take a Playwright screenshot of the full page at 1440px width
- Critically evaluate: is it scannable? Apple Design quality?
- Verify hook counts match: count hooks in both settings.json files, compare to page
- Curl `http://localhost:3033/workflow` to confirm page loads
- Restart server if you modified server.js: `node .claude/agent-hub/server.js`

### Stage 6: DEBRIEF (before you exit)
curl -X POST http://localhost:3033/api/campaigns/agent-debrief -H "Content-Type: application/json" -d '{"campaignId":"campaign-002","slot":"workflow-page-refresh","delivered":["item 1","item 2"],"missed":["item 1"],"lessons":["what you learned"]}'

## Constraints
- Apple Design aesthetic -- Plus Jakarta Sans, DM Sans, DM Mono, light mode, CSS vars from existing pages
- Do NOT change hook behavior -- UI only
- Do NOT remove any existing sections that are still accurate -- update them
- Every hook must have: name, event type, matcher, purpose, file path
- The page must be readable by someone who has never seen MC before
