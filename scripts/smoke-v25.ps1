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
    if (-not $health.ok) {
      Add-Failure "El servidor respondio health pero ok=false."
    } else {
      Add-Ok ("Servidor activo: {0} pedidos, {1} rutas, root={2}" -f $health.orders, $health.deliveryRoutes, $health.root)
    }
  } catch {
    Add-Failure "No responde $BaseUrl/api/health. Detalle: $($_.Exception.Message)"
  }

  try {
    $index = Invoke-WebRequest -Uri "$BaseUrl/index.html" -UseBasicParsing -TimeoutSec 8
    if ($index.Content -match "8790-25") {
      Add-Ok "Index v25 servido correctamente."
    } else {
      Add-Failure "El index no contiene marca v25 (8790-25). Puede haber cache o version vieja."
    }
  } catch {
    Add-Failure "No se pudo leer index.html. Detalle: $($_.Exception.Message)"
  }

  try {
    $app = Invoke-WebRequest -Uri "$BaseUrl/app.js" -UseBasicParsing -TimeoutSec 8
    if ($app.Content -match "openSupplyPlannerIfPending" -and $app.Content -match "allocatePendingOrders") {
      Add-Ok "Front v25 contiene planificador de abastecimiento y autoasignacion."
    } else {
      Add-Failure "app.js no contiene los marcadores esperados de v25 abastecimiento."
    }
  } catch {
    Add-Failure "No se pudo leer app.js desde servidor. Detalle: $($_.Exception.Message)"
  }

  $jsFiles = @("server.js", "app.js", "order-engine.js", "delivery-engine.js")
  foreach ($file in $jsFiles) {
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

  $engineScript = @'
const OrderEngine = require("./order-engine.js");
const state = {
  clients: [{ name: "Cliente Test", balance: 0 }],
  sellers: [{ name: "Vendedor Test", sales: 0 }],
  products: [{
    codigo: "PTEST",
    name: "Producto Test",
    stock: 0,
    stock_reservado: 0,
    stock_minimo: 0,
    price: 100,
    cost: 60
  }],
  orders: [],
  activity: [],
  stockMovements: []
};
OrderEngine.migrateState(state);
const order = OrderEngine.createOrder(state, {
  client: "Cliente Test",
  seller: "Vendedor Test",
  items: [{ productCode: "PTEST", name: "Producto Test", quantity: 5, price: 100 }]
}, "Smoke");
if (order.status !== OrderEngine.STATUS.PENDING_SUPPLY) {
  throw new Error("El pedido sin stock no quedo pendiente de abastecimiento.");
}
const result = OrderEngine.applyStockEntry(state, {
  productCode: "PTEST",
  product: "Producto Test",
  quantity: 5,
  type: "Ingreso"
}, "Smoke");
if (!result.completedOrders.includes(order.code)) {
  throw new Error("El ingreso de stock no completo el pedido pendiente.");
}
const updated = state.orders.find((item) => item.code === order.code);
if (updated.status !== OrderEngine.STATUS.READY) {
  throw new Error("El pedido no paso a Completo para armado.");
}
console.log("OK allocation");
'@

  try {
    $engineScript | node - | Out-Null
    if ($LASTEXITCODE -eq 0) {
      Add-Ok "Motor abastecimiento: pedido pendiente se completa al ingresar stock."
    } else {
      Add-Failure "Prueba de motor de abastecimiento fallo."
    }
  } catch {
    Add-Failure "No se pudo ejecutar prueba de motor. Detalle: $($_.Exception.Message)"
  }

  if ($Failures.Count -gt 0) {
    Write-Host ""
    Write-Host "Resultado: $($Failures.Count) falla(s)." -ForegroundColor Red
    exit 1
  }

  Write-Host ""
  Write-Host "Resultado: smoke v25 OK." -ForegroundColor Green
  exit 0
} finally {
  Pop-Location
}
