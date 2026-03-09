#!/usr/bin/env node
// .claude/agent-hub/auto-grade.js — Auto-grade an agent after completion
// Called by dispatch.sh after the claude process exits.
// Reads the activity log, infers lifecycle stages, calculates preliminary grade,
// and writes results to campaigns.json.
//
// Usage: node auto-grade.js <session-id>
//
// Requires: state file with dispatchMeta (campaignId, slot)

const fs   = require('fs');
const path = require('path');

const STATES_DIR    = path.join(__dirname, 'states');
const LOGS_DIR      = path.join(__dirname, 'logs');
const CAMPAIGNS_F   = path.join(__dirname, 'campaigns.json');

const sessionId = process.argv[2];
if (!sessionId) {
  console.error('[auto-grade] No session ID provided');
  process.exit(1);
}

// ── Read state file for dispatch metadata ──
const stateFile = path.join(STATES_DIR, `${sessionId}.json`);
let state;
try {
  state = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
} catch (e) {
  console.error('[auto-grade] Cannot read state file:', e.message);
  process.exit(1);
}

const meta = state.dispatchMeta;
if (!meta || !meta.campaignId || !meta.slot) {
  console.log('[auto-grade] No campaign link — skipping grade');
  process.exit(0);
}

// ── Read activity log ──
const logFile = path.join(LOGS_DIR, `${sessionId}.ndjson`);
let entries = [];
try {
  entries = fs.readFileSync(logFile, 'utf8').trim().split('\n')
    .map(l => { try { return JSON.parse(l); } catch { return null; } })
    .filter(Boolean);
} catch {
  console.log('[auto-grade] No activity log — minimal grade');
}

// ── Parse transcript for Skill tool calls + screenshot evidence ──
// The activity log (hook.js) only sees Read/Edit/Bash states — it CANNOT see Skill tool calls.
// The transcript (.jsonl) contains the full tool_use record with name:"Skill".
// Also check for Playwright screenshot files created by the agent.
// Transcripts are in the USER HOME .claude/projects/, not the project .claude/projects/
const TRANSCRIPTS_DIR = path.join(process.env.HOME || process.env.USERPROFILE || '', '.claude', 'projects');
let transcriptSkills = [];
let transcriptHasScreenshots = false;
let transcriptHasDebrief = false;

// Find the transcript file — could be in various project dirs
const projectDirs = fs.existsSync(TRANSCRIPTS_DIR)
  ? fs.readdirSync(TRANSCRIPTS_DIR).filter(d => fs.statSync(path.join(TRANSCRIPTS_DIR, d)).isDirectory())
  : [];

for (const pd of projectDirs) {
  const tFile = path.join(TRANSCRIPTS_DIR, pd, `${sessionId}.jsonl`);
  if (fs.existsSync(tFile)) {
    try {
      const tLines = fs.readFileSync(tFile, 'utf8').trim().split('\n');
      for (const line of tLines) {
        try {
          const e = JSON.parse(line);
          const content = e.message && e.message.content;
          if (!Array.isArray(content)) continue;
          for (const block of content) {
            // Detect Skill tool calls
            if (block.type === 'tool_use' && block.name === 'Skill') {
              const sk = block.input && block.input.skill;
              if (sk && !transcriptSkills.includes(sk)) transcriptSkills.push(sk);
            }
            // Detect Bash commands with screenshot/playwright keywords
            if (block.type === 'tool_use' && block.name === 'Bash') {
              const cmd = (block.input && block.input.command) || '';
              if (/playwright|screenshot/i.test(cmd)) transcriptHasScreenshots = true;
              if (/api\/campaigns\/agent-debrief/i.test(cmd)) transcriptHasDebrief = true;
            }
          }
        } catch {}
      }
    } catch {}
    break; // Found the transcript, stop searching
  }
}

