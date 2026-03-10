# Agent Lifecycle Rules

## Rule 11: Every agent prompt MUST follow the 6-stage Agent Lifecycle.
Define -> Discover -> Execute -> Reason -> Verify -> Debrief. Stage 2 (Discover) MUST mandate at least one skill -- `ls .claude/skills/` is non-negotiable. Stage 6 (Debrief) MUST include the debrief API curl. Use the `create-agent-prompt` skill as the canonical prompt generator.

## PRD text is aspirational, hooks are enforceable.
Checkpoints written in PRDs "absolutely do nothing" (user quote). Only hooks enforce agent behavior. Design enforcement mechanisms as hooks, not as PRD instructions.

## Research online first, through skills.
Before building anything from scratch, search online. Other people have likely solved this problem. Always use the `/deep-research` skill for multi-source research -- never raw WebSearch with kitchen-sink queries. Short, targeted queries. Universal language, not internal jargon.
