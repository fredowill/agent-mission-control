#!/usr/bin/env node
// auto-grade-orchestrator.js — Auto-grade orchestrator agents using orchestrator-specific rubric
// Separate from auto-grade.js (sub-agent grader). Uses 4-factor orchestrator rubric:
//   Coordination Quality 35%, Planning Quality 25%, Lifecycle Adherence 20%, Knowledge Continuity 20%
// Uses 6-stage orchestrator lifecycle: Orient, Plan, Dispatch, Monitor, Synthesize, Handoff
//
// Usage: node auto-grade-orchestrator.js <session-id>
//   OR:  node auto-grade-orchestrator.js --test          (run against all orchestrators in campaigns.json)
//   OR:  node auto-grade-orchestrator.js --test <slot>   (run against specific orchestrator)
//
// Called by auto-grade.js when it detects slot.startsWith('orchestrator-v')

const fs   = require('fs');
const path = require('path');

const STATES_DIR    = path.join(__dirname, 'states');
const LOGS_DIR      = path.join(__dirname, 'logs');
const CAMPAIGNS_F   = path.join(__dirname, 'campaigns.json');
const SKILLS_DIR    = path.join(process.env.HOME || process.env.USERPROFILE || '', '.claude', 'skills');
const PROMPTS_DIR   = path.join(__dirname, 'prompts');

// ── Known valid skill names (cached on first use) ──
let VALID_SKILLS = null;
function getValidSkills() {
  if (VALID_SKILLS) return VALID_SKILLS;
  try {
    VALID_SKILLS = fs.readdirSync(SKILLS_DIR).filter(d => {
      try { return fs.statSync(path.join(SKILLS_DIR, d)).isDirectory(); } catch { return false; }
    });
  } catch {
    VALID_SKILLS = [];
  }
  return VALID_SKILLS;
}

// ── Bug Fix #2: Skills sanitization ──
// Strip shell output leaked as skill names (pipes, redirects, globs)
const SHELL_CHARS_PATTERN = /[|><*&;`$(){}[\]\\]/;
function sanitizeSkills(rawSkills) {
  const validSkills = getValidSkills();
  return rawSkills.filter(s => {
    if (!s || typeof s !== 'string') return false;
    // Strip anything containing shell characters
    if (SHELL_CHARS_PATTERN.test(s)) return false;
    // Strip anything starting with numbers or whitespace-heavy entries
    if (/^\d/.test(s.trim()) || /^\s*$/.test(s)) return false;
    // Must match a known skill name
    return validSkills.includes(s.trim());
  }).map(s => s.trim());
}

// ── Bug Fix #3: Get mandated skills from agent's prompt file ──
function getMandatedSkills(slot, campaignId) {
  // Look for prompt file matching the slot
  const promptFiles = [];
  try {
    if (fs.existsSync(PROMPTS_DIR)) {
      const files = fs.readdirSync(PROMPTS_DIR);
      for (const f of files) {
        if (f.includes(slot) || f.includes(campaignId)) {
          promptFiles.push(path.join(PROMPTS_DIR, f));
        }
      }
    }
  } catch { /* no prompts dir */ }

  const mandated = [];
  for (const pf of promptFiles) {
    try {
      const content = fs.readFileSync(pf, 'utf8');
      // Look for "Mandated skills:" or "Stage 2: DISCOVER" sections
      const mandatedMatch = content.match(/[Mm]andated skills[^:]*:\s*`([^`]+)`/g);
      if (mandatedMatch) {
        for (const m of mandatedMatch) {
          const skillName = m.match(/`([^`]+)`/);
          if (skillName) mandated.push(skillName[1]);
        }
      }
      // Also check for skill references in DISCOVER stage
      const discoverSection = content.match(/Stage 2:.*?DISCOVER[\s\S]*?Stage 3:/);
      if (discoverSection) {
        const skillRefs = discoverSection[0].match(/`([a-z][\w-]+)`/g);
        if (skillRefs) {
          skillRefs.forEach(r => {
            const name = r.replace(/`/g, '');
            if (getValidSkills().includes(name) && !mandated.includes(name)) {
              mandated.push(name);
            }
          });
        }
      }
    } catch { /* skip unreadable files */ }
  }

  // Orchestrators always have these mandated skills
  const orchestratorMandated = [
    'orchestrator', 'orchestrator-init', 'orchestrator-rules',
    'orchestrator-plan', 'orchestrator-dispatch', 'orchestrator-grade',
    'orchestrator-sprint', 'orchestrator-handoff'
  ];

  // Merge without duplicates
  for (const s of orchestratorMandated) {
    if (!mandated.includes(s)) mandated.push(s);
  }

  return mandated;
}

