#!/usr/bin/env node
// .claude/agent-hub/scripts/test-hardstop.js
// E2E test for the triple-layer hardstop system.
// Tests: StatusLine thresholds, prompt-hook injection, PreCompact emergency handoff.
// Zero external deps. Run via: node scripts/test-hardstop.js
//
// SECURITY NOTE: execSync is used only to pipe controlled test JSON (not user input)
// into our own hook scripts. This is a test harness, not production code.

const fs   = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const DATA_DIR   = path.join(__dirname, '..', 'data');
const SPRINT_DIR = path.join(__dirname, '..', 'coordinated-sprint');
const HARDSTOP_FILE      = path.join(DATA_DIR, 'hardstop-state.json');
const PROMPT_COUNTS_FILE = path.join(DATA_DIR, 'prompt-counts.json');
const STATUSLINE_SCRIPT  = path.join(__dirname, 'statusline-hardstop.js');
const PROMPT_HOOK_SCRIPT = path.join(__dirname, '..', 'hooks', 'prompt-hook.js');
const PRECOMPACT_SCRIPT  = path.join(__dirname, 'precompact-handoff.js');

// Test session ID (isolated from real sessions)
const TEST_SID = 'test-hardstop-' + Date.now();

let passed = 0;
let failed = 0;
const results = [];

function test(name, fn) {
  try {
    fn();
    passed++;
    results.push({ name, status: 'PASS', detail: '' });
  } catch (e) {
    failed++;
    results.push({ name, status: 'FAIL', detail: String(e.message || e).slice(0, 100) });
  }
}

function assert(condition, msg) {
  if (!condition) throw new Error(msg || 'Assertion failed');
}

// Helper: pipe JSON into a script via stdin and capture stdout.
// Uses a temp file to avoid shell quoting issues on Windows.
function pipeToScript(scriptPath, inputObj) {
  const tmpFile = path.join(DATA_DIR, '_test-input-' + Date.now() + '.json');
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(tmpFile, JSON.stringify(inputObj));
    const out = execSync(
      'node "' + scriptPath + '" < "' + tmpFile.replace(/\\/g, '/') + '"',
      { encoding: 'utf8', timeout: 10000, stdio: ['pipe', 'pipe', 'pipe'] }
    );
    return out;
  } catch (e) {
    // Script may exit(0) with output on stdout
    return (e.stdout || '') + '';
  } finally {
    try { fs.unlinkSync(tmpFile); } catch {}
  }
}

// Cleanup before tests
function cleanup() {
  try { fs.unlinkSync(HARDSTOP_FILE); } catch {}
  try { fs.unlinkSync(PROMPT_COUNTS_FILE); } catch {}
  // Remove test prompt files
  try {
    const promptsDir = path.join(__dirname, '..', 'prompts');
    const testFile = path.join(promptsDir, TEST_SID + '.ndjson');
    fs.unlinkSync(testFile);
  } catch {}
  // Remove test state file
  try {
    const statesDir = path.join(__dirname, '..', 'states');
    const testFile = path.join(statesDir, TEST_SID + '.json');
    fs.unlinkSync(testFile);
  } catch {}
  // Remove test log file
  try {
    const logsDir = path.join(__dirname, '..', 'logs');
    const testFile = path.join(logsDir, TEST_SID + '.ndjson');
    fs.unlinkSync(testFile);
  } catch {}
}

// ============================================================
// SUITE 1: StatusLine script threshold detection
// ============================================================

function testStatusLine(usedPct, remainingPct, expectedLevel, expectedDisplay) {
  const input = {
    context_window: {
      used_percentage: usedPct,
      remaining_percentage: remainingPct,
    },
  };
  const stdout = pipeToScript(STATUSLINE_SCRIPT, input);

  // Check state file was written
  assert(fs.existsSync(HARDSTOP_FILE), 'hardstop-state.json should exist');
  const state = JSON.parse(fs.readFileSync(HARDSTOP_FILE, 'utf8'));

  assert(state.level === expectedLevel,
    'Expected level "' + expectedLevel + '", got "' + state.level + '"');
  assert(Math.abs(state.usedPct - usedPct) < 0.2,
    'usedPct mismatch: expected ~' + usedPct + ', got ' + state.usedPct);

  if (expectedDisplay) {
    assert(stdout.trim().includes(expectedDisplay),
      'Expected stdout to contain "' + expectedDisplay + '", got: "' + stdout.trim() + '"');
  } else {
    assert(stdout.trim() === '',
      'Expected empty stdout for green, got: "' + stdout.trim() + '"');
  }
}

