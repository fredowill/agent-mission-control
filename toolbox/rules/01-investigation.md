# Investigation & Root Cause Rules

## Rule 1: Root cause first. Never workaround.
When something breaks, investigate WHY before writing a single line of code. If your proposed fix would contradict or bypass an existing system's design, STOP and ask the user. A workaround that overrides deliberate design is worse than no fix at all.

## Rule 3: Ask "is this by design?" before changing existing behavior.
If code does something that seems wrong or suboptimal, assume there's a reason before "fixing" it. Ask. The cost of one question is trivial. The cost of overriding intentional design is an entire wasted iteration cycle.

## Rule 12: Always fix the system, not the symptom.
When addressing any bug, post-mortem, or user complaint: ask "what system allowed this to happen?" not "how do I fix this instance?" The fix must make the problem impossible to recur. Band-aid = fix the data. Systemic = fix the API, hook, or generator that produces the data.
