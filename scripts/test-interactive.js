#!/usr/bin/env node
// scripts/test-interactive.js
// E2E test for interactive dispatch system components.
// Tests checkpoint-counter.js and stop-gate.js with mock data.
// Zero external deps. Run via: node scripts/test-interactive.js

const fs   = require('fs');
const path = require('path');
const cp   = require('child_process');

const MC_ROOT    = path.join(__dirname, '..');
const STATES_DIR = path.join(MC_ROOT, 'states');
const LOGS_DIR   = path.join(MC_ROOT, 'logs');
const DATA_DIR   = path.join(MC_ROOT, 'data');
const COUNTS_FILE = path.join(DATA_DIR, 'checkpoint-counts.json');

const CHECKPOINT_HOOK = path.join(MC_ROOT, 'hooks', 'checkpoint-counter.js');
const STOP_GATE       = path.join(MC_ROOT, 'scripts', 'stop-gate.js');

// Test session IDs (prefixed to avoid collision with real sessions)
const SID_INTERACTIVE = 'test-interactive-' + Date.now();
const SID_AUTO        = 'test-auto-' + Date.now();

const results = [];

function log(name, pass, detail) {
  results.push({ name, pass, detail });
}

function cleanup() {
  const files = [
    path.join(STATES_DIR, SID_INTERACTIVE + '.json'),
    path.join(STATES_DIR, SID_AUTO + '.json'),
    path.join(LOGS_DIR, SID_INTERACTIVE + '.ndjson'),
    path.join(LOGS_DIR, SID_AUTO + '.ndjson'),
  ];
  for (const f of files) {
    try { fs.unlinkSync(f); } catch (_) {}
  }
  try {
    const counts = JSON.parse(fs.readFileSync(COUNTS_FILE, 'utf8'));
    delete counts[SID_INTERACTIVE];
    delete counts[SID_AUTO];
    fs.writeFileSync(COUNTS_FILE, JSON.stringify(counts, null, 2));
  } catch (_) {}
}

function setupTestState(sid, mode) {
  if (!fs.existsSync(STATES_DIR)) fs.mkdirSync(STATES_DIR, { recursive: true });
  if (!fs.existsSync(LOGS_DIR)) fs.mkdirSync(LOGS_DIR, { recursive: true });
  const state = {
    sessionId: sid,
    dispatchMeta: { agentName: 'test-agent', mode: mode, dispatchedAt: new Date().toISOString() },
    state: 'developing',
    ts: Date.now()
  };
  fs.writeFileSync(path.join(STATES_DIR, sid + '.json'), JSON.stringify(state));
}

// Safe subprocess execution using execFileSync (no shell injection risk)
function runHook(scriptPath, stdinData) {
  const input = JSON.stringify(stdinData);
  try {
    const stdout = cp.execFileSync(
      process.execPath,
      [scriptPath],
      { input, encoding: 'utf8', timeout: 5000, stdio: ['pipe', 'pipe', 'pipe'] }
    );
    return { exitCode: 0, stdout: stdout.trim(), stderr: '' };
  } catch (e) {
    return {
      exitCode: e.status || 1,
      stdout: (e.stdout || '').trim(),
      stderr: (e.stderr || '').trim()
    };
  }
}

function addLogEntry(sid, tool, state) {
  if (!fs.existsSync(LOGS_DIR)) fs.mkdirSync(LOGS_DIR, { recursive: true });
  const entry = JSON.stringify({ state: state || 'developing', tool, detail: '', ts: Date.now() });
  fs.appendFileSync(path.join(LOGS_DIR, sid + '.ndjson'), entry + '\n');
}

// ---- TEST 1: Checkpoint counter -- 4 writes should NOT trigger ----
function test1() {
  setupTestState(SID_INTERACTIVE, 'interactive');
  try {
    const counts = JSON.parse(fs.readFileSync(COUNTS_FILE, 'utf8'));
    delete counts[SID_INTERACTIVE];
    fs.writeFileSync(COUNTS_FILE, JSON.stringify(counts, null, 2));
  } catch (_) {}

  let triggered = false;
  for (let i = 0; i < 4; i++) {
    const res = runHook(CHECKPOINT_HOOK, { session_id: SID_INTERACTIVE, tool_name: 'Write', tool_input: { file_path: '/tmp/test.js' } });
    if (res.stdout.includes('CHECKPOINT')) triggered = true;
  }
  log('Checkpoint: 4 writes (no trigger)', !triggered, triggered ? 'Triggered early!' : 'Correctly silent');
}

// ---- TEST 2: Checkpoint counter -- 5th write SHOULD trigger ----
function test2() {
  const res = runHook(CHECKPOINT_HOOK, { session_id: SID_INTERACTIVE, tool_name: 'Edit', tool_input: { file_path: '/tmp/test.js' } });
  const triggered = res.stdout.includes('CHECKPOINT');
  log('Checkpoint: 5th write (trigger)', triggered, triggered ? 'Checkpoint message OK' : 'Did NOT trigger');
}

