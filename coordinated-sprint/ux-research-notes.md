# Multi-Agent Coordination UX Research
**Research date:** 2026-03-06
**Context:** Web-based agent manager for 2–8 concurrent Claude Code agents
**Focus:** Actionable patterns from production tools (CI/CD, K8s, monitoring, chat, AI frameworks)

---

## 1. CI/CD Dashboards (GitHub Actions, Jenkins Blue Ocean)

### How They Show Multiple Parallel Jobs

**GitHub Actions:**
- Displays all jobs in a workflow run at the same level (no nesting by default)
- Jobs show **status badge** (running, failed, success, queued) + duration
- Matrix-generated jobs appear as job-count badges (e.g., "job [1/8 passing]")
- Timeline view shows which jobs ran in parallel vs sequentially
- Jobs with dependencies show a visual "waiting for" state when blocked

**Jenkins Blue Ocean:**
- Visualizes parallel stages as **side-by-side columns** (not nested inside parent)
- Each stage column shows step-by-step progress vertically
- **Parallel Stages syntax** is the modern standard—older Parallel Execution syntax is collapsed
- Stage boxes change color: blue (running) → green (pass) → red (fail)
- Parallel branches are added via "+" icon below a stage, creating new columns

### "Click to See Details" Interaction

**Pattern:** Overview → Sidebar or modal detail pane
- Click job name → right-side panel opens showing:
  - Full console logs with search/filter
  - Step-by-step breakdown of what ran
  - Timing info per step
  - Environment variables (if visible)
  - Artifacts/outputs generated
- Logs are **live-scrolling** if job is running
- Failure annotations highlight the exact step + error message at the top

**Key insight:** Details panel does NOT replace the overview; it coexists. You can see the summary jobs list and read detailed logs simultaneously.

### Progress for Coordinated Pipelines

- **Dependency chains** show visually (Stage A → Stage B → Stage C)
- **Blocking state** is explicit: stage shows "waiting for X job to complete"
- **Aggregate progress:** "3 of 8 jobs done" badge at the workflow level
- **Timing estimates:** Each job shows elapsed time; some systems (GitHub) estimate total duration based on critical path
- **Cancellation state:** If one job fails, dependent jobs change to "skipped" (not "failed")

---

## 2. Container Orchestration (Kubernetes Dashboard, Lens, Docker Desktop)

### How They Show Multiple Running Pods/Containers

**Kubernetes (Lens):**
- **Pod list table:** Columns include Name, Ready (e.g., "2/3"), Status, Restarts, Age, CPU, Memory
- Color-coded badges: green (running), yellow (pending), red (failed/crashed)
- Namespace dropdown filters the list
- Search/filter by pod name, label, or status
- Sortable columns for quick triage (e.g., sort by CPU to find hungry pods)

**Docker Desktop:**
- **Container list:** Shows running + stopped containers
- Columns: Container name, Image, Status (green dot = running), CPU/Memory usage live
- Search box for quick filtering
- Hover over container row → action buttons appear (Logs, Stop, Pause, etc.)
- Status labels: "Running," "Stopped," "Paused," "Exited with code X"

### "Which Pod Is Which" Problem & Solution

**Pain point:** At scale (10+ pods), naming and identity become critical.
**Solutions implemented:**

1. **Namespace segregation** (Kubernetes): Pods are grouped by namespace first. Click namespace → only those pods appear.
2. **Label/tag display:** Pods show their labels (e.g., `app=orders`, `version=v2`). Filterable.
3. **Container count badge:** Ready count (e.g., "2/3" means 2 of 3 containers healthy) tells you pod health at a glance.
4. **Consistent naming convention:** Pod names often include replica set hash + index (e.g., `my-app-5d4c7b-0`), making it clear which generation it belongs to.
5. **Color + icon coding:** Status icons (spinning loader, checkmark, X) + color (green/yellow/red) reduce cognitive load.

### Detail/Inspect View

