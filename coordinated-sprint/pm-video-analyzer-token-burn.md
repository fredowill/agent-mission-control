# POST-MORTEM: Video Analyzer Session — Token Burn & Progress Visibility

**Date:** 2026-03-07
**Severity:** Medium (cost waste, UX frustration)
**Status:** OPEN — needs discussion

---

## What Happened

The user asked me to process a 2-hour, 15GB NVIDIA screen recording. The task was:
1. Extract audio with ffmpeg
2. Transcribe with whisper
3. Analyze and produce structured output

The task succeeded — but burned excessive tokens and left the user unable to see progress.

---

## Token Burn Analysis

### Where tokens were wasted:

| Phase | Issue | Estimated Waste |
|-------|-------|-----------------|
| **ffmpeg search** | Searched 5+ locations when `winget install` was the obvious path | LOW |
| **PyTorch CUDA 12.6 install** | Installed cu126 first, then discovered RTX 5070 Ti needs cu128+, had to reinstall nightly | **HIGH** — downloaded ~5GB of packages twice |
| **Progress bar output** | Whisper model download progress bars (1.4GB) dumped into context as raw text | **HIGH** — hundreds of lines of `###...` bars consumed tokens |
| **TaskOutput polling** | Multiple poll/wait cycles for background tasks | MEDIUM |
| **Transcript reading** | Read 1,168 lines in 3 chunks — necessary but large | MEDIUM (unavoidable) |

### What should have happened:
1. **Check GPU model FIRST** before installing PyTorch. `nvidia-smi` should have been the first command, not an afterthought. Would have avoided the cu126 -> cu128 reinstall.
2. **Suppress progress bars** in whisper/pip commands with `--quiet` or `--no-progress` flags. Progress bars are for humans at terminals, not for AI reading output.
3. **Single combined install command** — could have done `pip install openai-whisper torch --index-url ...` in one shot.

### Estimated token waste: ~30-40% of session tokens were avoidable.

---

## Progress Visibility Problem

### What the user experienced:
- Long stretches of silence while background tasks ran
- No indication of % complete, ETA, or phase
- CLI progress bars from pip/whisper rendered as garbled ASCII in the tool output
- User couldn't tell if agent was stuck, working, or done
- Had to interrupt to ask "are you stuck?"

### Why this matters:
This is EXACTLY the pain point Ephratah describes in the demo transcript:
> "I should clearly know when an agent needs approval... it should be a notification sound... I keep flip-flopping, forgetting if someone needs me."

The video analyzer agent had the same problem — the user couldn't tell what was happening.

---

## Proposed Solutions

### Immediate (this session type):
1. **Phase announcements** — Before each long-running step, print a clear status line: "PHASE 2/3: Transcribing audio (~15 min on GPU). I'll update when done."
2. **Suppress progress bars** — Use `--quiet` flags for pip, redirect whisper verbose output to file instead of stdout
3. **Check hardware first** — Always run `nvidia-smi` before any CUDA-related install to get exact GPU model and supported CUDA version

### For Mission Control (systemic):
4. **MC progress widget** — For long-running agent tasks, write a progress JSON to a known location (e.g., `.claude/agent-hub/states/{sessionId}-progress.json`) that the dashboard can poll and display. Fields: `phase`, `pct`, `eta`, `description`.
5. **Campaign page live status** — When an agent is doing a multi-phase task, show phase progress on its campaign card (not just "active")
6. **Toast notifications** — When a phase completes, MC could show a toast: "Video Analyzer: Audio extraction complete (85MB). Starting transcription."

### Root cause of double-install:
7. **GPU capability check should be a standard pre-flight** — Add to engineering principles: "Before any ML/CUDA task, run nvidia-smi and check compute capability FIRST."

---

## Lessons

1. **Infrastructure costs compound** — Installing the wrong PyTorch version once cost more tokens than the actual analysis work.
2. **Background task UX is broken** — The user has no visibility into background tasks beyond "running" / "done". This is a real MC gap.
3. **Progress bars are token killers** — Raw ASCII progress bars in tool output waste context and provide zero value. Always suppress them.
4. **The user's frustration was valid** — Being told to wait with no visibility is the exact frustration MC was built to solve. We should practice what we preach.
