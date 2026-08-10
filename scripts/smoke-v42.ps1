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
  } catch {
    Add-Failure "No responde $BaseUrl/api/health. Detalle: $($_.Exception.Message)"
  }

  try {
    $index = Invoke-WebRequest -Uri "$BaseUrl/index.html" -UseBasicParsing -TimeoutSec 8
    foreach ($pattern in @("8790-42", "orderLabelDialog", "orderScanDialog", "Listo para Despacho")) {
      if ($index.Content -match [regex]::Escape($pattern)) {
        Add-Ok "Index contiene: $pattern"
      } else {
        Add-Failure "Index no contiene: $pattern"
      }
    }
  } catch {
    Add-Failure "No se pudo leer index.html. Detalle: $($_.Exception.Message)"
  }

  $orderEngine = Get-Content -Raw -LiteralPath "order-engine.js"
  foreach ($pattern in @(
    "LABELED",
    "READY_DISPATCH",
    "generateOrderLabel",
    "scanOrderLabel",
    "assertDispatchChecklist",
    "PEDIDO_ETIQUETA_GENERADA",
    "PEDIDO_ETIQUETA_ESCANEADA"
  )) {
    if ($orderEngine -match [regex]::Escape($pattern)) {
      Add-Ok "Order engine contiene: $pattern"
    } else {
      Add-Failure "Order engine no contiene: $pattern"
    }
  }

  $deliveryEngine = Get-Content -Raw -LiteralPath "delivery-engine.js"
  foreach ($pattern in @("STATUS.READY_DISPATCH", "assertDispatchChecklist", "debe estar Listo para Despacho")) {
    if ($deliveryEngine -match [regex]::Escape($pattern)) {
      Add-Ok "Delivery engine contiene: $pattern"
    } else {
      Add-Failure "Delivery engine no contiene: $pattern"
    }
  }

  $server = Get-Content -Raw -LiteralPath "server.js"
  foreach ($pattern in @("orderLabelMatch", "generateOrderLabel", "scanOrderLabel", "PEDIDO_ETIQUETA_GENERADA", "PEDIDO_ETIQUETA_ESCANEADA")) {
    if ($server -match [regex]::Escape($pattern)) {
      Add-Ok "Servidor contiene: $pattern"
    } else {
      Add-Failure "Servidor no contiene: $pattern"
    }
  }

  $eventEngine = Get-Content -Raw -LiteralPath "event-engine.js"
  foreach ($pattern in @("order.label.generated", "order.label.scanned", "order.label.invalidated")) {
    if ($eventEngine -match [regex]::Escape($pattern)) {
      Add-Ok "Event engine contiene: $pattern"
    } else {
      Add-Failure "Event engine no contiene: $pattern"
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

  $flowScript = @'
const path = require("path");
const root = process.cwd();
const orderEngine = require(path.join(root, "order-engine"));
const deliveryEngine = require(path.join(root, "delivery-engine"));

const state = {
  products: [
    { codigo_producto: "P-ETQ-1", name: "Producto etiqueta", descripcion: "Producto etiqueta", stock_fisico: 10, stock_actual: 10, stock: 10, stock_reservado: 0, stock_en_transito: 0, price: 1000 }
  ],
  clients: [
    { name: "Cliente Etiqueta", domicilio: "San Martin 100", localidad: "Cordoba", zona: "Centro", ruta: "Centro" }
  ],
  sellers: [],
  orders: [],
  activity: [],
  stockMovements: [],
  deliveryRoutes: [],
  deliveryAudit: [],
  deliveryClosures: [],
  accounts: []
};

let order = orderEngine.createOrder(state, {
  client: "Cliente Etiqueta",
  seller: "Sofia",
  items: [{ productCode: "P-ETQ-1", qty: 2 }]
}, "Smoke");

if (order.status !== orderEngine.STATUS.READY) throw new Error("Pedido nuevo no quedo En Preparacion.");
order = orderEngine.advanceOrder(state, order.code, "Admin");
if (order.status !== orderEngine.STATUS.ASSEMBLY) throw new Error("Pedido no avanzo a En Armado.");

let blocked = false;
try {
  deliveryEngine.createPlannedRoute(state, { orderCodes: [order.code], day: "2026-07-05", zone: "Centro", driverUser: "reparto1", driverLabel: "Reparto 1" }, { user: "Admin", role: "admin" });
} catch (error) {
  blocked = String(error.message).includes("Listo para Despacho");
}
if (!blocked) throw new Error("La ruta se pudo planificar sin etiqueta/escaneo.");

order = orderEngine.generateOrderLabel(state, order.code, { packages: 2, printer: "Smoke Printer", observations: "Control smoke" }, { user: "Deposito" }).order;
if (order.status !== orderEngine.STATUS.LABELED) throw new Error("Etiqueta no dejo el pedido en Etiquetado.");
order = orderEngine.scanOrderLabel(state, order.code, { scanValue: order.code }, { user: "Deposito" }).order;
if (order.status !== orderEngine.STATUS.READY_DISPATCH) throw new Error("Scanner no dejo el pedido Listo para Despacho.");

const route = deliveryEngine.createPlannedRoute(state, { orderCodes: [order.code], day: "2026-07-05", zone: "Centro", driverUser: "reparto1", driverLabel: "Reparto 1" }, { user: "Admin", role: "admin" });
deliveryEngine.publishRoute(state, route.id, { user: "Admin", role: "admin" });
order = state.orders.find((item) => item.code === order.code);
if (order.status !== orderEngine.STATUS.DISPATCHED) throw new Error("Publicar ruta no despacho el pedido.");
if (!order.stockSettled) throw new Error("El stock no se liquido al despachar.");
console.log("FLOW_OK");
'@
  $tmp = Join-Path $env:TEMP ("dl-v42-flow-{0}.js" -f ([guid]::NewGuid().ToString("N")))
  try {
    Set-Content -LiteralPath $tmp -Value $flowScript -Encoding UTF8
    $flowOutput = & node $tmp 2>&1
    if ($LASTEXITCODE -eq 0 -and ($flowOutput -join "`n") -match "FLOW_OK") {
      Add-Ok "Flujo en memoria OK: armado -> etiqueta -> scanner -> despacho"
    } else {
      Add-Failure "Flujo en memoria fallo: $flowOutput"
    }
  } catch {
    Add-Failure "No se pudo ejecutar flujo en memoria. Detalle: $($_.Exception.Message)"
  } finally {
    if (Test-Path -LiteralPath $tmp) { Remove-Item -LiteralPath $tmp -Force }
  }

  if ($Failures.Count -gt 0) {
    Write-Host ""
    Write-Host "Resultado: $($Failures.Count) falla(s)." -ForegroundColor Red
    exit 1
  }

  Write-Host ""
  Write-Host "Resultado: smoke v42 OK." -ForegroundColor Green
  exit 0
} finally {
  Pop-Location
}
