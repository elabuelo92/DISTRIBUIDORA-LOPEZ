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
      Add-Ok ("Servidor activo: {0} pedidos, eventos {1}, outbox {2}" -f $health.orders, $health.domainEvents, $health.integrationOutbox)
    } else {
      Add-Failure "El servidor respondio health pero ok=false."
    }
    if ($null -ne $health.domainEvents -and $null -ne $health.integrationOutbox) {
      Add-Ok "Health expone domainEvents e integrationOutbox"
    } else {
      Add-Failure "Health no expone contadores de eventos/outbox"
    }
  } catch {
    Add-Failure "No responde $BaseUrl/api/health. Detalle: $($_.Exception.Message)"
  }

  try {
    $index = Invoke-WebRequest -Uri "$BaseUrl/index.html" -UseBasicParsing -TimeoutSec 8
    foreach ($pattern in @("8790-41", "orderTimelineDialog")) {
      if ($index.Content -match [regex]::Escape($pattern)) {
        Add-Ok "Index contiene: $pattern"
      } else {
        Add-Failure "Index no contiene: $pattern"
      }
    }
  } catch {
    Add-Failure "No se pudo leer index.html. Detalle: $($_.Exception.Message)"
  }

  $eventEngine = Get-Content -Raw -LiteralPath "event-engine.js"
  foreach ($pattern in @(
    "emitFromAuditEntries",
    "emitFromNotificationEntries",
    "integrationTargetsForEvent",
    "arca_facturacion",
    "ocr_comprobantes",
    "portal_cliente"
  )) {
    if ($eventEngine -match [regex]::Escape($pattern)) {
      Add-Ok "Event engine contiene: $pattern"
    } else {
      Add-Failure "Event engine no contiene: $pattern"
    }
  }

  $server = Get-Content -Raw -LiteralPath "server.js"
  foreach ($pattern in @(
    'require("./event-engine")',
    "eventEngine.emitFromAuditEntries",
    "eventEngine.emitFromNotificationEntries",
    "/api/events",
    "domainEvents",
    "integrationOutbox"
  )) {
    if ($server -match [regex]::Escape($pattern)) {
      Add-Ok "Servidor contiene: $pattern"
    } else {
      Add-Failure "Servidor no contiene: $pattern"
    }
  }

  foreach ($file in @("event-engine.js", "account-engine.js", "order-engine.js", "delivery-engine.js", "server.js", "app.js", "scripts/support-maintenance.js")) {
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
  Write-Host "Resultado: smoke v41 OK." -ForegroundColor Green
  exit 0
} finally {
  Pop-Location
}