// Also check for screenshot files in screenshots/ dir
// Screenshots dir is in the project root (2 levels up from .claude/agent-hub/)
const screenshotsDir = path.join(__dirname, '..', '..', 'screenshots');
if (fs.existsSync(screenshotsDir)) {
  const agentScreenshots = fs.readdirSync(screenshotsDir)
    .filter(f => f.toLowerCase().includes(meta.slot.replace(/-/g, '')) ||
                 f.toLowerCase().includes(meta.slot.split('-')[0]));
  if (agentScreenshots.length > 0) transcriptHasScreenshots = true;
}

// ── Infer lifecycle stages from activity log ──
const lifecycle = { define: 'skipped', discover: 'skipped', execute: 'skipped', reason: 'skipped', verify: 'skipped', debrief: 'skipped' };
const skillsUsed = [...transcriptSkills]; // Seed with transcript-detected skills

// Track tool usage sequence
const toolSequence = entries.map(e => ({ state: e.state, tool: e.tool, detail: e.detail || '', ts: e.ts }));
const hasReads = toolSequence.some(t => t.state === 'investigating');
const hasWrites = toolSequence.some(t => t.state === 'developing');
const hasBash = toolSequence.some(t => t.state === 'verifying');

// Find first write index (transition from reading to writing)
const firstWriteIdx = toolSequence.findIndex(t => t.state === 'developing');
const firstBashIdx = toolSequence.findIndex(t => t.state === 'verifying');

// DEFINE: Did the agent read files at the start?
const earlyReads = toolSequence.filter((t, i) => i < (firstWriteIdx > 0 ? firstWriteIdx : toolSequence.length) && t.state === 'investigating');
if (earlyReads.length >= 2) {
  lifecycle.define = 'passed';
} else if (earlyReads.length >= 1) {
  lifecycle.define = 'partial';
}

// DISCOVER: Did the agent check .claude/skills/ or load skills via Skill tool?
const skillReads = toolSequence.filter(t =>
  t.state === 'investigating' &&
  (t.detail.includes('.claude/skills') || t.detail.includes('skills/'))
);
// Transcript-based skill detection (Skill tool calls don't appear in activity logs)
if (transcriptSkills.length > 0 || skillReads.length > 0) {
  lifecycle.discover = 'passed';
  // Also check activity log for skill directory reads
  const skillMentions = toolSequence
    .filter(t => t.detail.includes('/skills/'))
    .map(t => {
      const m = t.detail.match(/skills\/([^/]+)/);
      return m ? m[1] : null;
    })
    .filter(Boolean);
  skillMentions.forEach(s => { if (!skillsUsed.includes(s)) skillsUsed.push(s); });
} else {
  const anySkillRef = toolSequence.some(t => t.detail.toLowerCase().includes('skill'));
  lifecycle.discover = anySkillRef ? 'partial' : 'skipped';
}

// EXECUTE: Did the agent write/edit files?
if (hasWrites) {
  const writeCount = toolSequence.filter(t => t.state === 'developing').length;
  lifecycle.execute = writeCount >= 2 ? 'passed' : 'partial';
}

// REASON: Did the agent read files AFTER writing? (reviewing own output)
if (hasWrites) {
  const postWriteReads = toolSequence.filter((t, i) => i > firstWriteIdx && t.state === 'investigating');
  if (postWriteReads.length >= 1) {
    lifecycle.reason = 'passed';
  } else {
    lifecycle.reason = 'skipped';
  }
}

// VERIFY: Did the agent run bash commands AFTER writing? (tests, screenshots, curl)
// Also check transcript for screenshot evidence (Playwright scripts won't show in activity log detail)
if (hasBash && firstBashIdx > firstWriteIdx) {
  const postWriteBash = toolSequence.filter((t, i) => i > firstWriteIdx && t.state === 'verifying');
  const hasVerifyKeywords = postWriteBash.some(t =>
    t.detail.includes('curl') || t.detail.includes('test') ||
    t.detail.includes('playwright') || t.detail.includes('screenshot') ||
    t.detail.includes('npm run')
  );
  lifecycle.verify = (hasVerifyKeywords || transcriptHasScreenshots) ? 'passed' : 'partial';
} else if (hasBash || transcriptHasScreenshots) {
  lifecycle.verify = transcriptHasScreenshots ? 'passed' : 'partial';
}