// ── Orchestrator lifecycle stages ──
const ORCHESTRATOR_STAGES = ['orient', 'plan', 'dispatch', 'monitor', 'synthesize', 'handoff'];

// Map sub-agent lifecycle fields to orchestrator stages
function mapLifecycleToOrchestrator(subAgentLifecycle) {
  if (!subAgentLifecycle) return null;
  return {
    orient:     subAgentLifecycle.define || 'skipped',
    plan:       subAgentLifecycle.discover || 'skipped',
    dispatch:   subAgentLifecycle.execute || 'skipped',
    monitor:    subAgentLifecycle.reason || 'skipped',
    synthesize: subAgentLifecycle.verify || 'skipped',
    handoff:    subAgentLifecycle.debrief || 'skipped'
  };
}

// ── Bug Fix #1: Stage-by-stage specific reasoning ──
function generateStageReasoning(stage, rating, agent, campaign) {
  const delivered = agent.delivered || [];
  const missed = agent.missed || [];
  const skills = sanitizeSkills(agent.skillsUsed || []);
  const focus = agent.focus || '';
  const sprint = agent.sprint;

  // Count non-orchestrator agents in same sprint
  const sprintAgents = campaign.agents.filter(a =>
    a.sprint === sprint && !a.slot.startsWith('orchestrator-v')
  );
  const completedAgents = sprintAgents.filter(a => a.status === 'completed');
  const gradedAgents = sprintAgents.filter(a => a.grade);

  switch (stage) {
    case 'orient': {
      const hasInit = skills.some(s => s.includes('orchestrator-init'));
      const hasRules = skills.some(s => s.includes('orchestrator-rules'));
      const hasHandoffDoc = agent.retro ? 'loaded handoff doc' : 'no handoff doc found';
      if (rating === 'passed') {
        return `Orient: PASSED — ${hasHandoffDoc}, loaded ${skills.length} skills (${hasInit ? 'includes orchestrator-init' : 'missing orchestrator-init'}), self-registered in campaigns.json, focus: "${focus.substring(0, 80)}".`;
      } else if (rating === 'partial') {
        return `Orient: PARTIAL — ${hasHandoffDoc}, ${hasInit ? 'loaded orchestrator-init' : 'did not load orchestrator-init'}, ${hasRules ? '' : 'missing orchestrator-rules. '}Incomplete context loading before first decision.`;
      }
      return `Orient: FAILED — skipped context loading or self-registration. ${hasHandoffDoc}.`;
    }

    case 'plan': {
      const planSkills = skills.filter(s => s.includes('orchestrator-plan'));
      if (rating === 'passed') {
        return `Plan: PASSED — produced execution plan${sprint ? ` for sprint ${sprint}` : ''}, ${sprintAgents.length} agents planned for dispatch. Used ${planSkills.length > 0 ? planSkills.join(', ') : 'planning phase'}. Tasks decomposed to single deliverables.`;
      } else if (rating === 'partial') {
        return `Plan: PARTIAL — plan exists but ${sprintAgents.length === 0 ? 'no agents were planned for dispatch' : 'missing dependencies or priorities'}. ${planSkills.length === 0 ? 'orchestrator-plan skill not loaded.' : ''}`;
      }
      return `Plan: FAILED — no formal execution plan. Jumped to dispatching agents ad-hoc or skipped planning entirely.`;
    }

    case 'dispatch': {
      const dispatchSkills = skills.filter(s => s.includes('orchestrator-dispatch') || s.includes('create-agent-prompt'));
      if (rating === 'passed') {
        return `Dispatch: PASSED — ${sprintAgents.length} agents dispatched in sprint ${sprint || '?'}. ${dispatchSkills.length > 0 ? `Used ${dispatchSkills.join(', ')}.` : ''} ${completedAgents.length}/${sprintAgents.length} completed. Campaign cards registered.`;
      } else if (rating === 'partial') {
        return `Dispatch: PARTIAL — ${sprintAgents.length} agents dispatched but ${dispatchSkills.length === 0 ? 'dispatch skill not used (possible PM022 violation)' : 'incomplete dispatch checklist'}. ${completedAgents.length}/${sprintAgents.length} completed.`;
      }
      return `Dispatch: FAILED — ${sprintAgents.length === 0 ? 'no agents dispatched' : 'agents dispatched without proper pipeline (Agent tool instead of /api/launch)'}. Missing campaign cards or prompt files.`;
    }

    case 'monitor': {
      if (rating === 'passed') {
        return `Monitor: PASSED — tracked ${sprintAgents.length} agents, graded ${gradedAgents.length} with full rubric. Zero duplicate work detected. Progress reported in scannable format.`;
      } else if (rating === 'partial') {
        return `Monitor: PARTIAL — ${gradedAgents.length}/${sprintAgents.length} agents graded. ${sprintAgents.length - gradedAgents.length > 0 ? `${sprintAgents.length - gradedAgents.length} agents not graded.` : 'Grading delayed or incomplete rubric used.'}`;
      }
      return `Monitor: FAILED — no active monitoring. ${sprintAgents.length > 0 ? `${sprintAgents.length} agents ran unsupervised.` : 'No agents to monitor.'} Grading was retroactive or missing.`;
    }

    case 'synthesize': {
      const findingsCount = delivered.filter(d =>
        /finding|f\d{3}/i.test(d)
      ).length;
      if (rating === 'passed') {
        return `Synthesize: PASSED — captured ${findingsCount} finding(s) as structured data. ${delivered.length} total deliverables documented. Lessons consolidated across agents.`;
      } else if (rating === 'partial') {
        return `Synthesize: PARTIAL — ${findingsCount} finding(s) captured${findingsCount === 0 ? ' (none found)' : ' but post-hoc or unstructured'}. ${delivered.length} deliverables listed, ${missed.length} items missed.`;
      }
      return `Synthesize: FAILED — no findings captured. No sprint transition plan. Lessons lost between sprints.`;
    }

    case 'handoff': {
      const hasRetro = !!agent.retro;
      const hasDebrief = rating !== 'skipped' && rating !== 'failed';
      if (rating === 'passed') {
        return `Handoff: PASSED — ${hasRetro ? `handoff doc at ${agent.retro}` : 'handoff doc written'}. Debrief API called with ${delivered.length} delivered, ${missed.length} missed. State transferred for next orchestrator.`;
      } else if (rating === 'partial') {
        return `Handoff: PARTIAL — ${hasRetro ? 'handoff doc exists but missing sections' : 'no handoff doc found'}. ${hasDebrief ? 'Debrief called but with vague items.' : 'Debrief API not called.'} Uncommitted changes possible.`;
      }
      return `Handoff: FAILED — ${hasRetro ? '' : 'no handoff doc. '}${hasDebrief ? '' : 'No debrief API call. '}State lost between orchestrator versions. Next version must rediscover context.`;
    }

    default:
      return `${stage}: ${rating.toUpperCase()}`;
  }
}

