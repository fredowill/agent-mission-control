# play-chime.ps1 -- Plays Windows chime on session completion
Add-Type -AssemblyName presentationCore
$p = New-Object System.Windows.Media.MediaPlayer
$p.Open([uri]"C:\Windows\Media\chimes.wav")
$p.Volume = 0.8
Start-Sleep -Milliseconds 200
$p.Play()
Start-Sleep -Milliseconds 2000
