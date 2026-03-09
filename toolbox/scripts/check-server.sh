#!/bin/bash
# PostToolUse hook — fires after Bash commands involving npm start / npm run dev
# Polls localhost:3002, confirms GREEN, and warns if running a stale prod build

input=$(cat 2>/dev/null)

# Extract the bash command from PostToolUse JSON payload
cmd=$(echo "$input" | node --input-type=commonjs -e "
const c = [];
process.stdin.on('data', d => c.push(d));
process.stdin.on('end', () => {
  try { process.stdout.write(JSON.parse(Buffer.concat(c).toString())?.tool_input?.command || ''); }
  catch(e) {}
})" 2>/dev/null)

# Only run for server-starting commands
if ! echo "$cmd" | grep -qE "npm (start|run dev)"; then
  exit 0
fi

PORT=3002
MAX_ATTEMPTS=6
WAIT=3

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  SERVER HEALTH CHECK — localhost:$PORT"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

for i in $(seq 1 $MAX_ATTEMPTS); do
  sleep $WAIT
  if curl -sf --max-time 5 "http://localhost:$PORT" > /dev/null 2>&1; then
    echo "  ✓ GREEN — server responding on :$PORT"

    # ── Dev vs prod detection ───────────────────────────────────────
    PID=$(netstat -ano 2>/dev/null | grep ":$PORT" | grep -i "LISTEN" \
          | awk '{print $NF}' | head -1 | tr -d ' \r\n')

    if [ -n "$PID" ]; then
      # Use PowerShell to read the full process command line on Windows
      PROC_CMD=$(powershell.exe -NoProfile -Command \
        "try{(Get-WmiObject Win32_Process -Filter \"ProcessId=$PID\").CommandLine}catch{''}" \
        2>/dev/null | tr -d '\r\n')

      if echo "$PROC_CMD" | grep -q " dev "; then
        echo "  ✓ DEV mode  — HMR active, changes hot-reload instantly"
      elif echo "$PROC_CMD" | grep -q " start"; then
        echo ""
        echo "  ⚠⚠ STALE PROD BUILD (npm start) ⚠⚠"
        echo "  Code changes are NOT being served — old .next only."
        echo "  Fix: npm run dev:fresh   (kills port + restarts dev)"
        echo ""
      else
        echo "  ? Could not determine dev/prod mode (PID $PID)"
      fi
    fi
    # ────────────────────────────────────────────────────────────────

    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    exit 0
  fi
  echo "  ... waiting (attempt $i/$MAX_ATTEMPTS)"
done

echo "  ✗ NOT RESPONDING on :$PORT after $((MAX_ATTEMPTS * WAIT))s"
echo ""

# Diagnose
if netstat -ano 2>/dev/null | grep ":$PORT" | grep -q LISTEN; then
  echo "  Port is bound but not serving HTTP (stale .next? module error?)"
  echo "  Fix: rm -rf .next && npm run build && npm start"
else
  echo "  Port not bound — server crashed on startup"
  echo "  Fix: check terminal for errors, then restart"
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
exit 1
