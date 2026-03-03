param([int]$StartPid)
$current = $StartPid
for ($i = 0; $i -lt 10; $i++) {
    $p = Get-CimInstance Win32_Process -Filter "ProcessId=$current" -EA SilentlyContinue
    if (-not $p) { break }
    if ($p.Name -match 'claude') { Write-Output $p.ProcessId; exit 0 }
    $current = $p.ParentProcessId
}
exit 1
