# Set Session Name

Set the display name for this terminal session. This name appears in the terminal tab title and Mission Control dashboard.

**Name:** $ARGUMENTS

## Steps

1. Get your session ID:
   ```bash
   echo $CLAUDE_SESSION_ID
   ```

2. If no name was provided (empty $ARGUMENTS), generate one from the session's work so far. Check the prompts file at `prompts/{sessionId}.ndjson` or recent activity and create a short, descriptive name (max 50 chars).

3. Set the terminal title (use node for reliable Windows Terminal support):
   ```bash
   node -e "process.title='NAME_HERE'"
   ```

4. Read the state file at `states/{sessionId}.json`, update the `displayName` field with the chosen name, and write it back. Preserve all other fields.

5. Confirm: "Session named: **NAME_HERE**"