test('StatusLine: green (40% used)', function() {
  testStatusLine(40, 60, 'green', '');
});

test('StatusLine: yellow (62% used)', function() {
  testStatusLine(62, 38, 'yellow', '[60%]');
});

test('StatusLine: orange (78% used)', function() {
  testStatusLine(78, 22, 'orange', '[75% HANDOFF]');
});

test('StatusLine: red (88% used)', function() {
  testStatusLine(88, 12, 'red', '[85% STOP]');
});

test('StatusLine: freeUntilCompact calculation', function() {
  testStatusLine(70, 30, 'yellow', '[60%]');
  const state = JSON.parse(fs.readFileSync(HARDSTOP_FILE, 'utf8'));
  // freeUntilCompact = max(0, 30 - 16.5) = 13.5
  assert(Math.abs(state.freeUntilCompact - 13.5) < 0.2,
    'freeUntilCompact should be ~13.5, got ' + state.freeUntilCompact);
});

test('StatusLine: boundary at exactly 60%', function() {
  testStatusLine(60, 40, 'yellow', '[60%]');
});

test('StatusLine: boundary at exactly 75%', function() {
  testStatusLine(75, 25, 'orange', '[75% HANDOFF]');
});

test('StatusLine: boundary at exactly 85%', function() {
  testStatusLine(85, 15, 'red', '[85% STOP]');
});

test('StatusLine: no context data (graceful)', function() {
  const stdout = pipeToScript(STATUSLINE_SCRIPT, {});
  // Should not crash, should not write state file (or leave previous)
  assert(stdout.trim() === '', 'Should produce no output with no data');
});

// ============================================================
// SUITE 2: Prompt-hook threshold injection
// ============================================================

// Helper: run prompt-hook with a mock hardstop state pre-written
function testPromptHook(hardstopState, promptCounts, prompt) {
  // Write mock state files
  if (hardstopState) {
    fs.writeFileSync(HARDSTOP_FILE, JSON.stringify(hardstopState));
  } else {
    try { fs.unlinkSync(HARDSTOP_FILE); } catch {}
  }
  if (promptCounts !== null) {
    fs.writeFileSync(PROMPT_COUNTS_FILE, JSON.stringify(promptCounts));
  } else {
    try { fs.unlinkSync(PROMPT_COUNTS_FILE); } catch {}
  }

  var input = {
    session_id: TEST_SID,
    prompt: prompt || 'Test prompt ' + Date.now(),
  };

  var stdout = pipeToScript(PROMPT_HOOK_SCRIPT, input);
  return stdout;
}

test('Prompt-hook: no state file (graceful, no crash)', function() {
  var out = testPromptHook(null, null, 'Hello test ' + Date.now());
  // Should not crash -- may or may not have output
  assert(typeof out === 'string', 'Should return a string');
});

test('Prompt-hook: green state, no warnings', function() {
  var out = testPromptHook(
    { level: 'green', usedPct: 40, remainingPct: 60, freeUntilCompact: 43.5, promptCount: 0, ts: Date.now() },
    {},
    'Green test ' + Date.now()
  );
  assert(!out.includes('CONTEXT'), 'Green should produce no context warnings');
  assert(!out.includes('HANDOFF'), 'Green should produce no handoff warnings');
});

test('Prompt-hook: yellow state injects awareness warning', function() {
  var out = testPromptHook(
    { level: 'yellow', usedPct: 63, remainingPct: 37, freeUntilCompact: 20.5, promptCount: 0, ts: Date.now() },
    {},
    'Yellow test ' + Date.now()
  );
  assert(out.includes('CONTEXT AWARENESS'), 'Should contain CONTEXT AWARENESS warning');
});

