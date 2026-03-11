#!/usr/bin/env node
// SessionStart hook addition — checks if ~/.claude/settings.json matches
// what setup.sh would generate from the template + machine-config.
// Warns if stale. Never crashes. Zero deps.
//
// Usage: Add to SessionStart hooks in settings.json, or call from session-context.js

const fs = require('fs');
const path = require('path');

// Find MC repo root
const HOME = process.env.HOME || process.env.USERPROFILE || '';
const MC_CANDIDATES = [
  path.join(HOME, 'projects', 'agent-mission-control'),
  path.join(HOME, 'Claude', 'projects', 'agent-mission-control'),
];
const MC_ROOT = MC_CANDIDATES.find(d => fs.existsSync(path.join(d, 'server.js')));

if (!MC_ROOT) process.exit(0); // can't find MC — skip silently

const TEMPLATE_PATH = path.join(MC_ROOT, 'toolbox', 'config', 'settings.template.json');
const CONFIG_PATH = path.join(MC_ROOT, 'toolbox', 'config', 'machine-config.json');
const SETTINGS_PATH = path.join(HOME, '.claude', 'settings.json');

try {
  if (!fs.existsSync(TEMPLATE_PATH) || !fs.existsSync(CONFIG_PATH) || !fs.existsSync(SETTINGS_PATH)) {
    process.exit(0); // missing files — skip
  }

  // Read machine config and find this machine
  const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
  const { execSync } = require('child_process');
  let hostname;
  try {
    hostname = execSync('hostname', { encoding: 'utf8', timeout: 3000 }).trim();
  } catch {
    hostname = process.env.COMPUTERNAME || '';
  }

  const machine = config.machines[hostname];
  if (!machine) process.exit(0); // unknown machine — skip

  // Generate expected settings from template
  const template = fs.readFileSync(TEMPLATE_PATH, 'utf8');
  const claudeDir = machine.claudeDir.replace(/\\/g, '/').replace(/^C:/i, '/c');
  const mcDir = MC_ROOT.replace(/\\/g, '/').replace(/^C:/i, '/c');

  const expected = template
    .replace(/\{\{CLAUDE_DIR\}\}/g, claudeDir)
    .replace(/\{\{MC_DIR\}\}/g, mcDir);

  // Compare hooks section only (permissions/model may differ)
  const currentSettings = JSON.parse(fs.readFileSync(SETTINGS_PATH, 'utf8'));
  const expectedSettings = JSON.parse(expected);

  const currentHooks = JSON.stringify(currentSettings.hooks || {});
  const expectedHooks = JSON.stringify(expectedSettings.hooks || {});

  if (currentHooks !== expectedHooks) {
    // Output warning that gets injected into session context
    console.log(
      'SETTINGS STALE: Your ~/.claude/settings.json hooks do not match the template. ' +
      'Run: bash toolbox/setup.sh (from MC repo root) to update.'
    );
  }
} catch {
  // Never crash — session must not be disrupted
}
process.exit(0);
