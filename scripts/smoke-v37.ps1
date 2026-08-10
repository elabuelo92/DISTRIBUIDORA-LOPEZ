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
    if ($index.Content -match "8790-(37|38|39)" -and $index.Content -match "Dashboard Operativo" -and $index.Content -match "Primeras 4 alertas") {
      Add-Ok "Index v37+ sirve Dashboard Operativo y cache-busting correcto."
    } else {
      Add-Failure "El index no contiene marca v37 o textos del Dashboard Operativo."
    }
  } catch {
    Add-Failure "No se pudo leer index.html. Detalle: $($_.Exception.Message)"
  }

  $app = Get-Content -Raw -LiteralPath "app.js"
  foreach ($pattern in @("buildOperationalDashboard", "Total vendido hoy", "Total cobrado hoy", "Transferencias a validar", "ORDER_DASHBOARD_STAGES")) {
    if ($app -match [regex]::Escape($pattern)) {
      Add-Ok "App contiene: $pattern"
    } else {
      Add-Failure "App no contiene: $pattern"
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
  Write-Host "Resultado: smoke v37 OK." -ForegroundColor Green
  exit 0
} finally {
  Pop-Location
}
