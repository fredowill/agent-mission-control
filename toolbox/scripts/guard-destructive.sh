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
# Exception: MC server restart (port 3033) is always safe — server.js changes require it.
# The server serves HTML from disk on each request, so only server.js changes need a restart.
# Agents, sessions, and state files are unaffected by a server restart.
if echo "$COMMAND" | grep -qE '(taskkill|kill\s+-9|pkill\s+-9|Stop-Process)'; then
  # Allow killing the MC server process (identified by port 3033 context in the command)
  if echo "$COMMAND" | grep -qE '(3033|server\.js|mc.server)'; then
    BLOCKED=false
  else
    BLOCKED=true
    REASON="Process termination (requires user confirmation per CLAUDE.md Rule 5)"
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