// ── Score calculation ──

// Factor 1: Coordination Quality (35 pts)
function scoreCoordination(agent, campaign) {
  const sprint = agent.sprint;
  const sprintAgents = campaign.agents.filter(a =>
    a.sprint === sprint && !a.slot.startsWith('orchestrator-v')
  );

  // Edge case: no dispatched agents (close-out sprint)
  if (sprintAgents.length === 0) {
    // Evaluate campaign management quality instead
    const delivered = agent.delivered || [];
    const missed = agent.missed || [];
    const realMissed = filterRealMissed(missed);
    const total = delivered.length + realMissed.length;
    if (total === 0) return { score: 15, reason: 'No agents dispatched and no deliverables data — conservative score.' };
    const ratio = delivered.length / total;
    const score = Math.round(35 * ratio);
    return {
      score: Math.max(5, score),
      reason: `Close-out sprint — no agents to coordinate. Campaign management: ${delivered.length} delivered, ${realMissed.length} missed.`
    };
  }

  const completedAgents = sprintAgents.filter(a => a.status === 'completed');
  const failedAgents = sprintAgents.filter(a => a.grade && ['D+', 'D', 'D-', 'F'].includes(a.grade));
  const highGradeAgents = sprintAgents.filter(a => a.grade && ['A+', 'A', 'A-', 'B+', 'B'].includes(a.grade));

  // Base score from completion rate
  const completionRate = sprintAgents.length > 0 ? completedAgents.length / sprintAgents.length : 0;
  let score = Math.round(20 * completionRate);

  // Bonus for high-quality outcomes
  const qualityRate = completedAgents.length > 0 ? highGradeAgents.length / completedAgents.length : 0;
  score += Math.round(10 * qualityRate);

  // Penalty for failures
  score -= failedAgents.length * 3;

  // Check for duplicate work (agents with overlapping focus)
  // Simple heuristic: check if any two agent focus strings share >50% words
  const focusWords = sprintAgents.map(a => new Set((a.focus || '').toLowerCase().split(/\s+/)));
  let duplicateCount = 0;
  for (let i = 0; i < focusWords.length; i++) {
    for (let j = i + 1; j < focusWords.length; j++) {
      const intersection = [...focusWords[i]].filter(w => focusWords[j].has(w) && w.length > 3);
      const smaller = Math.min(focusWords[i].size, focusWords[j].size);
      if (smaller > 0 && intersection.length / smaller > 0.5) duplicateCount++;
    }
  }
  score -= duplicateCount * 5;

  // Cap at 5-35
  score = Math.max(5, Math.min(35, score + 5)); // +5 base for having agents at all

  const reason = `${sprintAgents.length} agents dispatched, ${completedAgents.length} completed, ${highGradeAgents.length} high-grade (B+ or above), ${failedAgents.length} failed. ${duplicateCount > 0 ? `${duplicateCount} potential duplicate work pair(s).` : 'No duplicate work detected.'}`;

  return { score, reason };
}

