$ErrorActionPreference = "Stop"

$TaskName = "DistribuidoraLopezCRM-Usuario"
$ProjectDir = Split-Path -Parent $PSScriptRoot
$Runner = Join-Path $ProjectDir "scripts\run-server-prod.ps1"
$PowerShellPath = "$env:SystemRoot\System32\WindowsPowerShell\v1.0\powershell.exe"
$LogDir = Join-Path $ProjectDir "logs"

New-Item -ItemType Directory -Force -Path $LogDir | Out-Null

$Argument = "-NoProfile -ExecutionPolicy Bypass -File `"$Runner`""
$Action = New-ScheduledTaskAction -Execute $PowerShellPath -Argument $Argument -WorkingDirectory $ProjectDir
$Trigger = New-ScheduledTaskTrigger -AtLogOn
$Settings = New-ScheduledTaskSettingsSet `
  -AllowStartIfOnBatteries `
  -DontStopIfGoingOnBatteries `
  -StartWhenAvailable `
  -RestartCount 5 `
  -RestartInterval (New-TimeSpan -Minutes 1)

$existing = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
if ($existing) {
  Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
}

Register-ScheduledTask -TaskName $TaskName -Action $Action -Trigger $Trigger -Settings $Settings -Description "Servidor Distribuidora Lopez 8790 al iniciar sesion" | Out-Null
Start-ScheduledTask -TaskName $TaskName

Write-Host "Tarea programada de usuario instalada y ejecutada: $TaskName"
Write-Host "Validar en http://localhost:8790/index.html#dashboard"
