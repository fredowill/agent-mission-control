# Principles

Engineering principles that govern how agents think and work.
These are universal — they apply to every task, not just specific systems.
Domain-specific truths belong as code comments at the decision point.

## How to Think

- **Root cause first, workaround never.** Investigate WHY before writing code.
  If a fix contradicts existing design, stop and ask.

- **Don't overwrite deliberate design.** Assume existing code has a reason.
  Read it, understand the intent, then propose — don't silently ship a "fix."

- **Distill, don't hoard.** Mistake happens → extract the pattern → store as
  principle or anti-pattern → delete incident details. Memory stays lean.

- **Debug the serving layer first.** When UI shows wrong data, check if the
  server is serving latest code before investigating the data pipeline.

## How to Act

- **Confirm before destroying.** Never kill processes, delete files, or revert
  work without confirming with the user what it is and what it's doing.

- **Self-test before reporting done.** Playwright screenshot + critical visual
  evaluation. DOM checks alone miss clipping, overflow, z-index, layout issues.

- **Scientific method before implementation.** Hypothesize → validate with
  evidence → then implement. Don't jump to code for timing/race-condition bugs.

## How to Debug

**One failure = measure, not retry.** If the first attempt at a fix doesn't work,
the next action is NEVER "try a different value." It is ALWAYS:
1. **Instrument** — log/print the actual values vs expected values at the failure point
2. **Identify the layer** — which layer is broken?
   - **Environment**: zoom, transform, DPR, viewport, scroll offset, CSS inheritance
   - **Layout**: box model, positioning context, overflow, stacking context
   - **Logic**: event coordinates, state values, data flow, timing
   - **Rendering**: paint order, compositing, animation frames
3. **Measure the gap** — what is the delta between expected and actual?
   If expected=330 and actual=429, that's a 1.3x multiplier — now you have a clue.
4. **Only then fix** — with the root cause identified, the fix is usually obvious and one line.

**Never iterate blindly.** Two failed attempts at the same problem = stop, step back,
and run a proper diagnostic. Guessing is not debugging. Tweaking offsets is not debugging.
The cost of each blind iteration is the user's time and trust.

**Profile the environment before manipulating it.** Before writing code that touches
position, coordinates, transforms, or layout — read the current rendering context first.
`getComputedStyle(html)` for zoom/transform, scroll offsets, viewport dimensions.
Don't assume defaults. Other agents or linters may have changed them.

## How to Learn

- **Post-mortem pipeline:** incident → staging → distill into principle/finding
  → delete incident. Never store raw incidents long-term.

- **Findings over memory bloat.** Lessons go to the Findings page (visible,
  searchable, shareable) not buried in markdown files nobody checks.