**Lens side-panel pattern:**
- Click pod name → **right sidebar** slides in
- Shows:
  - Full pod metadata (UID, creation time, labels, annotations)
  - All containers in the pod + their status
  - Resource requests/limits (CPU, memory)
  - Mount points and volumes
  - Recent events (logs, state changes)
  - Buttons: View logs, Open terminal, Delete, etc.
- Click a specific container → container tab shows logs and terminal
- Can run commands directly in the container from this panel

**Key feature:** No page navigation. Detail view is a **non-modal sidebar** — you keep the full list visible while drilling into one pod.

**Docker Desktop detail tabs:**
- Logs: Real-time container stdout/stderr, searchable
- Inspect: Low-level metadata (image SHA, ports, env vars, mounts)
- Exec/Debug: Run commands inside the container interactively
- Files: Browse container filesystem
- Stats: Live CPU, memory, network, disk usage graphs

---

## 3. AI Agent Frameworks (CrewAI, LangGraph Studio)

### LangGraph Studio Visualization

**Layout:**
- **Left panel:** Visual flowchart (DAG) showing nodes (agent, action, tool, end) connected by arrows
- **Right panel:** Real-time execution state showing:
  - Current node executing (highlighted)
  - JSON structure of intermediate outputs
  - Step-through controls: pause, resume, next step, rewind ("time travel")
  - Input/output of current node

**Nodes as units of work:**
- Each node represents an agent action or tool call
- Click node → shows:
  - What input it received
  - What LLM was called (if applicable)
  - Function called (e.g., `search_web`)
  - Output produced
  - Duration
- Color coding: green (complete), blue (running), yellow (paused), red (error)

**Parallel execution visibility:**
- If the graph has multiple independent nodes, LangGraph Studio shows them side-by-side
- Execution status updates live as nodes complete

### CrewAI + AG-UI Pattern

- **Team view:** Shows agents as cards or nodes in the orchestration graph
- **Agent-to-agent communication:** Visible as arrows/lines showing task delegation
- **Conversation view:** See the dialogue between agents (useful for debugging and transparency)
- **Manual intervention:** Can stop an agent, adjust task priority, or inject new information mid-flow

### Key Insight

