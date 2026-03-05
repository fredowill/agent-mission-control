#!/usr/bin/env node
// .claude/agent-hub/server.js — Mission Control v6
// Semantic agent dashboard with AI-powered summarization (Cerebras free tier).
// Zero npm dependencies. Apple-inspired white design.
// Usage: node .claude/agent-hub/server.js

const http  = require('http');
const https = require('https');
const fs    = require('fs');
const path  = require('path');


const PORT        = 3033;
const STATES_DIR  = path.join(__dirname, 'states');
const LOGS_DIR    = path.join(__dirname, 'logs');
const PROMPTS_DIR = path.join(__dirname, 'prompts');
const MISSIONS_F  = path.join(__dirname, 'missions.json');
const SUMMARIES_F  = path.join(__dirname, 'summaries.json');
const NORTHSTAR_F  = path.join(__dirname, 'northstar-cache.json');
const DEEP_SUMM_F  = path.join(__dirname, 'deep-summaries.json');
const ENV_FILE    = path.join(__dirname, '.env');
const AGENTS_DIR  = path.join(process.env.HOME || process.env.USERPROFILE || '', '.claude', 'agents');
const COMMANDS_DIR = path.join(process.env.HOME || process.env.USERPROFILE || '', '.claude', 'commands');
// Transcript dir — Claude Code stores conversation .jsonl files here
// Auto-detect transcript dir based on CWD slug (same logic Claude Code uses)
const _cwdSlug = process.cwd().replace(/\\/g, '/').replace(/^([A-Za-z]):\//, (_, d) => d.toUpperCase() + '--').replace(/\//g, '-');
const TRANSCRIPTS_DIR = path.join(process.env.HOME || process.env.USERPROFILE || '', '.claude', 'projects', _cwdSlug);
const LOGIC_HTML_F = path.join(__dirname, 'logic-page.html');
const FINDINGS_HTML_F = path.join(__dirname, 'findings-page.html');
const TOOLS_HTML_F = path.join(__dirname, 'tools-page.html');
const RADAR_HTML_F = path.join(__dirname, 'radar-page.html');
const SOURCES_F    = path.join(__dirname, 'sources.json');
const DISPATCH_HTML_F = path.join(__dirname, 'dispatch-page.html');
const WORKSTREAMS_F   = path.join(__dirname, 'workstreams.json');
const AGENT_WS_F      = path.join(__dirname, 'agent-workstreams.json');
const DISPATCH_F      = path.join(__dirname, 'dispatch.json');
const STALE_MS    = 21_600_000; // 6 hours

// ── Load .env ────────────────────────────────────────────────────────────────
function loadEnv() {
  try {
    const lines = fs.readFileSync(ENV_FILE, 'utf8').split('\n');
    for (const line of lines) {
      const match = line.match(/^\s*([A-Z_]+)\s*=\s*(.+)\s*$/);
      if (match && !process.env[match[1]]) {
        process.env[match[1]] = match[2].trim();
      }
    }
  } catch {}
}
loadEnv();

const CEREBRAS_KEY = process.env.CEREBRAS_API_KEY || '';
const AI_READY     = CEREBRAS_KEY && CEREBRAS_KEY !== 'your-key-here';

// ── Helpers ──────────────────────────────────────────────────────────────────

function readJSON(file, fb) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return fb; }
}
function writeJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

// Session ID must be a UUID or pid-NNNNN format. Reject anything else.
const VALID_SID = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$|^pid-\d+$/;
function isValidSid(sid) { return VALID_SID.test(sid); }

// ── Session Liveness Detection ───────────────────────────────────────────────
// PID-based: each session stores its claude.exe PID (captured by hook.js on
// first fire via PowerShell process-tree walk). Server checks if that PID is
// still alive via a single `tasklist` call per poll (~130ms for all sessions).
// Fallback: timestamp-based for sessions that haven't captured a PID yet.
const { execSync } = require('child_process');
const ACTIVE_THRESHOLD  = 120_000;  // 2 min — fallback for sessions without PID

// Cache live claude.exe PIDs with a short TTL
let _livePidCache = { pids: new Set(), ts: 0 };
const PID_CACHE_TTL = 1500; // 1.5 seconds — reduced from 3s to minimize stale PID window

function getLiveClaudePids() {
  const now = Date.now();
  if (now - _livePidCache.ts < PID_CACHE_TTL) return _livePidCache.pids;
  try {
    const out = execSync('tasklist /FI "IMAGENAME eq claude.exe" /FO CSV /NH',
      { encoding: 'utf8', timeout: 5000, stdio: ['pipe', 'pipe', 'pipe'] }).trim();
    const pids = new Set();
    for (const line of out.split('\n')) {
      const m = line.match(/"claude\.exe","(\d+)"/i);
      if (m) pids.add(parseInt(m[1], 10));
    }
    _livePidCache = { pids, ts: now };
    return pids;
  } catch (_) {
    return _livePidCache.pids; // return stale cache on error
  }
}

// ── Prompt Reader ────────────────────────────────────────────────────────────
// CRITICAL: Prompt files are APPEND-ONLY. Only prompt-hook.js writes to them.
// The server MUST NEVER modify, merge, deduplicate, or overwrite prompt files.
// Each session's prompts are sacred user data captured exactly as submitted.

// MC-004: Filter system/interrupt messages from transcript fallback
function isSystemText(text) {
  const t = text.trimStart();
  return t.startsWith('[Request interrupted') ||
         t.startsWith('<system-reminder>') ||
         t.startsWith('<task-notification>') ||
         t.startsWith('<tool_result>');
}

// MC-004: Detect raw skill expansion markdown leaked from transcript
function isSkillExpansion(text) {
  if (/<command-name>[^<]+<\/command-name>/.test(text)) return true;
  if (/^---\s*\n[\s\S]*?name:\s*\S+[\s\S]*?---/.test(text)) return true;
  if (text.length > 2000 && (text.includes('```') || text.includes('<system') || text.startsWith('---\n'))) return true;
  return false;
}

function readPrompts(sid) {
  // Primary source: hook-captured prompts
  let hookPrompts = [];
  try {
    const lines = fs.readFileSync(path.join(PROMPTS_DIR, `${sid}.ndjson`), 'utf8')
      .trim().split('\n').filter(Boolean);
    hookPrompts = lines.map(l => JSON.parse(l));
  } catch {}

  // Fallback source: conversation transcript (catches prompts after auto-compact)
  // After compact, user prompts appear as:
  //   1. type:'user' with message.content[].type:'text' (normal)
  //   2. type:'queue-operation' with direct content (post-compact)
  let transcriptPrompts = [];
  try {
    const tFile = path.join(TRANSCRIPTS_DIR, `${sid}.jsonl`);
    if (fs.existsSync(tFile)) {
      const tLines = fs.readFileSync(tFile, 'utf8').trim().split('\n').filter(Boolean);
      for (const l of tLines) {
        try {
          const d = JSON.parse(l);
          let text = '';
          if (d.type === 'user') {
            const msg = d.message;
            if (typeof msg === 'string') {
              text = msg;
            } else if (msg && Array.isArray(msg.content)) {
              for (const p of msg.content) {
                if (p.type === 'text') text += p.text;
              }
            }
          } else if (d.type === 'queue-operation' && typeof d.content === 'string') {
            // Post-compact user prompts are stored as queue-operation
            // Filter out system notifications (task-notification, tool results)
            if (!d.content.startsWith('<task-notification>') && !d.content.startsWith('<tool_result>')) {
              text = d.content;
            }
          }
          // MC-004: Skip system messages and raw skill expansions
          if (text && isSystemText(text)) continue;
          if (text && isSkillExpansion(text)) continue;
          // Only include real user text (not tool results, not tiny fragments)
          if (text && text.length > 5) {
            // Timestamps can be Unix ms or ISO strings depending on entry type
            const ts = typeof d.timestamp === 'number' ? d.timestamp
              : typeof d.timestamp === 'string' ? new Date(d.timestamp).getTime()
              : 0;
            if (ts > 0) transcriptPrompts.push({ prompt: text, ts });
          }
        } catch {}
      }
    }
  } catch {}

  // Merge: use hook prompts as primary, fill gaps from transcript
  if (!transcriptPrompts.length) return hookPrompts;
  if (!hookPrompts.length) return transcriptPrompts;

  // Dedup: content prefix (first 80 chars) + timestamp proximity (within 3s of any hook prompt)
  const hookTexts = new Set(hookPrompts.map(p => p.prompt.slice(0, 80)));
  const hookTimes = hookPrompts.map(p => p.ts);
  const extras = transcriptPrompts.filter(p => {
    if (hookTexts.has(p.prompt.slice(0, 80))) return false;
    // MC-004: Skip transcript entries within 3s of any hook prompt (collapsed vs expanded pairs)
    if (hookTimes.some(t => Math.abs(t - p.ts) < 3000)) return false;
    return true;
  });
  if (!extras.length) return hookPrompts;

  return [...hookPrompts, ...extras].sort((a, b) => a.ts - b.ts);
}

// Find all session IDs that share the same claudePid (same terminal window).
// Returns [sid, ...otherSids] — the input sid first, then any chained sessions.
function getChainedSessions(sid) {
  try {
    const state = readJSON(path.join(STATES_DIR, `${sid}.json`), {});
    if (!state.claudePid) return [sid];
    const chain = [sid];
    const allFiles = fs.readdirSync(STATES_DIR).filter(f => f.endsWith('.json'));
    for (const f of allFiles) {
      const other = readJSON(path.join(STATES_DIR, f), {});
      if (other.sessionId !== sid && other.claudePid === state.claudePid) {
        chain.push(other.sessionId);
      }
    }
    return chain;
  } catch { return [sid]; }
}

// Read prompts from a session and all its chained sessions (same terminal)
function readChainedPrompts(sid) {
  const chain = getChainedSessions(sid);
  const all = [];
  for (const s of chain) all.push(...readPrompts(s));
  all.sort((a, b) => a.ts - b.ts);
  return all;
}

function getPromptsHash(sid) {
  const prompts = readChainedPrompts(sid);
  if (!prompts.length) return '';
  return prompts.length + ':' + prompts[prompts.length - 1].ts;
}

// ── Cerebras API Call (OpenAI-compatible) ────────────────────────────────────
// 30 RPM, 1M tokens/day free tier. Llama 3.1 70B.

// Rate limiter: max 25 calls per minute (under 30 RPM free tier)
let apiCallLog = [];
function canCallAPI() {
  const now = Date.now();
  apiCallLog = apiCallLog.filter(ts => now - ts < 60000);
  return apiCallLog.length < 25;
}

function callLLM(prompt, maxTokens = 1024) {
  return new Promise((resolve) => {
    if (!AI_READY) return resolve('');
    if (!canCallAPI()) return resolve('');
    apiCallLog.push(Date.now());

    const payload = JSON.stringify({
      model: 'gpt-oss-120b',
      messages: [{ role: 'user', content: prompt }],
      max_completion_tokens: maxTokens,
      temperature: 0.2,
    });

    const options = {
      hostname: 'api.cerebras.ai',
      path: '/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CEREBRAS_KEY}`,
        'Content-Length': Buffer.byteLength(payload),
      }
    };

    const req = https.request(options, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (res.statusCode !== 200) {
            console.log('[callLLM] error:', res.statusCode, parsed.message || data.slice(0, 100));
            resolve('');
            return;
          }
          const msg = parsed.choices?.[0]?.message || {};
          const text = msg.content || '';
          resolve(text.trim());
        } catch { resolve(''); }
      });
    });
    req.on('error', (e) => { console.log('[callLLM] req error:', e.message); resolve(''); });
    req.setTimeout(15000, () => { console.log('[callLLM] timeout'); req.destroy(); resolve(''); });
    req.write(payload);
    req.end();
  });
}

// ── AI Summarization Cache ───────────────────────────────────────────────────

let summariesCache = readJSON(SUMMARIES_F, {});
let northStarCache = readJSON(NORTHSTAR_F, { themes: [], ts: 0 });
const summarizing  = new Set();

// ── Summarize a single session ───────────────────────────────────────────────

const TRIVIAL = new Set(['yes', 'no', 'ok', 'okay', 'y', 'n', 'sure', 'thanks', 'thank you',
  'go ahead', 'do it', 'proceed', 'continue', 'looks good', 'lgtm', 'approve', 'approved',
  'hello', 'hi', 'hey']);

