#!/bin/bash
# setup-hooks.sh — Generate machine-specific .claude/settings.json from template
# Run this after pulling the agent-hub repo on a new machine.
# It detects the project root and agent-hub location, then writes settings.json
# with the correct absolute paths for this machine.
#
# Usage: bash .claude/agent-hub/setup-hooks.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
CLAUDE_DIR="$PROJECT_ROOT/.claude"
AGENT_HUB="$SCRIPT_DIR"

# Convert to Unix paths for bash hooks
UNIX_PROJECT=$(echo "$PROJECT_ROOT" | sed 's|\\|/|g' | sed 's|^C:|/c|i')
UNIX_CLAUDE="$UNIX_PROJECT/.claude"
UNIX_HUB="$UNIX_CLAUDE/agent-hub"

echo "Setting up hooks for: $PROJECT_ROOT"
echo "Agent hub: $AGENT_HUB"

SETTINGS_FILE="$CLAUDE_DIR/settings.json"

# Back up existing settings
if [ -f "$SETTINGS_FILE" ]; then
  cp "$SETTINGS_FILE" "$SETTINGS_FILE.bak"
  echo "Backed up existing settings to settings.json.bak"
fi

cat > "$SETTINGS_FILE" << SETTINGS_EOF
{
  "enabledPlugins": {
    "frontend-design@claude-plugins-official": true,
    "security-guidance@claude-plugins-official": true,
    "code-review@claude-plugins-official": true,
    "pr-review-toolkit@claude-plugins-official": true
  },
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "bash $UNIX_CLAUDE/scripts/guard-destructive.sh"
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "bash $UNIX_CLAUDE/scripts/check-code-change.sh"
          },
          {
            "type": "command",
            "command": "node $UNIX_CLAUDE/scripts/check-file-conflict.js"
          },
          {
            "type": "command",
            "command": "node $UNIX_CLAUDE/scripts/validate-html-js.js"
          }
        ]
      },
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "bash $UNIX_CLAUDE/scripts/check-server.sh"
          },
          {
            "type": "command",
            "command": "bash $UNIX_CLAUDE/scripts/verify-deploy.sh"
          }
        ]
      },
      {
        "matcher": ".*",
        "hooks": [
          {
            "type": "command",
            "command": "node $UNIX_HUB/hook.js"
          }
        ]
      }
    ],
    "UserPromptSubmit": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "node $UNIX_HUB/prompt-hook.js"
          },
          {
            "type": "command",
            "command": "bash $UNIX_CLAUDE/hooks/skill-activation-hook.sh"
          }
        ]
      }
    ],
    "SessionStart": [
      {
        "matcher": "compact",
        "hooks": [
          {
            "type": "command",
            "command": "node $UNIX_CLAUDE/scripts/session-start-compact.js"
          }
        ]
      }
    ],
    "Stop": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "node $UNIX_HUB/hook.js"
          },
          {
            "type": "command",
            "command": "echo '' && echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━' && echo '  VERIFY BEFORE DONE — Did you actually confirm this works?' && echo '  - Run tests or Playwright spot-check' && echo '  - Screenshot + visually evaluate if UI change' && echo '  - If you skipped verification, say so honestly' && echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'"
          }
        ]
      }
    ]
  }
}
SETTINGS_EOF

echo "✅ Settings written to $SETTINGS_FILE"
echo ""
echo "Hooks configured:"
echo "  PreToolUse:       guard-destructive.sh"
echo "  PostToolUse:      check-code-change, check-file-conflict, validate-html-js, hook.js"
echo "  UserPromptSubmit: prompt-hook.js, skill-activation-hook.sh"
echo "  SessionStart:     session-start-compact.js"
echo "  Stop:             hook.js, verify-before-done"
echo ""
echo "Next: Copy scripts from toolbox if not already present:"
echo "  cp -r $AGENT_HUB/toolbox/scripts/* $CLAUDE_DIR/scripts/"
echo "  cp -r $AGENT_HUB/toolbox/hooks/* $CLAUDE_DIR/hooks/"
