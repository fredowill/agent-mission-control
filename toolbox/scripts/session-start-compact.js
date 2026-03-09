#!/usr/bin/env node
// SessionStart hook — fires after compaction (source: "compact")
// Reads existing Mission Control logs + prompts + git state,
// injects a "here's where you left off" briefing into Claude's context.
// Zero deps. Read-only. Fails silently.

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const HUB_DIR = path.join(__dirname, '..', 'agent-hub');
const PROMPTS_DIR = path.join(HUB_DIR, 'prompts');
const LOGS_DIR = path.join(HUB_DIR, 'logs');

let raw = '';
process.stdin.on('data', c => raw += c);
process.stdin.on('end', () => {
  try {
    const data = JSON.parse(raw || '{}');
    const sid = data.session_id;
    if (!sid) { process.exit(0); return; }

    const parts = [];

    // 1. Last 5 user prompts
    try {
      const promptFile = path.join(PROMPTS_DIR, `${sid}.ndjson`);
      if (fs.existsSync(promptFile)) {
        const lines = fs.readFileSync(promptFile, 'utf8').trim().split('\n').filter(Boolean);
        const recent = lines.slice(-5).map(l => {
          try {
            const p = JSON.parse(l);
            if (p.type === 'skill') return p.prompt;
            const text = (p.prompt || '').slice(0, 200);
            return text;
          } catch { return null; }
        }).filter(Boolean);
        if (recent.length > 0) {
          parts.push('RECENT USER PROMPTS (most recent last):\n' + recent.map((p, i) => `  ${i + 1}. ${p}`).join('\n'));
        }
      }
    } catch {}

    // 2. Last 10 activity log entries
    try {
      const logFile = path.join(LOGS_DIR, `${sid}.ndjson`);
      if (fs.existsSync(logFile)) {
        const lines = fs.readFileSync(logFile, 'utf8').trim().split('\n').filter(Boolean);
        const recent = lines.slice(-10).map(l => {
          try {
            const e = JSON.parse(l);
            const tool = e.tool || 'unknown';
            const detail = e.detail ? ` (${e.detail})` : '';
            return `${e.state}: ${tool}${detail}`;
          } catch { return null; }
        }).filter(Boolean);
        if (recent.length > 0) {
          parts.push('RECENT TOOL ACTIVITY:\n' + recent.map(a => `  - ${a}`).join('\n'));
        }
      }
    } catch {}

    // 3. Git status
    try {
      const status = execSync('git status --short', {
        encoding: 'utf8', timeout: 5000, cwd: data.cwd || process.cwd(),
        stdio: ['pipe', 'pipe', 'pipe']
      }).trim();
      if (status) {
        const lines = status.split('\n').slice(0, 15);
        parts.push('MODIFIED FILES (git status):\n' + lines.map(l => `  ${l}`).join('\n'));
      }
    } catch {}

    // 4. Git diff stat
    try {
      const diff = execSync('git diff --stat', {
        encoding: 'utf8', timeout: 5000, cwd: data.cwd || process.cwd(),
        stdio: ['pipe', 'pipe', 'pipe']
      }).trim();
      if (diff) {
        const lines = diff.split('\n').slice(0, 10);
        parts.push('UNCOMMITTED CHANGES:\n' + lines.map(l => `  ${l}`).join('\n'));
      }
    } catch {}

    if (parts.length === 0) { process.exit(0); return; }

    const context = '--- CONTEXT RESTORED AFTER COMPACTION ---\n'
      + 'This session was compacted. Here is what you were working on:\n\n'
      + parts.join('\n\n')
      + '\n\nUse this to resume where you left off. Do not repeat completed work.';

    // Output as JSON with additionalContext for injection
    const output = JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'SessionStart',
        additionalContext: context
      }
    });

    process.stdout.write(output);
  } catch {
    // Fail silently — never disrupt the session
  }
  process.exit(0);
});
