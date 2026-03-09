const fs = require('fs');
const camps = JSON.parse(fs.readFileSync('C:/Users/ephra/phredomade/.claude/agent-hub/campaigns.json','utf8'));

const enrichment = {
  'orchestrator-v1': {
    grade: 'C+',
    gradeReason: 'High throughput (campaigns page, 13x perf gain, 15 agents coordinated) but broke Dashboard 3x, no Playwright, dumped prompts inline, built instead of delegating — context hit 2GB.',
    lifecycle: { define: 'passed', discover: 'failed', execute: 'passed', reason: 'partial', verify: 'failed' },
    lifecycleReached: 'execute',
    lifecycleFailedAt: 'discover',
    skillsUsed: [],
    skillsNote: 'Zero skill usage. Did not discover or use any of 34+ available skills.',
    delivered: ['/campaigns page', '13x page load improvement (18.5s to 1.4s)', 'Campaign auto-linking (prompt-hook.js)', 'StatusLine in hook.js', '15 agents dispatched across 4 sprint phases'],
    missed: ['Playwright verification (broke Dashboard 3x)', 'Prompt delivery (dumped inline)', 'Setup checklist', 'Context management (2GB crash)']
  },
  'orchestrator-v1.1': {
    grade: 'B+',
    gradeReason: 'Clean coordinator. Built /story, /close-out, condensed remaining 49 to 37, captured 7 findings. Memory cleanup started but not finished per user.',
    lifecycle: { define: 'passed', discover: 'partial', execute: 'passed', reason: 'passed', verify: 'partial' },
    lifecycleReached: 'reason',
    lifecycleFailedAt: null,
    skillsUsed: ['brainstorming'],
    skillsNote: 'First successful skill load in campaign. Used brainstorming once.',
    delivered: ['/story page', '/close-out page', 'Condensed 49 to 37 remaining items', '7 findings (f048-f052)', 'Memory cleanup (partial)', 'Handoff doc for v1.2'],
    missed: ['Memory cleanup not thorough enough', 'Notification sound still broken']
  },
  'beacon': {
    grade: 'B+',
    gradeReason: 'Clean delivery of terminal identity features. All assigned items completed.',
    lifecycle: { define: 'passed', discover: 'skipped', execute: 'passed', reason: 'skipped', verify: 'skipped' },
    lifecycleReached: 'execute',
    lifecycleFailedAt: null,
    skillsUsed: [],
    skillsNote: 'No skill usage detected.',
    delivered: ['Terminal auto-naming', '/name command', '/end-session structured close'],
    missed: []
  },
  'compass': {
    grade: 'A-',
    gradeReason: 'Excellent strategic output. Elevator pitch, /why page, 7 recommendations, and the key insight that the learning loop is the killer feature.',
    lifecycle: { define: 'passed', discover: 'passed', execute: 'passed', reason: 'passed', verify: 'skipped' },
    lifecycleReached: 'reason',
    lifecycleFailedAt: null,
    skillsUsed: [],
    skillsNote: 'Did competitive analysis research organically but did not use formal skills.',
    delivered: ['Elevator pitch: Air traffic control for AI agents', '/why page', '7 strategic recommendations', 'Key insight: learning loop is the killer feature'],
    missed: ['/why not wired as viewable deliverable on agent cards']
  },
  'overwatch': {
    grade: 'B',
    gradeReason: 'Good research output — inspector panel spec and competitive analysis. Research-only agent, no implementation.',
    lifecycle: { define: 'passed', discover: 'passed', execute: 'passed', reason: 'passed', verify: 'skipped' },
    lifecycleReached: 'reason',
    lifecycleFailedAt: null,
    skillsUsed: [],
    skillsNote: 'Did UX research and competitive analysis without formal skill usage.',
    delivered: ['Inspector panel spec', 'Competitive analysis (Kubernetes Lens, Jenkins Blue Ocean)'],
    missed: ['No implementation — spec only']
  },
  'polisher': {
    grade: 'A',
    gradeReason: 'Polished /why to screen-share quality and created /demo-guide. Clean, complete delivery.',
    lifecycle: { define: 'passed', discover: 'skipped', execute: 'passed', reason: 'passed', verify: 'passed' },
    lifecycleReached: 'verify',
    lifecycleFailedAt: null,
    skillsUsed: [],
    skillsNote: 'No formal skill usage. Would have benefited from impeccable-polish skill.',
    delivered: ['/why polished to screen-share quality', '/demo-guide created'],
    missed: []
  },
  'retrospector': {
    grade: 'B+',
    gradeReason: 'Solid retrospective with 7 broadly applicable lessons and orchestrator protocol.',
    lifecycle: { define: 'passed', discover: 'skipped', execute: 'passed', reason: 'passed', verify: 'skipped' },
    lifecycleReached: 'reason',
    lifecycleFailedAt: null,
    skillsUsed: [],
    skillsNote: 'No skill usage. Analysis was the core job.',
    delivered: ['Campaign retrospective', '7 broadly applicable lessons', 'Orchestrator protocol definition'],
    missed: ['Retro now stale — does not cover sprints 3-5']
  },
  'integrator': {
    grade: 'B',
    gradeReason: 'Added retrospective tab to Dashboard agent cards. Clean, focused delivery.',
    lifecycle: { define: 'passed', discover: 'skipped', execute: 'passed', reason: 'skipped', verify: 'skipped' },
    lifecycleReached: 'execute',
    lifecycleFailedAt: null,
    skillsUsed: [],
    skillsNote: 'No skill usage.',
    delivered: ['Retrospective tab on Dashboard agent cards'],
    missed: []
  },
  'analyst': {
    grade: 'B',
    gradeReason: 'Built analytics infrastructure and discovered the P0 sub-agent visibility gap. Incomplete implementation.',
    lifecycle: { define: 'passed', discover: 'passed', execute: 'passed', reason: 'passed', verify: 'failed' },
    lifecycleReached: 'reason',
    lifecycleFailedAt: 'verify',
    skillsUsed: [],
    skillsNote: 'No skill usage.',
    delivered: ['Session analytics infrastructure', 'Discovered sub-agent visibility gap (P0)'],
    missed: ['Analytics implementation incomplete', 'No per-agent metrics surfaced']
  },
  'video-analyzer': {
    grade: 'C+',
    gradeReason: 'Delivered transcription (80KB, 1168 segments, 15 quotes) but burned 30-40% extra tokens on wrong CUDA version. Wasteful execution.',
    lifecycle: { define: 'passed', discover: 'failed', execute: 'passed', reason: 'skipped', verify: 'skipped' },
    lifecycleReached: 'execute',
    lifecycleFailedAt: 'discover',
    skillsUsed: [],
    skillsNote: 'No skill usage. Failed to discover correct CUDA setup before executing.',
    delivered: ['2-hour demo transcribed: 80KB, 1168 segments', '15 value prop quotes', '/video-findings page'],
    missed: ['30-40% token waste on wrong CUDA version']
  },
  'findings-analyst': {
    grade: 'A-',
    gradeReason: 'Strong analytical output: 8 findings and 12 dispatch items extracted from transcript. Clean execution.',
    lifecycle: { define: 'passed', discover: 'skipped', execute: 'passed', reason: 'passed', verify: 'skipped' },
    lifecycleReached: 'reason',
    lifecycleFailedAt: null,
    skillsUsed: [],
    skillsNote: 'No formal skill usage. Analysis was core job.',
    delivered: ['8 findings (f036-f043)', '12 dispatch items from demo transcript'],
    missed: []
  },
  'medic': {
    grade: 'B',
    gradeReason: 'Built /health diagnostics page. Functional delivery, straightforward task.',
    lifecycle: { define: 'passed', discover: 'skipped', execute: 'passed', reason: 'skipped', verify: 'skipped' },
    lifecycleReached: 'execute',
    lifecycleFailedAt: null,
    skillsUsed: [],
    skillsNote: 'No skill usage. Would have benefited from frontend-design skill.',
    delivered: ['/health diagnostics page with system integrity checks'],
    missed: []
  },
  'workflow-redesign': {
    grade: 'D+',
    gradeReason: '3 failed iterations before using skills/sub-agents. Closed by user due to prompt quality. Did capture 5 important findings as silver lining.',
    lifecycle: { define: 'passed', discover: 'failed', execute: 'failed', reason: 'passed', verify: 'failed' },
    lifecycleReached: 'execute',
    lifecycleFailedAt: 'discover',
    skillsUsed: ['design (sub-agent, late)'],
    skillsNote: 'Did not discover design skills until 3 failed attempts. Eventually delegated to design sub-agent. Poster child for skill discovery gap.',
    delivered: ['Hook pipeline flow + collapsible sections (partial)', '5 findings (f046-f049, PM014)'],
    missed: ['Full workflow page redesign', 'Learning Loop visualization', 'Closed early by user']
  },
  'pipeline-architect': {
    grade: 'A-',
    gradeReason: 'Triple delivery: /capture, /president v1, Discord dump triage (14 items). High throughput with multiple deliverables.',
    lifecycle: { define: 'passed', discover: 'skipped', execute: 'passed', reason: 'skipped', verify: 'skipped' },
    lifecycleReached: 'execute',
    lifecycleFailedAt: null,
    skillsUsed: [],
    skillsNote: 'No skill usage despite building 3 pages. Would have benefited from brainstorming + frontend-design.',
    delivered: ['/capture: mobile idea intake with AI reasoning', '/president v1: mode-aware executive dashboard', 'Discord dump triage: 14 items (5 dispatch, 9 radar)'],
    missed: ['Remote capture', 'AI summaries', 'Image input', 'Dispatch deep-link filtering']
  },
  'dashboard-fix': {
    grade: 'A',
    gradeReason: 'Targeted bug fix, clean execution. Fixed PM008/PM011 blank card bug.',
    lifecycle: { define: 'passed', discover: 'skipped', execute: 'passed', reason: 'skipped', verify: 'passed' },
    lifecycleReached: 'verify',
    lifecycleFailedAt: null,
    skillsUsed: [],
    skillsNote: 'Bug fix — skill discovery not expected.',
    delivered: ['Blank card bug fixed (PM008/PM011)'],
    missed: []
  },
  'morning-brief': {
    grade: 'B',
    gradeReason: 'Built morning brief system with prioritized summary. Solid, focused delivery.',
    lifecycle: { define: 'passed', discover: 'skipped', execute: 'passed', reason: 'skipped', verify: 'skipped' },
    lifecycleReached: 'execute',
    lifecycleFailedAt: null,
    skillsUsed: [],
    skillsNote: 'No skill usage.',
    delivered: ['/morning-brief: prioritized wake-up summary', 'Fixed scroll/retro bugs', 'Updated campaign debrief'],
    missed: []
  }
};

