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
    if ($index.Content -match "8790-32") {
      Add-Ok "Index v32 servido correctamente."
    } else {
      Add-Failure "El index no contiene marca v32."
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
  products: [{ codigo_producto: "A", name: "Producto A", price: 100, stock_fisico: 10, stock_reservado: 0, stock_disponible: 10 }],
  clients: [{ name: "Cliente Test", balance: 0, limit: 100000, domicilio: "Av Siempre Viva 123", localidad: "Cordoba", latitud: -31.42, longitud: -64.18 }],
  sellers: [{ name: "Sofia Benitez", sales: 0, commission: 0 }],
  orders: [],
  accounts: [],
  activity: [],
  stockMovements: [],
  deliveryRoutes: [],
  deliveryAudit: [],
  deliverySettings: {
    bankAlias: "DISTRIBUIDORA.LOPEZ",
    bankAccountName: "Distribuidora Lopez",
    bankCbu: "0000003100010000000001",
    depotLat: -31.4167,
    depotLng: -64.1833
  }
};

const order = OrderEngine.createOrder(state, {
  client: "Cliente Test",
  seller: "Sofia Benitez",
  items: [{ productCode: "A", qty: 5 }]
}, "Sofia Benitez");

OrderEngine.advanceOrder(state, order.code, "Administracion 1");
const route = DeliveryEngine.createPlannedRoute(state, {
  orderCodes: [order.code],
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
DeliveryEngine.updateStopStatus(state, order.code, OrderEngine.STATUS.IN_ROUTE, {
  username: "reparto1",
  user: "Reparto 1",
  role: "driver",
  deviceId: "DEV1",
  deviceLabel: "Reparto 1",
  gps: { lat: -31.42, lng: -64.18, accuracy: 8, source: "test" }
});

const result = DeliveryEngine.collectAndDeliver(state, order.code, {
  method: "Efectivo",
  amountPaid: 300,
  pendingAmount: 0,
  deliveredItems: [{ productCode: "A", deliveredQty: 3, returnedQty: 2 }],
  returnReason: "Cliente rechazo 2 unidades",
  observations: "Se deja constancia con foto",
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

const saved = state.orders[0];
if (saved.status !== OrderEngine.STATUS.COLLECTED) throw new Error("No quedo cobrado.");
if (saved.deliverySummary.returnedQty !== 2 || saved.deliverySummary.returnedAmount !== 200) throw new Error("Resumen de devolucion incorrecto.");
if (saved.collection.collectibleAmount !== 300 || saved.collection.amountPaid !== 300) throw new Error("Total cobrable incorrecto.");
if (saved.collection.observations !== "Se deja constancia con foto") throw new Error("Observaciones no guardadas.");
if (state.deliveryRoutes[0].returnTotal !== 200) throw new Error("Ruta no acumulo devolucion.");
if (!state.deliveryAudit[0].note.includes("Devolucion 2")) throw new Error("Auditoria sin devolucion.");
if (result.nextStop !== null) throw new Error("Ruta no cerro.");

console.log("OK reparto devolucion v32");
'@

  try {
    $flowScript | node - | Out-Null
    if ($LASTEXITCODE -eq 0) {
      Add-Ok "Motor reparto: entrega, efectivo, devolucion y observaciones v32 OK."
    } else {
      Add-Failure "Prueba de reparto v32 fallo."
    }
  } catch {
    Add-Failure "No se pudo ejecutar prueba de reparto v32. Detalle: $($_.Exception.Message)"
  }

  if ($Failures.Count -gt 0) {
    Write-Host ""
    Write-Host "Resultado: $($Failures.Count) falla(s)." -ForegroundColor Red
    exit 1
  }

  Write-Host ""
  Write-Host "Resultado: smoke v32 OK." -ForegroundColor Green
  exit 0
} finally {
  Pop-Location
}
