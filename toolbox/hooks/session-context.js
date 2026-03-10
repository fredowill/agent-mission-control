#!/usr/bin/env node
// session-context.js — SessionStart hook
// Injects two things into every new session:
// 1. Session Catalog — 20 most recent sessions (so agents know what's been discussed)
// 2. Skill Index — categorized one-liners for all 60+ skills (for LLM-based skill selection)
//
// Fires on startup + compact. Zero deps. Silently exits on failure.

const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

let raw = '';
process.stdin.on('data', c => raw += c);
process.stdin.on('end', () => {
  try {
    const input = JSON.parse(raw);

    // Only inject on new sessions and compactions (not resume — already has context)
    if (input.source !== 'startup' && input.source !== 'compact') {
      process.exit(0);
    }

    const parts = [];

    // --- Part 1: Session Catalog ---
    try {
      const output = execFileSync('aichat', ['search', '--json'], {
        encoding: 'utf8',
        timeout: 3000,
        env: { ...process.env, PYTHONUTF8: '1' },
        stdio: ['pipe', 'pipe', 'pipe']
      });

      const sessions = output.trim().split('\n')
        .filter(l => l.trim())
        .map(l => { try { return JSON.parse(l); } catch { return null; } })
        .filter(Boolean)
        .sort((a, b) => (b.modified || '').localeCompare(a.modified || ''))
        .slice(0, 20);

      if (sessions.length > 0) {
        const lines = sessions.map(s => {
          const date = (s.modified || '').slice(0, 10);
          const proj = s.project || '?';
          const msg = (s.custom_title || s.first_msg || '')
            .replace(/\n/g, ' ')
            .slice(0, 100)
            .trim();
          return `  ${date} | ${proj} | ${msg}`;
        });

        parts.push([
          '## Session Catalog (20 most recent)',
          'The user dictates via voice and has discussed most topics in prior sessions.',
          'If your current task relates to any topic below, run `aichat search --json -g "topic keywords"` to pull detailed context.',
          '',
          ...lines
        ].join('\n'));
      }
    } catch {
      // aichat not installed — skip catalog, still inject skill index
    }

    // --- Part 2: Skill Index ---
    // Try multiple possible locations for the skill index
    const indexPaths = [
      path.join(input.cwd || '', '.claude', 'skills', 'skill-index.md'),
      path.join(process.env.HOME || process.env.USERPROFILE || '', 'phredomade', '.claude', 'skills', 'skill-index.md')
    ];

    for (const p of indexPaths) {
      try {
        const index = fs.readFileSync(p, 'utf8');
        parts.push(index);
        break;
      } catch {
        // Try next path
      }
    }

    if (parts.length === 0) process.exit(0);

    // Output as JSON with additionalContext
    console.log(JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'SessionStart',
        additionalContext: parts.join('\n\n---\n\n')
      }
    }));
  } catch {
    // Never crash, never block session startup
    process.exit(0);
  }
});
