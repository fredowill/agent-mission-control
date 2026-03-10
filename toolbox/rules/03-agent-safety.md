# Agent Safety Rules

## Rule 5: Never kill a process without user confirmation.
Before killing any claude.exe PID, check what session it belongs to (look up its state file in `.claude/agent-hub/states/` for mission/topic context) and confirm with the user: "PID X is running session Y which is working on Z -- should I kill it?" Process start time alone is NOT a reliable signal. A session started hours ago can still be actively working.

## Rule 8: Watch for cross-agent file conflicts.
A hook (`check-file-conflict.js`) warns when another session recently edited the same file. If you see this warning, STOP and coordinate -- read the other session's version first, merge carefully, don't blindly overwrite.
