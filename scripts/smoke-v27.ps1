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
    if ($index.Content -match "8790-27") {
      Add-Ok "Index v27 servido correctamente."
    } else {
      Add-Failure "El index no contiene marca v27."
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

  $partialScript = @'
const DeliveryEngine = require("./delivery-engine.js");
const OrderEngine = require("./order-engine.js");
const state = {
  clients: [{ name: "Cliente Parcial", balance: 0, limit: 5000, forma_pago: "Cuenta corriente" }],
  orders: [{
    code: "PED-PARCIAL",
    client: "Cliente Parcial",
    seller: "Vendedor Test",
    amount: 300,
    status: OrderEngine.STATUS.CHECKED,
    items: [
      { productCode: "A", name: "Producto A", requestedQty: 2, reservedQty: 2, missingQty: 0, unitPrice: 100, lineTotal: 200 },
      { productCode: "B", name: "Producto B", requestedQty: 1, reservedQty: 1, missingQty: 0, unitPrice: 100, lineTotal: 100 }
    ],
    trace: []
  }],
  accounts: [],
  activity: [],
  deliveryAudit: [],
  deliverySettings: { bankAlias: "DISTRIBUIDORA.LOPEZ", depotLat: -31.4, depotLng: -64.18 },
  deliveryRoutes: [{
    id: "RUTA-TEST",
    day: "2026-06-29",
    zone: "Test",
    status: "En curso",
    deviceId: "DEV1",
    deviceLabel: "Reparto Test",
    driverUser: "",
    cashTotal: 0,
    transferTotal: 0,
    pendingTotal: 0,
    stops: [{ orderCode: "PED-PARCIAL", client: "Cliente Parcial", status: OrderEngine.STATUS.CHECKED, sequence: 1, amount: 300 }]
  }]
};
const result = DeliveryEngine.collectAndDeliver(state, "PED-PARCIAL", {
  method: "Efectivo",
  amountPaid: 100,
  pendingAmount: 200,
  deliveredItems: [
    { productCode: "A", deliveredQty: 1 },
    { productCode: "B", deliveredQty: 0 }
  ],
  attachments: {}
}, {
  user: "Reparto Test",
  username: "reparto1",
  role: "driver",
  deviceId: "DEV1",
  deviceLabel: "Reparto Test",
  gps: { lat: -31.4, lng: -64.18, accuracy: 5, source: "test" }
});
const order = state.orders[0];
if (order.status !== OrderEngine.STATUS.PARTIAL_DELIVERED) throw new Error("El pedido no quedo parcialmente entregado.");
if (state.clients[0].balance !== 200) throw new Error("El saldo pendiente no impacto cuenta corriente.");
if (order.items[0].deliveredQty !== 1 || order.items[0].pendingDeliveryQty !== 1) throw new Error("Producto A no registro entregado/pendiente.");
if (order.items[1].deliveredQty !== 0 || order.items[1].pendingDeliveryQty !== 1) throw new Error("Producto B no registro pendiente.");
if (result.stop.status !== OrderEngine.STATUS.PARTIAL_DELIVERED) throw new Error("La parada no quedo parcial.");
console.log("OK partial delivery");
'@

  try {
    $partialScript | node - | Out-Null
    if ($LASTEXITCODE -eq 0) {
      Add-Ok "Motor reparto: entrega y pago parcial OK."
    } else {
      Add-Failure "Prueba de entrega parcial fallo."
    }
  } catch {
    Add-Failure "No se pudo ejecutar prueba de entrega parcial. Detalle: $($_.Exception.Message)"
  }

  if ($Failures.Count -gt 0) {
    Write-Host ""
    Write-Host "Resultado: $($Failures.Count) falla(s)." -ForegroundColor Red
    exit 1
  }

  Write-Host ""
  Write-Host "Resultado: smoke v27 OK." -ForegroundColor Green
  exit 0
} finally {
  Pop-Location
}
