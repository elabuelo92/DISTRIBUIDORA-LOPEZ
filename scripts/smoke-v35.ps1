param(
  [string]$BaseUrl = "http://127.0.0.1:8790",
  [string]$AdminPassword = "",
  [switch]$Integration,
  [switch]$AllowStateReset
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
$Failures = New-Object System.Collections.Generic.List[string]
if (-not $AdminPassword) {
  $AdminPassword = if ($env:DL_SMOKE_ADMIN_PASSWORD) {
    $env:DL_SMOKE_ADMIN_PASSWORD
  } elseif ($env:DL_DEFAULT_PASSWORD) {
    $env:DL_DEFAULT_PASSWORD
  } else {
    "Lopez2026!"
  }
}

function Add-Failure {
  param([string]$Message)
  $Failures.Add($Message) | Out-Null
  Write-Host "[FAIL] $Message" -ForegroundColor Red
}

function Add-Ok {
  param([string]$Message)
  Write-Host "[OK] $Message" -ForegroundColor Green
}

function Post-Json {
  param(
    [string]$Uri,
    [object]$Body,
    [Microsoft.PowerShell.Commands.WebRequestSession]$Session
  )
  Invoke-RestMethod -Uri $Uri -Method Post -ContentType "application/json" -Body ($Body | ConvertTo-Json -Depth 60) -WebSession $Session -TimeoutSec 12
}

Push-Location $Root
try {
  try {
    $health = Invoke-RestMethod -Uri "$BaseUrl/api/health" -TimeoutSec 8
    if ($health.ok) {
      Add-Ok ("Servidor activo: {0} pedidos, {1} rutas" -f $health.orders, $health.deliveryRoutes)
    } else {
      Add-Failure "El servidor respondio health pero ok=false."
    }
  } catch {
    Add-Failure "No responde $BaseUrl/api/health. Detalle: $($_.Exception.Message)"
  }

  try {
    $index = Invoke-WebRequest -Uri "$BaseUrl/index.html" -UseBasicParsing -TimeoutSec 8
    if ($index.Content -match "8790-35" -and $index.Content -match "auditList") {
      Add-Ok "Index v35 con auditoria servido correctamente."
    } else {
      Add-Failure "El index no contiene marca v35 o panel de auditoria."
    }
  } catch {
    Add-Failure "No se pudo leer index.html. Detalle: $($_.Exception.Message)"
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

  if ($Integration) {
    if (-not $AllowStateReset) {
      Add-Failure "Integracion v35 requiere -AllowStateReset y debe usarse solo con servidor temporal."
    } elseif ($BaseUrl -match ":8790($|/)") {
      Add-Failure "Integracion v35 bloqueada contra 8790 activo para no resetear datos reales."
    } else {
      try {
        $session = New-Object Microsoft.PowerShell.Commands.WebRequestSession
        $login = Post-Json -Uri "$BaseUrl/api/login" -Session $session -Body @{
          username = "admin1"
          password = $AdminPassword
          device = @{
            id = "SMOKE-V35"
            label = "Smoke v35"
            model = "PowerShell"
            os = "Windows"
            appVersion = "v35"
          }
          gps = @{
            lat = -31.4167
            lng = -64.1833
            accuracy = 20
            source = "smoke"
          }
        }
        if (-not $login.ok) { throw "Login admin1 no respondio ok." }
        Add-Ok "Login temporal admin OK."

        $seedState = @{
          clients = @(@{
            codigo_cliente = "CLI-AUD"
            name = "Cliente Auditoria"
            nombre_comercial = "Cliente Auditoria"
            razon_social = "Cliente Auditoria SA"
            cuit = "30-00000000-1"
            condicion_fiscal = "Responsable Inscripto"
            domicilio = "Colon 500"
            localidad = "Cordoba"
            zone = "Centro"
            ruta = "Centro"
            seller = "Sofia Benitez"
            status = "Activo"
            balance = 0
            limit = 100000
            latitud = -31.421
            longitud = -64.181
          })
          products = @(@{
            codigo_producto = "PROD-AUD"
            name = "Producto Auditoria"
            descripcion = "Producto Auditoria"
            rubro = "TEST"
            marca = "DL"
            familia = "Auditoria"
            segmento = "Smoke"
            price = 1000
            cost = 500
            stock_fisico = 10
            stock_actual = 10
            stock = 10
            stock_reservado = 0
            stock_disponible = 10
            stock_en_transito = 0
            min = 0
            stock_minimo = 0
          })
          sellers = @(@{ name = "Sofia Benitez"; route = "Centro"; orders = 0; sales = 0; commission = 0; gps = "GPS pendiente"; progress = 0; location = $null })
          orders = @()
          accounts = @()
          bankTransfers = @()
          bankReconciliation = @()
          stockMovements = @()
          activity = @()
          suppliers = @()
          requirements = @()
          deliveryRoutes = @()
          deliveryAudit = @()
          deliveryClosures = @()
          globalAudit = @()
        }

        $stateWrite = Post-Json -Uri "$BaseUrl/api/state" -Session $session -Body @{ state = $seedState; allowReset = $true }
        if (-not $stateWrite.ok) { throw "No se pudo preparar estado temporal." }
        Add-Ok "Estado temporal preparado."

        $orderResult = Post-Json -Uri "$BaseUrl/api/orders" -Session $session -Body @{
          client = "Cliente Auditoria"
          seller = "Sofia Benitez"
          items = @(@{ productCode = "PROD-AUD"; qty = 2 })
          paymentMethod = "Cuenta corriente"
          source = "smoke"
        }
        if (-not $orderResult.ok -or -not $orderResult.order.code) { throw "Pedido temporal no creado." }
        Add-Ok ("Pedido temporal creado: {0}" -f $orderResult.order.code)

        $stockResult = Post-Json -Uri "$BaseUrl/api/stock/entry" -Session $session -Body @{
          productCode = "PROD-AUD"
          qty = 5
          movementType = "Ingreso"
          supplier = "Smoke"
          note = "Prueba auditoria v35"
        }
        if (-not $stockResult.ok) { throw "Movimiento de stock temporal no creado." }
        Add-Ok "Movimiento de stock temporal creado."

        $audit = Invoke-RestMethod -Uri "$BaseUrl/api/audit?limit=50" -WebSession $session -TimeoutSec 12
        $created = @($audit.audit | Where-Object { $_.action -eq "PEDIDO_CREADO" -and $_.entityId -eq $orderResult.order.code })
        $stock = @($audit.audit | Where-Object { $_.action -eq "STOCK_MOVIMIENTO" -and $_.entityId -eq "PROD-AUD" })
        if ($created.Count -lt 1) { throw "No se encontro auditoria PEDIDO_CREADO." }
        if ($stock.Count -lt 1) { throw "No se encontro auditoria STOCK_MOVIMIENTO." }
        foreach ($entry in @($created[0], $stock[0])) {
          if (-not $entry.user -or -not $entry.date -or -not $entry.time -or -not $entry.ip -or -not $entry.device) {
            throw "Entrada de auditoria incompleta: $($entry.action)"
          }
        }
        Add-Ok "Auditoria global registra usuario, fecha, hora, IP, dispositivo, anterior y nuevo."
      } catch {
        Add-Failure "Integracion auditoria v35 fallo. Detalle: $($_.Exception.Message)"
      }
    }
  }

  if ($Failures.Count -gt 0) {
    Write-Host ""
    Write-Host "Resultado: $($Failures.Count) falla(s)." -ForegroundColor Red
    exit 1
  }

  Write-Host ""
  Write-Host "Resultado: smoke v35 OK." -ForegroundColor Green
  exit 0
} finally {
  Pop-Location
}
