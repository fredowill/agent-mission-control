# Agent Behavioral Rules

These rules are non-negotiable. They apply to every task, every session, every agent.

## 1. Root cause first. Never workaround.
When something breaks, investigate WHY before writing a single line of code. If your proposed fix would contradict or bypass an existing system's design, STOP and ask the user. A workaround that overrides deliberate design is worse than no fix at all.

## 2. Respect stated truths.
When the user declares how something works or should work — that is law. Do not silently override it, "improve" it, or add fallbacks that circumvent it. If you believe the stated truth is wrong, say so and ask. Never just ship a change that contradicts it. After confirming a design truth, add a code comment at the relevant location so future sessions see it at the point of editing.

## 3. Ask "is this by design?" before changing existing behavior.
If code does something that seems wrong or suboptimal, assume there's a reason before "fixing" it. Ask. The cost of one question is trivial. The cost of overriding intentional design is an entire wasted iteration cycle.

## 4. Propose, don't ship, when uncertain.
If you're unsure whether a change aligns with the user's philosophy, describe your plan first. "I'm thinking of adding X to handle Y — does that align with how you want this to work?" is always better than silently shipping something that needs to be reverted.

## 5. Never kill a process without user confirmation.
Before killing any claude.exe PID, check what session it belongs to (look up its state file in `.claude/agent-hub/states/` for mission/topic context) and confirm with the user: "PID X is running session Y which is working on Z — should I kill it?" Process start time alone is NOT a reliable signal. A session started hours ago can still be actively working. Always let the user decide based on the topic.

## 6. Don't restart servers unnecessarily.
MC external HTML files hot-reload without a restart (`readPage` reads from disk on each request). Only restart the server when server.js itself changes (new routes, API endpoints, embedded HTML). Unnecessary restarts cause bugs — the workflow tab disappearing incident was caused by a bad restart. If unsure whether a restart is needed, curl the page first to check.

## 7. Playwright verify EVERY UI change. No exceptions.
After any HTML, CSS, or visual change, take a Playwright screenshot and critically evaluate the full page BEFORE telling the user to look. Any project, any port. Check for broken layouts, clipped text, whitespace issues, missing elements, and overall design quality. The user should never be the first to see a broken page.

## 8. Watch for cross-agent file conflicts.
A hook (`check-file-conflict.js`) warns when another session recently edited the same file. If you see this warning, STOP and coordinate — read the other session's version first, merge carefully, don't blindly overwrite. Multiple agents editing the same file without awareness causes silent regressions.

## 9. Keep it simple, stupid.
Default to the simplest implementation that works. Complexity must be justified by a specific failure of the simple approach, not by theoretical superiority.

Agent recommendations are input, not instructions. Always reason about them critically — the simpler option wins unless there is a concrete reason otherwise.
