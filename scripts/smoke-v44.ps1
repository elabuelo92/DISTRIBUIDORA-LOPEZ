param(
  [int]$Port = 8896
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$dataDir = Join-Path $root ".tmp-smoke-v44"

Write-Host "DL v44 smoke test - root: $root"

Push-Location $root
try {
  node --check .\app.js
  node --check .\server.js

  if (Test-Path -LiteralPath $dataDir) {
    $resolvedRoot = (Resolve-Path -LiteralPath $root).Path
    $resolvedTmp = (Resolve-Path -LiteralPath $dataDir).Path
    if (-not $resolvedTmp.StartsWith($resolvedRoot)) {
      throw "Ruta temporal inesperada: $resolvedTmp"
    }
    Remove-Item -LiteralPath $resolvedTmp -Recurse -Force
  }
  New-Item -ItemType Directory -Path $dataDir | Out-Null

  $env:DL_PORT = [string]$Port
  $env:DATA_DIR = $dataDir
  $server = Start-Process -FilePath "node" -ArgumentList "server.js" -WorkingDirectory $root -PassThru -WindowStyle Hidden
  Start-Sleep -Milliseconds 900

  try {
    $health = Invoke-RestMethod -Uri "http://127.0.0.1:$Port/api/health" -TimeoutSec 5
    if (-not $health.ok) {
      throw "Health check sin ok"
    }
    $index = Invoke-WebRequest -Uri "http://127.0.0.1:$Port/index.html" -UseBasicParsing -TimeoutSec 5
    if ($index.Content -notmatch "ordersQuickFilter" -or $index.Content -notmatch "deliveryPlannerSort") {
      throw "Controles v44 no encontrados en index.html"
    }
    $app = Invoke-WebRequest -Uri "http://127.0.0.1:$Port/app.js" -UseBasicParsing -TimeoutSec 5
    if ($app.Content -notmatch "renderOrdersPager" -or $app.Content -notmatch "orderQuickFilterMatches") {
      throw "Logica v44 no encontrada en app.js"
    }
    Write-Host "OK v44 smoke test en puerto $Port"
  } finally {
    if ($server -and -not $server.HasExited) {
      Stop-Process -Id $server.Id -Force
    }
  }
} finally {
  Pop-Location
}

