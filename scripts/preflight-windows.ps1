$ErrorActionPreference = "Continue"

$ProjectDir = Split-Path -Parent $PSScriptRoot
$Port = if ($env:PORT) { [int]$env:PORT } else { 8790 }
$DataDir = if ($env:DATA_DIR) { $env:DATA_DIR } else { Join-Path $ProjectDir "data" }
$StateFile = if ($env:STATE_FILE) { $env:STATE_FILE } else { Join-Path $DataDir "demo-state.json" }

Write-Host "=== Distribuidora Lopez - Preflight Windows ==="
Write-Host "Proyecto: $ProjectDir"
Write-Host "Puerto: $Port"
Write-Host "DataDir: $DataDir"
Write-Host "StateFile: $StateFile"
Write-Host ""

Write-Host "Node.js:"
$node = Get-Command node -ErrorAction SilentlyContinue
if ($node) {
  try {
    $nodeVersion = & $node.Source --version 2>&1
    if ($LASTEXITCODE -eq 0) {
      Write-Host "  OK - $($node.Source)"
      Write-Host "  Version - $nodeVersion"
    } else {
      Write-Host "  ERROR - Node.js existe pero no ejecuta correctamente."
      Write-Host "  Detalle - $nodeVersion"
      Write-Host "  Instalar Node.js LTS desde instalador oficial."
    }
  } catch {
    Write-Host "  ERROR - Node.js existe pero Windows no permite ejecutarlo."
    Write-Host "  Detalle - $($_.Exception.Message)"
    Write-Host "  Instalar Node.js LTS desde instalador oficial."
  }
} else {
  Write-Host "  FALTA - Instalar Node.js LTS antes de seguir."
}

Write-Host ""
Write-Host "Archivos:"
foreach ($file in @("server.js", "index.html", "app.js", "package.json")) {
  $path = Join-Path $ProjectDir $file
  if (Test-Path $path) {
    Write-Host "  OK - $file"
  } else {
    Write-Host "  FALTA - $file"
  }
}

Write-Host ""
Write-Host "Red local:"
ipconfig | Select-String -Pattern "IPv4|Puerta de enlace"

Write-Host ""
Write-Host "Puerto ${Port}:"
$connection = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
if ($connection) {
  $connection | Select-Object LocalAddress, LocalPort, State, OwningProcess | Format-Table -AutoSize
} else {
  $netstat = netstat -ano -p tcp | Select-String ":$Port"
  if ($netstat) {
    $netstat
  } else {
    Write-Host "  Libre o sin servidor escuchando."
  }
}

Write-Host ""
Write-Host "Energia:"
powercfg /GETACTIVESCHEME
Write-Host "  Revisar manualmente que suspension e hibernacion queden desactivadas."

Write-Host ""
Write-Host "Backup:"
if (Test-Path (Join-Path $ProjectDir "scripts\backup-windows.ps1")) {
  Write-Host "  OK - script de backup disponible."
} else {
  Write-Host "  FALTA - scripts\backup-windows.ps1"
}

Write-Host ""
Write-Host "Resultado: si Node.js esta OK y los archivos estan OK, se puede instalar el arranque automatico."