// DEBRIEF: Check if agent called the debrief API (from transcript)
if (!lifecycle.debrief) lifecycle.debrief = 'skipped';
if (transcriptHasDebrief) lifecycle.debrief = 'passed';

// ── Calculate preliminary score (aligned with .claude/skills/agent-grading/SKILL.md) ──

// Lifecycle score (20 pts, 6 stages — ~3.3 per stage, passed=4 partial=2 then cap at 20)
const stagePts = { passed: 4, partial: 2, failed: 1, skipped: 0 };
let lcScore = 0;
['define', 'discover', 'execute', 'reason', 'verify', 'debrief'].forEach(stage => {
  const s = lifecycle[stage];
  if (s === 'skipped') {
    const isResearch = !hasWrites;
    if (isResearch && ['execute', 'reason', 'verify'].includes(stage)) {
      lcScore += 2; // neutral for non-applicable stages
    }
  } else {
    lcScore += stagePts[s] || 0;
  }
});
lcScore = Math.min(20, lcScore); // Cap at 20 pts max

// Skills score (15 pts) — aligned with skill rubric tiers:
//   13-15: Checked skills + used 1+ relevant skills
//   9-12:  Checked skills + correctly determined none needed, OR used appropriate skills
//   5-8:   Didn't check but task had low skill relevance
//   2-4:   Failed to discover skills that would have prevented failure
//   0-1:   Mandated skills ignored
let skillScore;
if (skillsUsed.length >= 2) skillScore = 15;
else if (skillsUsed.length === 1) skillScore = 13;
else if (lifecycle.discover === 'passed') skillScore = 10;  // Checked, determined none needed
else if (lifecycle.discover === 'partial') skillScore = 5;   // Some awareness but didn't use
else if (lifecycle.discover === 'failed') skillScore = 0;    // Failed to discover — hard zero
else skillScore = 3;  // Skipped/pending — didn't even check

// Execution quality (25 pts) — per skill rubric:
//   22-25: Clean execution, right approach first try
//   17-21: Minor inefficiency, 1 wrong approach corrected quickly
//   12-16: User redirected 2-3 times
//   6-11:  Significant waste, repeated redirections
//   0-5:   Catastrophic, broke things
// Auto-detection signals from activity log:
let execScore = 22; // Assume clean unless we find signals otherwise
const totalTools = toolSequence.length;
// Very short sessions = possible incomplete work
if (totalTools < 5) execScore -= 5;
// Very long sessions = possible wasted iterations
if (totalTools > 80) execScore -= 3;
if (totalTools > 120) execScore -= 5;
// Repeated same-tool usage in succession = possible retry loop
let repeatCount = 0;
for (let i = 1; i < toolSequence.length; i++) {
  if (toolSequence[i].tool === toolSequence[i-1].tool &&
      toolSequence[i].detail === toolSequence[i-1].detail) repeatCount++;
}
if (repeatCount > 5) execScore -= 5;  // Significant retries
if (repeatCount > 10) execScore -= 5; // Major retry loop
execScore = Math.max(5, execScore);

// Deliverables (40 pts) — CANNOT be fully auto-assessed from activity logs alone.
// Per skill rubric: requires counting delivered vs missed and weighing impact.
//
// IMPORTANT: If the agent has no delivered items AND no pre-existing scoreBreakdown,
// we MUST assume low deliverables. The old defaults (30/40 for reaching Verify)
// inflated grades — Dashboard Perf got 69/100 (B-) despite delivering NOTHING.
// Fix (P0 from v1.5 handoff): check if agent actually has deliverables data.
// If delivered[] is empty, cap at 10/40 regardless of lifecycle stage.
// Orchestrator/user overrides with actual assessment via manual grade.
let delScore;

