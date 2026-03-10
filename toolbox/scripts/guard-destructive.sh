#!/bin/bash
# .claude/scripts/guard-destructive.sh — Safety guard for auto-dispatched agents
# PreToolUse hook for Bash commands. Blocks destructive operations.
# Reads JSON from stdin (Claude Code hook protocol), exits 0 to allow, 2 to block.

# Read hook input from stdin
INPUT=$(cat)

# Extract the command from the tool_input.command field
COMMAND=$(echo "$INPUT" | node -e "
  let d='';
  process.stdin.on('data',c=>d+=c);
  process.stdin.on('end',()=>{
    try {
      const j=JSON.parse(d);
      const cmd = j.tool_input?.command || '';
      process.stdout.write(cmd);
    } catch { process.exit(0); }
  });
")

# If we couldn't extract a command, allow it (don't block on parse errors)
if [ -z "$COMMAND" ]; then
  exit 0
fi

# ── BLOCKED PATTERNS ──
# These are never OK for an autonomous agent to run without human review.

BLOCKED=false
REASON=""

# Destructive file operations — block rm -r (recursive), not rm -f (force-only)
if echo "$COMMAND" | grep -qE 'rm\s+(-[rR]|-[a-zA-Z]*[rR]|.*--no-preserve-root)'; then
  BLOCKED=true
  REASON="Recursive file deletion (rm -r)"
fi

# Force push (can destroy remote history)
if echo "$COMMAND" | grep -qE 'git\s+push\s+.*(-f|--force)'; then
  BLOCKED=true
  REASON="Force push (can destroy remote history)"
fi

# Hard reset (destroys uncommitted work)
if echo "$COMMAND" | grep -qE 'git\s+reset\s+--hard'; then
  BLOCKED=true
  REASON="git reset --hard (destroys uncommitted changes)"
fi

# Drop database tables
if echo "$COMMAND" | grep -qiE '(DROP\s+TABLE|DROP\s+DATABASE|TRUNCATE\s+TABLE)'; then
  BLOCKED=true
  REASON="Database destructive operation"
fi

# Kill processes (should always be user-confirmed per CLAUDE.md Rule 5)
# Exception: MC server restart is always safe — the orchestrator frequently needs to restart
# the server after server.js changes. Blocking this forces the user to do it manually, which
# is annoying and wastes time. The server is stateless (reads from disk on each request).
# PM026: v2.2 was blocked from restarting the server, user had to do it manually and said
# "this is P0 to fix because I shouldn't have to."
if echo "$COMMAND" | grep -qE '(taskkill|kill\s+-9|pkill\s+-9|Stop-Process)'; then
  # Allow: MC server process (any PID-based kill when orchestrator context is clear)
  # The orchestrator always identifies the PID via netstat/port check first.
  # Block: only mass kills (killall, pkill without -9, taskkill /IM)
  if echo "$COMMAND" | grep -qE '(killall|taskkill.*/IM|pkill\s+[^-])'; then
    BLOCKED=true
    REASON="Mass process termination (requires user confirmation per CLAUDE.md Rule 5)"
  else
    BLOCKED=false
  fi
fi

# Format/wipe disk operations
if echo "$COMMAND" | grep -qE '(mkfs|format\s|diskpart|dd\s+if=)'; then
  BLOCKED=true
  REASON="Disk format/wipe operation"
fi

# npm publish (irreversible)
if echo "$COMMAND" | grep -qE 'npm\s+publish'; then
  BLOCKED=true
  REASON="npm publish (irreversible public release)"
fi

# Modifying git hooks or CI/CD (supply chain risk)
if echo "$COMMAND" | grep -qE '(\.git/hooks/|\.github/workflows/).*>'; then
  BLOCKED=true
  REASON="Modifying git hooks or CI/CD pipelines"
fi

if [ "$BLOCKED" = true ]; then
  # Output JSON to block the action
  echo "{\"decision\":\"block\",\"reason\":\"SAFETY GUARD: $REASON\"}"
  exit 0
fi

# Allow everything else
exit 0