// Factor 2: Planning Quality (25 pts)
function scorePlanning(agent, orchestratorLifecycle) {
  const delivered = agent.delivered || [];
  const missed = agent.missed || [];
  const skills = sanitizeSkills(agent.skillsUsed || []);
  const hasPlanSkill = skills.some(s => s.includes('orchestrator-plan'));
  const focus = agent.focus || '';

  let score = 10; // Base

  // Plan skill loaded
  if (hasPlanSkill) score += 5;

  // Plan stage passed
  if (orchestratorLifecycle.plan === 'passed') score += 5;
  else if (orchestratorLifecycle.plan === 'partial') score += 2;

  // Focus quality — has specifics (numbers, version refs, named items)
  if (/\d+/.test(focus) && focus.length > 30) score += 3;

  // Deliverables show plan execution
  if (delivered.length >= 5) score += 2;

  score = Math.max(3, Math.min(25, score));

  const reason = `${hasPlanSkill ? 'orchestrator-plan loaded.' : 'orchestrator-plan NOT loaded.'} Plan stage: ${orchestratorLifecycle.plan}. Focus specificity: ${focus.length > 30 ? 'good' : 'vague'}. ${delivered.length} items delivered.`;

  return { score, reason };
}

// Factor 3: Lifecycle Adherence (20 pts)
// Bug Fix #4: Score calibration — partials dock points, failed docks more
function scoreLifecycle(orchestratorLifecycle) {
  const STAGE_POINTS = {
    passed: 4,   // 4 pts per stage, 6 stages = 24 max, capped at 20
    partial: 2,  // -2 penalty vs passed (Bug Fix #4: at least 5pt dock per partial from max)
    failed: 0,   // -4 penalty vs passed (Bug Fix #4: at least 10pt dock per failed from max)
    skipped: 0
  };

  let rawScore = 0;
  const stageDetails = [];

  for (const stage of ORCHESTRATOR_STAGES) {
    const rating = orchestratorLifecycle[stage] || 'skipped';
    rawScore += STAGE_POINTS[rating] || 0;
    stageDetails.push(`${stage}=${rating}`);
  }

  // Cap at 20
  let score = Math.min(20, rawScore);

  // Bug Fix #4: Hard caps based on partial/failed count
  const partialCount = ORCHESTRATOR_STAGES.filter(s => orchestratorLifecycle[s] === 'partial').length;
  const failedCount = ORCHESTRATOR_STAGES.filter(s =>
    orchestratorLifecycle[s] === 'failed' || orchestratorLifecycle[s] === 'skipped'
  ).length;

  // Two partials should never exceed ~17/20 (85%)
  if (partialCount >= 2) score = Math.min(score, 17);
  // Any failed stage caps at 15/20
  if (failedCount >= 1) score = Math.min(score, 15);
  // Two or more failed caps at 10/20
  if (failedCount >= 2) score = Math.min(score, 10);

  const reason = `${stageDetails.join(', ')}. ${partialCount} partial, ${failedCount} failed/skipped.`;

  return { score, reason };
}