Both CrewAI and LangGraph prioritize **visibility of the graph structure** (what's connected to what) and **real-time execution state** (which node is running now, what did it output). This is different from CI/CD logs, which are text-heavy. Graph visualization reduces cognitive load.

---

## 4. Chat-Style Multi-Thread Interfaces (Slack, ChatGPT)

### Slack Thread Pattern

**Design principle:** Reduce cognitive overhead by separating channel content from thread replies.

**Layout:**
- Main channel feed shows only top-level messages (no thread replies)
- **"All Threads" sidebar** shows list of threads you participate in:
  - Shows last message preview (1–2 lines)
  - Unread count badge
  - Timestamp of last activity
  - Sorted: unread threads first, then by recency
- Click thread → **right sidebar opens** with full conversation
- **"Also send to channel"** option if you want to broadcast a reply to the main channel

**Why this works for multi-agent use case:**
- Threads isolate side conversations (agent-to-agent chatter) from main workflow updates
- "Unread count" badges tell you which conversations need attention
- Preview text (first 1–2 lines of last message) gives context without opening

### ChatGPT Sidebar

**Known UX issue:** ChatGPT's sidebar only shows 5 most recent conversations, with older ones behind a "See More" dropdown. Users complained this is confusing and hides ongoing work.

**Better pattern (from complaint discussion):**
- Show more recent items upfront
- Use **infinite scroll flyout** to access historical conversations without pagination
- Group conversations by topic or date range
- Search function for finding old conversations

### Summary Pattern (Key for Agents)

Slack and ChatGPT both show **abbreviated summaries** in the list:
- Last message text (1–2 lines, truncated)
- Timestamp (relative: "2 min ago")
- Unread badge (if relevant)

**Actionable insight:** For agent sessions, show:
- Agent name + ID
- Last status update (1–2 words: "complete", "waiting for input", "error")
- Time since last activity
- Unread count (if user hasn't viewed yet)

---

## 5. Real-Time Monitoring Dashboards (Grafana, New Relic, Datadog)

### Overview → Detail Drill-Down Pattern

**Grafana metrics drill-down:**
1. **Overview dashboard** shows high-level KPIs (e.g., "CPU usage across all services")
2. Click metric card → **breakdown view** opens showing:
   - Time series chart for selected metric
   - Tabbed view of label values (e.g., service names, instance IDs)
   - Each label row is clickable → zoom into that specific service
3. Further drill-down into specific host/container by clicking its row in the table

**New Relic service map drill-down:**
1. **Service map visualization** shows services as nodes + dependencies as edges
2. Click a service node → **detail panel** slides in showing:
   - Response time, throughput, error rate (the "golden signals")
   - Top transactions in that service
   - Upstream/downstream dependencies
3. Click a transaction → trace detail view with all spans (distributed tracing)

**Key pattern:** Each drill level adds **1 more layer of granularity without replacing the previous view**. You maintain context as you go deeper.

### Service Differentiation at Scale

- **Color coding by health:** Green (healthy), yellow (warning), red (error)
- **Size/thickness of nodes:** Proportional to load or importance (visual weight = urgency)
- **Status badges:** Show error rate, latency percentile, or other KPI inline
- **Grouping by service tier:** Organize services hierarchically (API tier → compute tier → data tier)

---

## 6. Synthesized Patterns for Agent Manager UX

### Pattern 1: Dashboard Overview + Sidebar Detail

**Structure:**
```
┌─────────────────────────────────────────┐
│  Agent Manager Dashboard                │
│  ┌────────────────────────┐             │
│  │ Agent List             │ ┌─────────┐ │
│  │ ┌──────────────────┐   │ │ Details │ │
│  │ │ Agent A (running)│───┤ │ Panel   │ │
│  │ │ Agent B (idle)   │   │ │         │ │
│  │ │ Agent C (error)  │   │ └─────────┘ │
│  │ └──────────────────┘   │             │
│  └────────────────────────┘             │
└─────────────────────────────────────────┘
```

- **Left:** Scrollable list of agents with status badges
- **Right:** Non-modal detail panel showing logs, metrics, state of selected agent
- Clicking a different agent updates the right panel without closing it
- "Minimize detail" button collapses the right panel for full-width list view

### Pattern 2: Status Badges + Timeline

Use badge system from GitHub Actions / Jenkins:
- **Agent status:** Running (blue, pulsing), Idle (gray), Success (green), Error (red), Waiting (yellow)
- **Inline timing:** "Running 3m 24s" or "Completed 2m ago"
- **Progress indicator:** For agents with tasks, show "Step 2 of 5" or percentage complete
- **Health at a glance:** CPU/memory usage, if available (from Docker)

### Pattern 3: Hierarchical Drill-Down (Grafana-style)

For complex tasks spanning multiple sub-agents:

```
Level 0: Agent A is working on "feature-x"
  ↓ click
Level 1: Breakdown: subagent-1 (working), subagent-2 (done), subagent-3 (waiting)
  ↓ click subagent-1
Level 2: Subagent-1 detail: current task, logs, state
```

Each level is clickable, non-modal. Breadcrumb navigation shows depth.

### Pattern 4: Thread-Style Communication Log

Like Slack threads, separate "side conversations" from main workflow:

- **Main log:** Major milestones (agent started, task completed, waiting for input)
- **Expand/collapse:** Each milestone can expand to show full logs or agent-to-agent messages
- **"Show more" for older entries:** Infinite scroll or pagination

### Pattern 5: Diff/Comparison View for Parallel Work

When 2+ agents are working on related tasks (e.g., two code branches):

- Show side-by-side progress
- Highlight divergence points
- Show when one agent blocks the other

(Inspired by Git diff tools and VS Code's compare view.)

### Pattern 6: Unread/Activity Indicator

- Red badge with count (e.g., "3") next to agent name if there's new output
- Timestamp of last activity
- Clear unread on click

(Borrowed from Slack / ChatGPT.)

### Pattern 7: Search + Filter

- Filter agents by status (running, idle, error)
- Filter by tags (team, project, feature)
- Search by agent name or recent message

---

## 7. Specific UX Mechanics to Steal

| Mechanic | Source | How It Works | Why It Works for Agents |
|----------|--------|-------------|------------------------|
| **Live progress bar with step count** | GitHub Actions, Jenkins | Shows "Step 3 of 7" + percentage bar | Agent tasks are procedural; progress is meaningful |
| **Sidebar detail, not modal** | Lens, VS Code | Click item → right panel slides in; main list stays visible | You want to compare agents or glance back at the list |
| **Color + icon + text status** | Kubernetes, Docker | Green checkmark + "Running" + blue badge | Triple redundancy (color-blind users, quick scanning, clarity) |
| **Unread badge count** | Slack, Gmail | Red dot + number on item | Tells you which agents need attention without opening each one |
| **Expandable rows** | Slack threads, VS Code debugger | Click → expands to show sub-items | Hide complexity by default, show on demand |
| **"Time travel" debugging** | LangGraph Studio | Rewind to previous step, inspect state | When agent fails, replay to find the bug |
| **Breadcrumb trail** | Web UX standard | "Dashboard > Agent A > Task 1" | Always know where you are in the hierarchy |
| **Tab-based detail views** | Docker Desktop, Kubernetes | Logs, Inspect, Exec, Stats tabs | Different views for different questions (logs vs. config vs. resources) |
| **Search box filters in real time** | GitHub, Docker, VS Code | Type → list narrows instantly | Fast triage of many agents (10+ at scale) |
| **Hover → action buttons** | Docker Desktop, Notion | Buttons appear on hover, hidden by default | Keeps UI clean; actions discoverable |

---

## 8. Known Pitfalls to Avoid

1. **Sidebar "hidden" conversations** (ChatGPT issue)
   - **Problem:** Only showing 5 items + "See More" dropdown is confusing
   - **Fix:** Infinite scroll flyout, or show 15–20 by default with scroll

2. **Nested parallel stages** (Jenkins Blue Ocean issue)
   - **Problem:** When parallel jobs are nested, visualization breaks
   - **Fix:** Flatten the view (show all parallel branches at same level) or use explicit indentation

3. **No filtering at scale** (Kubernetes Dashboard issue, deprecated)
   - **Problem:** 50+ pods in one view is overwhelming
   - **Fix:** Namespace/filter controls upfront; sort by health/age

4. **Modal detail view replaces list** (bad UX)
   - **Problem:** Opening details hides the full list; hard to compare agents
   - **Fix:** Use non-modal sidebar detail (Lens, Docker Desktop do this well)

5. **Text-only status updates**
   - **Problem:** Humans scan by color + shape, not just text
   - **Fix:** Use badges, icons, and color coding (GitHub Actions, Kubernetes)

6. **Long logs without search**
   - **Problem:** Finding the error in 1000 lines of logs is painful
   - **Fix:** Search + filter + syntax highlighting + collapsible sections

---

## 9. Recommended Stacking for Agent Manager

### Tier 1: Minimum Viable (MVP)

- [ ] Agent list with status badges (running, idle, error, success)
- [ ] Click agent → sidebar detail panel with logs
- [ ] Scroll/search to find agents by name
- [ ] Unread badge on agents with new output

### Tier 2: Task Visibility

- [ ] Show task count or current task name next to agent
- [ ] Progress indicator (step N of M, or %)
- [ ] Timestamp of last activity

### Tier 3: Parallel Insights

- [ ] Expand agent to show sub-tasks (if multi-step)
- [ ] Timeline view showing which agents ran in parallel
- [ ] Dependency visualization (Agent A depends on Agent B)

### Tier 4: Advanced Debugging

- [ ] Diff view for comparing two agent runs
- [ ] "Time travel" rewind (if state is captured)
- [ ] Agent-to-agent message log (separate from main logs)
- [ ] Metrics: CPU, memory, API calls (if instrumented)

---

## 10. Sources & References

### CI/CD Dashboards
- [GitHub Actions Job Concurrency Control](https://docs.github.com/en/actions/writing-workflows/choosing-what-your-workflow-does/control-the-concurrency-of-workflows-and-jobs)
- [Jenkins Blue Ocean Pipeline Run Details](https://www.jenkins.io/doc/book/blueocean/pipeline-run-details/)
- [GitHub Actions Parallel Jobs Overview (Medium)](https://medium.com/@er_anwar/running-parallel-jobs-github-actions-3be0a26bed4a)

### Container Orchestration
- [Kubernetes Dashboard Documentation](https://kubernetes.io/docs/tasks/access-application-cluster/web-ui-dashboard/)
- [Lens Pods View Documentation](https://docs.k8slens.dev/using-lens/workloads/pods/)
- [Docker Desktop Container View](https://docs.docker.com/desktop/use-desktop/container/)
- [Kubernetes Dashboard vs Lens vs K9s Comparison (2025)](https://puffersoft.com/kubernetes-dashboard-vs-lens-vs-k9s-which-one-should-you-choose-in-2025/)

### AI Agent Frameworks
- [LangGraph Studio: A Visual Guide to Building AI Agents](https://www.analyticsvidhya.com/blog/2025/06/langgraph-studio/)
- [LangSmith Studio Docs (LangChain)](https://docs.langchain.com/oss/python/langgraph/studio)
- [Why LangGraph and CrewAI Are Betting on AG-UI (Medium)](https://prajnaaiwisdom.medium.com/why-langgraph-and-crewai-are-betting-on-ag-ui-03ed00ffd193)

### Chat & Communication
- [Slack Threads Design Journey (Part 2)](https://slack.design/articles/threads-in-slack-a-long-design-journey-part-2-of-2/)
- [Slack Help: Use Threads](https://slack.help/articles/115000769927-Use-threads-to-organize-discussions-)
- [ChatGPT Sidebar Redesign Guide](https://www.ai-toolbox.co/chatgpt-management-and-productivity/chatgpt-sidebar-redesign-guide/)

### Monitoring & Observability
- [Grafana Drill-Down Metrics Documentation](https://grafana.com/docs/grafana/latest/visualizations/simplified-exploration/metrics/drill-down-metrics/)
- [New Relic Service Maps Documentation](https://docs.newrelic.com/docs/new-relic-solutions/new-relic-one/ui-data/service-maps/service-maps/)
- [Grafana Dashboard Best Practices](https://grafana.com/docs/grafana/latest/visualizations/dashboards/build-dashboards/best-practices/)

### Multi-Agent Systems
- [Claude Code: Multi-Agent Orchestration (DEV Community)](https://dev.to/bredmond1019/multi-agent-orchestration-running-10-claude-instances-in-parallel-part-3-29da)
- [Claude Code Subagents Documentation](https://code.claude.com/docs/en/sub-agents)
- [How to Run Claude Code in Parallel (Ona)](https://ona.com/stories/parallelize-claude-code)

---

## Conclusion

The strongest pattern across all tools is **sidebar detail + main list coexistence**. This works because:
1. You maintain context (full list visible)
2. You can quickly compare items
3. Clicking another item updates the sidebar without navigation friction
4. It scales: works with 2 agents or 50 agents

Second strongest: **Status badges (color + icon + text)** reduce cognitive load by signaling state at a glance.

Third: **Hierarchical drill-down** (level 0 → level 1 → level 2) borrowed from Grafana works beautifully for multi-step tasks.

For a web-based agent manager, start with these three patterns and iterate based on real usage data.