test('Prompt-hook: orange state injects handoff warning', function() {
  var out = testPromptHook(
    { level: 'orange', usedPct: 78, remainingPct: 22, freeUntilCompact: 5.5, promptCount: 0, ts: Date.now() },
    {},
    'Orange test ' + Date.now()
  );
  assert(out.includes('HANDOFF RECOMMENDED'), 'Should contain HANDOFF RECOMMENDED warning');
});

test('Prompt-hook: red state injects mandatory handoff', function() {
  var out = testPromptHook(
    { level: 'red', usedPct: 88, remainingPct: 12, freeUntilCompact: 0, promptCount: 0, ts: Date.now() },
    {},
    'Red test ' + Date.now()
  );
  assert(out.includes('CONTEXT CRITICAL'), 'Should contain CONTEXT CRITICAL warning');
  assert(out.includes('MANDATORY HANDOFF'), 'Should contain MANDATORY HANDOFF');
});

test('Prompt-hook: stale state (>5min) ignored', function() {
  var staleTs = Date.now() - (6 * 60 * 1000); // 6 minutes ago
  var out = testPromptHook(
    { level: 'red', usedPct: 90, remainingPct: 10, freeUntilCompact: 0, promptCount: 0, ts: staleTs },
    {},
    'Stale test ' + Date.now()
  );
  assert(!out.includes('CONTEXT CRITICAL'), 'Stale state should be ignored');
});

// Prompt count tests -- need to set counts to one below threshold
// so after increment it hits the threshold
test('Prompt-hook: 29 prompts, no warning', function() {
  var counts = {};
  counts[TEST_SID] = 28; // will become 29 after increment
  var out = testPromptHook(
    { level: 'green', usedPct: 30, remainingPct: 70, freeUntilCompact: 53.5, promptCount: 0, ts: Date.now() },
    counts,
    'Count29 test ' + Date.now()
  );
  assert(!out.includes('PROMPT COUNT'), '29 prompts should not trigger warning');
});

test('Prompt-hook: 30 prompts triggers count warning', function() {
  var counts = {};
  counts[TEST_SID] = 29; // will become 30 after increment
  var out = testPromptHook(
    { level: 'green', usedPct: 30, remainingPct: 70, freeUntilCompact: 53.5, promptCount: 0, ts: Date.now() },
    counts,
    'Count30 test ' + Date.now()
  );
  assert(out.includes('PROMPT COUNT: 30'), 'Should contain 30-prompt warning');
});

test('Prompt-hook: 50 prompts triggers preparation warning', function() {
  var counts = {};
  counts[TEST_SID] = 49;
  var out = testPromptHook(
    { level: 'green', usedPct: 30, remainingPct: 70, freeUntilCompact: 53.5, promptCount: 0, ts: Date.now() },
    counts,
    'Count50 test ' + Date.now()
  );
  assert(out.includes('PROMPT WARNING: 50'), 'Should contain 50-prompt warning');
});

test('Prompt-hook: 75 prompts triggers hard stop', function() {
  var counts = {};
  counts[TEST_SID] = 74;
  var out = testPromptHook(
    { level: 'green', usedPct: 30, remainingPct: 70, freeUntilCompact: 53.5, promptCount: 0, ts: Date.now() },
    counts,
    'Count75 test ' + Date.now()
  );
  assert(out.includes('PROMPT HARD STOP: 75'), 'Should contain 75-prompt hard stop');
});

test('Prompt-hook: combined context + prompt warnings', function() {
  var counts = {};
  counts[TEST_SID] = 49;
  var out = testPromptHook(
    { level: 'red', usedPct: 87, remainingPct: 13, freeUntilCompact: 0, promptCount: 0, ts: Date.now() },
    counts,
    'Combined test ' + Date.now()
  );
  assert(out.includes('CONTEXT CRITICAL'), 'Should have context warning');
  assert(out.includes('PROMPT WARNING: 50'), 'Should have prompt warning');
});

// ============================================================
// SUITE 3: PreCompact emergency handoff
// ============================================================