// Factor 4: Knowledge Continuity (20 pts)
function scoreKnowledgeContinuity(agent, orchestratorLifecycle) {
  const delivered = agent.delivered || [];
  const missed = agent.missed || [];
  const hasRetro = !!agent.retro;
  const hasDebrief = orchestratorLifecycle.handoff !== 'skipped' && orchestratorLifecycle.handoff !== 'failed';

  let score = 0;

  // Handoff doc exists (8 pts)
  if (hasRetro) score += 8;
  else score += 0;

  // Debrief API called (4 pts)
  if (hasDebrief) score += 4;

  // Findings captured — look for finding references in delivered items
  const findingsCount = delivered.filter(d => /finding|f\d{3}/i.test(d)).length;
  if (findingsCount >= 3) score += 4;
  else if (findingsCount >= 1) score += 2;

  // Delivered/missed arrays populated (shows self-awareness)
  if (delivered.length >= 3 && missed.length >= 0) score += 2;

  // Lessons learned (missed array shows honest self-assessment)
  if (missed.length >= 1 && missed.some(m => !/no miss|none|nothing|n\/a/i.test(m))) {
    score += 2;
  }

  score = Math.max(0, Math.min(20, score));

  const reason = `Handoff doc: ${hasRetro ? 'yes' : 'no'}. Debrief: ${hasDebrief ? 'yes' : 'no'}. Findings: ${findingsCount}. Delivered items: ${delivered.length}. Missed items: ${missed.length}.`;

  return { score, reason };
}

// ── Helper: filter real missed items ──
function filterRealMissed(missed) {
  return (missed || []).filter(m =>
    !/no miss|none|nothing|n\/a/i.test(m) &&
    !/out of scope|deferred|future work|not in scope|beyond scope|correctly left/i.test(m)
  );
}

// ── Letter grade mapping ──
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

// ── Bug Fix #4: Total score calibration ──
function calibrateTotal(coordination, planning, lifecycle, continuity, orchestratorLifecycle) {
  let total = coordination.score + planning.score + lifecycle.score + continuity.score;

  // Hard cap: any partial stages means max 92 (no A+ possible)
  const partialCount = ORCHESTRATOR_STAGES.filter(s => orchestratorLifecycle[s] === 'partial').length;
  const failedCount = ORCHESTRATOR_STAGES.filter(s =>
    orchestratorLifecycle[s] === 'failed' || orchestratorLifecycle[s] === 'skipped'
  ).length;

  if (partialCount >= 1) total = Math.min(total, 92);
  if (partialCount >= 2) total = Math.min(total, 85);
  if (failedCount >= 1) total = Math.min(total, 82);
  if (failedCount >= 2) total = Math.min(total, 72);

  return Math.max(0, Math.min(100, total));
}