// Apply enrichment
camps[0].agents.forEach(agent => {
  const e = enrichment[agent.slot];
  if (e) {
    Object.assign(agent, e);
  }
});

fs.writeFileSync('C:/Users/ephra/phredomade/.claude/agent-hub/campaigns.json', JSON.stringify(camps, null, 2));
console.log('Enriched', Object.keys(enrichment).length, 'agents in campaigns.json');
console.log();
console.log('=== GRADE SUMMARY ===');
camps[0].agents.forEach(a => {
  const bar = a.lifecycleReached || '?';
  const fail = a.lifecycleFailedAt ? ' (FAILED: ' + a.lifecycleFailedAt + ')' : '';
  const skills = (a.skillsUsed || []).length;
  console.log(
    (a.grade || '?').padEnd(4),
    a.name.padEnd(22),
    'Reached:', bar.padEnd(10),
    'Skills:', String(skills).padEnd(3),
    fail
  );
});

// Campaign-level stats
const grades = camps[0].agents.map(a => a.grade);
const gradeMap = { 'A': 4, 'A-': 3.7, 'B+': 3.3, 'B': 3, 'C+': 2.3, 'D+': 1.3 };
const avg = grades.reduce((s, g) => s + (gradeMap[g] || 0), 0) / grades.length;
console.log('\nCampaign GPA:', avg.toFixed(2));
console.log('Skill usage: ' + camps[0].agents.filter(a => a.skillsUsed && a.skillsUsed.length > 0).length + '/' + camps[0].agents.length + ' agents used any skill');
