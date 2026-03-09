#!/usr/bin/env node
// PostToolUse hook: validates JS inside <script> tags after editing .html files.
// Prevents PM012-class errors (JS syntax error breaking entire page).
// Only fires on .html files. Extracts all <script> blocks and validates syntax.

const fs = require('fs');

// Hook receives tool result via stdin
let input = '';
process.stdin.on('data', d => input += d);
process.stdin.on('end', () => {
  try {
    const data = JSON.parse(input);
    const filePath = data.tool_input?.file_path;

    // Only check .html files
    if (!filePath || !filePath.endsWith('.html')) {
      process.exit(0);
    }

    // Read the file
    let content;
    try {
      content = fs.readFileSync(filePath, 'utf8');
    } catch {
      process.exit(0); // File doesn't exist or can't read — not our problem
    }

    // Extract all <script> blocks
    const scriptRegex = /<script[^>]*>([\s\S]*?)<\/script>/gi;
    let match;
    const errors = [];

    while ((match = scriptRegex.exec(content)) !== null) {
      const scriptContent = match[1].trim();
      if (!scriptContent) continue;

      try {
        // Use Function constructor to check syntax without executing
        new Function(scriptContent);
      } catch (e) {
        // Find approximate line number in original file
        const beforeScript = content.substring(0, match.index);
        const scriptStartLine = beforeScript.split('\n').length;
        errors.push({
          line: scriptStartLine,
          message: e.message
        });
      }
    }

    if (errors.length > 0) {
      const msg = errors.map(e =>
        `  Line ~${e.line}: ${e.message}`
      ).join('\n');
      // Output warning — this shows to the agent
      console.error(`\n⚠️  JS SYNTAX ERROR in ${filePath.split('/').pop() || filePath.split('\\').pop()}\n${msg}\n   Fix this before moving on! (PM012 prevention)\n`);
      process.exit(1); // Non-zero = hook warns the agent
    }
  } catch {
    // Don't break the workflow if hook itself has issues
    process.exit(0);
  }
});