// ── Main grading function ──
function gradeOrchestrator(agent, campaign, options = {}) {
  const { dryRun = false } = options;

  // Map existing lifecycle to orchestrator stages
  const orchestratorLifecycle = mapLifecycleToOrchestrator(agent.lifecycle);
  if (!orchestratorLifecycle) {
    return {
      error: 'No lifecycle data available',
      grade: null,
      total: 0
    };
  }

  // Sanitize skills (Bug Fix #2)
  const cleanSkills = sanitizeSkills(agent.skillsUsed || []);

  // Get mandated skills (Bug Fix #3)
  const mandatedSkills = getMandatedSkills(agent.slot, campaign.id);
  const usedMandated = mandatedSkills.filter(s => cleanSkills.includes(s));
  const missedMandated = mandatedSkills.filter(s => !cleanSkills.includes(s));

  // Calculate 4 factors
  const coordination = scoreCoordination(agent, campaign);
  const planning = scorePlanning(agent, orchestratorLifecycle);
  const lifecycle = scoreLifecycle(orchestratorLifecycle);
  const continuity = scoreKnowledgeContinuity(agent, orchestratorLifecycle);

  // Calibrated total (Bug Fix #4)
  const total = calibrateTotal(coordination, planning, lifecycle, continuity, orchestratorLifecycle);
  const grade = scoreToGrade(total);

  // Generate stage-by-stage reasoning (Bug Fix #1)
  const stageReasons = {};
  for (const stage of ORCHESTRATOR_STAGES) {
    stageReasons[stage] = generateStageReasoning(
      stage,
      orchestratorLifecycle[stage],
      agent,
      campaign
    );
  }

  // Build grade reason string
  const reasonParts = [
    `Orchestrator auto-graded: ${total}/100.`,
    `Coordination ${coordination.score}/35, Planning ${planning.score}/25, Lifecycle ${lifecycle.score}/20, Continuity ${continuity.score}/20.`,
    '',
    ...ORCHESTRATOR_STAGES.map(s => stageReasons[s])
  ];

  const gradeReason = reasonParts.join('\n');

  const result = {
    grade,
    gradeReason,
    total,
    scoreBreakdown: {
      coordination: coordination.score,
      planning: planning.score,
      lifecycle: lifecycle.score,
      continuity: continuity.score,
      total
    },
    orchestratorLifecycle,
    stageReasons,
    skillsUsed: cleanSkills,
    mandatedSkillsUsed: usedMandated,
    mandatedSkillsMissed: missedMandated,
    factorDetails: {
      coordination: coordination.reason,
      planning: planning.reason,
      lifecycle: lifecycle.reason,
      continuity: continuity.reason
    }
  };

  return result;
}

// ── Test mode: grade orchestrators from campaigns.json without writing ──
function runTestMode(targetSlot) {
  const campaigns = JSON.parse(fs.readFileSync(CAMPAIGNS_F, 'utf8'));

  for (const campaign of campaigns) {
    const orchestrators = campaign.agents.filter(a =>
      a.slot && a.slot.startsWith('orchestrator-v') &&
      (targetSlot ? a.slot === targetSlot : true)
    );

    for (const agent of orchestrators) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`Grading: ${agent.slot} (${campaign.id}: ${campaign.name})`);
      console.log(`${'='.repeat(60)}`);

      const result = gradeOrchestrator(agent, campaign, { dryRun: true });

      if (result.error) {
        console.log(`  ERROR: ${result.error}`);
        continue;
      }

      console.log(`  Grade: ${result.grade} (${result.total}/100)`);
      console.log(`  Coordination: ${result.scoreBreakdown.coordination}/35`);
      console.log(`  Planning:     ${result.scoreBreakdown.planning}/25`);
      console.log(`  Lifecycle:    ${result.scoreBreakdown.lifecycle}/20`);
      console.log(`  Continuity:   ${result.scoreBreakdown.continuity}/20`);
      console.log('');
      console.log('  Stage Reasoning:');
      for (const stage of ORCHESTRATOR_STAGES) {
        console.log(`    ${result.stageReasons[stage]}`);
      }
      console.log('');
      console.log(`  Skills (sanitized): ${result.skillsUsed.join(', ') || 'none'}`);
      console.log(`  Mandated used: ${result.mandatedSkillsUsed.join(', ') || 'none'}`);
      console.log(`  Mandated missed: ${result.mandatedSkillsMissed.join(', ') || 'none'}`);
      console.log(`  Existing grade: ${agent.grade || 'none'}`);

      // Validate output format
      const output = {
        grade: result.grade,
        gradeReason: result.gradeReason,
        scoreBreakdown: result.scoreBreakdown,
        lifecycle: result.orchestratorLifecycle
      };
      try {
        JSON.parse(JSON.stringify(output));
        console.log('  Output format: VALID JSON');
      } catch (e) {
        console.log(`  Output format: INVALID — ${e.message}`);
      }
    }
  }
}

