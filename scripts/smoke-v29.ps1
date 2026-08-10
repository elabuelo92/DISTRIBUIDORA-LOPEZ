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
      Add-Ok ("Servidor activo: {0} pedidos, {1} rutas" -f $health.orders, $health.deliveryRoutes)
    } else {
      Add-Failure "El servidor respondio health pero ok=false."
    }
  } catch {
    Add-Failure "No responde $BaseUrl/api/health. Detalle: $($_.Exception.Message)"
  }

  try {
    $index = Invoke-WebRequest -Uri "$BaseUrl/index.html" -UseBasicParsing -TimeoutSec 8
    if ($index.Content -match "8790-29") {
      Add-Ok "Index v29 servido correctamente."
    } else {
      Add-Failure "El index no contiene marca v29."
    }
  } catch {
    Add-Failure "No se pudo leer index.html. Detalle: $($_.Exception.Message)"
  }

  foreach ($file in @("account-engine.js", "order-engine.js", "delivery-engine.js", "server.js", "app.js")) {
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
const OrderEngine = require("./order-engine.js");
const DeliveryEngine = require("./delivery-engine.js");

const state = {
  products: [
    { codigo_producto: "A", name: "Producto A", price: 100, stock_fisico: 1, stock_reservado: 0, stock_disponible: 1 }
  ],
  clients: [{
    name: "Cliente Test",
    balance: 0,
    limit: 100000,
    domicilio: "Av Siempre Viva 123",
    localidad: "Cordoba",
    latitud: -31.42,
    longitud: -64.18,
    forma_pago: "Cuenta corriente"
  }],
  sellers: [{ name: "Sofia Benitez", sales: 0, commission: 0 }],
  orders: [],
  accounts: [],
  activity: [],
  stockMovements: [],
  deliveryRoutes: [],
  deliveryAudit: []
};

const order = OrderEngine.createOrder(state, {
  client: "Cliente Test",
  seller: "Sofia Benitez",
  items: [{ productCode: "A", qty: 3 }]
}, "Sofia Benitez");

if (order.status !== OrderEngine.STATUS.PENDING) throw new Error("Pedido con faltante no quedo Pendiente.");
if (!order.trace[0].date || !order.trace[0].time || !order.trace[0].user) throw new Error("Traza inicial sin fecha/hora/usuario.");

OrderEngine.applyStockEntry(state, { productCode: "A", qty: 5, movementType: "Ingreso" }, "Administracion 1");
if (state.orders[0].status !== OrderEngine.STATUS.READY) throw new Error("Ingreso de stock no paso a En Preparacion.");

OrderEngine.advanceOrder(state, order.code, "Administracion 1");
if (state.orders[0].status !== OrderEngine.STATUS.ASSEMBLY) throw new Error("No paso a Armado.");

const route = DeliveryEngine.createPlannedRoute(state, {
  orderCodes: [order.code],
  day: "2026-06-30",
  zone: "Centro",
  driverUser: "reparto1",
  deviceLabel: "Reparto 1"
}, { user: "Administracion 1", role: "admin" });

DeliveryEngine.publishRoute(state, route.id, { user: "Administracion 1", role: "admin" });
if (state.orders[0].status !== OrderEngine.STATUS.DISPATCHED) throw new Error("No paso a Despachado.");

DeliveryEngine.claimRoute(state, route.id, {
  username: "reparto1",
  user: "Reparto 1",
  role: "driver",
  deviceId: "DEV1",
  deviceLabel: "Reparto 1"
});

DeliveryEngine.updateStopStatus(state, order.code, OrderEngine.STATUS.IN_ROUTE, {
  username: "reparto1",
  user: "Reparto 1",
  role: "driver",
  deviceId: "DEV1",
  deviceLabel: "Reparto 1",
  gps: { lat: -31.42, lng: -64.18, accuracy: 8, source: "test" }
});
if (state.orders[0].status !== OrderEngine.STATUS.IN_ROUTE) throw new Error("No paso a En Reparto.");

DeliveryEngine.collectAndDeliver(state, order.code, {
  method: "Efectivo",
  amountPaid: 300,
  pendingAmount: 0,
  deliveredItems: [{ productCode: "A", deliveredQty: 3 }]
}, {
  username: "reparto1",
  user: "Reparto 1",
  role: "driver",
  deviceId: "DEV1",
  deviceLabel: "Reparto 1",
  gps: { lat: -31.421, lng: -64.181, accuracy: 8, source: "test" }
});
if (state.orders[0].status !== OrderEngine.STATUS.COLLECTED) throw new Error("Pago completo no paso a Cobrado.");
if (!state.orders[0].trace.some((entry) => entry.status === OrderEngine.STATUS.DELIVERED)) throw new Error("No registro Entregado en la traza.");
if (!state.orders[0].trace.some((entry) => entry.status === OrderEngine.STATUS.COLLECTED && entry.gps && entry.date && entry.time && entry.user)) {
  throw new Error("Cobrado sin GPS/fecha/hora/usuario.");
}

OrderEngine.advanceOrder(state, order.code, "Administracion 1");
if (state.orders[0].status !== OrderEngine.STATUS.CLOSED) throw new Error("No paso a Cerrado.");

console.log("OK flujo v29");
'@

  try {
    $flowScript | node - | Out-Null
    if ($LASTEXITCODE -eq 0) {
      Add-Ok "Motor pedidos/reparto: flujo v29 OK."
    } else {
      Add-Failure "Prueba de flujo v29 fallo."
    }
  } catch {
    Add-Failure "No se pudo ejecutar prueba de flujo v29. Detalle: $($_.Exception.Message)"
  }

  if ($Failures.Count -gt 0) {
    Write-Host ""
    Write-Host "Resultado: $($Failures.Count) falla(s)." -ForegroundColor Red
    exit 1
  }

  Write-Host ""
  Write-Host "Resultado: smoke v29 OK." -ForegroundColor Green
  exit 0
} finally {
  Pop-Location
}
