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
    if ($index.Content -match "8790-33") {
      Add-Ok "Index v33 servido correctamente."
    } else {
      Add-Failure "El index no contiene marca v33."
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
    { codigo_producto: "A", name: "Producto A", price: 100, stock_fisico: 20, stock_reservado: 0, stock_disponible: 20 },
    { codigo_producto: "B", name: "Producto B", price: 500, stock_fisico: 20, stock_reservado: 0, stock_disponible: 20 }
  ],
  clients: [
    { name: "Cliente Test 1", balance: 0, limit: 100000, domicilio: "Av Siempre Viva 123", localidad: "Cordoba", latitud: -31.42, longitud: -64.18 },
    { name: "Cliente Test 2", balance: 0, limit: 100000, domicilio: "Colon 500", localidad: "Cordoba", latitud: -31.421, longitud: -64.181 }
  ],
  sellers: [{ name: "Sofia Benitez", sales: 0, commission: 0 }],
  orders: [],
  accounts: [],
  activity: [],
  stockMovements: [],
  deliveryRoutes: [],
  deliveryAudit: [],
  deliveryClosures: [],
  deliverySettings: {
    bankAlias: "DISTRIBUIDORA.LOPEZ",
    bankAccountName: "Distribuidora Lopez",
    bankCbu: "0000003100010000000001",
    depotLat: -31.4167,
    depotLng: -64.1833
  }
};

const order1 = OrderEngine.createOrder(state, {
  client: "Cliente Test 1",
  seller: "Sofia Benitez",
  items: [{ productCode: "A", qty: 5 }]
}, "Sofia Benitez");
const order2 = OrderEngine.createOrder(state, {
  client: "Cliente Test 2",
  seller: "Sofia Benitez",
  items: [{ productCode: "B", qty: 1 }]
}, "Sofia Benitez");

OrderEngine.advanceOrder(state, order1.code, "Administracion 1");
OrderEngine.advanceOrder(state, order2.code, "Administracion 1");

const route = DeliveryEngine.createPlannedRoute(state, {
  orderCodes: [order1.code, order2.code],
  day: "2026-07-04",
  zone: "Centro",
  driverUser: "reparto1",
  deviceLabel: "Reparto 1"
}, { user: "Administracion 1", role: "admin" });

DeliveryEngine.publishRoute(state, route.id, { user: "Administracion 1", role: "admin" });
DeliveryEngine.claimRoute(state, route.id, {
  username: "reparto1",
  user: "Reparto 1",
  role: "driver",
  deviceId: "DEV1",
  deviceLabel: "Reparto 1"
});
DeliveryEngine.updateStopStatus(state, order1.code, OrderEngine.STATUS.IN_ROUTE, {
  username: "reparto1",
  user: "Reparto 1",
  role: "driver",
  deviceId: "DEV1",
  deviceLabel: "Reparto 1",
  gps: { lat: -31.42, lng: -64.18, accuracy: 8, source: "test" }
});

DeliveryEngine.collectAndDeliver(state, order1.code, {
  method: "Efectivo",
  amountPaid: 300,
  pendingAmount: 0,
  deliveredItems: [{ productCode: "A", deliveredQty: 3, returnedQty: 2 }],
  returnReason: "Cliente rechazo 2 unidades",
  observations: "Entrega parcial de ruta",
  attachments: {
    delivery: { kind: "delivery", filename: "foto.jpg", url: "/api/uploads/foto.jpg", mimeType: "image/jpeg" }
  }
}, {
  username: "reparto1",
  user: "Reparto 1",
  role: "driver",
  deviceId: "DEV1",
  deviceLabel: "Reparto 1",
  gps: { lat: -31.421, lng: -64.181, accuracy: 8, source: "test" }
});

const close = DeliveryEngine.closeRoute(state, route.id, {
  reportedCash: 280,
  reportedTransfer: 0,
  observations: "Faltan 20 pesos en rendicion."
}, {
  username: "reparto1",
  user: "Reparto 1",
  role: "driver",
  deviceId: "DEV1",
  deviceLabel: "Reparto 1",
  gps: { lat: -31.422, lng: -64.182, accuracy: 8, source: "test" }
});

if (close.closure.deliveredOrders !== 1) throw new Error("Cierre no conto entregados.");
if (close.closure.pendingOrders !== 1) throw new Error("Cierre no conto pendientes.");
if (close.closure.returnedOrders !== 1 || close.closure.returnedAmount !== 200) throw new Error("Cierre no conto devoluciones.");
if (close.closure.expectedCash !== 300 || close.closure.reportedCash !== 280) throw new Error("Cierre no guardo efectivo.");
if (close.closure.cashDifference !== -20 || close.closure.totalDifference !== -20) throw new Error("Diferencia negativa incorrecta.");
if (state.deliveryClosures.length !== 1) throw new Error("Cierre no quedo en resumen administrativo.");
if (state.deliveryRoutes[0].status !== DeliveryEngine.ROUTE_STATUS.COMPLETED) throw new Error("Ruta no quedo completada.");
if (state.deliveryAudit[0].action !== "CIERRE_DIARIO_REPARTO") throw new Error("Auditoria no registro cierre.");

console.log("OK cierre diario reparto v33");
'@

  try {
    $flowScript | node - | Out-Null
    if ($LASTEXITCODE -eq 0) {
      Add-Ok "Motor reparto: cierre diario, diferencias y resumen administrativo v33 OK."
    } else {
      Add-Failure "Prueba de cierre diario v33 fallo."
    }
  } catch {
    Add-Failure "No se pudo ejecutar prueba de cierre diario v33. Detalle: $($_.Exception.Message)"
  }

  if ($Failures.Count -gt 0) {
    Write-Host ""
    Write-Host "Resultado: $($Failures.Count) falla(s)." -ForegroundColor Red
    exit 1
  }

  Write-Host ""
  Write-Host "Resultado: smoke v33 OK." -ForegroundColor Green
  exit 0
} finally {
  Pop-Location
}
