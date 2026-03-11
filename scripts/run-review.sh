#!/bin/bash
# run-review.sh — Mini review agent that debriefs a completed agent
# Called by dispatch.sh after auto-grade.js
# Usage: run-review.sh <session-id> <agent-slot> <prompt-file>

SESSION_ID="$1"
AGENT_SLOT="$2"
PROMPT_FILE="$3"

if [ -z "$SESSION_ID" ] || [ -z "$AGENT_SLOT" ]; then
  echo "Usage: run-review.sh <session-id> <agent-slot> <prompt-file>"
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
cd "$PROJECT_ROOT"
unset CLAUDECODE

# Signal "reviewing" status on the agent card
curl -s -X POST http://localhost:3033/api/campaigns/agent-debrief \
  -H "Content-Type: application/json" \
  -d "{\"campaignId\":\"campaign-001\",\"slot\":\"$AGENT_SLOT\",\"reviewStatus\":\"reviewing\"}" > /dev/null 2>&1

# Build the review prompt with injected values
REVIEW_MSG="You are a Review Agent. Read the completed agent's work and write a structured debrief.

SESSION: $SESSION_ID
AGENT SLOT: $AGENT_SLOT
PRD FILE: $PROMPT_FILE

Steps:
1. Read the state file in the MC repo states/ directory for this session — look at statusLine entries to understand what the agent did
2. Read the PRD file: cat $PROMPT_FILE — understand what was required
3. Check what files were ACTUALLY modified by running: git status --short && git diff --name-only HEAD
   a) If modified files exist, those are deliverables — the agent changed real code
   d) Do NOT report 'nothing delivered' if files were modified. File changes are the strongest evidence of work done.
4. Check the TRANSCRIPT for skill usage and verification:
   a) Find the transcript: look for a .jsonl file matching the session ID in .claude/projects/*/
   b) Search for Skill tool calls: grep -o '\"skill\":\"[^\"]*\"' on the transcript file — these are skills the agent loaded
   c) Search for screenshot evidence: grep -c 'screenshot\|playwright\|\.png' on the transcript — count verification attempts
   d) Search for debrief API calls: grep -c 'agent-debrief' on the transcript
   e) IMPORTANT: Skills loaded via the Skill tool do NOT appear in the activity log. Only the transcript has this data.
5. Check for screenshot FILES the agent created: ls screenshots/ | grep the agent slot name (with hyphens removed)
6. Cross-reference: compare files modified (step 3) + skills loaded (step 4) + screenshots (step 5) against PRD requirements (step 2).
7. Generate delivered (what was done — grounded in file changes + transcript evidence), missed (what wasn't), lessons (what we learned)
8. Call the debrief API with this exact curl:

curl -s -X POST http://localhost:3033/api/campaigns/agent-debrief -H 'Content-Type: application/json' -d '{\"campaignId\":\"campaign-001\",\"slot\":\"$AGENT_SLOT\",\"delivered\":[...],\"missed\":[...],\"lessons\":[...]}'

Rules:
- Each item max 8 words, format: 'Keyword: brief description'
- Only list items clearly evidenced in the logs, transcript, or filesystem
- Do NOT modify any files besides calling the API
- Do NOT report 'no Playwright screenshots' without checking the screenshots/ directory
- Do NOT report 'no skills loaded' without checking the transcript for Skill tool calls
- Exit immediately after the API call"

# Run as a tiny headless session — should take ~30 seconds
echo "  🔍 Review agent analyzing..."
claude -p "$REVIEW_MSG" \
  --dangerously-skip-permissions \
  --max-turns 5 \
  2>&1 | while read line; do echo "  📋 $line"; done

# Signal "complete" status
curl -s -X POST http://localhost:3033/api/campaigns/agent-debrief \
  -H "Content-Type: application/json" \
  -d "{\"campaignId\":\"campaign-001\",\"slot\":\"$AGENT_SLOT\",\"reviewStatus\":\"complete\"}" > /dev/null 2>&1

echo "  ✅ Review complete"
