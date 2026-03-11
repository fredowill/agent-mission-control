#!/bin/bash
# setup-hooks.sh — Generate machine-specific ~/.claude/settings.json (user-level)
# Run this after cloning the MC repo on a new machine.
# It detects the MC repo location and writes user-level settings.json
# with the correct absolute paths for MC hooks on this machine.
#
# Usage: bash ~/projects/agent-mission-control/scripts/setup-hooks.sh
#
# NOTE: This generates USER-LEVEL settings (~/.claude/settings.json).
# Phredomade project-level settings (~/phredomade/.claude/settings.json) are separate
# and only contain phredomade-specific hooks. MC hooks live at user level.

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MC_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Convert to Unix paths for bash hooks
UNIX_MC=$(echo "$MC_ROOT" | sed 's|\\|/|g' | sed 's|^C:|/c|i')
UNIX_HOME=$(echo "$HOME" | sed 's|\\|/|g' | sed 's|^C:|/c|i')
UNIX_CLAUDE="$UNIX_HOME/.claude"

echo "Setting up MC hooks for: $MC_ROOT"
echo "MC Unix path: $UNIX_MC"

SETTINGS_FILE="$HOME/.claude/settings.json"

# Back up existing settings
if [ -f "$SETTINGS_FILE" ]; then
  cp "$SETTINGS_FILE" "$SETTINGS_FILE.bak"
  echo "Backed up existing settings to settings.json.bak"
fi

cat > "$SETTINGS_FILE" << SETTINGS_EOF
{
  "permissions": {
    "defaultMode": "bypassPermissions"
  },
  "model": "opus[1m]",
  "hooks": {
    "SessionStart": [
      {
        "matcher": "startup|compact",
        "hooks": [
          {
            "type": "command",
            "command": "node $UNIX_CLAUDE/hooks/session-context.js",
            "timeout": 5
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": ".*",
        "hooks": [
          {
            "type": "command",
            "command": "node $UNIX_MC/hooks/hook.js"
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
            "command": "node $UNIX_MC/hooks/prompt-hook.js"
          },
          {
            "type": "command",
            "command": "bash $UNIX_CLAUDE/hooks/skill-activation-hook.sh"
          }
        ]
      }
    ],
    "PreCompact": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "node $UNIX_MC/scripts/precompact-handoff.js"
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
            "command": "bash $UNIX_CLAUDE/scripts/update-profile.sh"
          },
          {
            "type": "command",
            "command": "node $UNIX_MC/hooks/hook.js"
          }
        ]
      }
    ]
  },
  "statusLine": {
    "type": "command",
    "command": "node $UNIX_MC/scripts/statusline-hardstop.js"
  },
  "effortLevel": "high",
  "autoUpdatesChannel": "latest",
  "skipDangerousModePermissionPrompt": true
}
SETTINGS_EOF

echo ""
echo "User-level settings written to $SETTINGS_FILE"
echo ""
echo "Hooks configured (user-level, all projects):"
echo "  SessionStart:     session-context.js"
echo "  PostToolUse .*:   hook.js (MC)"
echo "  UserPromptSubmit: prompt-hook.js (MC) + skill-activation-hook.sh"
echo "  PreCompact:       precompact-handoff.js (MC)"
echo "  Stop:             update-profile.sh + hook.js (MC)"
echo "  StatusLine:       statusline-hardstop.js (MC)"
echo ""
echo "NOTE: Phredomade project-level settings are separate."
echo "      Copy toolbox/config/settings.json to ~/phredomade/.claude/settings.json"
echo "      (or project-settings-home.json on home machine)."
