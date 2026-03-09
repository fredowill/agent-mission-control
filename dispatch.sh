#!/bin/bash
# .claude/agent-hub/dispatch.sh — Auto-dispatch agent into current terminal
# This script runs INSIDE the new terminal tab opened by wt.exe.
# Called by: /api/launch endpoint or manual wt.exe invocation
#
# Usage: dispatch.sh <agent-name> <prompt-file-path> <session-id> [mode] [close]
#   mode:  "auto" (default) = headless -p, runs to completion
#          "interactive"    = full Claude Code TUI, user can interact
#   close: "close" = auto-close tab on successful completion
#          (omit)  = keep tab open with bash prompt for resume
#
# The prompt file is loaded via --append-system-prompt-file so the full
# mission brief lives in the system prompt. The user message is a short
# "begin your mission" trigger. --dangerously-skip-permissions for full autonomy.

AGENT_NAME="$1"
PROMPT_FILE="$2"
SESSION_ID="$3"
MODE="${4:-auto}"
AUTO_CLOSE="${5:-}"
AGENT_SLOT="${6:-}"

if [ -z "$AGENT_NAME" ] || [ -z "$PROMPT_FILE" ] || [ -z "$SESSION_ID" ]; then
  echo "Usage: dispatch.sh <agent-name> <prompt-file> <session-id> [auto|interactive] [close]"
  exit 1
fi

if [ ! -f "$PROMPT_FILE" ]; then
  echo "Error: Prompt file not found: $PROMPT_FILE"
  exit 1
fi

cd /c/Users/ephra/phredomade

# Clear the CLAUDECODE env var — prevents "nested session" error.
# The MC server inherits this from the orchestrator's session.
# Each dispatched agent is an independent session, not a nested one.
unset CLAUDECODE

TRIGGER_MSG="You are the $AGENT_NAME agent. Begin your mission now. Follow the Agent Lifecycle stages in order: Define, Discover, Execute, Reason, Verify, Debrief. Start with Stage 1: DEFINE — read all context files specified in your system prompt. IMPORTANT: Stage 6 DEBRIEF is mandatory — before you exit, call the debrief API to report what you delivered and missed."

echo ""
echo "  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  🤖 AUTO-DISPATCH: $AGENT_NAME"
echo "  📄 Prompt: $(basename "$PROMPT_FILE")"
echo "  🔑 Session: ${SESSION_ID:0:8}..."
echo "  ⚙️  Mode: $MODE"
echo "  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ "$MODE" = "interactive" ]; then
  # Interactive mode: full Claude Code TUI. User can watch and interact.
  # The session starts with the trigger message, user can type follow-ups.
  claude "$TRIGGER_MSG" \
    --append-system-prompt-file "$PROMPT_FILE" \
    --session-id "$SESSION_ID" \
    --dangerously-skip-permissions
else
  # Auto mode (default): headless -p. Agent runs to completion.
  # User sees output but can't interact. --resume after for follow-ups.
  claude -p "$TRIGGER_MSG" \
    --append-system-prompt-file "$PROMPT_FILE" \
    --session-id "$SESSION_ID" \
    --dangerously-skip-permissions \
    --verbose
fi

EXIT_CODE=$?

# ── Auto-grade: analyze activity log and write grade to campaigns.json ──
echo ""
echo "  ⏳ Auto-grading..."
node .claude/agent-hub/auto-grade.js "$SESSION_ID" 2>&1 | while read line; do echo "  $line"; done

# ── Review Agent: read activity log + PRD, generate debrief ──
if [ -n "$AGENT_SLOT" ] && [ -f "$PROMPT_FILE" ]; then
  echo ""
  echo "  🔍 Review agent analyzing agent output..."
  bash .claude/agent-hub/run-review.sh "$SESSION_ID" "$AGENT_SLOT" "$PROMPT_FILE"
fi

echo ""
echo "  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ $EXIT_CODE -eq 0 ]; then
  echo "  ✅ Agent completed successfully"
  # PM007: Notification sound — LoL Enemy Missing ping (.wav, volume pre-baked at 40%).
  powershell -c "(New-Object Media.SoundPlayer 'C:\Users\ephra\phredomade\.claude\agent-hub\notify-ping.wav').PlaySync()" 2>/dev/null
else
  echo "  ⚠️  Agent exited with code $EXIT_CODE"
  # Error: double ping so user knows something went wrong
  powershell -c "(New-Object Media.SoundPlayer 'C:\Users\ephra\phredomade\.claude\agent-hub\notify-ping.wav').PlaySync(); (New-Object Media.SoundPlayer 'C:\Users\ephra\phredomade\.claude\agent-hub\notify-ping.wav').PlaySync()" 2>/dev/null
fi
echo "  🔑 Session: $SESSION_ID"
echo "  🔄 Resume:  claude --resume $SESSION_ID"
echo "  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Auto-close tab on success if requested, otherwise keep open for resume
if [ "$AUTO_CLOSE" = "close" ] && [ $EXIT_CODE -eq 0 ]; then
  sleep 3  # Brief pause so user can see the completion banner
  exit 0   # Tab closes when the shell exits
fi
exec bash
