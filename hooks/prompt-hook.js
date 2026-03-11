#!/usr/bin/env node
// hooks/prompt-hook.js (agent-mission-control)
// UserPromptSubmit hook. Captures every user prompt to prompts/{sessionId}.ndjson.
// Zero deps. Fire-and-forget. Never crashes.
//
// CRITICAL: Prompt files are APPEND-ONLY sacred user data.
// This hook is the ONLY thing that writes to them. The server never modifies them.
//
// IDENTITY: Uses session_id directly. One session_id = one prompt file.

const fs   = require('fs');
const path = require('path');

const PROMPTS_DIR       = path.join(__dirname, '..', 'prompts');
const STATES_DIR        = path.join(__dirname, '..', 'states');
const LOGS_DIR          = path.join(__dirname, '..', 'logs');
const DATA_DIR          = path.join(__dirname, '..', 'data');
const HARDSTOP_FILE     = path.join(DATA_DIR, 'hardstop-state.json');
const PROMPT_COUNTS_FILE = path.join(DATA_DIR, 'prompt-counts.json');

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

// ── Hardstop threshold checking ──
// Reads context % from StatusLine state + tracks prompt count per session.
// Returns warning text to inject into the prompt (or empty string).
// Staleness guard: ignore state data older than 5 minutes.
const HARDSTOP_STALE_MS = 5 * 60 * 1000;