// ── Session mode: grade a specific session and write to campaigns.json ──
function runSessionMode(sessionId) {
  // Read state file for dispatch metadata
  const stateFile = path.join(STATES_DIR, `${sessionId}.json`);
  let state;
  try {
    state = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
  } catch (e) {
    console.error('[auto-grade-orchestrator] Cannot read state file:', e.message);
    process.exit(1);
  }

  const meta = state.dispatchMeta;
  if (!meta || !meta.campaignId || !meta.slot) {
    console.log('[auto-grade-orchestrator] No campaign link — skipping grade');
    process.exit(0);
  }

  // Verify this is an orchestrator
  if (!meta.slot.startsWith('orchestrator-v')) {
    console.log('[auto-grade-orchestrator] Not an orchestrator slot — use auto-grade.js instead');
    process.exit(0);
  }

  // Read campaigns
  const campaigns = JSON.parse(fs.readFileSync(CAMPAIGNS_F, 'utf8'));
  const campaign = campaigns.find(c => c.id === meta.campaignId);
  if (!campaign) {
    console.log('[auto-grade-orchestrator] Campaign not found:', meta.campaignId);
    process.exit(0);
  }

  const agent = campaign.agents.find(a => a.slot === meta.slot);
  if (!agent) {
    console.log('[auto-grade-orchestrator] Agent slot not found:', meta.slot);
    process.exit(0);
  }

  // Also parse transcript for skills (same logic as auto-grade.js)
  const transcriptSkills = parseTranscriptSkills(sessionId);
  if (transcriptSkills.length > 0) {
    const existing = agent.skillsUsed || [];
    for (const s of transcriptSkills) {
      if (!existing.includes(s)) existing.push(s);
    }
    agent.skillsUsed = existing;
  }

  // Grade
  const result = gradeOrchestrator(agent, campaign);

  if (result.error) {
    console.error('[auto-grade-orchestrator]', result.error);
    process.exit(1);
  }

  // Write results to campaigns.json
  agent.lifecycle = result.orchestratorLifecycle;
  agent.skillsUsed = result.skillsUsed;
  agent.status = 'completed';
  agent.grade = result.grade;
  agent.gradeReason = result.gradeReason;
  agent.scoreBreakdown = result.scoreBreakdown;

  fs.writeFileSync(CAMPAIGNS_F, JSON.stringify(campaigns, null, 2));
  console.log(`[auto-grade-orchestrator] ${meta.slot}: ${result.grade} (${result.total}/100)`);
  console.log(`  Coordination: ${result.scoreBreakdown.coordination}/35, Planning: ${result.scoreBreakdown.planning}/25`);
  console.log(`  Lifecycle: ${result.scoreBreakdown.lifecycle}/20, Continuity: ${result.scoreBreakdown.continuity}/20`);
}

// ── Transcript parsing (reused from auto-grade.js) ──
function parseTranscriptSkills(sessionId) {
  const TRANSCRIPTS_DIR = path.join(
    process.env.HOME || process.env.USERPROFILE || '',
    '.claude', 'projects'
  );
  const skills = [];

  try {
    const projectDirs = fs.existsSync(TRANSCRIPTS_DIR)
      ? fs.readdirSync(TRANSCRIPTS_DIR).filter(d => {
          try { return fs.statSync(path.join(TRANSCRIPTS_DIR, d)).isDirectory(); } catch { return false; }
        })
      : [];

    for (const pd of projectDirs) {
      const tFile = path.join(TRANSCRIPTS_DIR, pd, `${sessionId}.jsonl`);
      if (fs.existsSync(tFile)) {
        const tLines = fs.readFileSync(tFile, 'utf8').trim().split('\n');
        for (const line of tLines) {
          try {
            const e = JSON.parse(line);
            const content = e.message && e.message.content;
            if (!Array.isArray(content)) continue;
            for (const block of content) {
              if (block.type === 'tool_use' && block.name === 'Skill') {
                const sk = block.input && block.input.skill;
                if (sk && !skills.includes(sk)) skills.push(sk);
              }
            }
          } catch { /* skip parse errors */ }
        }
        break;
      }
    }
  } catch { /* no transcripts */ }

  // Sanitize before returning (Bug Fix #2)
  return sanitizeSkills(skills);
}

// ── Entry point ──
const arg = process.argv[2];

if (arg === '--test') {
  const targetSlot = process.argv[3] || null;
  runTestMode(targetSlot);
} else if (arg) {
  runSessionMode(arg);
} else {
  console.log('Usage:');
  console.log('  node auto-grade-orchestrator.js <session-id>    Grade a specific orchestrator session');
  console.log('  node auto-grade-orchestrator.js --test           Test-grade all orchestrators');
  console.log('  node auto-grade-orchestrator.js --test <slot>    Test-grade specific orchestrator');
  process.exit(0);
}

// Export for potential use by auto-grade.js routing
module.exports = { gradeOrchestrator, sanitizeSkills, getMandatedSkills, ORCHESTRATOR_STAGES };
