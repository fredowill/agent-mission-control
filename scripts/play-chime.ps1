# play-chime.ps1 -- Backward-compatible wrapper
# Delegates to play-sound.ps1 with the "done" event
# Kept so any existing references to play-chime.ps1 continue to work

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$playSoundScript = Join-Path $scriptDir "play-sound.ps1"

& $playSoundScript -Event "done"