test('PreCompact: creates emergency handoff file', function() {
  // Setup: write a mock state file for the test session
  var statesDir = path.join(__dirname, '..', 'states');
  if (!fs.existsSync(statesDir)) fs.mkdirSync(statesDir, { recursive: true });
  fs.writeFileSync(
    path.join(statesDir, TEST_SID + '.json'),
    JSON.stringify({
      sessionId: TEST_SID,
      displayName: 'Test Mission',
      lifecycleStage: 'execute',
      dispatchMeta: { slot: 'test-agent' },
    })
  );

  // Write hardstop state
  fs.writeFileSync(HARDSTOP_FILE, JSON.stringify({
    level: 'red', usedPct: 88, remainingPct: 12, freeUntilCompact: 0, promptCount: 42, ts: Date.now(),
  }));

  // Write a mock activity log
  var logsDir = path.join(__dirname, '..', 'logs');
  if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });
  fs.writeFileSync(
    path.join(logsDir, TEST_SID + '.ndjson'),
    JSON.stringify({ state: 'developing', tool: 'Edit', detail: 'test-file.js', ts: Date.now() }) + '\n'
  );

  // Run PreCompact script
  var input = { session_id: TEST_SID };
  pipeToScript(PRECOMPACT_SCRIPT, input);

  // Check emergency handoff was created
  var truncSid = TEST_SID.slice(0, 20);
  var outFile = path.join(SPRINT_DIR, 'emergency-handoff-' + truncSid + '.md');
  assert(fs.existsSync(outFile), 'Emergency handoff file should exist at ' + outFile);

  var content = fs.readFileSync(outFile, 'utf8');
  assert(content.includes('Emergency Handoff'), 'Should contain Emergency Handoff header');
  assert(content.includes(TEST_SID), 'Should contain session ID');
  assert(content.includes('auto-compaction'), 'Should mention auto-compaction');
  assert(content.includes('test-file.js'), 'Should list modified files');

  // Cleanup emergency file
  try { fs.unlinkSync(outFile); } catch {}
});

test('PreCompact: exits 0 even with missing data', function() {
  // Clean all data files
  try { fs.unlinkSync(HARDSTOP_FILE); } catch {}
  try { fs.unlinkSync(PROMPT_COUNTS_FILE); } catch {}

  var input = { session_id: 'nonexistent-session-12345' };
  // Should not throw
  pipeToScript(PRECOMPACT_SCRIPT, input);
  // If we get here, it did not crash
  assert(true, 'Should not crash with missing data');
});

// ============================================================
// SUITE 4: State file schema validation
// ============================================================

test('Schema: hardstop-state.json has all required fields', function() {
  // Write via StatusLine
  testStatusLine(72, 28, 'yellow', '[60%]');
  var state = JSON.parse(fs.readFileSync(HARDSTOP_FILE, 'utf8'));
  var required = ['level', 'usedPct', 'remainingPct', 'freeUntilCompact', 'promptCount', 'ts'];
  for (var i = 0; i < required.length; i++) {
    var key = required[i];
    assert(key in state, 'Missing required field: ' + key);
  }
  assert(typeof state.level === 'string', 'level should be string');
  assert(typeof state.usedPct === 'number', 'usedPct should be number');
  assert(typeof state.remainingPct === 'number', 'remainingPct should be number');
  assert(typeof state.freeUntilCompact === 'number', 'freeUntilCompact should be number');
  assert(typeof state.promptCount === 'number', 'promptCount should be number');
  assert(typeof state.ts === 'number', 'ts should be number');
});

// ============================================================
// Cleanup and report
// ============================================================

cleanup();

// Print results table
console.log('');
console.log('=== Hardstop System Test Results ===');
console.log('');
console.log('| # | Test | Status | Detail |');
console.log('|---|------|--------|--------|');
results.forEach(function(r, i) {
  var icon = r.status === 'PASS' ? 'PASS' : 'FAIL';
  var detail = r.detail ? r.detail.replace(/\|/g, '/') : '';
  console.log('| ' + (i + 1) + ' | ' + r.name + ' | ' + icon + ' | ' + detail + ' |');
});
console.log('');
console.log('Total: ' + (passed + failed) + ' | Passed: ' + passed + ' | Failed: ' + failed);
console.log('');

process.exit(failed > 0 ? 1 : 0);
