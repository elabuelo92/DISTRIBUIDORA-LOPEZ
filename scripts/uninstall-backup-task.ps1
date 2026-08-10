$ErrorActionPreference = "Stop"

$TaskName = "DistribuidoraLopezBackup"
$existing = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
if ($existing) {
  Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
  Write-Host "Tarea eliminada: $TaskName"
} else {
  Write-Host "La tarea no existe: $TaskName"
}
