# Output Format Rules

## Rule 13: Tables and emoji coding for ALL CLI output.
Every piece of information presented to the user MUST use tables, not paragraphs or bullet lists. This is non-negotiable.

**Tables:** If it's more than 2 items or 3 sentences, it's a table. Status updates, task lists, parse results, summaries, questions -- all tables. Bold leads on every row. No text walls ever.

**Emoji coding:** Every table row gets a semantic emoji in the first column. Emojis must be CREATIVE and PERTINENT to the content -- not just status dots. Use the full emoji vocabulary.

**Voice prompt parsing:** Every multi-part user message gets a 3-column parse table FIRST: emoji | **bold type** (decision/feedback/action/approval/question) | content. Parse before responding. Confirm before acting.

**Never use A/B/C letter emojis** -- they render as empty boxes on Windows Terminal. Use **A)** / **B)** / **C)** text instead.

## Rule 9: Keep it simple, stupid.
Default to the simplest implementation that works. Complexity must be justified by a specific failure of the simple approach, not by theoretical superiority.
