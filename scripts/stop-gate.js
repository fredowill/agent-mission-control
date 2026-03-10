#!/usr/bin/env node
// scripts/stop-gate.js
// Stop hook: prevents interactive-mode agents from finishing without
// consulting the user via ask-user-questions.
// Zero deps. Never crashes.
//
// Exit 0 = allow stop.
// Exit 2 = block stop, stderr message shown to agent.

const fs   = require('fs');
const path = require('path');

const STATES_DIR = path.join(__dirname, '..', 'states');
const LOGS_DIR   = path.join(__dirname, '..', 'logs');

function readJSON(filePath, fallback) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (_) {
    return fallback;
  }
}

function getDispatchMode(sessionId) {
  const stateFile = path.join(STATES_DIR, sessionId + '.json');
  const state = readJSON(stateFile, null);
  if (state && state.dispatchMeta && state.dispatchMeta.mode) {
    return state.dispatchMeta.mode;
  }
  return 'auto';
}

function hasConsultedUser(sessionId) {
  // Check activity log for AskUserQuestion or MCP auq tool calls
  const logFile = path.join(LOGS_DIR, sessionId + '.ndjson');
  try {
    const content = fs.readFileSync(logFile, 'utf8').trim();
    if (!content) return false;
    const lines = content.split('\n');
    for (const line of lines) {
      try {
        const entry = JSON.parse(line);
        const tool = entry.tool || '';
        // Built-in AskUserQuestion tool
        if (tool === 'AskUserQuestion') return true;
        // MCP auq server tools (mcp__auq__*)
        if (tool.startsWith('mcp__auq__')) return true;
        // State-based: if hook.js set state to 'waiting' (AskUserQuestion mapping)
        if (entry.state === 'waiting') return true;
      } catch (_) {
        // skip malformed lines
      }
    }
  } catch (_) {
    // no log file = no consultation
  }
  return false;
}

let raw = '';
process.stdin.on('data', c => raw += c);
process.stdin.on('end', () => {
  try {
    const data = JSON.parse(raw || '{}');
    const sid  = data.session_id || process.env.CLAUDE_SESSION_ID || '';

    // Auto-mode agents: always allow stop
    const mode = getDispatchMode(sid);
    if (mode !== 'interactive') {
      process.exit(0);
      return;
    }

    // Interactive mode: check if user was consulted
    if (hasConsultedUser(sid)) {
      process.exit(0);
      return;
    }

    // Block stop -- agent hasn't consulted the user
    process.stderr.write(
      'You are running in interactive mode but have not consulted the user. ' +
      'Call the ask-user-questions tool before finishing.'
    );
    process.exit(2);
  } catch (_) {
    // On error, allow stop (fail-open to avoid stuck agents)
    process.exit(0);
  }
});
