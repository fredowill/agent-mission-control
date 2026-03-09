#!/bin/bash
# PostToolUse hook — fires after every Edit / Write tool call
# Immediately warns if server is in stale prod mode so changes won't show.

PORT=3002

# If server isn't even up, don't spam — just exit silently.
if ! curl -sf --max-time 2 "http://localhost:$PORT" > /dev/null 2>&1; then
  exit 0
fi

# Detect dev vs prod
PID=$(netstat -ano 2>/dev/null | grep ":$PORT" | grep -i "LISTEN" \
      | awk '{print $NF}' | head -1 | tr -d ' \r\n')

if [ -n "$PID" ]; then
  PROC_CMD=$(powershell.exe -NoProfile -Command \
    "try{(Get-WmiObject Win32_Process -Filter \"ProcessId=$PID\").CommandLine}catch{''}" \
    2>/dev/null | tr -d '\r\n')

  if echo "$PROC_CMD" | grep -q " start"; then
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "  ⚠⚠  STALE PROD BUILD (npm start)  ⚠⚠"
    echo "  Code changes will NOT show on reload."
    echo "  Fix: npm run dev  (or npm run dev:fresh)"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
  fi
  # Dev mode: HMR handles it — no noise needed
fi

exit 0