// Check if agent already has deliverables data in campaigns.json
const campaign_data = JSON.parse(fs.readFileSync(CAMPAIGNS_F, 'utf8'));
const campaign_check = campaign_data.find(c => c.id === meta.campaignId);
const agent_check = campaign_check ? campaign_check.agents.find(a => a.slot === meta.slot) : null;
const hasDeliverables = agent_check && agent_check.delivered && agent_check.delivered.length > 0;

if (hasDeliverables) {
  // Score based on actual delivered vs missed ratio
  const delivered = agent_check.delivered || [];
  const missed = agent_check.missed || [];
  // Filter out placeholder "no missed items" entries
  const realMissed = missed.filter(m => !/no miss|none|nothing|n\/a/i.test(m));
  const total_items = delivered.length + realMissed.length;
  if (total_items > 0) {
    delScore = Math.round(40 * delivered.length / total_items);
  } else {
    delScore = 30; // Has deliverables array but both are empty — assume decent
  }
  // Bonus: if verify passed and zero real misses, bump to at least 35
  if (lifecycle.verify !== 'skipped' && realMissed.length === 0 && delivered.length >= 3) {
    delScore = Math.max(delScore, 35);
  }
} else {
  // No deliverables data — be conservative. Agent must prove it delivered.
  // Review agent or orchestrator will fill in actual data and re-grade.
  if (lifecycle.verify !== 'skipped') delScore = 15; // Built + verified something, but unconfirmed
  else if (lifecycle.execute !== 'skipped') delScore = 10; // Wrote files but no verification
  else delScore = 5; // Barely started
}

const total = delScore + execScore + lcScore + skillScore;

// Map to letter grade
function scoreToGrade(s) {
  if (s >= 97) return 'A+';
  if (s >= 93) return 'A';
  if (s >= 90) return 'A-';
  if (s >= 87) return 'B+';
  if (s >= 83) return 'B';
  if (s >= 80) return 'B-';
  if (s >= 77) return 'C+';
  if (s >= 73) return 'C';
  if (s >= 70) return 'C-';
  if (s >= 67) return 'D+';
  if (s >= 63) return 'D';
  if (s >= 60) return 'D-';
  return 'F';
}

const grade = scoreToGrade(total);

// ── Write to campaigns.json ──
try {
  const campaigns = JSON.parse(fs.readFileSync(CAMPAIGNS_F, 'utf8'));
  const campaign = campaigns.find(c => c.id === meta.campaignId);
  if (!campaign) {
    console.log('[auto-grade] Campaign not found:', meta.campaignId);
    process.exit(0);
  }

  const agent = campaign.agents.find(a => a.slot === meta.slot);
  if (!agent) {
    console.log('[auto-grade] Agent slot not found:', meta.slot);
    process.exit(0);
  }

  // Update agent with auto-grade results
  agent.lifecycle = lifecycle;
  agent.skillsUsed = skillsUsed.length ? skillsUsed : agent.skillsUsed || [];
  agent.status = 'completed';

  // Always update grade + breakdown. Re-runs should produce better scores
  // as more data becomes available (transcript, debrief). Manual overrides
  // happen via direct campaigns.json edits, not via auto-grade.
  agent.grade = grade;
  agent.gradeReason = `Auto-graded: ${total}/100. Lifecycle ${lcScore}/20, Skills ${skillScore}/15, Exec ${execScore}/25, Deliverables ${delScore}/40.`;
  agent.scoreBreakdown = {
    deliverables: delScore,
    execution: execScore,
    lifecycle: lcScore,
    skills: skillScore,
      total
    };

  fs.writeFileSync(CAMPAIGNS_F, JSON.stringify(campaigns, null, 2));
  console.log(`[auto-grade] ${meta.agentName}: ${grade} (${total}/100)`);
  console.log(`  Lifecycle: D=${lifecycle.define} Di=${lifecycle.discover} E=${lifecycle.execute} R=${lifecycle.reason} V=${lifecycle.verify}`);
  if (skillsUsed.length) console.log(`  Skills: ${skillsUsed.join(', ')}`);
} catch (e) {
  console.error('[auto-grade] Error writing grade:', e.message);
  process.exit(1);
}
