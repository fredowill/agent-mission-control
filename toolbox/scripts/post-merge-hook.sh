#!/bin/bash
# post-merge hook — auto-runs setup.sh after every git pull
# Install: cp toolbox/scripts/post-merge-hook.sh .git/hooks/post-merge
#
# Safe to run repeatedly (setup.sh is idempotent).
# If setup.sh fails, the pull still succeeded — you just need to run setup manually.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# When running as a git hook, we're in .git/hooks/ — MC root is two levels up
MC_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
SETUP="$MC_DIR/toolbox/setup.sh"

if [ ! -f "$SETUP" ]; then
  # Not in the expected location — skip silently
  exit 0
fi

echo ""
echo "--- post-merge: running toolbox/setup.sh ---"
bash "$SETUP" 2>&1 || echo "  (setup.sh had errors — pull succeeded, run setup manually)"
echo "--- post-merge: done ---"
