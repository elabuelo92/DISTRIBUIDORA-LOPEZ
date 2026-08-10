$ErrorActionPreference = "Stop"

$TaskName = "DistribuidoraLopezBackup"
$ProjectDir = Split-Path -Parent $PSScriptRoot
$Runner = Join-Path $ProjectDir "scripts\backup-windows.ps1"
$PowerShellPath = "$env:SystemRoot\System32\WindowsPowerShell\v1.0\powershell.exe"

$Argument = "-NoProfile -ExecutionPolicy Bypass -File `"$Runner`""
$Action = New-ScheduledTaskAction -Execute $PowerShellPath -Argument $Argument -WorkingDirectory $ProjectDir
$Trigger = New-ScheduledTaskTrigger -Daily -At 20:00
$Principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -RunLevel Highest
$Settings = New-ScheduledTaskSettingsSet `
  -AllowStartIfOnBatteries `
  -DontStopIfGoingOnBatteries `
  -StartWhenAvailable

$existing = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
if ($existing) {
  Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
}

Register-ScheduledTask -TaskName $TaskName -Action $Action -Trigger $Trigger -Principal $Principal -Settings $Settings | Out-Null

Write-Host "Tarea de backup instalada: $TaskName"
Write-Host "Horario diario: 20:00"
