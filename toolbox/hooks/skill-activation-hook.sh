#!/bin/bash
# Mandatory Skill Activation Hook for phredomade
# Based on: https://gist.github.com/umputun/570c77f8d5f3ab621498e1449d2b98b6
# and: https://claudefa.st/blog/tools/hooks/skill-activation-hook
#
# This hook fires on every UserPromptSubmit, injecting a skill activation
# reminder into Claude's context. Claude cannot skip this — it's system-level.
#
# WHY: 20/30+ dispatched agents in campaign-001 used zero skills despite
# PRD "HARD GATE" instructions. PRD text alone doesn't enforce skill usage.
# This hook makes skill discovery unavoidable.

cat <<'EOF'
SKILL ACTIVATION CHECK (mandatory — injected by hook, not optional)

Before responding to this prompt, you MUST:

1. EVALUATE: Check which skills in .claude/skills/ are relevant to this task
   Run: ls .claude/skills/ (if you haven't already this session)

2. ACTIVATE: If any skills are relevant, load them using the Skill tool
   - Performance tasks → impeccable-optimize, systematic-debugging
   - UI/design tasks → frontend-design, impeccable-polish
   - New features → brainstorming (ALWAYS before building)
   - Code review → critic agent, guard agent
   - Research → scientist agent, WebSearch tool
   - Agent creation → agent-expert agent, agent-development skill

3. IMPLEMENT: Only after evaluating and activating relevant skills

If no skills are relevant, state "No skills relevant" and proceed.
If you skip this check, your output quality will be lower and you will be graded poorly.

ALSO: Before building anything from scratch, search online first (WebSearch tool).
Other people have likely solved this problem already. Don't DIY when open-source exists.
EOF