function checkHardstopThresholds(sid) {
  const warnings = [];

  // ── Context % thresholds (from StatusLine state file) ──
  try {
    const state = JSON.parse(fs.readFileSync(HARDSTOP_FILE, 'utf8'));
    const age = Date.now() - (state.ts || 0);
    if (age < HARDSTOP_STALE_MS && typeof state.usedPct === 'number') {
      const pct = state.usedPct;
      if (pct >= 85) {
        warnings.push(
          'CONTEXT CRITICAL -- MANDATORY HANDOFF: You have used 85%+ of context. ' +
          'You MUST run /orchestrator-handoff immediately. Do not perform any work ' +
          'except writing the handoff document. This is a hard stop.'
        );
      } else if (pct >= 75) {
        // f108: Auto-generate handoff skeleton at L2 to reduce context waste.
        // Only generate once per session (check if draft already exists).
        const sprintDir = path.join(__dirname, '..', 'coordinated-sprint');
        const draftFile = path.join(sprintDir, 'handoff-draft-' + sid.slice(0, 12) + '.md');
        if (!fs.existsSync(draftFile)) {
          try {
            const campaignsFile = path.join(DATA_DIR, 'campaigns.json');
            const dispatchHomeFile = path.join(DATA_DIR, 'dispatch-home.json');
            const campaigns = JSON.parse(fs.readFileSync(campaignsFile, 'utf8'));
            const activeCampaign = campaigns.find(c => c.status === 'active') || {};
            const agents = (activeCampaign.agents || []);
            const orchAgent = agents.filter(a => (a.slot || '').includes('orchestrator')).pop() || {};
            const sprintAgents = agents.filter(a => a.sprint === orchAgent.sprint && !(a.slot || '').includes('orchestrator'));

            // Open PMs
            let openPMs = [];
            try {
              const dhItems = JSON.parse(fs.readFileSync(dispatchHomeFile, 'utf8'));
              openPMs = dhItems.filter(i => i.status === 'open' && (i.tags || []).includes('post-mortem'));
            } catch {}

            const lines = [
              '# Orchestrator ' + (orchAgent.name || 'v?.?') + ' Handoff',
              '',
              '**Date:** ' + new Date().toISOString().slice(0, 10) + ' | **Campaign:** ' + (activeCampaign.id || '?') + ' (' + (activeCampaign.name || '?') + ')',
              '',
              '---',
              '',
              '## What this orchestrator did',
              '',
              '| Component | What It Does |',
              '|-----------|-------------|',
              '| **[FILL IN]** | [describe] |',
              '',
              '---',
              '',
              '## Sprint ' + (orchAgent.sprint || '?') + ' Agents',
              '',
              '| Agent | Grade | Status |',
              '|-------|-------|--------|',
            ];
            for (const a of sprintAgents) {
              lines.push('| ' + (a.name || a.slot) + ' | ' + (a.grade || 'ungraded') + ' | ' + (a.status || '?') + ' |');
            }
            lines.push('', '---', '', '## Delivered', '');
            for (const d of (orchAgent.delivered || [])) {
              lines.push('- ' + d);
            }
            if (!(orchAgent.delivered || []).length) lines.push('- [FILL IN from this session]');
            lines.push('', '## Missed', '');
            for (const m of (orchAgent.missed || [])) {
              lines.push('- ' + m);
            }
            if (!(orchAgent.missed || []).length) lines.push('- [FILL IN]');
            lines.push('', '---', '', '## Open Post-Mortems', '');
            if (openPMs.length) {
              lines.push('| PM | Title | Priority |');
              lines.push('|----|-------|----------|');
              for (const pm of openPMs) {
                lines.push('| ' + pm.id + ' | ' + (pm.title || '').slice(0, 80) + ' | ' + (pm.priority || '?') + ' |');
              }
            } else {
              lines.push('No open PMs.');
            }
            lines.push('', '---', '', '## Critical Tasks for Next Orchestrator', '', '- [FILL IN]', '');
            lines.push('## Context Metrics', '', '- Used: ' + pct + '%', '- Prompt count: ' + (state.promptCount || 0), '');

            if (!fs.existsSync(sprintDir)) fs.mkdirSync(sprintDir, { recursive: true });
            fs.writeFileSync(draftFile, lines.join('\n'));
          } catch {} // never crash the hook
        }
        const draftMsg = fs.existsSync(draftFile)
          ? ' A handoff skeleton has been auto-generated at coordinated-sprint/handoff-draft-' + sid.slice(0, 12) + '.md -- review and fill in the gaps.'
          : '';
        warnings.push(
          'HANDOFF RECOMMENDED: You have used 75%+ of context. Run /orchestrator-handoff ' +
          'to write your handoff doc NOW. Do not dispatch new agents. Focus on documenting ' +
          'what you have done and what remains.' + draftMsg
        );
      } else if (pct >= 60) {
        warnings.push(
          'CONTEXT AWARENESS: You have used 60%+ of your context window. ' +
          'Scope remaining work carefully. Consider what must be done vs what can be deferred.'
        );
      }
    }
  } catch {} // state file may not exist yet -- graceful degradation

  // ── Prompt count thresholds ──
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    let counts = {};
    try { counts = JSON.parse(fs.readFileSync(PROMPT_COUNTS_FILE, 'utf8')); } catch {}
    const prev = counts[sid] || 0;
    const count = prev + 1;
    counts[sid] = count;
    fs.writeFileSync(PROMPT_COUNTS_FILE, JSON.stringify(counts));

    // Also update prompt count in hardstop state file if it exists
    try {
      const state = JSON.parse(fs.readFileSync(HARDSTOP_FILE, 'utf8'));
      state.promptCount = count;
      fs.writeFileSync(HARDSTOP_FILE, JSON.stringify(state));
    } catch {}

    if (count >= 75) {
      warnings.push('PROMPT HARD STOP: 75 prompts processed. Write handoff doc NOW.');
    } else if (count >= 50) {
      warnings.push('PROMPT WARNING: 50 prompts processed. Begin handoff preparation.');
    } else if (count >= 30) {
      warnings.push('PROMPT COUNT: 30 prompts processed. Check your context usage.');
    }
  } catch {} // never crash

  return warnings.join('\n');
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
      let parentSessionId = null;  // Preserved from /api/launch pre-created state
      let dispatchMeta = null;
      try {
        const prev = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
        claudePid = prev.claudePid || null;
        resumeCount = prev.resumeCount || 0;
        displayName = prev.displayName || null;
        parentSessionId = prev.parentSessionId || null;
        dispatchMeta = prev.dispatchMeta || null;
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
        parentSessionId,
        dispatchMeta,
        state: 'thinking',
        emoji: '💭',
        label: 'THINKING',
      };
      fs.writeFileSync(stateFile, JSON.stringify(stateData));

      // ── Campaign auto-linking ──
      // If first prompt mentions a known campaign agent name, auto-link this session
      try {
        const campaignsFile = path.join(__dirname, '..', 'data', 'campaigns.json');
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

    // ── Hardstop threshold injection ──
    // Check context % and prompt count, inject warnings into the prompt via stdout
    try {
      const warning = checkHardstopThresholds(sid);
      if (warning) {
        process.stdout.write('\n' + warning + '\n');
      }
    } catch {} // never crash
  } catch (_) {
    // never crash -- agent must not be disrupted
  }
  process.exit(0);
});
