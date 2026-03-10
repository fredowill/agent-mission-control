#!/usr/bin/env node
// hooks/checkpoint-counter.js
// PostToolUse hook: counts Write/Edit calls per session.
// For interactive-mode agents, injects checkpoint messages at configurable thresholds.
// Zero deps. Never crashes. <50ms per call.

const fs   = require('fs');
const path = require('path');

const DATA_DIR    = path.join(__dirname, '..', 'data');
const STATES_DIR  = path.join(__dirname, '..', 'states');
const COUNTS_FILE = path.join(DATA_DIR, 'checkpoint-counts.json');
const CONFIG_FILE = path.join(__dirname, '..', 'config', 'checkpoint-config.json');

// Only count these tools
const WRITE_TOOLS = new Set(['Write', 'Edit']);

// Default config
const DEFAULT_CONFIG = { writeThreshold: 5, enabled: true };

function readJSON(filePath, fallback) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (_) {
    return fallback;
  }
}

function writeJSON(filePath, data) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

function getDispatchMode(sessionId) {
  // Check state file for dispatchMeta.mode
  const stateFile = path.join(STATES_DIR, sessionId + '.json');
  const state = readJSON(stateFile, null);
  if (state && state.dispatchMeta && state.dispatchMeta.mode) {
    return state.dispatchMeta.mode;
  }
  // Fallback: default to "auto" (no-op for non-dispatched sessions)
  return 'auto';
}

let raw = '';
process.stdin.on('data', c => raw += c);
process.stdin.on('end', () => {
  try {
    const data = JSON.parse(raw || '{}');
    const sid  = data.session_id || process.env.CLAUDE_SESSION_ID || '';
    const tool = data.tool_name || '';

    // Only process Write/Edit tools
    if (!WRITE_TOOLS.has(tool)) {
      process.exit(0);
      return;
    }

    // Check if interactive mode -- exit early for auto agents
    const mode = getDispatchMode(sid);
    if (mode !== 'interactive') {
      process.exit(0);
      return;
    }

    // Load config
    const config = { ...DEFAULT_CONFIG, ...readJSON(CONFIG_FILE, {}) };
    if (!config.enabled) {
      process.exit(0);
      return;
    }

    // Load and update counts
    const counts = readJSON(COUNTS_FILE, {});
    const prev = counts[sid] || 0;
    const next = prev + 1;
    counts[sid] = next;
    writeJSON(COUNTS_FILE, counts);

    // Check threshold
    if (next > 0 && next % config.writeThreshold === 0) {
      // Output checkpoint message to stdout -- shown to agent as tool result
      const msg = [
        'CHECKPOINT: You have made ' + next + ' file changes.',
        'Before continuing, call the ask-user-questions MCP tool to check in with the user.',
        'Describe what you have done so far and ask if they want to adjust the approach.'
      ].join(' ');
      process.stdout.write(msg);
    }
  } catch (_) {
    // never crash -- agent must not be disrupted
  }
  process.exit(0);
});
