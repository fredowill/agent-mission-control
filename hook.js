#!/usr/bin/env node
// .claude/agent-hub/hook.js
// PostToolUse + Stop hook. Writes state file + appends activity log.
// Zero deps. Never crashes. Never slows down the agent.
//
// IDENTITY: Uses session_id directly. One session_id = one card.
// LIVENESS: On first fire per session, walks process tree from ppid up to
// find claude.exe PID. Stores it in state file. Server checks if PID is alive.

const fs   = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const FIND_PID_SCRIPT = path.join(__dirname, 'find-claude-pid.ps1');

const STATES_DIR = path.join(__dirname, 'states');
const LOGS_DIR   = path.join(__dirname, 'logs');

const TOOL_MAP = {
  // ── Investigating ──
  Read:          { state: 'investigating', emoji: '🔍', label: 'INVESTIGATING' },
  Grep:          { state: 'investigating', emoji: '🔍', label: 'INVESTIGATING' },
  Glob:          { state: 'investigating', emoji: '🔍', label: 'INVESTIGATING' },
  WebFetch:      { state: 'investigating', emoji: '🔍', label: 'INVESTIGATING' },
  WebSearch:     { state: 'investigating', emoji: '🔍', label: 'INVESTIGATING' },
  // ── Developing ──
  Write:         { state: 'developing',    emoji: '🔨', label: 'DEVELOPING'    },
  Edit:          { state: 'developing',    emoji: '🔨', label: 'DEVELOPING'    },
  NotebookEdit:  { state: 'developing',    emoji: '🔨', label: 'DEVELOPING'    },
  // ── Planning ──
  Task:          { state: 'planning',      emoji: '🗺️',  label: 'PLANNING'     },
  EnterPlanMode: { state: 'planning',      emoji: '🗺️',  label: 'PLANNING'     },
  // ── Waiting for user ──
  AskUserQuestion:{ state: 'waiting',      emoji: '🔔', label: 'NEEDS INPUT'  },
  // ── Verifying ──
  Bash:          { state: 'verifying',     emoji: '🧪', label: 'VERIFYING'    },
};

// Stop hook = turn ended, waiting for user input (NOT session closed)
const IDLE_WAITING_STATE = { state: 'idle', emoji: '⏸️', label: 'IDLE' };
const IDLE_STATE = { state: 'thinking', emoji: '💭', label: 'THINKING' };

// ── PID Resolution ──
// Walk process tree from ppid to find ancestor claude.exe PID.
// Runs ONCE per session (first hook fire). Result cached in state file.
function findClaudePid(ppid) {
  try {
    const out = execSync(
      `powershell -NoProfile -ExecutionPolicy Bypass -File "${FIND_PID_SCRIPT}" -StartPid ${ppid}`,
      { encoding: 'utf8', timeout: 8000, stdio: ['pipe', 'pipe', 'pipe'] }
    ).trim();
    const pid = parseInt(out, 10);
    return pid > 0 ? pid : null;
  } catch (_) {
    return null;
  }
}

function getDetail(toolName, input = {}) {
  const short = (s, n = 50) => String(s || '').slice(0, n);
  if (input.file_path)   return short(path.basename(input.file_path));
  if (input.path)        return short(path.basename(input.path));
  if (input.pattern)     return short(input.pattern);
  if (input.command)     return short(input.command);
  if (input.description) return short(input.description);
  if (input.prompt)      return short(input.prompt);
  if (input.query)       return short(input.query);
  return '';
}

let raw = '';
process.stdin.on('data', c => raw += c);
process.stdin.on('end', () => {
  try {
    const data = JSON.parse(raw || '{}');
    const sid  = data.session_id || process.env.CLAUDE_SESSION_ID || `pid-${process.ppid}`;
    const tool = data.tool_name;
    const info = tool ? (TOOL_MAP[tool] || IDLE_STATE) : IDLE_WAITING_STATE;
    const detail = tool ? getDetail(tool, data.tool_input || {}) : '';
    const now  = Date.now();

    // ── Ensure dirs ──
    for (const d of [STATES_DIR, LOGS_DIR]) {
      if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
    }

    // ── Resolve claude.exe PID (once per session, re-resolve if dead) ──
    const stateFile = path.join(STATES_DIR, `${sid}.json`);
    let claudePid = null;
    let resumeCount = 0;
    try {
      const prev = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
      claudePid = prev.claudePid || null;
      resumeCount = prev.resumeCount || 0;
    } catch (_) { /* first fire — no state file yet */ }

    // If stored PID exists, check if it's still alive.
    // If dead, this is likely a /resume in a new terminal — force re-resolve.
    if (claudePid) {
      try {
        const check = execSync(
          `tasklist /FI "PID eq ${claudePid}" /NH`,
          { encoding: 'utf8', timeout: 3000, stdio: ['pipe', 'pipe', 'pipe'] }
        );
        if (!check.includes(String(claudePid))) {
          claudePid = null; // stored PID is dead — re-resolve
          resumeCount++;    // track terminal resume
        }
      } catch (_) { claudePid = null; resumeCount++; }
    }
    if (!claudePid) {
      claudePid = findClaudePid(process.ppid);
    }

    // ── Write current state ──
    // Guard: if Stop hook fires while state is 'waiting' (AskUserQuestion),
    // preserve the waiting state — the user hasn't answered yet.
    if (!tool && info.state === 'idle') {
      try {
        const prev = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
        if (prev.state === 'waiting') {
          // Keep waiting state, just update timestamp + PID
          const stateData = { ...prev, ts: now, claudePid: claudePid || prev.claudePid };
          fs.writeFileSync(stateFile, JSON.stringify(stateData));
          // Skip logging — no real state change
          process.exit(0);
          return;
        }
      } catch (_) { /* no previous state — proceed normally */ }
    }
    const stateData = { sessionId: sid, tool: tool || null, detail, ts: now, claudePid, resumeCount, ...info };
    fs.writeFileSync(stateFile, JSON.stringify(stateData));

    // ── Append to activity log (only on state transitions) ──
    const logFile = path.join(LOGS_DIR, `${sid}.ndjson`);
    let shouldLog = true;
    try {
      const lines = fs.readFileSync(logFile, 'utf8').trim().split('\n');
      const last  = JSON.parse(lines[lines.length - 1]);
      // Skip if same state AND same tool (avoid flooding)
      if (last.state === info.state && last.tool === tool) shouldLog = false;
    } catch (_) { /* first entry or corrupt file — log it */ }

    if (shouldLog) {
      fs.appendFileSync(logFile,
        JSON.stringify({ state: info.state, emoji: info.emoji, tool: tool || 'stop', detail, ts: now }) + '\n'
      );
    }
  } catch (_) {
    // never crash — agent must not be disrupted
  }
  process.exit(0);
});
