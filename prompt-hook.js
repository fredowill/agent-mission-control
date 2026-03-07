#!/usr/bin/env node
// .claude/agent-hub/prompt-hook.js
// UserPromptSubmit hook. Captures every user prompt to prompts/{sessionId}.ndjson.
// Zero deps. Fire-and-forget. Never crashes.
//
// CRITICAL: Prompt files are APPEND-ONLY sacred user data.
// This hook is the ONLY thing that writes to them. The server never modifies them.
//
// IDENTITY: Uses session_id directly. One session_id = one prompt file.

const fs   = require('fs');
const path = require('path');

const PROMPTS_DIR = path.join(__dirname, 'prompts');
const STATES_DIR  = path.join(__dirname, 'states');
const LOGS_DIR    = path.join(__dirname, 'logs');

// ── Skill/command detection ──
// When a /skill is invoked, Claude Code sends the entire expanded markdown as
// the "prompt". We detect this and replace it with a short "/skill-name was used"
// marker. The full expansion is noise in prompt history.
const SKILL_PATTERNS = [
  // <command-name>foo</command-name> tags injected by Claude Code skill system
  { regex: /<command-name>([^<]+)<\/command-name>/, label: m => '/' + m[1] },
  // Frontmatter-style skill files (--- name: foo ---)
  { regex: /^---\s*\n[\s\S]*?name:\s*(\S+)[\s\S]*?---/, label: m => '/' + m[1] },
];

function detectSkill(text) {
  for (const { regex, label } of SKILL_PATTERNS) {
    const m = text.match(regex);
    if (m) return label(m);
  }
  // Heuristic: if the prompt is very long (>2000 chars) and doesn't look like
  // normal user text (contains code fences, HTML tags, or frontmatter), it's
  // likely a skill/system expansion
  if (text.length > 2000 && (text.includes('```') || text.includes('<system') || text.startsWith('---\n'))) {
    return '/skill (expanded)';
  }
  return null;
}

