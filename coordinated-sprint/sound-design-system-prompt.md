<!-- PIPELINE: create-agent-prompt | mandated: coding-standards,verification-before-completion | task-type: infrastructure -->

## Mission: Build a sound design system with different chimes for different agent events (done, needs input, error, orchestrator alert)

Currently MC has one default chime (`play-chime.ps1`) that plays on every Stop event. The user wants different sounds for different events -- carried as a request for 4 orchestrator sessions. The system should map event types to distinct sounds so the user knows what happened without looking at the terminal.

## Agent Lifecycle (follow in order)

### Stage 1: DEFINE
- **Read:** `.claude/agent-hub/scripts/play-chime.ps1` (current chime implementation)
- **Read:** `.claude/settings.json` (see where play-chime.ps1 is wired in Stop hooks)
- **Read:** `~/.claude/settings.json` (user-level hooks that might also play sounds)
- **Research findings (from v2.6 deep research):**
  - Windows has 5 built-in SystemSounds: `Asterisk`, `Beep`, `Exclamation`, `Hand`, `Question`
  - Custom WAV files via `System.Media.SoundPlayer`
  - Custom frequency beeps via `[console]::beep(frequency, duration)`
  - Sources: [PowerShell Play Sound Guide](https://powershellcommands.com/powershell-play-sound), [Redmondmag](https://redmondmag.com/articles/2018/02/07/play-sound-with-powershell.aspx)
- **Success looks like:** A sound config system where different hook events trigger different sounds. At minimum 4 distinct sounds for: agent-done, needs-input, error, orchestrator-alert. Easy to extend with new event-sound mappings.
- **Constraints:** Must work on Windows 11. PowerShell execution. No external dependencies (no npm packages, no downloads). Use built-in SystemSounds or `[console]::beep()` sequences.

### Stage 2: DISCOVER (HARD GATE -- do not skip)
Run: `ls .claude/skills/`
**You MUST load at least one skill before proceeding to Stage 3.**
Mandated skills for this task: `coding-standards`, `verification-before-completion`
If you skip this stage, your grade caps at C regardless of deliverables.

### Stage 3: EXECUTE
1. Create `.claude/agent-hub/scripts/play-sound.ps1` -- new script that accepts an event type parameter and plays the corresponding sound:
   - `done` -- uplifting chime (Asterisk or custom beep sequence: ascending tones)
   - `needs-input` -- attention tone (Exclamation or 2 quick beeps)
   - `error` -- warning tone (Hand or descending tones)
   - `orchestrator-alert` -- distinct notification (Question or custom melody)
   - Default fallback: current chime behavior if no event type specified
2. Create `.claude/agent-hub/config/sound-config.json` -- maps event types to sound configs:
   ```json
   {
     "done": {"type": "system", "sound": "Asterisk"},
     "needs-input": {"type": "beep", "frequency": 800, "duration": 200, "repeat": 2},
     "error": {"type": "system", "sound": "Hand"},
     "orchestrator-alert": {"type": "system", "sound": "Question"}
   }
   ```
3. Update `.claude/settings.json` Stop hook to call `play-sound.ps1 -Event done` instead of `play-chime.ps1`
4. Keep `play-chime.ps1` as a backward-compatible wrapper that calls `play-sound.ps1 -Event done`
5. Add documentation comments in the script explaining how to add new events/sounds

### Stage 4: REASON
- Are the sounds distinct enough? Test by playing all 4 in sequence -- can you tell them apart?
- Does the beep sequence approach work cross-terminal (Windows Terminal, VS Code, etc.)?
- Is the config file approach overkill for 4 sounds? Consider: user explicitly asked for different tones per event, config file makes it extensible without editing PowerShell.
- Will this break on the work laptop? SystemSounds are built into Windows -- should be universal.

### Stage 5: VERIFY
- Run each sound type and confirm they play:
  - `powershell -ExecutionPolicy Bypass -File scripts/play-sound.ps1 -Event done`
  - `powershell -ExecutionPolicy Bypass -File scripts/play-sound.ps1 -Event needs-input`
  - `powershell -ExecutionPolicy Bypass -File scripts/play-sound.ps1 -Event error`
  - `powershell -ExecutionPolicy Bypass -File scripts/play-sound.ps1 -Event orchestrator-alert`
- Verify backward compatibility: `powershell -ExecutionPolicy Bypass -File scripts/play-chime.ps1` still works
- Verify the Stop hook in settings.json fires correctly (start and stop a test session)
- Confirm sounds are distinguishable (different tones, not all the same)

### Stage 6: DEBRIEF (before you exit)
curl -X POST http://localhost:3033/api/campaigns/agent-debrief -H "Content-Type: application/json" -d '{"campaignId":"campaign-002","slot":"sound-design-system","delivered":["item 1","item 2"],"missed":["item 1"],"lessons":["what you learned"]}'

## Constraints
- Windows only (PowerShell) -- no cross-platform requirement
- No external dependencies -- built-in SystemSounds and [console]::beep() only
- Must not break existing chime behavior -- backward compatible
- Keep it simple -- 4 events is enough for now, extensible via config
- Scripts must be in `.claude/agent-hub/scripts/`
- Config must be in `.claude/agent-hub/config/`
