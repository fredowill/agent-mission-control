#!/usr/bin/env node
// .claude/agent-hub/scripts/statusline-hardstop.js
// StatusLine hook: reads context window metrics, writes threshold state, outputs status indicator.
// Fires on every StatusLine render cycle -- must complete in <50ms.
// Zero deps. Synchronous only. No network calls.

const fs   = require('fs');
const path = require('path');

const DATA_DIR    = path.join(__dirname, '..', 'data');
const STATE_FILE  = path.join(DATA_DIR, 'hardstop-state.json');

// Auto-compaction fires at ~83.5% usage (remaining ~16.5%)
const AUTOCOMPACT_BUFFER_PCT = 16.5;

// Threshold levels
const THRESHOLDS = [
  { minPct: 85, level: 'red',    display: '[85% STOP]' },
  { minPct: 75, level: 'orange', display: '[75% HANDOFF]' },
  { minPct: 60, level: 'yellow', display: '[60%]' },
];

let raw = '';
process.stdin.on('data', c => raw += c);
process.stdin.on('end', () => {
  try {
    const data = JSON.parse(raw || '{}');
    const cw = data.context_window || {};

    const usedPct      = typeof cw.used_percentage === 'number' ? cw.used_percentage : null;
    const remainingPct = typeof cw.remaining_percentage === 'number' ? cw.remaining_percentage : null;

    // If no context data available, exit silently
    if (usedPct === null || remainingPct === null) {
      process.exit(0);
      return;
    }

    // Calculate free space until auto-compaction fires
    const freeUntilCompact = Math.max(0, remainingPct - AUTOCOMPACT_BUFFER_PCT);

    // Determine threshold level
    let level = 'green';
    let display = '';
    for (const t of THRESHOLDS) {
      if (usedPct >= t.minPct) {
        level = t.level;
        display = t.display;
        break;
      }
    }

    // Read existing state to preserve prompt count
    let promptCount = 0;
    try {
      const prev = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
      promptCount = prev.promptCount || 0;
    } catch {}

    // Write state file (synchronous for speed)
    const state = {
      level,
      usedPct: Math.round(usedPct * 10) / 10,
      remainingPct: Math.round(remainingPct * 10) / 10,
      freeUntilCompact: Math.round(freeUntilCompact * 10) / 10,
      promptCount,
      ts: Date.now(),
    };

    // Ensure data dir exists
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    fs.writeFileSync(STATE_FILE, JSON.stringify(state));

    // Output status indicator to stdout (StatusLine display)
    if (display) {
      process.stdout.write(display);
    }
  } catch (_) {
    // Never crash -- StatusLine must not disrupt the agent
  }
  process.exit(0);
});
