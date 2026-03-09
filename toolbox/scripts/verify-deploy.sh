#!/usr/bin/env bash
# PostToolUse hook: after any Bash command containing "git push" or "vercel --prod",
# verify the Vercel deployment went green with the CORRECT commit.
#
# Reads the tool input from $CLAUDE_TOOL_INPUT (JSON with "command" field).
# Only runs verification if the command looks like a push/deploy.

set -euo pipefail

TOOL_INPUT="${CLAUDE_TOOL_INPUT:-}"
if [ -z "$TOOL_INPUT" ]; then
  exit 0
fi

# Check if the command was a git push or vercel deploy
IS_PUSH=$(echo "$TOOL_INPUT" | grep -iE '"command"\s*:\s*"[^"]*git push' || true)
IS_DEPLOY=$(echo "$TOOL_INPUT" | grep -iE '"command"\s*:\s*"[^"]*vercel (--prod|deploy)' || true)

if [ -z "$IS_PUSH" ] && [ -z "$IS_DEPLOY" ]; then
  exit 0
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  ⏳ DEPLOY VERIFICATION — checking Vercel deployment status..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

LOCAL_SHA=$(git -C /c/Users/ephra/phredomade rev-parse --short HEAD 2>/dev/null || echo "unknown")
LOCAL_SHA_FULL=$(git -C /c/Users/ephra/phredomade rev-parse HEAD 2>/dev/null || echo "unknown")

echo "  📦 Local commit: $LOCAL_SHA"

# If this was just "git push" (not vercel --prod), check if Vercel auto-deploys.
# Wait up to 30s for a new deployment to appear, then warn if nothing shows.
MAX_WAIT=150
INTERVAL=15
ELAPSED=0
DEPLOY_STATUS=""
DEPLOY_URL=""
DEPLOY_SHA=""

while [ $ELAPSED -lt $MAX_WAIT ]; do
  # Use vercel CLI to get latest deployment details
  # Parse the JSON output for commit SHA and status
  LATEST_JSON=$(npx --yes vercel inspect --json 2>/dev/null || true)

  # Fallback: use vercel ls and parse text output
  LATEST_LINE=$(npx --yes vercel ls 2>/dev/null | grep -E "●" | head -1 || true)

  if [ -z "$LATEST_LINE" ]; then
    sleep $INTERVAL
    ELAPSED=$((ELAPSED + INTERVAL))
    continue
  fi

  # Check deployment status
  if echo "$LATEST_LINE" | grep -q "● Ready"; then
    DEPLOY_URL=$(echo "$LATEST_LINE" | grep -oE 'https://[^ ]+' | head -1 || true)

    # Verify this deployment matches our commit by inspecting it
    if [ -n "$DEPLOY_URL" ]; then
      INSPECT_OUTPUT=$(npx --yes vercel inspect "$DEPLOY_URL" 2>/dev/null || true)
      DEPLOY_SHA=$(echo "$INSPECT_OUTPUT" | grep -iE "commit|sha|git" | grep -oE '[a-f0-9]{7,40}' | head -1 || true)
    fi

    # Check if commit matches (compare short SHAs)
    if [ -n "$DEPLOY_SHA" ] && echo "$LOCAL_SHA_FULL" | grep -q "^${DEPLOY_SHA}"; then
      DEPLOY_STATUS="ready_matched"
      break
    elif [ -n "$DEPLOY_SHA" ]; then
      # Deployment is ready but for a DIFFERENT commit — still waiting
      echo "  ⏳ Latest deploy is $DEPLOY_SHA (waiting for $LOCAL_SHA)... (${ELAPSED}s)"
      sleep $INTERVAL
      ELAPSED=$((ELAPSED + INTERVAL))
    else
      # Can't extract SHA — fall back to timing check
      # If deploy just completed in last 60s, likely ours
      DEPLOY_STATUS="ready_unverified"
      break
    fi

  elif echo "$LATEST_LINE" | grep -q "● Error"; then
    DEPLOY_STATUS="error"
    DEPLOY_URL=$(echo "$LATEST_LINE" | grep -oE 'https://[^ ]+' | head -1 || true)
    break
  elif echo "$LATEST_LINE" | grep -qE "● (Building|Queued)"; then
    echo "  ⏳ Build in progress... (${ELAPSED}s elapsed)"
    sleep $INTERVAL
    ELAPSED=$((ELAPSED + INTERVAL))
  else
    sleep $INTERVAL
    ELAPSED=$((ELAPSED + INTERVAL))
  fi
done

echo ""
if [ "$DEPLOY_STATUS" = "ready_matched" ]; then
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "https://www.phredomade.com/" --max-time 10 2>/dev/null || echo "000")
  echo "  ✅ DEPLOY GREEN — commit $LOCAL_SHA is live on Vercel (HTTP $HTTP_CODE)"
  [ -n "$DEPLOY_URL" ] && echo "  🔗 $DEPLOY_URL"

elif [ "$DEPLOY_STATUS" = "ready_unverified" ]; then
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "https://www.phredomade.com/" --max-time 10 2>/dev/null || echo "000")
  echo "  ⚠️  DEPLOY READY but could not verify commit SHA matches $LOCAL_SHA"
  echo "  Site returned HTTP $HTTP_CODE"
  [ -n "$DEPLOY_URL" ] && echo "  🔗 $DEPLOY_URL"
  echo "  👉 Manually verify at: https://vercel.com/ephratah17-1526s-projects/phredomade"

elif [ "$DEPLOY_STATUS" = "error" ]; then
  echo "  ❌ DEPLOY FAILED — Vercel build errored!"
  echo "  📦 Local commit: $LOCAL_SHA"
  [ -n "$DEPLOY_URL" ] && echo "  🔗 Inspect: $DEPLOY_URL"
  echo "  👉 Run: npx vercel inspect $DEPLOY_URL --logs"
  echo ""
  echo "  ⚠️  ACTION REQUIRED: Fix the build error before proceeding."

elif [ $ELAPSED -ge $MAX_WAIT ]; then
  echo "  ⚠️  Auto-deploy not detected after ${MAX_WAIT}s — deploying manually..."
  echo ""
  MANUAL_OUTPUT=$(cd /c/Users/ephra/phredomade && npx --yes vercel --prod 2>&1)
  if echo "$MANUAL_OUTPUT" | grep -q "Production:"; then
    MANUAL_URL=$(echo "$MANUAL_OUTPUT" | grep "Production:" | grep -oE 'https://[^ ]+' | head -1)
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "https://www.phredomade.com/" --max-time 10 2>/dev/null || echo "000")
    echo "  ✅ MANUAL DEPLOY GREEN — commit $LOCAL_SHA deployed (HTTP $HTTP_CODE)"
    [ -n "$MANUAL_URL" ] && echo "  🔗 $MANUAL_URL"
  else
    echo "  ❌ MANUAL DEPLOY FAILED"
    echo "$MANUAL_OUTPUT" | tail -5
    echo "  👉 Check https://vercel.com/ephratah17-1526s-projects/phredomade"
  fi

else
  echo "  ⚠️  DEPLOY STATUS UNKNOWN"
  echo "  👉 Check https://vercel.com/ephratah17-1526s-projects/phredomade"
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
