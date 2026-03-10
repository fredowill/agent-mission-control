# play-sound.ps1 -- Event-based sound system for Claude Code agent hooks
#
# Usage:
#   powershell -ExecutionPolicy Bypass -File play-sound.ps1 -Event done
#   powershell -ExecutionPolicy Bypass -File play-sound.ps1 -Event needs-input
#   powershell -ExecutionPolicy Bypass -File play-sound.ps1 -Event error
#   powershell -ExecutionPolicy Bypass -File play-sound.ps1 -Event orchestrator-alert
#
# To add a new event sound:
#   1. Add an entry in ../config/sound-config.json with type "beep" and a sequence array
#   2. Each sequence item needs "frequency" (Hz) and "duration" (ms)
#   3. Optionally add "pause" (ms) for delay between beeps (default: 50ms)
#   4. That's it -- this script reads the config dynamically

param(
    [string]$Event = "done"
)

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$configPath = Join-Path $scriptDir "..\config\sound-config.json"

# Load config -- fall back to simple chime if config missing
if (-not (Test-Path $configPath)) {
    # Fallback: play the original Windows chime
    Add-Type -AssemblyName presentationCore
    $p = New-Object System.Windows.Media.MediaPlayer
    $p.Open([uri]"C:\Windows\Media\chimes.wav")
    $p.Volume = 0.8
    Start-Sleep -Milliseconds 200
    $p.Play()
    Start-Sleep -Milliseconds 2000
    exit 0
}

$config = Get-Content $configPath -Raw | ConvertFrom-Json

# Look up the event -- fall back to "done" if event not found
$soundDef = $config.$Event
if (-not $soundDef) {
    $soundDef = $config.done
}

if (-not $soundDef) {
    # Ultimate fallback: single beep
    [console]::beep(600, 300)
    exit 0
}

# Play the beep sequence
$pause = 50
if ($soundDef.pause) {
    $pause = $soundDef.pause
}

$sequence = $soundDef.sequence
for ($i = 0; $i -lt $sequence.Count; $i++) {
    $note = $sequence[$i]
    [console]::beep($note.frequency, $note.duration)
    if ($i -lt ($sequence.Count - 1)) {
        Start-Sleep -Milliseconds $pause
    }
}
