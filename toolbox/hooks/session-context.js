#!/usr/bin/env node
// SessionStart hook: injects Session Catalog + Skill Index into every new session
// v2.7 design: ~2K tokens, <500ms target
// Requires: aichat CLI (uv tool install claude-code-tools) for session catalog
// Falls back gracefully if aichat is not installed

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Skill index path — check multiple locations
const skillIndexPaths = [
  path.join(process.env.HOME || process.env.USERPROFILE, '.claude', 'skills', 'skill-index.md'),
  path.join(process.env.HOME || process.env.USERPROFILE, 'Claude', 'projects', 'agent-mission-control', 'toolbox', 'skills', 'skill-index.md')
];

let skillIndex = '';
for (const p of skillIndexPaths) {
  try {
    if (fs.existsSync(p)) {
      skillIndex = fs.readFileSync(p, 'utf8');
      break;
    }
  } catch (_) {}
}

// Session catalog via aichat (if available)
let sessionCatalog = '';
try {
  const raw = execSync('aichat search --recent 20 --format json 2>/dev/null', {
    timeout: 3000,
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe']
  });
  const sessions = JSON.parse(raw);
  if (Array.isArray(sessions) && sessions.length > 0) {
    sessionCatalog = '## Recent Sessions (last 20)\n\n';
    sessionCatalog += '| # | Topic | Date |\n|---|-------|------|\n';
    sessions.slice(0, 20).forEach((s, i) => {
      const topic = (s.topic || s.summary || 'unknown').substring(0, 80);
      const date = s.date || s.timestamp || '?';
      sessionCatalog += `| ${i + 1} | ${topic} | ${date} |\n`;
    });
  }
} catch (_) {
  sessionCatalog = '## Recent Sessions\n\n*aichat CLI not installed. Run `uv tool install claude-code-tools` to enable session catalog.*\n';
}

// Output context for injection
const output = [];
output.push('# Session Context (auto-injected)\n');

if (sessionCatalog) {
  output.push(sessionCatalog);
}

if (skillIndex) {
  // Inject just the first few lines as a reminder, not the full index
  output.push('## Skill Index Available\n');
  output.push('Run `cat ~/.claude/skills/skill-index.md` to see all 80+ skills categorized by type.');
  output.push('Pick 0-2 skills that genuinely help your current task. State your reasoning.\n');
}

output.push('## Emoji Standard\n');
output.push('Emojis are SEMANTIC, not decorative. Use contextual emojis (🔬 research, 🛠️ build, 📋 plan, 🧠 design, 🛡️ security, ⚡ active) alongside status dots (🔴🟡🟢⬜✅). Never just color dots — mix pertinent emojis per context.\n');

console.log(output.join('\n'));
