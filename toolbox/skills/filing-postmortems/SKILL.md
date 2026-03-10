---
name: filing-postmortems
description: >-
  File structured post-mortems for agent failures, orchestrator mistakes, and
  systemic issues. Use when the user says "post-mortem", "PM", "file a PM",
  "this should be a post-mortem", or when an agent or orchestrator makes a
  mistake that needs documented. Reads existing PMs from dispatch.json to match
  convention, enforces blameless format with numbered failures and systemic
  fixes, and writes to the MC API. Triggers on: post-mortem, PM, incident,
  file postmortem, this is a postmortem, should be a PM.
---

# Filing Post-Mortems

Create structured, blameless post-mortem entries in Mission Control's dispatch system.

## When to Use

- An agent dispatched to the wrong target
- An orchestrator skipped a pipeline or process
- A systemic issue caused data corruption or downtime
- A recurring pattern was identified that needs prevention
- The user explicitly says "post-mortem" or "PM"

## Step 1: Read Existing PMs

Before writing anything, read 2-3 existing post-mortems to match convention:

```bash
curl -s http://localhost:3033/api/dispatch | python -c "
import sys, json
items = json.load(sys.stdin)
pms = [i for i in items if 'post-mortem' in i.get('tags', [])]
for pm in pms[-3:]:
    print(pm['id'], '-', pm['title'][:80])
"
```

Then read one fully to absorb the format. Our PMs use `##` headers (NOT `###`), numbered failures, and each failure has a **Lesson** and **Systemic fix**.

## Step 2: Gather Incident Details

Collect from context or ask:

| Field | Required | Source |
|-------|----------|--------|
| **What happened** | Yes | The incident description |
| **What was expected** | Yes | What should have happened |
| **Root cause** | Yes | Why it happened (not who) |
| **Failures** | Yes | Numbered, each with Lesson + Systemic Fix |
| **Impact** | Yes | What was wasted (time, tokens, user trust) |
| **Action items** | Yes | Concrete next steps |
| **Campaign context** | If applicable | Which campaign/sprint |
| **Session** | If applicable | Which agent/orchestrator |

## Step 3: Write the PM

Follow this EXACT structure (matching existing convention):

```
## Incident (YYYY-MM-DD)
[1-2 sentences: what happened]

## What actually happened
[3-5 sentences: the full story with specifics]

## Failure 1: [Title]
- [Description of what went wrong]
- **Lesson:** [What to learn]
- **Systemic fix:** [How to make this impossible to recur]

## Failure 2: [Title]
- [Description]
- **Lesson:** [...]
- **Systemic fix:** [...]

## Action items
1. [Concrete action with owner if known]
2. [...]
```

## Quality Gates

Before submitting, verify ALL:

1. **Blameless tone** -- describes what happened, not who messed up
2. **No `###` headers** -- parser renders `##` only
3. **No special characters** -- no em dashes, smart quotes, arrows (use --, ', ->)
4. **Every failure has Lesson + Systemic fix** -- no bare failures
5. **Systemic fix prevents recurrence** -- not "be more careful" but "add a check/hook/gate"
6. **ASCII only in JSON strings** -- no Unicode punctuation

## Step 4: Get Next PM ID and Submit

The API generates random IDs. PMs need sequential IDs (pm026, pm027...). Before submitting:

```bash
# Find the highest existing PM number
curl -s http://localhost:3033/api/dispatch | python -c "
import sys, json, re
items = json.load(sys.stdin)
nums = [int(re.search(r'\d+', i['id']).group()) for i in items if i['id'].startswith('pm') and re.search(r'\d+', i['id'])]
print('Next ID: pm' + str(max(nums) + 1 if nums else 1).zfill(3))
"
```

Then write directly to the correct dispatch file (dispatch-home.json or dispatch-work.json based on machine context) with the sequential ID:

```bash
# Write to dispatch file directly with correct ID
python -c "
import json
with open('.claude/agent-hub/data/dispatch-home.json', encoding='utf-8') as f:
    items = json.load(f)
items.append({
    'id': 'pmNNN',
    'title': 'Post-Mortem: [title]',
    'description': '[full PM text]',
    'status': 'open',
    'priority': 'p0',
    'workstream': 'mission-control',
    'tags': ['post-mortem', 'tag'],
    'context': 'campaign-NNN',
    'created': '...',
    'updated': '...'
})
with open('.claude/agent-hub/data/dispatch-home.json', 'w', encoding='utf-8') as f:
    json.dump(items, f, indent=2, ensure_ascii=True)
"
```

Do NOT use the POST /api/dispatch endpoint -- it generates random IDs instead of sequential pmNNN.

## Step 5: Report Back

After filing, present:

```
PM filed:
  ID: pmNNN
  Title: [title]
  Failures: N identified
  Systemic fixes: [list]
  Status: open
```

## Rules

- **Blameless always** -- "the orchestrator" not "you"
- **Systemic fixes are mandatory** -- a PM without a systemic fix is incomplete
- **Match existing convention** -- read before writing
- **ASCII in JSON** -- writeJSON sanitizes but don't rely on it
- **Open by default** -- PMs start open, closed when systemic fix is implemented