// ── Display name extraction ──
// Extracts a short topic from the user's first prompt for terminal/dashboard display.
function extractDisplayName(prompt) {
  let name = prompt.split('\n')[0].trim();
  // Strip markdown headers
  name = name.replace(/^#+\s*/, '');
  // Strip conversational prefixes
  name = name.replace(/^(hey,?\s*|hi,?\s*|hello,?\s*|please\s+|can you\s+|could you\s+|i need you to\s+|i want you to\s+)/i, '');
  // Truncate at 50 chars on word boundary
  if (name.length > 50) {
    name = name.substring(0, 50);
    const lastSpace = name.lastIndexOf(' ');
    if (lastSpace > 20) name = name.substring(0, lastSpace);
    name += '...';
  }
  return name || null;
}

// ── Terminal title ──
// Sets the terminal tab title. Multiple approaches for Windows Terminal compatibility.
// Best-effort, never crashes. At least one approach should work.
function setTerminalTitle(title) {
  // Approach 1: process.title — on Windows, calls SetConsoleTitleW (Win32 API)
  try { process.title = title; } catch {}
  // Approach 2: ANSI OSC escape — works in terminals that support VT100
  const seq = `\x1b]0;${title}\x07`;
  try { process.stderr.write(seq); } catch {}
  // Approach 3: Write directly to TTY device (bypasses capture)
  try {
    const fd = fs.openSync('/dev/tty', 'w');
    fs.writeSync(fd, seq);
    fs.closeSync(fd);
  } catch {}
}

// ── Dedup guard ──
// Skip if the exact same prompt was written in the last 5 seconds
function isDuplicate(file, prompt) {
  try {
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.trim().split('\n');
    const recent = lines.slice(-3); // check last 3 lines
    const now = Date.now();
    for (const line of recent) {
      try {
        const p = JSON.parse(line);
        if (p.prompt === prompt && (now - p.ts) < 5000) return true;
      } catch {}
    }
  } catch {}
  return false;
}

let raw = '';
process.stdin.on('data', c => raw += c);
process.stdin.on('end', () => {
  try {
    const data = JSON.parse(raw || '{}');
    const sid  = data.session_id || process.env.CLAUDE_SESSION_ID || `pid-${process.ppid}`;
    let prompt = data.prompt || '';
    if (!prompt) { process.exit(0); return; }

    // Filter out pure system/task-notification messages
    if (prompt.startsWith('<task-notification>') || prompt.startsWith('<system-reminder>')) {
      process.exit(0); return;
    }

    if (!fs.existsSync(PROMPTS_DIR)) fs.mkdirSync(PROMPTS_DIR, { recursive: true });

    const file = path.join(PROMPTS_DIR, `${sid}.ndjson`);

    // Dedup check
    if (isDuplicate(file, prompt)) { process.exit(0); return; }

    // Detect and collapse skill expansions
    const skillName = detectSkill(prompt);
    const entry = skillName
      ? { prompt: skillName + ' was used', ts: Date.now(), type: 'skill', originalLength: prompt.length }
      : { prompt, ts: Date.now(), type: 'user' };

    // Validate JSON before writing (prevent ndjson corruption)
    const line = JSON.stringify(entry);
    JSON.parse(line); // round-trip test — if this throws, we don't write garbage

    fs.appendFileSync(file, line + '\n');

    // ── Write "thinking" state so dashboard shows immediate activity ──
    // Bridges the gap between UserPromptSubmit and first PostToolUse.
    // Works for both user prompts AND skill expansions — any prompt means
    // the user answered, so "waiting" → "thinking" is always correct.
    try {
      if (!fs.existsSync(STATES_DIR)) fs.mkdirSync(STATES_DIR, { recursive: true });
      if (!fs.existsSync(LOGS_DIR))   fs.mkdirSync(LOGS_DIR, { recursive: true });

      const stateFile = path.join(STATES_DIR, `${sid}.json`);
      // Preserve claudePid and resumeCount from existing state file
      let claudePid = null;
      let resumeCount = 0;
      let displayName = null;
      try {
        const prev = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
        claudePid = prev.claudePid || null;
        resumeCount = prev.resumeCount || 0;
        displayName = prev.displayName || null;
      } catch {}

      // If stored PID exists, check liveness. Dead PID = /resume in new terminal.
      if (claudePid) {
        try {
          const { execSync } = require('child_process');
          const check = execSync(
            `tasklist /FI "PID eq ${claudePid}" /NH`,
            { encoding: 'utf8', timeout: 3000, stdio: ['pipe', 'pipe', 'pipe'] }
          );
          if (!check.includes(String(claudePid))) {
            claudePid = null; // dead — will be re-resolved by next hook.js fire
          }
        } catch { claudePid = null; }
      }

      // Auto-name session from first user prompt (skip skills and long expansions)
      if (!displayName && !skillName && prompt.length < 500) {
        displayName = extractDisplayName(prompt);
      }
      // Re-assert terminal title on every prompt (handles resume / new terminal)
      if (displayName) setTerminalTitle(displayName);

      const stateData = {
        sessionId: sid,
        tool: null,
        detail: skillName ? `${skillName} invoked` : '',
        ts: Date.now(),
        claudePid,
        resumeCount,
        displayName,
        state: 'thinking',
        emoji: '💭',
        label: 'THINKING',
      };
      fs.writeFileSync(stateFile, JSON.stringify(stateData));

      // ── Campaign auto-linking ──
      // If first prompt mentions a known campaign agent name, auto-link this session
      try {
        const campaignsFile = path.join(__dirname, 'campaigns.json');
        const isFirstPrompt = !fs.existsSync(file) || fs.readFileSync(file, 'utf8').trim().split('\n').length <= 1;
        if (isFirstPrompt && prompt.length > 50) {
          const campaigns = JSON.parse(fs.readFileSync(campaignsFile, 'utf8'));
          let changed = false;
          for (const camp of campaigns) {
            if (!camp.agents) continue;
            for (const agent of camp.agents) {
              // Match: "You're the Medic agent" or "You're the Video Analyzer agent"
              const namePattern = new RegExp("you(?:'re| are) the " + agent.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
              if (namePattern.test(prompt) && !agent.sessionId) {
                agent.sessionId = sid;
                agent.status = 'active';
                changed = true;
                break;
              }
            }
            if (changed) break;
          }
          if (changed) fs.writeFileSync(campaignsFile, JSON.stringify(campaigns, null, 2));
        }
      } catch {} // never crash

      // Append to activity log
      const logFile = path.join(LOGS_DIR, `${sid}.ndjson`);
      let shouldLog = true;
      try {
        const lines = fs.readFileSync(logFile, 'utf8').trim().split('\n');
        const last  = JSON.parse(lines[lines.length - 1]);
        if (last.state === 'thinking') shouldLog = false; // don't flood
      } catch {}
      if (shouldLog) {
        const logDetail = skillName ? `${skillName} invoked` : '';
        fs.appendFileSync(logFile, JSON.stringify({ state: 'thinking', emoji: '💭', tool: 'prompt', detail: logDetail, ts: Date.now() }) + '\n');
      }
    } catch {}
  } catch (_) {
    // never crash — agent must not be disrupted
  }
  process.exit(0);
});
