## Mission: Audit all installed Claude Code plugins and recommend which to enable, disable, or remove

We have two plugin marketplaces at `~/.claude/plugins/marketplaces/` — "claude-code-plugins" (12 plugins, older) and "claude-plugins-official" (29 + 13 external, newer superset). Most plugins in the first also exist in the second. Only ONE plugin is currently enabled: `frontend-design@claude-plugins-official`.

The full inventory with every plugin, what it does, overlap with our existing systems, and 8 specific decisions is at: `docs/plans/plugin-audit-briefing.md` — **read that first.**

## Key Tensions to Resolve

1. We already have custom skills, hooks, agents, and MCP servers that overlap with several plugins (commit, simplify, code review, context7, typescript LSP, skill-creator). For each overlap, decide: **keep ours, switch to plugin, or use both.**
2. `security-guidance` plugin is disabled but we have 16 open security findings. Should it be on?
3. Two review plugins exist (`code-review` + `pr-review-toolkit`). Complementary or redundant?
4. Duplicate marketplaces — should we consolidate to one?
5. Do enabled plugins cost context window tokens? If so, we need to be selective.

## Agent Lifecycle (follow in order)

### Stage 1: DEFINE
Read these files to understand our current setup:
- `docs/plans/plugin-audit-briefing.md` — full inventory and overlap analysis
- `.claude/settings.json` — current enabled plugins and hooks
- `ls ~/.claude/plugins/marketplaces/claude-plugins-official/plugins/` — browse plugin directories
- `ls .claude/skills/` — our custom skills
- `.mcp.json` or MCP config — our MCP servers
- `CLAUDE.md` and `MEMORY.md` — behavioral rules and project context

### Stage 2: DISCOVER (HARD GATE — do not skip)
Run: `ls .claude/skills/`
**You MUST load at least one skill before proceeding to Stage 3.**
Suggested skills: `systematic-debugging` (for investigating plugin behavior), or any relevant skill you find.
If you skip this stage, your grade caps at C.

### Stage 3: EXECUTE

**For each plugin, research online:**
- What does the community say about it? Any GitHub issues, blog posts, reviews?
- What does Anthropic's documentation say about plugin costs (context window tokens)?
- Are there better alternatives we don't know about?

**For each of the 8 decisions in the briefing doc, deliver:**
- A concrete YES/NO recommendation with reasoning
- If YES: exact steps to enable (settings.json changes)
- If overlap with our custom system: which wins and why

**Online research is mandatory for this task.** Use WebSearch to find:
- Claude Code plugin best practices
- How plugins affect context window size
- Community recommendations for which plugins are worth enabling
- Any Anthropic documentation on plugin architecture

**Deliverable:** A structured recommendations document with:
- **Enable these** (with settings.json changes)
- **Skip these** (with reasoning)
- **Remove these** (cleanup commands)
- **Investigate further** (only if genuinely unclear, not as a cop-out)

### Stage 4: REASON
- Will enabling multiple hooks (security-guidance, explanatory-output-style) slow down every tool call?
- Does our custom skill infrastructure conflict with plugin skills?
- Is `code-review` plugin better than our critic/guard agents?

### Stage 5: VERIFY
- Test-enable one recommended plugin and verify it works
- Check that existing hooks/skills still function after enabling
- Measure: does enabling a plugin increase context window token usage?

### Stage 6: DEBRIEF (before you exit)
```bash
curl -s -X POST http://localhost:3033/api/campaigns/agent-debrief \
  -H "Content-Type: application/json" \
  -d '{"campaignId":"campaign-001","slot":"plugin-audit","delivered":["item 1","item 2"],"missed":["item 1"],"lessons":["lesson 1"]}'
```

## Constraints
- Do NOT enable plugins without documenting why
- Do NOT remove the `claude-code-plugins` marketplace without confirming nothing unique is lost
- Do NOT modify CLAUDE.md — that's the orchestrator's job
- Output your recommendations to `docs/plans/plugin-audit-recommendations.md`
- Be honest about trade-offs. No maybes — concrete decisions.
