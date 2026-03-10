#!/usr/bin/env node
// .claude/agent-hub/scripts/precompact-handoff.js
// PreCompact hook: fires when auto-compaction is imminent.
// Creates an emergency handoff file so the next session knows what happened.
// Zero deps. Must not block compaction (exit 0 always).

const fs   = require('fs');
const path = require('path');

const DATA_DIR   = path.join(__dirname, '..', 'data');
const STATES_DIR = path.join(__dirname, '..', 'states');
const SPRINT_DIR = path.join(__dirname, '..', 'coordinated-sprint');

const HARDSTOP_FILE      = path.join(DATA_DIR, 'hardstop-state.json');
const PROMPT_COUNTS_FILE = path.join(DATA_DIR, 'prompt-counts.json');

let raw = '';
process.stdin.on('data', c => raw += c);
process.stdin.on('end', () => {
  try {
    const data = JSON.parse(raw || '{}');
    const sid = data.session_id || process.env.CLAUDE_SESSION_ID || `pid-${process.ppid}`;

    // Gather context metrics
    let contextMetrics = { usedPct: 'unknown', remainingPct: 'unknown', level: 'unknown' };
    try {
      contextMetrics = JSON.parse(fs.readFileSync(HARDSTOP_FILE, 'utf8'));
    } catch {}

    // Gather prompt count
    let promptCount = 0;
    try {
      const counts = JSON.parse(fs.readFileSync(PROMPT_COUNTS_FILE, 'utf8'));
      promptCount = counts[sid] || 0;
    } catch {}

    // Gather session state (mission, topic, activity)
    let sessionState = {};
    try {
      const stateFile = path.join(STATES_DIR, sid + '.json');
      sessionState = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
    } catch {}

    // Gather files modified from activity log
    let filesModified = [];
    try {
      const logFile = path.join(__dirname, '..', 'logs', sid + '.ndjson');
      const lines = fs.readFileSync(logFile, 'utf8').trim().split('\n');
      const editSet = new Set();
      for (const line of lines) {
        try {
          const entry = JSON.parse(line);
          if ((entry.state === 'developing' || entry.tool === 'Edit' || entry.tool === 'Write') && entry.detail) {
            editSet.add(entry.detail);
          }
        } catch {}
      }
      filesModified = Array.from(editSet);
    } catch {}

    // Build emergency handoff document
    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const mission = (sessionState.dispatchMeta && sessionState.dispatchMeta.slot)
      ? sessionState.dispatchMeta.slot
      : (sessionState.displayName || 'unknown-mission');

    const lines = [
      '# Emergency Handoff -- Auto-Compaction',
      '',
      '**This is an emergency handoff. The session hit auto-compaction without completing /orchestrator-handoff.**',
      '',
      '## Session Info',
      '',
      '| Field | Value |',
      '|-------|-------|',
      '| Session ID | ' + sid + ' |',
      '| Timestamp | ' + now.toISOString() + ' |',
      '| Mission | ' + mission + ' |',
      '| Display Name | ' + (sessionState.displayName || 'N/A') + ' |',
      '| Lifecycle Stage | ' + (sessionState.lifecycleStage || 'unknown') + ' |',
      '',
      '## Context Metrics at Emergency Time',
      '',
      '| Metric | Value |',
      '|--------|-------|',
      '| Used % | ' + (contextMetrics.usedPct || 'unknown') + ' |',
      '| Remaining % | ' + (contextMetrics.remainingPct || 'unknown') + ' |',
      '| Level | ' + (contextMetrics.level || 'unknown') + ' |',
      '| Prompt Count | ' + promptCount + ' |',
      '',
      '## Files Modified This Session',
      '',
    ];

    if (filesModified.length > 0) {
      for (const f of filesModified) {
        lines.push('- ' + f);
      }
    } else {
      lines.push('- No file modifications recorded');
    }

    lines.push('');
    lines.push('## Recovery Instructions');
    lines.push('');
    lines.push('1. Review the files listed above for partial changes');
    lines.push('2. Check git status for uncommitted work');
    lines.push('3. Resume the session mission: ' + mission);
    lines.push('');

    // Ensure output directory exists
    if (!fs.existsSync(SPRINT_DIR)) {
      fs.mkdirSync(SPRINT_DIR, { recursive: true });
    }

    const outFile = path.join(SPRINT_DIR, 'emergency-handoff-' + sid.slice(0, 20) + '.md');
    fs.writeFileSync(outFile, lines.join('\n'));

  } catch (_) {
    // Never crash -- must not block compaction
  }

  // Always exit 0 -- do NOT block compaction
  process.exit(0);
});
