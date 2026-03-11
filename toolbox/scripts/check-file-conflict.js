#!/usr/bin/env node
// PostToolUse hook — cross-agent file conflict detection
// Checks if another session recently edited the same file.
// Ledger: file-edits.ndjson in the MC repo root
// Zero deps. Never crashes. Never slows down the agent.

const fs = require('fs');
const path = require('path');

// Find MC repo root — check known locations (work + home machines)
const HOME = process.env.HOME || process.env.USERPROFILE || '';
const MC_CANDIDATES = [
  path.join(HOME, 'projects', 'agent-mission-control'),
  path.join(HOME, 'Claude', 'projects', 'agent-mission-control'),
];
const MC_ROOT = MC_CANDIDATES.find(d => fs.existsSync(path.join(d, 'server.js'))) || MC_CANDIDATES[0];
const LEDGER = path.join(MC_ROOT, 'file-edits.ndjson');
const CONFLICT_WINDOW = 1800; // 30 minutes in seconds
const MAX_LEDGER_LINES = 500;

let raw = '';
process.stdin.on('data', c => raw += c);
process.stdin.on('end', () => {
  try {
    const data = JSON.parse(raw || '{}');
    const filePath = data.tool_input?.file_path || data.tool_input?.path || '';
    const sid = data.session_id || '';
    if (!filePath || !sid) process.exit(0);

    const basename = path.basename(filePath);
    const now = Math.floor(Date.now() / 1000);

    // Check ledger for conflicts
    if (fs.existsSync(LEDGER)) {
      const lines = fs.readFileSync(LEDGER, 'utf8').trim().split('\n').filter(Boolean);
      const conflicts = new Map(); // sid -> most recent age

      for (const line of lines.slice(-200)) {
        try {
          const entry = JSON.parse(line);
          if (entry.file === basename && entry.sid !== sid) {
            const age = now - (entry.ts || 0);
            if (age >= 0 && age < CONFLICT_WINDOW) {
              const existing = conflicts.get(entry.sid);
              if (!existing || age < existing) {
                conflicts.set(entry.sid, age);
              }
            }
          }
        } catch {}
      }

      if (conflicts.size > 0) {
        console.log('');
        console.log('\u2501'.repeat(56));
        console.log('  FILE CONFLICT WARNING');
        console.log('  ' + basename + ' was also edited by another session:');
        for (const [csid, age] of conflicts) {
          const mins = Math.floor(age / 60);
          console.log('    Session ...' + csid.slice(-8) + '  ' + mins + 'm ago');
        }
        console.log('  Your changes may overwrite or conflict with theirs.');
        console.log('\u2501'.repeat(56));
        console.log('');
      }
    }

    // Log this edit
    const entry = JSON.stringify({ file: basename, sid, ts: now, path: filePath });
    fs.appendFileSync(LEDGER, entry + '\n');

    // Rotate if too large
    try {
      const content = fs.readFileSync(LEDGER, 'utf8');
      const allLines = content.trim().split('\n');
      if (allLines.length > MAX_LEDGER_LINES) {
        fs.writeFileSync(LEDGER, allLines.slice(-Math.floor(MAX_LEDGER_LINES / 2)).join('\n') + '\n');
      }
    } catch {}

  } catch {}
  process.exit(0);
});
