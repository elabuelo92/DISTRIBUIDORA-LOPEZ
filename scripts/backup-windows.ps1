$ErrorActionPreference = "Stop"

$ProjectDir = Split-Path -Parent $PSScriptRoot
$DataDir = if ($env:DATA_DIR) { $env:DATA_DIR } else { Join-Path $ProjectDir "data" }
$LegacyState = Join-Path $ProjectDir "demo-state.json"
$BackupDir = Join-Path $ProjectDir "backups"
$Stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$TempDir = Join-Path $env:TEMP "dl-backup-$Stamp"
$ZipFile = Join-Path $BackupDir "distribuidora-lopez-$Stamp.zip"

New-Item -ItemType Directory -Force -Path $BackupDir | Out-Null
New-Item -ItemType Directory -Force -Path $TempDir | Out-Null

if (Test-Path $DataDir) {
  Copy-Item -Path $DataDir -Destination (Join-Path $TempDir "data") -Recurse -Force
}

if (Test-Path $LegacyState) {
  Copy-Item -Path $LegacyState -Destination (Join-Path $TempDir "demo-state.json") -Force
}

Compress-Archive -Path (Join-Path $TempDir "*") -DestinationPath $ZipFile -Force
Remove-Item -Path $TempDir -Recurse -Force

Get-ChildItem -Path $BackupDir -Filter "distribuidora-lopez-*.zip" |
  Sort-Object LastWriteTime -Descending |
  Select-Object -Skip 30 |
  Remove-Item -Force

Write-Host "Backup generado: $ZipFile"