async function summarizeSession(sid) {
  if (summarizing.has(sid)) return;
  summarizing.add(sid);

  try {
    const prompts = readChainedPrompts(sid);
    if (!prompts.length) return;

    const meaningful = prompts
      .map(p => (p.prompt || '').trim())
      .filter(t => t.length > 15 && !TRIVIAL.has(t.toLowerCase()));

    if (!meaningful.length) return;

    // Feed up to 10 prompts, truncated to 300 chars each
    const promptList = meaningful
      .slice(0, 10)
      .map((p, i) => `${i + 1}. ${p.slice(0, 300)}`)
      .join('\n');

    const result = await callLLM(
      `You are a task summarizer for a coding project dashboard. Given the user prompts from a single Claude Code session, output a concise task title (5-10 words) that captures the overarching goal of this session.

Examples of good titles:
- "Redesigning Mission Control dashboard"
- "Fixing booking form validation"
- "Adding dark mode to gallery page"
- "Setting up email notifications with Resend"
- "Refactoring gallery grid to CSS grid"

Rules:
- Use present participle form (e.g. "Updating...", "Fixing...", "Adding...")
- Focus on WHAT the user is trying to accomplish, not individual steps
- Output ONLY the title, nothing else
- No quotes, no punctuation at the end

User prompts from this session:
${promptList}`
    );

    if (result && result.length > 3 && result.length < 120) {
      // Clean: remove quotes, trailing punctuation
      const clean = result.replace(/^["']|["']$/g, '').replace(/[.!?]+$/, '').trim();
      summariesCache[sid] = { summary: clean, hash: getPromptsHash(sid), ts: Date.now() };
      writeJSON(SUMMARIES_F, summariesCache);
    }
  } catch {} finally {
    summarizing.delete(sid);
  }
}

// ── Summarize North Star themes ──────────────────────────────────────────────

async function summarizeNorthStarThemes(activeAgents) {
  // Only summarize ACTIVE agents — done/idle agents don't belong in Top of Mind
  const agents = activeAgents || [];
  const missions = [];
  for (const a of agents) {
    const m = deriveMission(a.sessionId);
    if (m) missions.push({ hex: a.letter, mission: m });
  }
  console.log('[northstar] starting with', missions.length, 'active missions');

  if (missions.length < 1) {
    northStarCache = { themes: [], topOfMind: '', agents: [], ts: Date.now() };
    writeJSON(NORTHSTAR_F, northStarCache);
    return;
  }

  // Use numeric indices for LLM markers — simple and unambiguous
  const missionList = missions.map((m, i) => `${i}: ${m.mission}`).join('\n');

  const result = await callLLM(
    `Given these coding session titles, list 3-5 overarching themes. For each theme, write the theme name followed by a colon and the number of related sessions.

Example format:
Mission Control dashboard: 4
Booking system: 3
Gallery improvements: 2

Session titles:
${missionList}

List the themes now:`,
    2048
  );

  let themes = northStarCache.themes || [];
  console.log('[northstar] themes result length:', result.length, 'preview:', result.slice(0, 120));
  if (result.length > 5) {
    const parsed = [];
    const lines = result.split('\n').filter(l => l.includes(':'));
    for (const line of lines) {
      const match = line.match(/^[\d.\-*]*\s*(.+?):\s*(\d+)/);
      if (match) {
        parsed.push({ theme: match[1].trim(), count: parseInt(match[2]) });
      }
    }
    if (parsed.length > 0) themes = parsed.slice(0, 5);
    console.log('[northstar] parsed', themes.length, 'themes');
  }

  await new Promise(r => setTimeout(r, 2000));

  // Generate Top of Mind — task-focused briefing with keyword highlights
  // Format: {key phrase|0} where 0 is the agent index — rendered as colored pills
  const topOfMindResult = await callLLM(
    `You are a PM assistant writing a quick status briefing about active coding work. Each line below is a session number followed by what they're working on.

Write 2-3 concise sentences describing the active work. Wrap the most important keyword or phrase for each session in curly braces with the session number, like {interactive 3D globe|0} or {booking flow|1}.

Rules:
- 2-3 sentences max, present tense
- Wrap 1 key phrase per session in {phrase|NUMBER} format
- The phrase should be the core deliverable or feature name (2-5 words)
- Do NOT mention session numbers outside the curly braces
- Be specific to the actual work, not generic
- Output ONLY the briefing text

Example output: "Active work on the {3D globe animation|0} and {mobile nav redesign|2}, while {session summarization|1} is being refined in the background."

Current active sessions:
${missionList}`,
    2048
  );

  console.log('[northstar] topOfMind result length:', topOfMindResult.length, 'preview:', topOfMindResult.slice(0, 80));
  const topOfMind = topOfMindResult && topOfMindResult.length > 20
    ? topOfMindResult.replace(/^["']|["']$/g, '').trim()
    : northStarCache.topOfMind || '';

  // Pass agent hex codes indexed by position so frontend can color pills by index
  const agentMap = missions.map(m => m.hex);

  northStarCache = { themes: themes.length ? themes : (northStarCache.themes || []), topOfMind, agents: agentMap, ts: Date.now() };
  writeJSON(NORTHSTAR_F, northStarCache);
}

// ── Deep Session Summary (detail page) ───────────────────────────────────────
// Generates an in-depth narrative summary with citations back to specific prompts.
// Called on-demand when user opens a session detail page. Cached in deep-summaries.json.

let deepSummariesCache = readJSON(DEEP_SUMM_F, {});
const deepSummarizing  = new Set();

async function generateDeepSummary(sid) {
  if (deepSummarizing.has(sid)) return deepSummariesCache[sid] || null;

  const prompts = readPrompts(sid);
  if (!prompts.length) return null;

  // Check cache freshness
  const hash = getPromptsHash(sid);
  const cached = deepSummariesCache[sid];
  if (cached && cached.hash === hash) return cached;

  deepSummarizing.add(sid);
  try {
    // Build prompt list with timestamps for citation
    const promptEntries = prompts.map((p, i) => {
      const time = new Date(p.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const text = (p.prompt || '').trim();
      return { index: i, time, text, ts: p.ts };
    });

    const meaningful = promptEntries.filter(e => e.text.length > 10 && !TRIVIAL.has(e.text.toLowerCase()));
    if (!meaningful.length) { console.log('[deep-summary] no meaningful prompts for', sid.slice(-6)); return null; }

    const promptList = meaningful
      .map(e => `[Prompt #${e.index} at ${e.time}]: ${e.text.slice(0, 600)}`)
      .join('\n\n');

    console.log('[deep-summary] calling Cerebras for', sid.slice(-6), 'with', meaningful.length, 'prompts');
    const result = await callLLM(
      `You are an expert PM summarizing a developer's coding session. Given the timestamped prompts from a Claude Code session, write a clear narrative summary.

FORMAT YOUR RESPONSE AS JSON with this exact structure:
{
  "overview": "2-3 sentence high-level summary of what this session accomplished",
  "sections": [
    {
      "title": "Short section title (e.g. 'Initial Setup', 'Bug Investigation')",
      "body": "2-4 sentences describing this phase of work",
      "promptRefs": [0, 2]
    }
  ],
  "keyDecisions": ["Decision 1 that was made", "Decision 2"],
  "outcome": "1 sentence: where things ended up"
}

Rules:
- promptRefs are the prompt indices (from [Prompt #N]) that informed each section
- Group related prompts into logical phases of work (3-5 sections max)
- Skip trivial prompts (greetings, "yes", "ok", API keys) — don't cite them
- Focus on the user's INTENT and DECISIONS, not technical details
- Be specific: "Switched from Anthropic API to Gemini free tier" not "Changed API provider"
- Output ONLY valid JSON, no markdown fences, no explanation

Session prompts:
${promptList}`,
      4096
    );

    console.log('[deep-summary] result length:', result.length, 'preview:', result.slice(0, 100));
    try {
      const jsonStr = result.replace(/```json?\s*/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(jsonStr);
      if (parsed.overview && parsed.sections) {
        const summary = { ...parsed, hash, ts: Date.now() };
        deepSummariesCache[sid] = summary;
        writeJSON(DEEP_SUMM_F, deepSummariesCache);
        return summary;
      }
    } catch {}
    return cached || null;
  } catch {
    return cached || null;
  } finally {
    deepSummarizing.delete(sid);
  }
}

// ── Background Summarization Loop ────────────────────────────────────────────

async function runSummarizationLoop() {
  if (!AI_READY) return;

  const stateFiles = fs.existsSync(STATES_DIR)
    ? fs.readdirSync(STATES_DIR).filter(f => f.endsWith('.json'))
    : [];

  const missions = readJSON(MISSIONS_F, {});
  let newSummaries = 0;

  for (const f of stateFiles) {
    try {
      const a = JSON.parse(fs.readFileSync(path.join(STATES_DIR, f), 'utf8'));
      const sid = a.sessionId;

      // Skip if manually overridden
      if (missions[sid]) continue;

      const hash = getPromptsHash(sid);
      if (!hash) continue; // no prompts

      const cached = summariesCache[sid];
      if (cached && cached.hash === hash) continue; // up to date

      await summarizeSession(sid);
      newSummaries++;

      // Rate limit: max 3 per loop, 5 seconds between calls
      if (newSummaries >= 3) break;
      await new Promise(r => setTimeout(r, 5000));
    } catch {}
  }

  // Refresh North Star if we generated new summaries or cache is old (>5 min)
  // Only pass active agents — Top of Mind should reflect current work only
  const nsAge = Date.now() - (northStarCache.ts || 0);
  if (newSummaries > 0 || nsAge > 300_000) {
    const allAgents = readAgents();
    const activeAgents = allAgents.filter(a => a.active);
    await summarizeNorthStarThemes(activeAgents);
  }
}

// Run every 12 seconds (stays within 30 RPM free tier — max ~5 calls/min)
setInterval(runSummarizationLoop, 12_000);
// Run immediately on startup (after a brief delay for server to be ready)
setTimeout(runSummarizationLoop, 2000);

// ── Derive Mission (sync, reads cache) ───────────────────────────────────────

function deriveMission(sid) {
  // Manual override first (check this session and all chained sessions)
  const missions = readJSON(MISSIONS_F, {});
  const chain = getChainedSessions(sid);
  for (const s of chain) {
    if (missions[s]) return missions[s];
  }

  // AI summary from cache (check this session and all chained sessions)
  for (const s of chain) {
    const cached = summariesCache[s];
    if (cached && cached.summary) return cached.summary;
  }

  // No AI summary yet — eagerly trigger summarization in background
  const hash = getPromptsHash(sid);
  if (hash && AI_READY) {
    summarizeSession(sid); // fire-and-forget, async
  }

  // No AI summary yet — return empty. Card will show "Summarizing..." if prompts exist.
  return '';
}

// ── Agents Reader ────────────────────────────────────────────────────────────

const ARCHIVE_MS = 86_400_000; // 24 hours


function readAgents() {
  if (!fs.existsSync(STATES_DIR)) return [];
  const now = Date.now();
  const livePids = getLiveClaudePids();

  // Read all raw state files
  const raw = fs.readdirSync(STATES_DIR)
    .filter(f => f.endsWith('.json'))
    .map(f => {
      try {
        const a = JSON.parse(fs.readFileSync(path.join(STATES_DIR, f), 'utf8'));
        a.ago   = now - a.ts;
        return a;
      } catch { return null; }
    })
    .filter(Boolean)
    .sort((a, b) => b.ts - a.ts);

  // ── Merge sessions that share a claudePid (same terminal window) ──
  // When Claude Code transitions (/plan → implement, /compact, etc.) it creates
  // a new session ID but the same claude.exe process stays alive. These are ONE
  // continuous thread of work — one card, combined prompts, shared history.
  const pidGroups = new Map();  // claudePid → [sessions] (newest first)
  const orphans = [];           // sessions without a PID

  for (const a of raw) {
    if (a.claudePid) {
      if (!pidGroups.has(a.claudePid)) pidGroups.set(a.claudePid, []);
      pidGroups.get(a.claudePid).push(a);
    } else {
      orphans.push(a);
    }
  }

  const agents = [];

  // For each PID group: merge into a single card
  for (const [pid, sessions] of pidGroups) {
    // sessions already sorted newest-first (from raw sort)
    const newest = sessions[0];
    const allSids = sessions.map(s => s.sessionId);

    // Merge: newest session's state, combined prompts/history from all
    const merged = { ...newest };
    merged.chainedSessions = allSids; // all session IDs in this terminal
    merged.sessionId = newest.sessionId; // card identity = newest session

    // Mission: use first non-empty mission from any session in chain
    merged.mission = '';
    for (const s of sessions) {
      const m = deriveMission(s.sessionId);
      if (m) { merged.mission = m; break; }
    }

    // Prompts: check across ALL chained sessions
    merged.hasPrompts = allSids.some(sid => readPrompts(sid).length > 0);

    // Detect if summary is stale (new prompts came in since last summarization)
    merged.isSummarizing = false;
    if (merged.hasPrompts) {
      const currentHash = getPromptsHash(newest.sessionId);
      const cached = summariesCache[newest.sessionId];
      if (!cached || !cached.summary) {
        merged.isSummarizing = true; // never summarized yet
      } else if (cached.hash !== currentHash) {
        merged.isSummarizing = true; // new prompts since last summary
      }
    }

    // Context switches: how many times this terminal transitioned
    // (e.g. /plan → implement, /compact). 0 = fresh, 1+ = tenured agent.
    merged.contextSwitches = allSids.length - 1;

    // Resume count: how many times this session was /resumed in a new terminal
    // Sum across all chained sessions (each may have its own resumeCount)
    merged.resumeCount = sessions.reduce((sum, s) => sum + (s.resumeCount || 0), 0);

    // Liveness: based on whether this PID is alive
    if (livePids.has(pid)) {
      merged.active = true;
      merged.done   = false;
    } else {
      merged.active = false;
      merged.done   = true;
    }

    merged.stale    = merged.done && merged.ago > STALE_MS;
    merged.archived = merged.done && merged.ago > ARCHIVE_MS;
    agents.push(merged);
  }

  // Orphan sessions (no PID): fallback to timestamp-based liveness
  // Exception: "waiting" state is preserved indefinitely — user hasn't answered yet
  for (const a of orphans) {
    a.active = a.state === 'waiting' || a.ago < ACTIVE_THRESHOLD;
    a.done   = !a.active;
    a.stale    = a.done && a.ago > STALE_MS;
    a.archived = a.done && a.ago > ARCHIVE_MS;
    a.mission  = deriveMission(a.sessionId);
    a.hasPrompts = readPrompts(a.sessionId).length > 0;
    a.isSummarizing = false;
    if (a.hasPrompts) {
      const currentHash = getPromptsHash(a.sessionId);
      const cached = summariesCache[a.sessionId];
      if (!cached || !cached.summary) {
        a.isSummarizing = true;
      } else if (cached.hash !== currentHash) {
        a.isSummarizing = true;
      }
    }
    a.chainedSessions = [a.sessionId];
    agents.push(a);
  }

  agents.sort((a, b) => b.ts - a.ts);

  // Use stable hex ID instead of flip-flopping letters
  agents.forEach(a => {
    a.letter = a.sessionId.slice(-6);
  });

  // Merge workstream assignment data into each agent
  const agentWs = readJSON(AGENT_WS_F, {});
  const wsList = readJSON(WORKSTREAMS_F, []);
  agents.forEach(a => {
    const assignment = agentWs[a.sessionId];
    if (assignment) {
      a.workstream = assignment.workstream;
      a.wsTags = assignment.tags || [];
      a.wsAssignedBy = assignment.assignedBy;
    } else {
      a.workstream = null;
      a.wsTags = [];
      a.wsAssignedBy = null;
    }
    // Resolve workstream color/name for frontend
    const ws = wsList.find(w => w.id === a.workstream);
    a.wsName = ws ? ws.name : null;
    a.wsColor = ws ? ws.color : null;
  });

  return agents;
}

// ── Tools Reader ─────────────────────────────────────────────────────────────
// Reads .claude/agents/*.md and .claude/commands/*.md, parses YAML frontmatter.

function parseFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return { meta: {}, body: content };
  const meta = {};
  match[1].split(/\r?\n/).forEach(line => {
    const idx = line.indexOf(':');
    if (idx < 1) return;
    const key = line.slice(0, idx).trim();
    let val = line.slice(idx + 1).trim();
    // Strip surrounding quotes
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (key && val) meta[key] = val;
  });
  return { meta, body: content.slice(match[0].length) };
}

function readToolsData() {
  const agents = [];
  const commands = [];

  // Read custom agents
  try {
    const files = fs.readdirSync(AGENTS_DIR).filter(f => f.endsWith('.md'));
    for (const f of files) {
      try {
        const content = fs.readFileSync(path.join(AGENTS_DIR, f), 'utf8');
        const { meta } = parseFrontmatter(content);
        const tools = (meta.tools || '').split(',').map(t => t.trim()).filter(Boolean);
        const canEdit = tools.some(t => ['Edit', 'Write'].includes(t));
        const canBash = tools.includes('Bash');
        agents.push({
          name: meta.name || f.replace('.md', ''),
          description: meta.description || '',
          model: meta.model || 'sonnet',
          tools,
          canEdit,
          canBash,
        });
      } catch {}
    }
  } catch {}

  // Read slash commands
  try {
    const files = fs.readdirSync(COMMANDS_DIR).filter(f => f.endsWith('.md'));
    for (const f of files) {
      try {
        const content = fs.readFileSync(path.join(COMMANDS_DIR, f), 'utf8');
        // Commands don't have frontmatter, extract first line as description
        const lines = content.trim().split('\n');
        let description = '';
        for (const line of lines) {
          const clean = line.replace(/^#+\s*/, '').trim();
          if (clean.length > 10 && clean.length < 200) { description = clean; break; }
        }
        commands.push({
          name: f.replace('.md', ''),
          description,
        });
      } catch {}
    }
  } catch {}

  const builtins = [
    { name: 'Explore', model: 'haiku', description: 'Fast codebase exploration — find files, search code, answer questions about the codebase' },
    { name: 'Plan', model: 'inherit', description: 'Software architect — designs implementation plans, identifies critical files, considers trade-offs' },
    { name: 'general-purpose', model: 'inherit', description: 'General-purpose agent for complex multi-step tasks, code search, and research' },
    { name: 'claude-code-guide', model: 'inherit', description: 'Answers questions about Claude Code features, hooks, MCP servers, settings, IDE integrations' },
    { name: 'statusline-setup', model: 'inherit', description: 'Configures Claude Code status line settings' },
  ];

  return { agents, commands, builtins };
}

// ── Logic Introspection ─────────────────────────────────────────────────────

function readLogicData() {
  const now = Date.now();
  const settingsFile = path.join(__dirname, '..', 'settings.json');
  const stateFiles = fs.existsSync(STATES_DIR) ? fs.readdirSync(STATES_DIR).filter(f => f.endsWith('.json')) : [];
  const logFiles = fs.existsSync(LOGS_DIR) ? fs.readdirSync(LOGS_DIR).filter(f => f.endsWith('.ndjson')) : [];
  const promptFiles = fs.existsSync(PROMPTS_DIR) ? fs.readdirSync(PROMPTS_DIR).filter(f => f.endsWith('.ndjson')) : [];
  const stateSids = new Set(stateFiles.map(f => f.replace('.json', '')));
  const logSids = new Set(logFiles.map(f => f.replace('.ndjson', '')));
  const promptSids = new Set(promptFiles.map(f => f.replace('.ndjson', '')));
  const allSids = new Set([...stateSids, ...logSids, ...promptSids]);

  const sessions = [];
  for (const sid of allSids) {
    const hasState = stateSids.has(sid);
    const hasLog = logSids.has(sid);
    const hasPrompts = promptSids.has(sid);
    let state = null, lastTool = null, stateAge = null;
    if (hasState) {
      try {
        const s = JSON.parse(fs.readFileSync(path.join(STATES_DIR, sid + '.json'), 'utf8'));
        state = s.state; lastTool = s.tool; stateAge = now - s.ts;
      } catch {}
    }
    let promptCount = 0, logCount = 0;
    if (hasPrompts) { try { promptCount = fs.readFileSync(path.join(PROMPTS_DIR, sid + '.ndjson'), 'utf8').trim().split('\n').filter(Boolean).length; } catch {} }
    if (hasLog) { try { logCount = fs.readFileSync(path.join(LOGS_DIR, sid + '.ndjson'), 'utf8').trim().split('\n').filter(Boolean).length; } catch {} }
    const hasSummary = !!(summariesCache[sid]);
    const hasDeepSummary = !!(deepSummariesCache[sid]);
    const mission = deriveMission(sid);
    const issues = [];
    if (hasState && !hasLog) issues.push('State but no log');
    if (hasLog && !hasState) issues.push('Log but no state');
    if (hasState && !hasPrompts) issues.push('State but no prompts');
    if (state === 'investigating' && stateAge > 3600000) issues.push('Stuck investigating >1h');
    if (state === 'developing' && stateAge > 7200000) issues.push('Stuck developing >2h');
    if (promptCount > 5 && !hasSummary && AI_READY) issues.push('No AI summary yet');
    sessions.push({ sid: sid.slice(-6), fullSid: sid, hasState, hasLog, hasPrompts, state, lastTool, stateAge, promptCount, logCount, hasSummary, hasDeepSummary, mission, issues });
  }

  const hookIssues = [];
  try {
    const hc = JSON.parse(fs.readFileSync(settingsFile, 'utf8'));
    const hooks = hc.hooks || {};
    if (!(hooks.PostToolUse || []).some(h => h.hooks?.some(hh => hh.command?.includes('hook.js')))) hookIssues.push('PostToolUse hook.js not wired');
    if (!(hooks.UserPromptSubmit || []).some(h => h.hooks?.some(hh => hh.command?.includes('prompt-hook.js')))) hookIssues.push('prompt-hook.js not wired');
    if (!(hooks.Stop || []).some(h => h.hooks?.some(hh => hh.command?.includes('hook.js')))) hookIssues.push('Stop hook.js not wired');
  } catch { hookIssues.push('Cannot read settings.json'); }

  const summaryCount = Object.keys(summariesCache).length;
  const deepSummaryCount = Object.keys(deepSummariesCache).length;
  const northStarAge = now - (northStarCache.ts || 0);
  let staleSummaries = 0;
  for (const sid of stateSids) { const h = getPromptsHash(sid); const c = summariesCache[sid]; if (h && c && c.hash !== h) staleSummaries++; }

  const globalIssues = [];
  if (!AI_READY) globalIssues.push({ severity: 'warn', msg: 'Cerebras API key not set' });
  if (staleSummaries > 0) globalIssues.push({ severity: 'info', msg: staleSummaries + ' stale summary(ies)' });
  hookIssues.forEach(h => globalIssues.push({ severity: 'error', msg: h }));

  const activeCount = sessions.filter(s => s.active).length;

  const pipeline = [
    { id: 'user', label: 'User Prompt', type: 'input' },
    { id: 'hooks', label: 'Hooks Layer', type: 'process', children: [
      { id: 'prompt-hook', label: 'prompt-hook.js', event: 'UserPromptSubmit', writes: 'prompts/', status: hookIssues.some(h => h.includes('prompt-hook')) ? 'broken' : 'ok' },
      { id: 'hook-post', label: 'hook.js', event: 'PostToolUse', writes: 'states/ + logs/', status: hookIssues.some(h => h.includes('PostToolUse')) ? 'broken' : 'ok' },
      { id: 'hook-stop', label: 'hook.js', event: 'Stop', writes: 'states/ (idle)', status: hookIssues.some(h => h.includes('Stop')) ? 'broken' : 'ok' },
    ]},
    { id: 'files', label: 'File Layer', type: 'storage', children: [
      { id: 'states', label: 'states/', count: stateFiles.length },
      { id: 'logs', label: 'logs/', count: logFiles.length },
      { id: 'prompts', label: 'prompts/', count: promptFiles.length },
      { id: 'summaries', label: 'summaries.json', count: summaryCount },
      { id: 'deep-summ', label: 'deep-summaries.json', count: deepSummaryCount },
      { id: 'northstar', label: 'northstar-cache.json', themes: (northStarCache.themes || []).length, age: northStarAge },
      { id: 'missions', label: 'missions.json', count: Object.keys(readJSON(MISSIONS_F, {})).length },
    ]},
    { id: 'server', label: 'Server', type: 'process', children: [
      { id: 'bg-loop', label: 'Summarization Loop', interval: '30s' },
      { id: 'cerebras', label: 'Cerebras API', status: AI_READY ? 'ok' : 'off', calls: apiCallLog.filter(ts => now - ts < 60000).length },
      { id: 'liveness', label: 'PID Liveness', count: activeCount, method: 'claude.exe PID alive', livePids: getLiveClaudePids().size },
    ]},
    { id: 'api', label: 'API Layer', type: 'interface', children: [
      { id: 'ep-agents', label: '/api/agents' }, { id: 'ep-northstar', label: '/api/northstar' },
      { id: 'ep-session', label: '/api/session/:id' }, { id: 'ep-summary', label: '/api/session/:id/summary' },
      { id: 'ep-missions', label: '/api/missions' }, { id: 'ep-tools', label: '/api/tools' }, { id: 'ep-logic', label: '/api/logic' },
    ]},
    { id: 'browser', label: 'Dashboard UI', type: 'output' },
  ];

  return { ts: now, pipeline, sessions, health: { aiReady: AI_READY, activeSessions: activeCount, states: stateFiles.length, logs: logFiles.length, prompts: promptFiles.length, summaries: summaryCount, deepSummaries: deepSummaryCount, staleSummaries, northStarAge, northStarThemes: (northStarCache.themes || []).length, apiCallsLastMin: apiCallLog.filter(ts => now - ts < 60000).length }, issues: globalIssues };
}

// ── UI Zoom (single source of truth for all pages) ──────────────────────────
const UI_ZOOM = 1.3;

// ── Dashboard HTML ───────────────────────────────────────────────────────────

const DASHBOARD = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Mission Control</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=DM+Sans:wght@400;500&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>

  html { zoom: ${UI_ZOOM} }
  *, *::before, *::after { margin:0; padding:0; box-sizing:border-box }

  :root {
    --bg: #ffffff;
    --bg-page: #f8f8f8;
    --surface: #f2f2f2;
    --surface2: #e8e8e8;
    --text: #1a1a1a;
    --text2: #555;
    --text3: #999;
    --sep: #e5e5e5;

    --green: #22c55e;
    --green-bg: rgba(34, 197, 94, 0.08);
    --blue: #3b82f6;
    --blue-bg: rgba(59, 130, 246, 0.08);
    --amber: #f59e0b;
    --amber-bg: rgba(245, 158, 11, 0.08);
    --purple: #8b5cf6;
    --purple-bg: rgba(139, 92, 246, 0.08);
    --rose: #ef4444;
    --rose-bg: rgba(239, 68, 68, 0.06);
    --gray: #9ca3af;
  }

  body {
    background: var(--bg-page);
    color: var(--text);
    font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
    min-height: 100vh;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  /* ================================================================
     HEADER
     ================================================================ */
  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 clamp(24px, 4vw, 48px);
    height: 64px;
    background: var(--bg);
    border-bottom: 1px solid var(--sep);
    position: sticky;
    top: 0;
    z-index: 10;
  }

  .logo {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .logo-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--gray);
    transition: background 0.4s ease;
  }
  .logo-dot.active { background: var(--green) }
  .logo-dot.waiting { background: var(--amber); animation: blink 1.4s ease-in-out infinite }

  .logo-text {
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 15px;
    font-weight: 600;
    letter-spacing: -0.02em;
    color: var(--text);
  }

  .header-nav {
    display: flex;
    gap: 4px;
    padding: 3px;
    background: var(--surface);
    border-radius: 8px;
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
  }
  .nav-link {
    padding: 5px 14px;
    border-radius: 6px;
    font-family: 'DM Sans', sans-serif;
    font-size: 13px;
    font-weight: 500;
    color: var(--text3);
    text-decoration: none;
    transition: all 0.15s ease;
  }
  .nav-link:hover { color: var(--text2) }
  .nav-link.active {
    background: var(--bg);
    color: var(--text);
    box-shadow: 0 1px 3px rgba(0,0,0,0.06);
  }
  .header-spacer { flex: 1 }

  .hstats {
    display: flex;
    gap: 6px;
  }
  .stat-pill {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 5px 12px;
    border-radius: 100px;
    background: var(--surface);
    font-family: 'DM Sans', sans-serif;
    font-size: 13px;
    color: var(--text2);
  }
  .stat-pill .count {
    font-weight: 600;
    color: var(--text);
  }
  .stat-pill.has-waiting {
    background: var(--amber-bg);
    color: #92400e;
  }
  .stat-pill.has-waiting .count { color: #92400e }
  .sdot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    flex-shrink: 0;
  }
  .sdot-on   { background: var(--green) }
  .sdot-wait { background: var(--amber); animation: blink 1.4s ease-in-out infinite }
  .sdot-off  { background: var(--gray) }
  .sdot-done { background: var(--green); opacity: 0.4 }

  @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} }
  @keyframes pulse { 0%,100%{opacity:0.4} 50%{opacity:1} }

  /* ================================================================
     LAYOUT
     ================================================================ */
  .shell {
    max-width: 1200px;
    margin: 0 auto;
    padding: clamp(24px, 4vw, 48px);
  }

  .page-title {
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: clamp(28px, 4vw, 38px);
    font-weight: 700;
    letter-spacing: -0.035em;
    color: var(--text);
    margin-bottom: 8px;
    line-height: 1.1;
  }
  .page-sub {
    font-size: 15px;
    color: var(--text3);
    margin-bottom: 36px;
  }

  /* ================================================================
     TOP OF MIND
     ================================================================ */
  .tom-section {
    margin-bottom: 28px;
    padding: 20px 24px;
    background: var(--bg);
    border-radius: 14px;
    border: 1px solid var(--sep);
  }

  .tom-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 14px;
  }
  .tom-label {
    font-family: 'DM Sans', sans-serif;
    font-size: 12px;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--text3);
  }
  .tom-ago {
    font-family: 'DM Mono', monospace;
    font-size: 11px;
    color: var(--text3);
    opacity: 0.5;
  }

  .tom-text {
    font-family: 'DM Sans', sans-serif;
    font-size: 15px;
    font-weight: 400;
    line-height: 1.75;
    color: var(--text2);
  }
  .tom-pill {
    font-weight: 600;
    color: var(--text);
  }

  .tom-topics {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid var(--sep);
  }
  .ns-chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 7px 16px;
    border-radius: 100px;
    background: var(--surface);
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 14px;
    font-weight: 500;
    color: var(--text);
    letter-spacing: -0.01em;
    transition: background 0.15s ease;
  }
  .ns-chip:hover { background: var(--surface2) }
  .ns-chip .ns-count {
    font-family: 'DM Mono', monospace;
    font-size: 11px;
    color: var(--text3);
    background: var(--surface2);
    padding: 1px 6px;
    border-radius: 100px;
  }
  .ns-chip:hover .ns-count { background: var(--bg) }

  .ns-empty {
    font-size: 13px;
    color: var(--text3);
    font-style: italic;
  }
  .ns-noai {
    font-size: 13px;
    color: var(--text3);
    font-style: italic;
    margin-bottom: 28px;
  }
  .ns-noai code {
    font-size: 11px;
    background: var(--surface);
    padding: 1px 5px;
    border-radius: 3px;
  }
  .ns-noai a {
    color: var(--blue);
    text-decoration: none;
  }
  .ns-noai a:hover { text-decoration: underline }

  /* Filter tabs */
  .filters {
    display: flex;
    gap: 4px;
    margin-bottom: 24px;
    padding: 3px;
    background: var(--surface);
    border-radius: 10px;
    width: fit-content;
  }
  .filter-btn {
    padding: 7px 16px;
    border-radius: 8px;
    border: none;
    background: transparent;
    font-family: 'DM Sans', sans-serif;
    font-size: 13px;
    font-weight: 500;
    color: var(--text3);
    cursor: pointer;
    transition: all 0.15s ease;
  }
  .filter-btn:hover { color: var(--text2) }
  .filter-btn.active {
    background: var(--bg);
    color: var(--text);
    box-shadow: 0 1px 3px rgba(0,0,0,0.06);
  }
  .filter-count {
    font-size: 11px;
    margin-left: 4px;
    opacity: 0.5;
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
    gap: 16px;
  }

  /* ================================================================
     AGENT CARD
     ================================================================ */
  .card {
    background: var(--bg);
    border-radius: 14px;
    border: 1px solid var(--sep);
    overflow: hidden;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
    position: relative;
  }
  .card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0,0,0,0.04);
  }

  .card::before {
    content: '';
    position: absolute;
    left: 0; top: 0; bottom: 0;
    width: 3px;
    background: var(--card-accent, var(--gray));
    border-radius: 3px 0 0 3px;
    opacity: 0.7;
    transition: opacity 0.2s ease;
  }
  .card:hover::before { opacity: 1 }

  .card-body { padding: 20px 24px }

  .card-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }
  .state-pill {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 3px 10px;
    border-radius: 100px;
    font-family: 'DM Sans', sans-serif;
    font-size: 12px;
    font-weight: 500;
    letter-spacing: 0.01em;
  }
  .state-pill .sdot { width: 5px; height: 5px }
  .state-pill.s-investigating { background: var(--blue-bg); color: #1d4ed8 }
  .state-pill.s-investigating .sdot { background: var(--blue) }
  .state-pill.s-developing { background: var(--amber-bg); color: #92400e }
  .state-pill.s-developing .sdot { background: var(--amber) }
  .state-pill.s-planning { background: var(--purple-bg); color: #6d28d9 }
  .state-pill.s-planning .sdot { background: var(--purple) }
  .state-pill.s-verifying { background: var(--green-bg); color: #166534 }
  .state-pill.s-verifying .sdot { background: var(--green) }
  .state-pill.s-waiting { background: var(--amber-bg); color: #92400e }
  .state-pill.s-waiting .sdot { background: var(--amber); animation: blink 1.4s ease-in-out infinite }
  .state-pill.s-thinking { background: var(--purple-bg); color: #6d28d9 }
  .state-pill.s-thinking .sdot { background: var(--purple); animation: blink 2s ease-in-out infinite }
  .state-pill.s-done { background: var(--green-bg); color: #166534 }
  .state-pill.s-done .sdot { background: var(--green); opacity: 0.5 }
  .state-pill.s-idle { background: var(--surface); color: var(--text3) }
  .state-pill.s-idle .sdot { background: var(--gray); opacity: 0.4 }

  .card-ago {
    font-family: 'DM Mono', monospace;
    font-size: 12px;
    color: var(--text3);
  }

  .card-mission {
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 17px;
    font-weight: 600;
    color: var(--text);
    line-height: 1.35;
    margin-bottom: 6px;
    letter-spacing: -0.02em;
  }

  .card-no-prompt {
    font-size: 14px;
    color: var(--text3);
    font-style: italic;
    line-height: 1.5;
    margin-bottom: 6px;
  }

  .card-summarizing {
    font-size: 13px;
    color: var(--blue);
    line-height: 1.5;
    margin-bottom: 6px;
    animation: pulse 2s ease-in-out infinite;
  }

  .needs-input {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    margin-bottom: 12px;
    border-radius: 8px;
    background: var(--amber-bg);
    font-family: 'DM Sans', sans-serif;
    font-size: 13px;
    font-weight: 500;
    color: #92400e;
  }
  .needs-input-dot {
    width: 6px; height: 6px;
    border-radius: 50%;
    background: var(--amber);
    animation: blink 1.4s ease-in-out infinite;
    flex-shrink: 0;
  }

  .card-footer {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 8px;
    position: absolute;
    bottom: 8px;
    right: 12px;
  }
  .card-id {
    font-family: 'DM Mono', monospace;
    font-size: 11px;
    color: var(--text3);
    opacity: 0.5;
  }

  .ctx-badge {
    font-family: 'DM Mono', monospace;
    font-size: 10px;
    font-weight: 600;
    color: var(--purple);
    background: rgba(139,92,246,0.08);
    padding: 1px 6px;
    border-radius: 4px;
    letter-spacing: 0.02em;
  }
  .resume-badge {
    font-family: 'DM Mono', monospace;
    font-size: 10px;
    font-weight: 600;
    color: var(--blue);
    background: rgba(59,130,246,0.08);
    padding: 1px 6px;
    border-radius: 4px;
    letter-spacing: 0.02em;
  }

  .card-ws {
    display: flex; align-items: center; gap: 5px;
    font-size: 11px; font-weight: 500; color: var(--text3);
    margin-top: 4px;
  }
  .card-ws-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0 }
  .ws-suggest {
    display: flex; align-items: center; gap: 8px;
    margin-top: 8px; padding: 6px 10px;
    background: rgba(139,92,246,0.06); border-radius: 8px;
    font-size: 11px; color: var(--text2);
  }
  .ws-suggest span { flex: 1 }
  .ws-suggest b { color: var(--purple) }
  .ws-accept {
    font-size: 11px; font-weight: 600; color: var(--purple);
    background: none; border: 1px solid rgba(139,92,246,0.3);
    border-radius: 4px; padding: 2px 8px; cursor: pointer;
    font-family: 'DM Sans', sans-serif;
  }
  .ws-accept:hover { background: rgba(139,92,246,0.1) }
  .ws-dismiss {
    font-size: 13px; color: var(--text3); background: none; border: none;
    cursor: pointer; padding: 0 4px;
  }
  .ws-dismiss:hover { color: var(--text) }
  .card-tag {
    font-family: 'DM Mono', monospace; font-size: 9px; font-weight: 500;
    padding: 1px 6px; border-radius: 100px;
    background: var(--surface); color: var(--text3);
  }

  /* Workstream filter row */
  .ws-filters {
    display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap; align-items: center;
  }
  .ws-fpill {
    display: flex; align-items: center; gap: 5px;
    padding: 5px 12px; border-radius: 100px;
    font-size: 12px; font-weight: 500;
    background: var(--bg); border: 1px solid var(--sep);
    color: var(--text3); cursor: pointer;
    transition: all .15s; user-select: none;
  }
  .ws-fpill:hover { border-color: var(--text3) }
  .ws-fpill.active { border-color: var(--purple); color: var(--purple); background: rgba(139,92,246,0.06) }
  .ws-fpill .wf-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0 }
  .ws-fpill .wf-count {
    font-family: 'DM Mono', monospace; font-size: 10px;
    padding: 0 5px; border-radius: 100px;
    background: var(--surface); color: var(--text3);
  }

  .card.stale { opacity: 0.45; border-color: transparent }
  .card.stale:hover { opacity: 0.7 }
  .card.done { opacity: 0.7 }

  /* ================================================================
     EMPTY STATE
     ================================================================ */
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 120px 24px;
    text-align: center;
  }
  .empty-state .dot-ring {
    width: 48px; height: 48px;
    border-radius: 50%;
    border: 2px solid var(--sep);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 20px;
  }
  .empty-state .dot-ring .inner {
    width: 8px; height: 8px;
    border-radius: 50%;
    background: var(--gray);
    opacity: 0.4;
  }
  .empty-state h2 {
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 18px;
    font-weight: 600;
    letter-spacing: -0.02em;
    color: var(--text2);
    margin-bottom: 8px;
  }
  .empty-state p {
    font-size: 14px;
    color: var(--text3);
    max-width: 360px;
    line-height: 1.6;
  }

  @media (max-width: 800px) {
    .grid { grid-template-columns: 1fr }
    .shell { padding: 20px 16px }
    .page-title { font-size: 24px }
  }
</style>
</head>
<body>

<header>
  <div class="logo">
    <div class="logo-dot" id="logo-dot"></div>
    <div class="logo-text">Mission Control</div>
  </div>
  <nav class="header-nav">
    <a href="/" class="nav-link active">Dashboard</a>
    <a href="/dispatch" class="nav-link">Dispatch</a>
    <a href="/findings" class="nav-link">Findings</a>
    <a href="/tools" class="nav-link">Toolbox</a>
    <a href="/logic" class="nav-link">Logic</a>
    <a href="/radar" class="nav-link">Radar</a>
  </nav>
  <div class="hstats" id="stats"></div>
</header>

<div class="shell">
  <div id="main"></div>
</div>

<script>
const STATE_ACCENT = {
  investigating: 'var(--blue)',
  developing:    'var(--amber)',
  planning:      'var(--purple)',
  waiting:       'var(--amber)',
  verifying:     'var(--green)',
  thinking:      'var(--purple)',
  done:          'var(--green)',
  idle:          'var(--gray)',
};

const STATE_LABEL = {
  investigating: 'Researching',
  developing:    'Writing',
  planning:      'Planning',
  waiting:       'Needs input',
  verifying:     'Verifying',
  thinking:      'Thinking',
  done:          'Done',
  idle:          'Idle',
};

if ('Notification' in window && Notification.permission === 'default') {
  Notification.requestPermission();
}
const notifiedSessions = new Set();

function notify(title, body) {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, { body, tag: 'mc-input' });
  }
}

function ago(ms) {
  if (ms < 5000) return 'now';
  const s = Math.floor(ms / 1000);
  if (s < 60) return s + 's ago';
  const m = Math.floor(s / 60);
  if (m < 60) return m + 'm ago';
  const hr = Math.floor(m / 60);
  if (hr < 24) return hr + 'h ago';
  return Math.floor(hr / 24) + 'd ago';
}

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function renderCard(a) {
  const isWaiting = a.active && a.state === 'waiting';
  const stateKey  = a.done ? 'done' : a.state;
  const accent    = STATE_ACCENT[stateKey] || 'var(--gray)';
  const label     = STATE_LABEL[stateKey] || stateKey;
  const sid       = a.sessionId || '???';
  const short     = sid.slice(-6);
  const mission   = a.mission || '';
  const letter    = a.letter || '?';

  let cardCls = 'card';
  if (a.done) cardCls += ' done';

  if (isWaiting && !notifiedSessions.has(sid)) {
    notifiedSessions.add(sid);
    notify('Agent needs your input', mission || 'Agent #' + short);
  }
  if (!isWaiting) notifiedSessions.delete(sid);

  let inputBanner = '';
  if (isWaiting) {
    inputBanner = '<div class="needs-input"><span class="needs-input-dot"></span>Waiting for your input</div>';
  }

  // Workstream badge
  let wsHtml = '';
  if (a.wsName) {
    wsHtml = '<div class="card-ws"><span class="card-ws-dot" style="background:' + (a.wsColor || '#9ca3af') + '"></span>' + esc(a.wsName) + '</div>';
  }

  let heroHtml = '';
  if (mission && a.isSummarizing) {
    heroHtml = '<div class="card-mission">' + esc(mission) + '</div>'
      + wsHtml
      + '<div class="card-summarizing">Re-summarizing...</div>';
  } else if (mission) {
    heroHtml = '<div class="card-mission">' + esc(mission) + '</div>' + wsHtml;
  } else if (a.hasPrompts || (a.active && !a.done)) {
    heroHtml = '<div class="card-summarizing">Summarizing...</div>' + wsHtml;
  } else {
    heroHtml = '<div class="card-no-prompt">No prompt captured yet</div>' + wsHtml;
  }

  // Tag pills
  let tagPills = '';
  if (a.wsTags && a.wsTags.length) {
    tagPills = a.wsTags.map(t => '<span class="card-tag">' + esc(t) + '</span>').join('');
  }

  return '<a href="/session/' + esc(sid) + '" class="' + cardCls + '" style="--card-accent:' + accent + ';text-decoration:none;color:inherit;display:block" data-sid="' + esc(sid) + '" data-ws="' + (a.workstream || '') + '">'
    + '<div class="card-body">'
    + '<div class="card-top">'
    + '<span class="state-pill s-' + stateKey + '"><span class="sdot"></span>' + esc(label) + '</span>'
    + '<span class="card-ago">' + ago(a.ago) + '</span>'
    + '</div>'
    + inputBanner
    + heroHtml
    + '</div>'
    + '<div class="card-footer">'
    + tagPills
    + (a.resumeCount > 0 ? '<span class="resume-badge" title="Resumed ' + a.resumeCount + ' time' + (a.resumeCount > 1 ? 's' : '') + ' in a new terminal">' + a.resumeCount + 'x resume</span>' : '')
    + (a.contextSwitches > 0 ? '<span class="ctx-badge" title="' + a.contextSwitches + ' context transition' + (a.contextSwitches > 1 ? 's' : '') + ' (/plan, /compact, etc.)">' + a.contextSwitches + 'x ctx</span>' : '')
    + '<span class="card-id">' + esc(letter) + '</span>'
    + '</div>'
    + '</a>';
}

function renderNorthStar(data) {
  const PILL_COLORS = ['#22c55e','#3b82f6','#f59e0b','#8b5cf6','#ef4444','#06b6d4','#ec4899','#f97316'];

  function pillColor(idx) {
    return PILL_COLORS[idx % PILL_COLORS.length];
  }

  if (!data.aiReady) {
    return '<div class="ns-noai">Add your Cerebras API key to <code>.claude/agent-hub/.env</code> to enable AI summaries. <a href="https://cloud.cerebras.ai" target="_blank">Get free key</a></div>';
  }

  let h = '<div class="tom-section">';

  // Header
  const tsAge = data.ts ? ago(Date.now() - data.ts) : '';
  h += '<div class="tom-head">';
  h += '<span class="tom-label">Top of Mind</span>';
  if (tsAge) h += '<span class="tom-ago">' + tsAge + '</span>';
  h += '</div>';

  // Briefing text
  if (data.topOfMind) {
    let tomHtml = esc(data.topOfMind);
    tomHtml = tomHtml.replace(/\\{(.+?)\\|(\\d+)\\}/g, (_, phrase, idxStr) => {
      const color = pillColor(parseInt(idxStr, 10));
      return '<span class="tom-pill" style="color:' + color + '">' + phrase + '</span>';
    });
    h += '<div class="tom-text">' + tomHtml + '</div>';
  } else {
    h += '<span class="ns-empty">Generating briefing...</span>';
  }

  // Topic pills
  if (data.themes && data.themes.length) {
    h += '<div class="tom-topics">';
    data.themes.forEach(t => {
      h += '<span class="ns-chip">' + esc(t.theme) + '<span class="ns-count">' + t.count + '</span></span>';
    });
    h += '</div>';
  }

  h += '</div>';
  return h;
}

function renderStats(agents) {
  const waiting = agents.filter(a => a.active && a.state === 'waiting').length;
  const active  = agents.filter(a => a.active && a.state !== 'waiting').length;
  const done    = agents.filter(a => a.done && !a.archived).length;
  let h = '';

  if (waiting) h += '<div class="stat-pill has-waiting"><span class="sdot sdot-wait"></span><span class="count">' + waiting + '</span> waiting</div>';
  if (active)  h += '<div class="stat-pill"><span class="sdot sdot-on"></span><span class="count">' + active + '</span> active</div>';
  if (done)    h += '<div class="stat-pill"><span class="sdot sdot-done"></span>' + done + ' done</div>';
  if (!agents.length) h = '<div class="stat-pill" style="color:var(--text3)">No agents</div>';

  const dot = document.getElementById('logo-dot');
  if (dot) {
    dot.className = 'logo-dot' + (waiting ? ' waiting' : active ? ' active' : '');
  }

  document.title = waiting
    ? '(' + waiting + ') Mission Control'
    : active
    ? 'Mission Control \\u2022 ' + active + ' active'
    : 'Mission Control';

  return h;
}

function renderEmpty() {
  return '<div class="empty-state">'
    + '<div class="dot-ring"><div class="inner"></div></div>'
    + '<h2>Listening for agents</h2>'
    + '<p>Open a Claude Code session in this project. Agent activity will appear here automatically.</p>'
    + '</div>';
}

let currentFilter = 'active';
let currentWsFilter = 'all';

function filterAgents(agents) {
  let result;
  if (currentFilter === 'all') result = agents.filter(a => !a.archived);
  else if (currentFilter === 'done') result = agents.filter(a => a.done && !a.archived);
  else if (currentFilter === 'archived') result = agents.filter(a => a.archived);
  else result = agents.filter(a => a.active);

  // Apply workstream filter
  if (currentWsFilter !== 'all') {
    if (currentWsFilter === 'unassigned') result = result.filter(a => !a.workstream);
    else result = result.filter(a => a.workstream === currentWsFilter);
  }
  return result;
}

function renderWsFilters(agents) {
  const nonArchived = agents.filter(a => !a.archived);
  const wsCounts = {};
  let unassigned = 0;
  nonArchived.forEach(a => {
    if (a.workstream) wsCounts[a.workstream] = (wsCounts[a.workstream] || 0) + 1;
    else unassigned++;
  });

  // Only show if there are any assignments or more than 0 workstreams defined
  const hasAny = Object.keys(wsCounts).length > 0 || unassigned > 0;
  if (!hasAny) return '';

  let h = '<div class="ws-filters">';
  h += '<div class="ws-fpill' + (currentWsFilter === 'all' ? ' active' : '') + '" data-ws="all">All</div>';

  // Get workstream metadata from agents (already merged in readAgents)
  const seen = new Set();
  nonArchived.forEach(a => {
    if (a.workstream && !seen.has(a.workstream)) {
      seen.add(a.workstream);
      const count = wsCounts[a.workstream] || 0;
      h += '<div class="ws-fpill' + (currentWsFilter === a.workstream ? ' active' : '') + '" data-ws="' + esc(a.workstream) + '">'
        + '<span class="wf-dot" style="background:' + (a.wsColor || '#9ca3af') + '"></span>'
        + esc(a.wsName || a.workstream)
        + '<span class="wf-count">' + count + '</span></div>';
    }
  });

  if (unassigned > 0) {
    h += '<div class="ws-fpill' + (currentWsFilter === 'unassigned' ? ' active' : '') + '" data-ws="unassigned">Unassigned<span class="wf-count">' + unassigned + '</span></div>';
  }

  h += '</div>';
  return h;
}

function renderFilters(agents) {
  const activeN   = agents.filter(a => a.active).length;
  const allN      = agents.filter(a => !a.archived).length;
  const doneN     = agents.filter(a => a.done && !a.archived).length;
  const archivedN = agents.filter(a => a.archived).length;

  let h = '<div class="filters">';
  h += '<button class="filter-btn' + (currentFilter === 'active' ? ' active' : '') + '" data-f="active">Active<span class="filter-count">' + activeN + '</span></button>';
  h += '<button class="filter-btn' + (currentFilter === 'all' ? ' active' : '') + '" data-f="all">All<span class="filter-count">' + allN + '</span></button>';
  h += '<button class="filter-btn' + (currentFilter === 'done' ? ' active' : '') + '" data-f="done">Done<span class="filter-count">' + doneN + '</span></button>';
  if (archivedN) h += '<button class="filter-btn' + (currentFilter === 'archived' ? ' active' : '') + '" data-f="archived">Archived<span class="filter-count">' + archivedN + '</span></button>';
  h += '</div>';
  return h;
}

async function refresh() {
  try {
    const [agents, nsData] = await Promise.all([
      fetch('/api/agents').then(r => r.json()),
      fetch('/api/northstar').then(r => r.json()),
    ]);

    document.getElementById('stats').innerHTML = renderStats(agents);

    if (!agents.length) {
      document.getElementById('main').innerHTML = renderEmpty();
      return;
    }

    const filtered = filterAgents(agents);
    let h = '<h1 class="page-title">Agents</h1>';
    h += '<p class="page-sub">' + agents.length + ' sessions tracked</p>';
    h += renderNorthStar(nsData);
    h += renderFilters(agents);
    h += renderWsFilters(agents);

    if (filtered.length) {
      h += '<div class="grid">' + filtered.map(renderCard).join('') + '</div>';
    } else {
      h += '<div class="empty-state" style="padding:80px 24px"><h2>No agents in this view</h2><p>Try switching filters above.</p></div>';
    }

    document.getElementById('main').innerHTML = h;

    document.querySelectorAll('.ws-fpill').forEach(pill => {
      pill.addEventListener('click', () => {
        currentWsFilter = pill.dataset.ws;
        refresh();
      });
    });

    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        currentFilter = btn.dataset.f;
        refresh();
      });
    });

    // AI workstream suggestions for unassigned sessions with prompts
    agents.forEach(a => {
      if (!a.workstream && a.hasPrompts && !suggestedSessions.has(a.sessionId)) {
        suggestedSessions.add(a.sessionId);
        fetch('/api/suggest-workstream/' + encodeURIComponent(a.sessionId))
          .then(r => r.json())
          .then(data => {
            if (data.workstream && data.confidence > 0.4) {
              const card = document.querySelector('[data-sid="' + a.sessionId + '"]');
              if (!card) return;
              if (card.querySelector('.ws-suggest')) return;
              const banner = document.createElement('div');
              banner.className = 'ws-suggest';
              const span = document.createElement('span');
              span.innerHTML = 'Looks like <b>' + esc(data.workstream) + '</b>';
              banner.appendChild(span);
              const acceptBtn = document.createElement('button');
              acceptBtn.className = 'ws-accept';
              acceptBtn.textContent = 'Accept';
              acceptBtn.onclick = function(e) { e.preventDefault(); e.stopPropagation(); acceptWs(a.sessionId, data.workstream); };
              banner.appendChild(acceptBtn);
              const dismissBtn = document.createElement('button');
              dismissBtn.className = 'ws-dismiss';
              dismissBtn.textContent = 'x';
              dismissBtn.onclick = function(e) { e.preventDefault(); e.stopPropagation(); banner.remove(); };
              banner.appendChild(dismissBtn);
              card.querySelector('.card-body').appendChild(banner);
            }
          }).catch(() => {});
      }
    });
  } catch (e) {
    console.warn('refresh error', e);
  }
}

const suggestedSessions = new Set();

function acceptWs(sid, workstream) {
  fetch('/api/agent-workstreams', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId: sid, workstream })
  }).then(() => refresh()).catch(() => {});
}

refresh();
setInterval(refresh, 1500);
</script>
</body>
</html>`;

// ── Detail Page HTML ─────────────────────────────────────────────────────────

const DETAIL_PAGE = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Session Detail — Mission Control</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=DM+Sans:wght@400;500&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
  html { zoom: ${UI_ZOOM} }
  *, *::before, *::after { margin:0; padding:0; box-sizing:border-box }
  :root {
    --bg: #ffffff; --bg-page: #f8f8f8; --surface: #f2f2f2; --surface2: #e8e8e8;
    --text: #1a1a1a; --text2: #555; --text3: #999; --sep: #e5e5e5;
    --green: #22c55e; --green-bg: rgba(34,197,94,0.08);
    --blue: #3b82f6; --blue-bg: rgba(59,130,246,0.08);
    --amber: #f59e0b; --amber-bg: rgba(245,158,11,0.08);
    --purple: #8b5cf6; --purple-bg: rgba(139,92,246,0.08);
    --gray: #9ca3af;
  }
  body { background:var(--bg-page); color:var(--text); font-family:'DM Sans',-apple-system,system-ui,sans-serif; min-height:100vh; -webkit-font-smoothing:antialiased }

  header { display:flex; align-items:center; padding:0 clamp(24px,4vw,48px); height:64px; background:var(--bg); border-bottom:1px solid var(--sep); position:sticky; top:0; z-index:10; gap:16px }
  .back-link { display:flex; align-items:center; gap:8px; text-decoration:none; color:var(--text2); font-size:14px; font-weight:500; transition:color .15s }
  .back-link:hover { color:var(--text) }
  .header-nav { display:flex; gap:4px; padding:3px; background:#f2f2f2; border-radius:8px; position:absolute; left:50%; transform:translateX(-50%) }
  .nav-link { padding:5px 14px; border-radius:6px; font-family:'DM Sans',sans-serif; font-size:13px; font-weight:500; color:#999; text-decoration:none; transition:all .15s }
  .nav-link:hover { color:#555 }
  .nav-link.active { background:#fff; color:#1a1a1a; box-shadow:0 1px 3px rgba(0,0,0,.06) }

  .shell { max-width:800px; margin:0 auto; padding:clamp(24px,4vw,48px) }

  .detail-hero { margin-bottom:24px }
  .detail-meta { display:flex; align-items:center; gap:12px; margin-bottom:16px; flex-wrap:wrap }
  .state-pill { display:flex; align-items:center; gap:6px; padding:4px 12px; border-radius:100px; font-size:12px; font-weight:500 }
  .state-pill .sdot { width:5px; height:5px; border-radius:50% }
  .state-pill.s-investigating { background:var(--blue-bg); color:#1d4ed8 } .state-pill.s-investigating .sdot { background:var(--blue) }
  .state-pill.s-developing { background:var(--amber-bg); color:#92400e } .state-pill.s-developing .sdot { background:var(--amber) }
  .state-pill.s-planning { background:var(--purple-bg); color:#6d28d9 } .state-pill.s-planning .sdot { background:var(--purple) }
  .state-pill.s-verifying { background:var(--green-bg); color:#166534 } .state-pill.s-verifying .sdot { background:var(--green) }
  .state-pill.s-waiting { background:var(--amber-bg); color:#92400e } .state-pill.s-waiting .sdot { background:var(--amber) }
  .state-pill.s-thinking { background:var(--purple-bg); color:#6d28d9 } .state-pill.s-thinking .sdot { background:var(--purple); animation:blink 2s ease-in-out infinite }
  .state-pill.s-done { background:var(--green-bg); color:#166534 } .state-pill.s-done .sdot { background:var(--green); opacity:.5 }
  .state-pill.s-idle { background:var(--surface); color:var(--text3) } .state-pill.s-idle .sdot { background:var(--gray); opacity:.4 }

  .detail-sid, .detail-ago { font-family:'DM Mono',monospace; font-size:12px; color:var(--text3) }
  .detail-mission { font-family:'Plus Jakarta Sans',sans-serif; font-size:clamp(24px,3.5vw,32px); font-weight:700; letter-spacing:-0.03em; color:var(--text); line-height:1.2 }

  /* Tabs */
  .tabs { display:flex; gap:4px; margin-bottom:24px; padding:3px; background:var(--surface); border-radius:10px; width:fit-content }
  .tab-btn { padding:7px 16px; border-radius:8px; border:none; background:transparent; font-family:'DM Sans',sans-serif; font-size:13px; font-weight:500; color:var(--text3); cursor:pointer; transition:all .15s }
  .tab-btn:hover { color:var(--text2) }
  .tab-btn.active { background:var(--bg); color:var(--text); box-shadow:0 1px 3px rgba(0,0,0,0.06) }

  .tab-content { display:none }
  .tab-content.visible { display:block }

  .section { margin-bottom:32px }
  .section-title { font-size:12px; font-weight:500; text-transform:uppercase; letter-spacing:0.06em; color:var(--text3); margin-bottom:12px }

  /* Prompt cards */
  .prompt-card { background:var(--bg); border:1px solid var(--sep); border-radius:12px; padding:16px 20px; margin-bottom:8px; scroll-margin-top:80px; transition:border-color .3s,box-shadow .3s }
  .prompt-card:hover { border-color:var(--surface2) }
  .prompt-card.highlighted { border-color:var(--blue); box-shadow:0 0 0 3px var(--blue-bg) }
  .prompt-card.skill { border:1px solid rgba(139,92,246,0.25); border-left:3px solid var(--purple); background:linear-gradient(135deg, rgba(139,92,246,0.04) 0%, rgba(139,92,246,0.01) 100%); padding:12px 20px }
  .skill-header { display:flex; align-items:center; gap:8px; margin-bottom:6px }
  .skill-badge { font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:0.08em; padding:3px 10px; border-radius:100px; background:var(--purple); color:#fff }
  .skill-icon { font-family:'DM Mono',monospace; font-size:13px; color:var(--purple); font-weight:600 }
  .prompt-card.skill .prompt-text { font-family:'DM Mono',monospace; font-size:13px; color:var(--purple); font-weight:500; white-space:pre-wrap; word-break:break-word; line-height:1.5 }
  .prompt-text { font-size:15px; color:var(--text); line-height:1.6; white-space:pre-wrap; word-break:break-word }
  .prompt-meta { display:flex; justify-content:space-between; align-items:center; margin-top:10px; padding-top:10px; border-top:1px solid var(--sep) }
  .prompt-time { font-family:'DM Mono',monospace; font-size:11px; color:var(--text3) }
  .prompt-idx { font-family:'DM Mono',monospace; font-size:11px; color:var(--text3); opacity:0.5 }
  .copy-btn { padding:4px 10px; border-radius:6px; border:1px solid var(--sep); background:var(--bg); font-size:12px; color:var(--text2); cursor:pointer; transition:all .15s }
  .copy-btn:hover { background:var(--surface); color:var(--text) }
  .copy-btn.copied { background:var(--green-bg); color:#166534; border-color:var(--green) }

  /* Summary view */
  .summary-loading { font-size:14px; color:var(--blue); animation:pulse 2s ease-in-out infinite; padding:24px 0 }
  @keyframes pulse { 0%,100%{opacity:.4} 50%{opacity:1} }

  .summary-overview { font-size:16px; line-height:1.7; color:var(--text); margin-bottom:24px; padding:20px 24px; background:var(--bg); border-radius:12px; border:1px solid var(--sep) }

  .summary-section { background:var(--bg); border:1px solid var(--sep); border-radius:12px; padding:20px 24px; margin-bottom:12px }
  .summary-section-title { font-family:'Plus Jakarta Sans',sans-serif; font-size:15px; font-weight:600; color:var(--text); margin-bottom:8px; letter-spacing:-0.01em }
  .summary-section-body { font-size:14px; color:var(--text2); line-height:1.7; margin-bottom:10px }
  .summary-refs { display:flex; gap:4px; flex-wrap:wrap }
  .ref-link { padding:2px 8px; border-radius:4px; background:var(--blue-bg); color:#1d4ed8; font-family:'DM Mono',monospace; font-size:11px; cursor:pointer; text-decoration:none; transition:background .15s }
  .ref-link:hover { background:rgba(59,130,246,0.15) }

  .summary-decisions { margin-bottom:24px }
  .summary-decisions ul { list-style:none; padding:0 }
  .summary-decisions li { padding:8px 0; border-bottom:1px solid var(--sep); font-size:14px; color:var(--text2); line-height:1.5 }
  .summary-decisions li::before { content:'\\2192  '; color:var(--blue); font-weight:600 }
  .summary-decisions li:last-child { border-bottom:none }

  .summary-outcome { font-size:15px; font-weight:500; color:var(--text); padding:16px 20px; background:var(--green-bg); border-radius:10px; border-left:3px solid var(--green) }

  /* Timeline */
  .timeline { position:relative; padding-left:24px }
  .timeline::before { content:''; position:absolute; left:5px; top:4px; bottom:4px; width:1px; background:var(--sep) }
  .tl-item { position:relative; padding-bottom:12px; display:flex; align-items:baseline; gap:12px }
  .tl-dot { position:absolute; left:-21px; top:6px; width:7px; height:7px; border-radius:50%; background:var(--gray) }
  .tl-dot.investigating { background:var(--blue) } .tl-dot.developing { background:var(--amber) }
  .tl-dot.planning { background:var(--purple) } .tl-dot.verifying { background:var(--green) }
  .tl-dot.waiting { background:var(--amber) } .tl-dot.done { background:var(--green) }
  .tl-label { font-size:13px; color:var(--text2) }
  .tl-tool { font-family:'DM Mono',monospace; font-size:12px; color:var(--text3) }
  .tl-time { font-family:'DM Mono',monospace; font-size:11px; color:var(--text3); margin-left:auto; flex-shrink:0 }

  .empty-note { font-size:14px; color:var(--text3); font-style:italic; padding:16px 0 }

  @media (max-width:600px) { .shell { padding:20px 16px } }
</style>
</head>
<body>

<header>
  <a href="/" class="back-link"><span>\u2190</span> All agents</a>
  <nav class="header-nav">
    <a href="/" class="nav-link active">Dashboard</a>
    <a href="/dispatch" class="nav-link">Dispatch</a>
    <a href="/findings" class="nav-link">Findings</a>
    <a href="/tools" class="nav-link">Toolbox</a>
    <a href="/logic" class="nav-link">Logic</a>
    <a href="/radar" class="nav-link">Radar</a>
  </nav>
</header>

<div class="shell">
  <div id="detail"></div>
</div>

<script>
const STATE_LABEL = {
  investigating:'Researching', developing:'Writing', planning:'Planning',
  waiting:'Needs input', verifying:'Verifying', thinking:'Thinking',
  done:'Done', idle:'Idle',
};

function ago(ms) {
  if (ms < 5000) return 'now';
  const s = Math.floor(ms/1000);
  if (s < 60) return s+'s ago';
  const m = Math.floor(s/60);
  if (m < 60) return m+'m ago';
  const hr = Math.floor(m/60);
  if (hr < 24) return hr+'h ago';
  return Math.floor(hr/24)+'d ago';
}

function fmtTime(ts) {
  const d = new Date(ts);
  return d.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})
    + ' \\u00b7 ' + d.toLocaleDateString([], {month:'short',day:'numeric'});
}

function esc(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

let sessionData = null;
let currentTab = 'summary';
let summaryData = null;
let summaryPolling = null;

function switchTab(tab) {
  currentTab = tab;
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
  document.querySelectorAll('.tab-content').forEach(c => c.classList.toggle('visible', c.id === 'tab-' + tab));
}

function scrollToPrompt(idx) {
  switchTab('prompts');
  setTimeout(() => {
    const card = document.getElementById('prompt-' + idx);
    if (card) {
      card.scrollIntoView({ behavior:'smooth', block:'center' });
      card.classList.add('highlighted');
      setTimeout(() => card.classList.remove('highlighted'), 3000);
    }
  }, 100);
}

function renderSummary(summ) {
  if (!summ) return '<div class="summary-loading">Generating in-depth summary...</div>';

  let h = '';
  // Overview
  if (summ.overview) {
    h += '<div class="summary-overview">' + esc(summ.overview) + '</div>';
  }

  // Sections with citations
  if (summ.sections && summ.sections.length) {
    summ.sections.forEach(s => {
      h += '<div class="summary-section">';
      h += '<div class="summary-section-title">' + esc(s.title) + '</div>';
      h += '<div class="summary-section-body">' + esc(s.body) + '</div>';
      if (s.promptRefs && s.promptRefs.length) {
        h += '<div class="summary-refs">';
        s.promptRefs.forEach(ref => {
          const p = sessionData.prompts[ref];
          const label = p ? fmtTime(p.ts) : 'Prompt #' + ref;
          h += '<a class="ref-link" onclick="scrollToPrompt(' + ref + ')" title="Jump to prompt">\u2192 ' + esc(label) + '</a>';
        });
        h += '</div>';
      }
      h += '</div>';
    });
  }

  // Key decisions
  if (summ.keyDecisions && summ.keyDecisions.length) {
    h += '<div class="summary-decisions">';
    h += '<div class="section-title">Key decisions</div>';
    h += '<ul>';
    summ.keyDecisions.forEach(d => { h += '<li>' + esc(d) + '</li>'; });
    h += '</ul></div>';
  }

  // Outcome
  if (summ.outcome) {
    h += '<div class="summary-outcome">' + esc(summ.outcome) + '</div>';
  }

  return h;
}

async function loadSummary(sid) {
  const res = await fetch('/api/session/' + encodeURIComponent(sid) + '/summary').then(r => r.json());
  if (res.status === 'ready' && res.data) {
    summaryData = res.data;
    document.getElementById('summary-content').innerHTML = renderSummary(summaryData);
    if (summaryPolling) { clearInterval(summaryPolling); summaryPolling = null; }
  } else if (res.status === 'generating') {
    if (res.data) {
      summaryData = res.data;
      document.getElementById('summary-content').innerHTML = renderSummary(summaryData);
    }
    // Poll until ready
    if (!summaryPolling) {
      summaryPolling = setInterval(() => loadSummary(sid), 3000);
    }
  }
}

async function load() {
  const sid = location.pathname.replace('/session/', '');
  sessionData = await fetch('/api/session/' + encodeURIComponent(sid)).then(r => r.json());

  if (sessionData.error) {
    document.getElementById('detail').innerHTML = '<div class="empty-note">Session not found</div>';
    return;
  }

  document.title = (sessionData.mission || 'Session #' + sid.slice(-6)) + ' \\u2014 Mission Control';

  let h = '<div class="detail-hero">';
  h += '<div class="detail-meta">';
  h += '<span class="state-pill s-' + esc(sessionData.state) + '"><span class="sdot"></span>' + esc(STATE_LABEL[sessionData.state] || sessionData.state) + '</span>';
  h += '<span class="detail-ago">' + ago(sessionData.ago) + '</span>';
  h += '<span class="detail-sid">#' + esc(sid.slice(-6)) + '</span>';
  h += '</div>';
  h += '<div class="detail-mission">' + esc(sessionData.mission || 'No summary yet') + '</div>';
  h += '</div>';

  // Tabs
  h += '<div class="tabs">';
  h += '<button class="tab-btn active" data-tab="summary">Summary</button>';
  h += '<button class="tab-btn" data-tab="prompts">Prompts (' + sessionData.prompts.length + ')</button>';
  h += '<button class="tab-btn" data-tab="timeline">Timeline</button>';
  h += '</div>';

  // Tab: Summary
  h += '<div id="tab-summary" class="tab-content visible">';
  h += '<div id="summary-content"><div class="summary-loading">Generating in-depth summary...</div></div>';
  h += '</div>';

  // Tab: Prompts
  h += '<div id="tab-prompts" class="tab-content">';
  if (sessionData.prompts.length) {
    sessionData.prompts.forEach((p, i) => {
      const isSkill = p.type === 'skill' || /^\\s*\\/[a-z][\\w-]*\\s*$/i.test(p.prompt);
      h += '<div class="prompt-card' + (isSkill ? ' skill' : '') + '" id="prompt-' + i + '">';
      if (isSkill) {
        h += '<div class="skill-header"><span class="skill-badge">COMMAND</span><span class="skill-icon">&gt;_</span></div>';
        h += '<div class="prompt-text">' + esc(p.prompt) + '</div>';
      } else {
        h += '<div class="prompt-text">' + esc(p.prompt) + '</div>';
      }
      h += '<div class="prompt-meta">';
      h += '<span class="prompt-time">' + fmtTime(p.ts) + '</span>';
      h += '<span class="prompt-idx">#' + i + '</span>';
      h += '<button class="copy-btn" data-idx="' + i + '">Copy</button>';
      h += '</div></div>';
    });
  } else {
    h += '<div class="empty-note">No prompts captured for this session</div>';
  }
  h += '</div>';

  // Tab: Timeline
  h += '<div id="tab-timeline" class="tab-content">';
  if (sessionData.activity.length) {
    h += '<div class="timeline">';
    const events = sessionData.activity.slice(-40).reverse();
    events.forEach(e => {
      h += '<div class="tl-item">';
      h += '<span class="tl-dot ' + esc(e.state) + '"></span>';
      h += '<span class="tl-label">' + esc(STATE_LABEL[e.state] || e.state) + '</span>';
      if (e.tool && e.tool !== 'stop') {
        let detail = e.detail || '';
        if (detail.length > 40) detail = detail.slice(0,40) + '\\u2026';
        h += '<span class="tl-tool">' + esc(e.tool) + (detail ? ' \\u00b7 ' + esc(detail) : '') + '</span>';
      }
      h += '<span class="tl-time">' + fmtTime(e.ts) + '</span>';
      h += '</div>';
    });
    h += '</div>';
  } else {
    h += '<div class="empty-note">No activity recorded</div>';
  }
  h += '</div>';

  document.getElementById('detail').innerHTML = h;

  // Wire tabs
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  // Wire copy buttons
  document.querySelectorAll('.copy-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.dataset.idx);
      const text = sessionData.prompts[idx]?.prompt || '';
      navigator.clipboard.writeText(text).then(() => {
        btn.textContent = 'Copied!';
        btn.classList.add('copied');
        setTimeout(() => { btn.textContent = 'Copy'; btn.classList.remove('copied'); }, 2000);
      });
    });
  });

  // Load summary
  if (sessionData.prompts.length) {
    loadSummary(sid);
  } else {
    document.getElementById('summary-content').innerHTML = '<div class="empty-note">No prompts to summarize</div>';
  }
}

load();
</script>
</body>
</html>`;

// ── Page HTML helpers (read from disk on each request for live reloading) ────
function readPage(file, fallback) {
  try {
    const html = fs.readFileSync(file, 'utf8');
    return html.replace('<style>', `<style>\n  html { zoom: ${UI_ZOOM} }`);
  } catch { return `<html><body>${fallback} not found</body></html>`; }
}

// ── HTTP Server ──────────────────────────────────────────────────────────────

const server = http.createServer((req, res) => {
  const url = req.url.split('?')[0];

  if (url === '/api/agents' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
    return res.end(JSON.stringify(readAgents()));
  }

  if (url === '/api/northstar' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
    return res.end(JSON.stringify({
      aiReady: AI_READY,
      themes: northStarCache.themes || [],
      topOfMind: northStarCache.topOfMind || '',
      agents: northStarCache.agents || [],
      ts: northStarCache.ts || 0,
    }));
  }

  if (url === '/api/missions' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify(readJSON(MISSIONS_F, {})));
  }

  if (url === '/api/missions' && req.method === 'POST') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      try {
        const { sessionId, mission } = JSON.parse(body);
        const missions = readJSON(MISSIONS_F, {});
        if (mission) missions[sessionId] = mission;
        else delete missions[sessionId];
        writeJSON(MISSIONS_F, missions);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end('{"ok":true}');
      } catch {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end('{"error":"bad request"}');
      }
    });
    return;
  }

  if (url.startsWith('/api/agents/') && req.method === 'DELETE') {
    const sid = decodeURIComponent(url.slice('/api/agents/'.length));
    if (!isValidSid(sid)) { res.writeHead(400); return res.end('{"error":"invalid sid"}'); }
    try {
      // Find all chained sessions (same terminal) to delete together
      const chain = getChainedSessions(sid);
      const deleted = [];
      for (const s of chain) {
        // State file
        const sf = path.join(STATES_DIR, `${s}.json`);
        if (fs.existsSync(sf)) { fs.unlinkSync(sf); deleted.push('state:' + s.slice(-6)); }
        // Log file
        const lf = path.join(LOGS_DIR, `${s}.ndjson`);
        if (fs.existsSync(lf)) { fs.unlinkSync(lf); deleted.push('log:' + s.slice(-6)); }
        // Prompt file
        const pf = path.join(PROMPTS_DIR, `${s}.ndjson`);
        if (fs.existsSync(pf)) { fs.unlinkSync(pf); deleted.push('prompts:' + s.slice(-6)); }
        // Clear from in-memory caches
        delete summariesCache[s];
        delete deepSummariesCache[s];
        // Remove from missions.json
        const missions = readJSON(MISSIONS_F, {});
        if (missions[s]) { delete missions[s]; writeJSON(MISSIONS_F, missions); }
      }
      // Persist summary cache changes
      writeJSON(SUMMARIES_F, summariesCache);
      writeJSON(DEEP_SUMM_F, deepSummariesCache);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true, deleted }));
    } catch (e) {
      res.writeHead(500);
      res.end(JSON.stringify({ error: 'failed', msg: e.message }));
    }
    return;
  }

  // Session deep summary API (on-demand, triggers AI call)
  if (url.match(/^\/api\/session\/[^/]+\/summary$/) && req.method === 'GET') {
    const sid = decodeURIComponent(url.split('/')[3]);
    const stateFile = path.join(STATES_DIR, `${sid}.json`);
    if (!fs.existsSync(stateFile)) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      return res.end('{"error":"not found"}');
    }
    // Return cached immediately if available, trigger generation in background
    const cached = deepSummariesCache[sid];
    const hash = getPromptsHash(sid);
    if (cached && cached.hash === hash) {
      res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
      return res.end(JSON.stringify({ status: 'ready', data: cached }));
    }
    // Trigger generation, return pending
    generateDeepSummary(sid);
    res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
    return res.end(JSON.stringify({ status: 'generating', data: cached || null }));
  }

  // Session detail API
  if (url.startsWith('/api/session/') && req.method === 'GET') {
    const sid = decodeURIComponent(url.slice('/api/session/'.length));
    if (!isValidSid(sid)) { res.writeHead(400); return res.end('{"error":"invalid sid"}'); }
    const stateFile = path.join(STATES_DIR, `${sid}.json`);
    if (!fs.existsSync(stateFile)) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      return res.end('{"error":"not found"}');
    }
    const state = readJSON(stateFile, {});

    // Find all chained sessions (same claudePid = same terminal window)
    const chainedSessions = [sid];
    if (state.claudePid) {
      try {
        const allFiles = fs.readdirSync(STATES_DIR).filter(f => f.endsWith('.json'));
        for (const f of allFiles) {
          const other = readJSON(path.join(STATES_DIR, f), {});
          if (other.sessionId !== sid && other.claudePid === state.claudePid) {
            chainedSessions.push(other.sessionId);
          }
        }
      } catch {}
    }

    // Combine prompts and activity from ALL chained sessions
    let prompts = [];
    let activity = [];
    for (const chainSid of chainedSessions) {
      prompts.push(...readPrompts(chainSid));
      try {
        const logFile = path.join(LOGS_DIR, `${chainSid}.ndjson`);
        const entries = fs.readFileSync(logFile, 'utf8').trim().split('\n')
          .filter(Boolean).map(l => JSON.parse(l));
        activity.push(...entries);
      } catch {}
    }
    // Sort by timestamp so the combined view is chronological
    prompts.sort((a, b) => a.ts - b.ts);
    activity.sort((a, b) => a.ts - b.ts);

    const mission = deriveMission(sid) || chainedSessions.slice(1).reduce((m, s) => m || deriveMission(s), '');
    const now = Date.now();

    res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
    return res.end(JSON.stringify({
      sessionId: sid,
      state: state.state,
      mission,
      ts: state.ts,
      ago: now - state.ts,
      prompts,
      activity,
    }));
  }

  // Tools API
  if (url === '/api/tools' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
    return res.end(JSON.stringify(readToolsData()));
  }

  // Logic API
  if (url === '/api/logic' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
    return res.end(JSON.stringify(readLogicData()));
  }

  // Sources API (Radar)
  if (url === '/api/sources' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
    return res.end(JSON.stringify(readJSON(SOURCES_F, [])));
  }
  if (url === '/api/sources' && req.method === 'POST') {
    let body = '';
    req.on('data', c => { body += c; });
    req.on('end', () => {
      try {
        const { name, url: srcUrl, category, description, tags } = JSON.parse(body);
        if (!name || !srcUrl) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: 'name and url required' }));
        }
        const sources = readJSON(SOURCES_F, []);
        const id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        sources.push({ id, name, url: srcUrl, category: category || 'Research', description: description || '', tags: tags || [], added: new Date().toISOString().slice(0, 10), pinned: false });
        writeJSON(SOURCES_F, sources);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(sources));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }
  if (url.startsWith('/api/sources/') && req.method === 'DELETE') {
    const id = decodeURIComponent(url.slice('/api/sources/'.length));
    let sources = readJSON(SOURCES_F, []);
    sources = sources.filter(s => s.id !== id);
    writeJSON(SOURCES_F, sources);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify(sources));
  }
  if (url.startsWith('/api/sources/') && req.method === 'PUT') {
    const id = decodeURIComponent(url.slice('/api/sources/'.length));
    let body = '';
    req.on('data', c => { body += c; });
    req.on('end', () => {
      try {
        const updates = JSON.parse(body);
        const sources = readJSON(SOURCES_F, []);
        const idx = sources.findIndex(s => s.id === id);
        if (idx === -1) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: 'not found' }));
        }
        Object.assign(sources[idx], updates);
        writeJSON(SOURCES_F, sources);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(sources));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  // ── Workstreams API ──────────────────────────────────────────────────────────
  if (url === '/api/workstreams' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
    return res.end(JSON.stringify(readJSON(WORKSTREAMS_F, [])));
  }
  if (url === '/api/workstreams' && req.method === 'POST') {
    let body = '';
    req.on('data', c => { body += c; });
    req.on('end', () => {
      try {
        const { name, color } = JSON.parse(body);
        if (!name) { res.writeHead(400, { 'Content-Type': 'application/json' }); return res.end(JSON.stringify({ error: 'name required' })); }
        const ws = readJSON(WORKSTREAMS_F, []);
        const id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        ws.push({ id, name, color: color || '#8b5cf6', order: ws.length, created: new Date().toISOString().slice(0, 10) });
        writeJSON(WORKSTREAMS_F, ws);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(ws));
      } catch (e) { res.writeHead(400, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: e.message })); }
    });
    return;
  }
  if (url.startsWith('/api/workstreams/') && req.method === 'PUT') {
    const id = decodeURIComponent(url.slice('/api/workstreams/'.length));
    let body = '';
    req.on('data', c => { body += c; });
    req.on('end', () => {
      try {
        const updates = JSON.parse(body);
        const ws = readJSON(WORKSTREAMS_F, []);
        const idx = ws.findIndex(w => w.id === id);
        if (idx === -1) { res.writeHead(404, { 'Content-Type': 'application/json' }); return res.end(JSON.stringify({ error: 'not found' })); }
        if (updates.name !== undefined) ws[idx].name = updates.name;
        if (updates.color !== undefined) ws[idx].color = updates.color;
        if (updates.order !== undefined) ws[idx].order = updates.order;
        writeJSON(WORKSTREAMS_F, ws);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(ws));
      } catch (e) { res.writeHead(400, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: e.message })); }
    });
    return;
  }
  if (url.startsWith('/api/workstreams/') && req.method === 'DELETE') {
    const id = decodeURIComponent(url.slice('/api/workstreams/'.length));
    let ws = readJSON(WORKSTREAMS_F, []);
    ws = ws.filter(w => w.id !== id);
    writeJSON(WORKSTREAMS_F, ws);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify(ws));
  }

  // ── Agent Workstream Assignments API ────────────────────────────────────────
  if (url === '/api/agent-workstreams' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
    return res.end(JSON.stringify(readJSON(AGENT_WS_F, {})));
  }
  if (url === '/api/agent-workstreams' && req.method === 'POST') {
    let body = '';
    req.on('data', c => { body += c; });
    req.on('end', () => {
      try {
        const { sessionId, workstream, tags } = JSON.parse(body);
        if (!sessionId || !workstream) { res.writeHead(400, { 'Content-Type': 'application/json' }); return res.end(JSON.stringify({ error: 'sessionId and workstream required' })); }
        const aws = readJSON(AGENT_WS_F, {});
        aws[sessionId] = { workstream, tags: tags || [], assignedBy: 'user', overridden: !!(aws[sessionId] && aws[sessionId].assignedBy === 'ai') };
        writeJSON(AGENT_WS_F, aws);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true }));
      } catch (e) { res.writeHead(400, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: e.message })); }
    });
    return;
  }

  // ── Dispatch CRUD API ───────────────────────────────────────────────────────
  if (url === '/api/dispatch' && req.method === 'GET') {
    // Merge local dispatch + shared MC backlog (mc-backlog.json tracked in git)
    const local = readJSON(DISPATCH_F, []).map(i => ({ ...i, _source: 'local' }));
    const mcFile = path.join(__dirname, 'mc-backlog.json');
    const mcData = readJSON(mcFile, { tasks: [] });
    const shared = (mcData.tasks || []).map(i => ({ ...i, _source: 'mc' }));
    res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
    return res.end(JSON.stringify([...shared, ...local]));
  }
  if (url === '/api/dispatch' && req.method === 'POST') {
    let body = '';
    req.on('data', c => { body += c; });
    req.on('end', () => {
      try {
        const { title, description, status, priority, workstream, tags, linkedSession, _source } = JSON.parse(body);
        if (!title) { res.writeHead(400, { 'Content-Type': 'application/json' }); return res.end(JSON.stringify({ error: 'title required' })); }
        const id = (_source === 'mc' ? 'mc-' : '') + Math.random().toString(36).slice(2, 10);
        const now = new Date().toISOString();
        const item = { id, title, description: description || '', status: status || 'todo', priority: priority || 'p2', workstream: workstream || '', tags: tags || [], linkedSession: linkedSession || null, created: now, updated: now };
        if (_source === 'mc') {
          const mcFile = path.join(__dirname, 'mc-backlog.json');
          const mcData = readJSON(mcFile, { tasks: [] });
          mcData.tasks.push(item);
          writeJSON(mcFile, mcData);
        } else {
          const items = readJSON(DISPATCH_F, []);
          items.push(item);
          writeJSON(DISPATCH_F, items);
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, id }));
      } catch (e) { res.writeHead(400, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: e.message })); }
    });
    return;
  }
  if (url.startsWith('/api/dispatch/') && req.method === 'PUT') {
    const id = decodeURIComponent(url.slice('/api/dispatch/'.length));
    let body = '';
    req.on('data', c => { body += c; });
    req.on('end', () => {
      try {
        const updates = JSON.parse(body);
        // Route to correct file based on id prefix
        if (id.startsWith('mc-')) {
          const mcFile = path.join(__dirname, 'mc-backlog.json');
          const mcData = readJSON(mcFile, { tasks: [] });
          const idx = mcData.tasks.findIndex(i => i.id === id);
          if (idx === -1) { res.writeHead(404, { 'Content-Type': 'application/json' }); return res.end(JSON.stringify({ error: 'not found' })); }
          for (const key of ['title', 'description', 'status', 'priority', 'workstream', 'tags', 'linkedSession']) {
            if (updates[key] !== undefined) mcData.tasks[idx][key] = updates[key];
          }
          mcData.tasks[idx].updated = new Date().toISOString();
          writeJSON(mcFile, mcData);
        } else {
          const items = readJSON(DISPATCH_F, []);
          const idx = items.findIndex(i => i.id === id);
          if (idx === -1) { res.writeHead(404, { 'Content-Type': 'application/json' }); return res.end(JSON.stringify({ error: 'not found' })); }
          for (const key of ['title', 'description', 'status', 'priority', 'workstream', 'tags', 'linkedSession']) {
            if (updates[key] !== undefined) items[idx][key] = updates[key];
          }
          items[idx].updated = new Date().toISOString();
          writeJSON(DISPATCH_F, items);
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true }));
      } catch (e) { res.writeHead(400, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: e.message })); }
    });
    return;
  }
  if (url.startsWith('/api/dispatch/') && req.method === 'DELETE') {
    const id = decodeURIComponent(url.slice('/api/dispatch/'.length));
    if (id.startsWith('mc-')) {
      const mcFile = path.join(__dirname, 'mc-backlog.json');
      const mcData = readJSON(mcFile, { tasks: [] });
      mcData.tasks = mcData.tasks.filter(i => i.id !== id);
      writeJSON(mcFile, mcData);
    } else {
      let items = readJSON(DISPATCH_F, []);
      items = items.filter(i => i.id !== id);
      writeJSON(DISPATCH_F, items);
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ ok: true }));
  }

  // ── Prompt Search API ───────────────────────────────────────────────────────
  if (url.startsWith('/api/search/prompts') && req.method === 'GET') {
    const params = new URL(req.url, 'http://localhost').searchParams;
    const q = (params.get('q') || '').toLowerCase().trim();
    const limit = Math.min(parseInt(params.get('limit') || '50', 10), 200);
    const offset = parseInt(params.get('offset') || '0', 10);

    if (!q || q.length < 2) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ results: [], total: 0, query: q }));
    }

    const results = [];
    const missions = readJSON(MISSIONS_F, {});

    // Scan all prompt ndjson files
    try {
      const promptFiles = fs.existsSync(PROMPTS_DIR) ? fs.readdirSync(PROMPTS_DIR).filter(f => f.endsWith('.ndjson')) : [];
      for (const f of promptFiles) {
        const sid = f.replace('.ndjson', '');
        try {
          const lines = fs.readFileSync(path.join(PROMPTS_DIR, f), 'utf8').trim().split('\n').filter(Boolean);
          for (let i = 0; i < lines.length; i++) {
            try {
              const entry = JSON.parse(lines[i]);
              const text = (entry.prompt || '').toLowerCase();
              if (text.includes(q)) {
                results.push({
                  sessionId: sid,
                  prompt: entry.prompt.slice(0, 300),
                  ts: entry.ts,
                  mission: missions[sid] || deriveMission(sid) || '',
                  matchIndex: i
                });
              }
            } catch {}
          }
        } catch {}
      }
    } catch {}

    // Also scan transcript files for prompts missed by hooks
    try {
      const tFiles = fs.existsSync(TRANSCRIPTS_DIR) ? fs.readdirSync(TRANSCRIPTS_DIR).filter(f => f.endsWith('.jsonl')) : [];
      const alreadyFound = new Set(results.map(r => r.sessionId + ':' + r.ts));
      for (const f of tFiles) {
        const sid = f.replace('.jsonl', '');
        if (!isValidSid(sid)) continue;
        try {
          const lines = fs.readFileSync(path.join(TRANSCRIPTS_DIR, f), 'utf8').trim().split('\n').filter(Boolean);
          for (const l of lines) {
            try {
              const d = JSON.parse(l);
              let text = '';
              if (d.type === 'user') {
                const msg = d.message;
                if (typeof msg === 'string') text = msg;
                else if (msg && Array.isArray(msg.content)) {
                  for (const p of msg.content) { if (p.type === 'text') text += p.text; }
                }
              }
              if (text && text.length > 5 && text.toLowerCase().includes(q)) {
                const ts = typeof d.timestamp === 'number' ? d.timestamp : typeof d.timestamp === 'string' ? new Date(d.timestamp).getTime() : 0;
                const key = sid + ':' + ts;
                if (!alreadyFound.has(key) && ts > 0) {
                  results.push({ sessionId: sid, prompt: text.slice(0, 300), ts, mission: missions[sid] || deriveMission(sid) || '', matchIndex: -1 });
                  alreadyFound.add(key);
                }
              }
            } catch {}
          }
        } catch {}
      }
    } catch {}

    // Sort by timestamp desc
    results.sort((a, b) => b.ts - a.ts);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ results: results.slice(offset, offset + limit), total: results.length, query: q }));
  }

  // ── AI Workstream Suggestion ────────────────────────────────────────────────
  if (url.startsWith('/api/suggest-workstream/') && req.method === 'GET') {
    const sid = decodeURIComponent(url.slice('/api/suggest-workstream/'.length));
    if (!isValidSid(sid)) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'invalid session id' }));
    }

    const prompts = readChainedPrompts(sid);
    const ws = readJSON(WORKSTREAMS_F, []);
    if (!prompts.length || !ws.length || !AI_READY) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ workstream: null, confidence: 0, reasoning: 'No data' }));
    }

    const promptText = prompts.slice(0, 5).map((p, i) => `${i + 1}. ${(p.prompt || '').slice(0, 200)}`).join('\n');
    const wsNames = ws.map(w => w.id + ' (' + w.name + ')').join(', ');

    callLLM(
      `Given these user prompts from a coding session, classify which workstream this session belongs to.
Available workstreams: ${wsNames}

Prompts:
${promptText}

Respond with ONLY a JSON object: {"workstream": "the-id", "confidence": 0.0-1.0, "reasoning": "brief reason"}`,
      256
    ).then(result => {
      try {
        const parsed = JSON.parse(result.replace(/```json?\s*/g, '').replace(/```/g, '').trim());
        // Auto-assign if high confidence
        if (parsed.confidence > 0.6 && ws.some(w => w.id === parsed.workstream)) {
          const aws = readJSON(AGENT_WS_F, {});
          if (!aws[sid] || !aws[sid].overridden) {
            aws[sid] = { workstream: parsed.workstream, tags: [], assignedBy: 'ai', overridden: false };
            writeJSON(AGENT_WS_F, aws);
          }
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(parsed));
      } catch {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ workstream: null, confidence: 0, reasoning: 'Failed to parse' }));
      }
    }).catch(() => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ workstream: null, confidence: 0, reasoning: 'API error' }));
    });
    return;
  }

  // Session detail page
  if (url.startsWith('/session/')) {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    return res.end(DETAIL_PAGE);
  }

  // Tools page
  if (url === '/tools') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    return res.end(readPage(TOOLS_HTML_F, 'Tools page'));
  }

  // Findings page
  if (url === '/findings') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    return res.end(readPage(FINDINGS_HTML_F, 'Findings page'));
  }

  // Logic page
  if (url === '/logic') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    return res.end(readPage(LOGIC_HTML_F, 'Logic page'));
  }

  // Radar page
  if (url === '/radar') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    return res.end(readPage(RADAR_HTML_F, 'Radar page'));
  }

  if (url === '/dispatch') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    return res.end(readPage(DISPATCH_HTML_F, 'Dispatch page'));
  }

  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(DASHBOARD);
});

server.listen(PORT, () => {
  console.log('');
  console.log('  \u250c\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510');
  console.log('  \u2502                                              \u2502');
  console.log('  \u2502   \u25c9  MISSION CONTROL v6                     \u2502');
  console.log('  \u2502   http://localhost:' + PORT + '                   \u2502');
  console.log('  \u2502                                              \u2502');
  console.log('  \u2502   AI:  ' + (AI_READY ? '\u2705 Cerebras ready' : '\u26a0\ufe0f  No API key (add to .env)') + '               \u2502');
  console.log('  \u2502   Ctrl+C to stop                             \u2502');
  console.log('  \u2502                                              \u2502');
  console.log('  \u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518');
  console.log('');
});
