#!/bin/bash
# Skill Activation Hook — LLM Reasoning (v2)
#
# Replaced keyword matching (skill-rules.json) with forced eval pattern.
# The Skill Index is injected once at SessionStart. This hook just reminds
# the agent to check it and reason about which skills fit.
#
# Based on: Scott Spence's forced eval approach (84% activation rate)
# Previous: keyword matching against skill-rules.json (~50% activation)

cat > /dev/null  # consume stdin (required but unused)

cat <<'EOF'
SKILL ACTIVATION CHECK (mandatory — injected by hook, not optional)

Before responding to this prompt, you MUST:
1. EVALUATE: Check the Skill Index in your context. Which 0-2 skills would genuinely help with THIS specific task?
2. ACTIVATE: If any skills are relevant, load them using the Skill tool
3. IMPLEMENT: Only after evaluating and activating relevant skills

Rules:
- Pick skills based on REASONING, not habit. Don't default to the same 3 skills every time.
- If no skills are relevant, state "No skills relevant" and proceed.
- Max 2 skills per task. More causes confusion.
- Consider skills you haven't used before — eval-harness, continuous-learning, verification-loop, impeccable-critique all exist for a reason.

ALSO: Before building anything from scratch, search online first (WebSearch tool).
Other people have likely solved this problem already. Don't DIY when open-source exists.
EOF