// ---- TEST 3: Checkpoint counter -- auto mode (never triggers) ----
function test3() {
  setupTestState(SID_AUTO, 'auto');
  let triggered = false;
  for (let i = 0; i < 10; i++) {
    const res = runHook(CHECKPOINT_HOOK, { session_id: SID_AUTO, tool_name: 'Write', tool_input: { file_path: '/tmp/test.js' } });
    if (res.stdout.includes('CHECKPOINT')) triggered = true;
  }
  log('Checkpoint: auto mode (never trigger)', !triggered, triggered ? 'Triggered for auto!' : 'Correctly silent');
}

// ---- TEST 4: Checkpoint counter -- Read tool (not counted) ----
function test4() {
  try {
    const counts = JSON.parse(fs.readFileSync(COUNTS_FILE, 'utf8'));
    counts[SID_INTERACTIVE] = 0;
    fs.writeFileSync(COUNTS_FILE, JSON.stringify(counts, null, 2));
  } catch (_) {}

  let triggered = false;
  for (let i = 0; i < 10; i++) {
    const res = runHook(CHECKPOINT_HOOK, { session_id: SID_INTERACTIVE, tool_name: 'Read', tool_input: { file_path: '/tmp/test.js' } });
    if (res.stdout.includes('CHECKPOINT')) triggered = true;
  }
  log('Checkpoint: Read tool (not counted)', !triggered, triggered ? 'Read was counted!' : 'Correctly ignored');
}

// ---- TEST 5: Stop gate -- interactive, no consultation (block) ----
function test5() {
  const logFile = path.join(LOGS_DIR, SID_INTERACTIVE + '.ndjson');
  try { fs.unlinkSync(logFile); } catch (_) {}
  addLogEntry(SID_INTERACTIVE, 'Write', 'developing');
  addLogEntry(SID_INTERACTIVE, 'Edit', 'developing');

  const res = runHook(STOP_GATE, { session_id: SID_INTERACTIVE });
  const blocked = res.exitCode === 2;
  log('Stop gate: interactive, no consult (block)', blocked,
    blocked ? 'Blocked correctly' : 'Allowed stop! Exit: ' + res.exitCode);
}

// ---- TEST 6: Stop gate -- interactive, WITH consultation (allow) ----
function test6() {
  addLogEntry(SID_INTERACTIVE, 'AskUserQuestion', 'waiting');

  const res = runHook(STOP_GATE, { session_id: SID_INTERACTIVE });
  const allowed = res.exitCode === 0;
  log('Stop gate: interactive, consulted (allow)', allowed,
    allowed ? 'Allowed stop' : 'Blocked! Exit: ' + res.exitCode);
}

// ---- TEST 7: Stop gate -- auto mode (always allow) ----
function test7() {
  const res = runHook(STOP_GATE, { session_id: SID_AUTO });
  const allowed = res.exitCode === 0;
  log('Stop gate: auto mode (always allow)', allowed,
    allowed ? 'Allowed stop' : 'Blocked auto agent!');
}

// ---- TEST 8: Stop gate -- unknown session (fail-open) ----
function test8() {
  const res = runHook(STOP_GATE, { session_id: 'nonexistent-session-xyz' });
  const allowed = res.exitCode === 0;
  log('Stop gate: unknown session (fail-open)', allowed,
    allowed ? 'Fail-open: allowed' : 'Blocked unknown session!');
}

// ---- RUN ALL TESTS ----
console.log('');
console.log('  ====================================================');
console.log('  Interactive Dispatch System -- E2E Tests');
console.log('  ====================================================');
console.log('');

test1();
test2();
test3();
test4();
test5();
test6();
test7();
test8();

const COL1 = 50;
const COL2 = 8;
console.log('  ' + 'Test'.padEnd(COL1) + 'Result'.padEnd(COL2) + 'Detail');
console.log('  ' + '-'.repeat(COL1 + COL2 + 40));

let passed = 0;
let failed = 0;
for (const r of results) {
  const icon = r.pass ? 'PASS' : 'FAIL';
  const line = '  ' + r.name.padEnd(COL1) + icon.padEnd(COL2) + r.detail;
  console.log(line);
  if (r.pass) passed++;
  else failed++;
}

console.log('');
console.log('  ' + '-'.repeat(COL1 + COL2 + 40));
console.log('  Total: ' + results.length + ' | Passed: ' + passed + ' | Failed: ' + failed);
console.log('  ' + (failed === 0 ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'));
console.log('');

cleanup();
process.exit(failed > 0 ? 1 : 0);
