$ErrorActionPreference = "Stop"

$TaskName = "DistribuidoraLopezCRM"
$existing = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
if ($existing) {
  Stop-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
  Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
  Write-Host "Tarea eliminada: $TaskName"
} else {
  Write-Host "La tarea no existe: $TaskName"
}
