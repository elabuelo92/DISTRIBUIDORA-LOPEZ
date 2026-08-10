$ErrorActionPreference = "Stop"

Write-Host "Este instalador ahora usa tarea programada al iniciar Windows."
Write-Host "Es la opcion recomendada para la primera implementacion."

$Installer = Join-Path $PSScriptRoot "install-startup-task.ps1"
& $Installer
