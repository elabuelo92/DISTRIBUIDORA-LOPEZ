param(
  [string]$BaseUrl = "http://127.0.0.1:8790"
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
$Failures = New-Object System.Collections.Generic.List[string]

function Add-Failure {
  param([string]$Message)
  $Failures.Add($Message) | Out-Null
  Write-Host "[FAIL] $Message" -ForegroundColor Red
}

function Add-Ok {
  param([string]$Message)
  Write-Host "[OK] $Message" -ForegroundColor Green
}

Push-Location $Root
try {
  try {
    $health = Invoke-RestMethod -Uri "$BaseUrl/api/health" -TimeoutSec 8
    if ($health.ok) {
      Add-Ok ("Servidor activo: {0} pedidos, {1} rutas, {2} sesiones" -f $health.orders, $health.deliveryRoutes, $health.activeSessions)
    } else {
      Add-Failure "El servidor respondio health pero ok=false."
    }
  } catch {
    Add-Failure "No responde $BaseUrl/api/health. Detalle: $($_.Exception.Message)"
  }

  try {
    $index = Invoke-WebRequest -Uri "$BaseUrl/index.html" -UseBasicParsing -TimeoutSec 8
    foreach ($pattern in @("8790-39", "Dashboard Operativo", "Sesiones activas", "Motivo del cambio")) {
      if ($index.Content -match [regex]::Escape($pattern)) {
        Add-Ok "Index contiene: $pattern"
      } else {
        Add-Failure "Index no contiene: $pattern"
      }
    }
  } catch {
    Add-Failure "No se pudo leer index.html. Detalle: $($_.Exception.Message)"
  }

  $app = Get-Content -Raw -LiteralPath "app.js"
  foreach ($pattern in @(
    "buildOperationalDashboard",
    "ORDER_DASHBOARD_STAGES",
    "renderSessionMonitor",
    "uniquePresenceSessions",
    "openClientEditDialog",
    "submitClientEdit"
  )) {
    if ($app -match [regex]::Escape($pattern)) {
      Add-Ok "App contiene: $pattern"
    } else {
      Add-Failure "App no contiene: $pattern"
    }
  }

  $server = Get-Content -Raw -LiteralPath "server.js"
  foreach ($pattern in @(
    "/api/admin/sessions",
    "/api/admin/session-settings",
    "/api/presence/location",
    "clientEditMatch",
    "CLIENTE_CAMBIO_SENSIBLE"
  )) {
    if ($server -match [regex]::Escape($pattern)) {
      Add-Ok "Servidor contiene: $pattern"
    } else {
      Add-Failure "Servidor no contiene: $pattern"
    }
  }

  foreach ($file in @("account-engine.js", "order-engine.js", "delivery-engine.js", "server.js", "app.js", "scripts/support-maintenance.js")) {
    try {
      & node --check $file | Out-Null
      if ($LASTEXITCODE -eq 0) {
        Add-Ok "Sintaxis OK: $file"
      } else {
        Add-Failure "node --check fallo en $file"
      }
    } catch {
      Add-Failure "No se pudo ejecutar node --check en $file. Detalle: $($_.Exception.Message)"
    }
  }

  if ($Failures.Count -gt 0) {
    Write-Host ""
    Write-Host "Resultado: $($Failures.Count) falla(s)." -ForegroundColor Red
    exit 1
  }

  Write-Host ""
  Write-Host "Resultado: smoke v39 OK." -ForegroundColor Green
  exit 0
} finally {
  Pop-Location
}
