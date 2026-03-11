#!/bin/bash
# setup.sh — Sync ~/.claude/ with MC toolbox via NTFS junctions
#
# Run after git pull:  bash toolbox/setup.sh
# Preview first:       bash toolbox/setup.sh --dry-run
#
# Creates junctions so ~/.claude/skills → toolbox/skills, etc.
# Then generates ~/.claude/settings.json with correct machine paths.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MC_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
TOOLBOX="$SCRIPT_DIR"
CONFIG="$TOOLBOX/config/machine-config.json"
TEMPLATE="$TOOLBOX/config/settings.template.json"

if [ ! -f "$CONFIG" ]; then echo "ERROR: machine-config.json not found"; exit 1; fi
if [ ! -f "$TEMPLATE" ]; then echo "ERROR: settings.template.json not found"; exit 1; fi

# Detect machine
HOSTNAME=$(hostname 2>/dev/null || echo "$COMPUTERNAME")
WIN_CONFIG=$(cygpath -w "$CONFIG" 2>/dev/null || echo "$CONFIG")

CLAUDE_DIR=$(node -e "
  const c = require('${WIN_CONFIG//\\/\\\\}');
  const m = c.machines['$HOSTNAME'];
  if (!m) { console.error('Unknown machine: $HOSTNAME. Add to toolbox/config/machine-config.json'); process.exit(1); }
  console.log(m.claudeDir);
")

MACHINE_NAME=$(node -e "
  const c = require('${WIN_CONFIG//\\/\\\\}');
  const m = c.machines['$HOSTNAME'];
  console.log(m ? m.name : 'unknown');
")

echo "🔍 Machine: $MACHINE_NAME ($HOSTNAME)"
echo "📁 MC repo: $MC_DIR"
echo "🏠 Claude dir: $CLAUDE_DIR"
echo ""

DIRS="skills agents commands hooks rules scripts"
WIN_CLAUDE=$(cygpath -w "$CLAUDE_DIR" 2>/dev/null || echo "$CLAUDE_DIR")
WIN_TOOLBOX=$(cygpath -w "$TOOLBOX" 2>/dev/null || echo "$TOOLBOX")

# ── Dry run ────────────────────────────────────────────────────
if [ "${1:-}" = "--dry-run" ]; then
  echo "=== DRY RUN ==="
  for dir in $DIRS; do
    dst="$CLAUDE_DIR/$dir"
    if [ -L "$dst" ] || powershell -NoProfile -Command "(Get-Item '$WIN_CLAUDE\\$dir' -ErrorAction SilentlyContinue).Mode -match 'l'" 2>/dev/null | grep -q True; then
      echo "  ✅ $dir — already junctioned"
    elif [ -d "$dst" ]; then
      echo "  🔄 $dir — would backup + junction"
    else
      echo "  ➕ $dir — would create junction"
    fi
  done
  echo "  ⚙️  Would generate settings.json"
  exit 0
fi

# ── Create junctions via PowerShell ────────────────────────────
mkdir -p "$CLAUDE_DIR"
BACKUP="$WIN_CLAUDE\\.setup-backup.$(date +%Y%m%d-%H%M%S)"

for dir in $DIRS; do
  if [ ! -d "$TOOLBOX/$dir" ]; then
    echo "  ⚠️  $dir — not in toolbox, skip"
    continue
  fi

  # Check if already a junction
  IS_JUNCTION=$(powershell -NoProfile -Command "
    \$i = Get-Item '$WIN_CLAUDE\\$dir' -ErrorAction SilentlyContinue
    if (\$i -and \$i.Mode -match 'l') { 'yes' } else { 'no' }
  " 2>/dev/null | tr -d '\r')

  if [ "$IS_JUNCTION" = "yes" ]; then
    echo "  ✅ $dir — already junctioned"
    continue
  fi

  # Backup existing dir if present
  if [ -d "$CLAUDE_DIR/$dir" ]; then
    powershell -NoProfile -Command "
      if (!(Test-Path '$BACKUP')) { New-Item -ItemType Directory -Path '$BACKUP' | Out-Null }
      Move-Item -Path '$WIN_CLAUDE\\$dir' -Destination '$BACKUP\\$dir' -Force
    " 2>/dev/null
    echo "  📦 $dir backed up"
  fi

  # Create junction
  powershell -NoProfile -Command "
    New-Item -ItemType Junction -Path '$WIN_CLAUDE\\$dir' -Target '$WIN_TOOLBOX\\$dir' | Out-Null
  " 2>/dev/null
  echo "  🔗 $dir → toolbox/$dir"
done

# ── Generate settings.json ─────────────────────────────────────
echo ""
echo "⚙️  Generating settings.json..."

# Use Unix paths (/c/Users/...) so bash hooks work in Git Bash
UNIX_MC=$(echo "$MC_DIR" | sed 's|\\|/|g' | sed 's|^C:|/c|i')
UNIX_CLAUDE=$(echo "$CLAUDE_DIR" | sed 's|\\|/|g' | sed 's|^C:|/c|i')

SETTINGS=$(cat "$TEMPLATE")
SETTINGS="${SETTINGS//\{\{CLAUDE_DIR\}\}/$UNIX_CLAUDE}"
SETTINGS="${SETTINGS//\{\{MC_DIR\}\}/$UNIX_MC}"

if [ -f "$CLAUDE_DIR/settings.json" ]; then
  cp "$CLAUDE_DIR/settings.json" "$CLAUDE_DIR/settings.json.pre-setup"
fi

echo "$SETTINGS" > "$CLAUDE_DIR/settings.json"
echo "  ✅ settings.json written"

# ── Validate skill & command integrity ────────────────────────
echo ""
echo "🔍 Validating toolbox integrity..."

ERRORS=0

# Check for empty skill dirs (no SKILL.md)
for d in "$TOOLBOX/skills"/*/; do
  name=$(basename "$d")
  if [ ! -f "$d/SKILL.md" ]; then
    echo "  ❌ EMPTY SKILL: $name (no SKILL.md)"
    ERRORS=$((ERRORS + 1))
  fi
done

# Check for phantom gitlinks (skill tracked as submodule commit, not files)
if command -v git >/dev/null 2>&1 && git -C "$MC_DIR" rev-parse --git-dir >/dev/null 2>&1; then
  while IFS= read -r line; do
    path=$(echo "$line" | awk '{print $4}')
    echo "  ❌ GITLINK: $path (tracked as submodule, files invisible to git)"
    echo "     Fix: git rm --cached $path && git add $path/"
    ERRORS=$((ERRORS + 1))
  done < <(git -C "$MC_DIR" ls-tree -r HEAD | grep "^160000")
fi

if [ "$ERRORS" -gt 0 ]; then
  echo ""
  echo "  ⚠️  $ERRORS integrity issue(s) found — fix before pushing"
else
  echo "  ✅ All skills have SKILL.md, no gitlinks"
fi

echo ""
echo "✅ Setup complete for $MACHINE_NAME"
echo "   git pull + bash toolbox/setup.sh = full sync"
