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
    if ($index.Content -match "8790-30") {
      Add-Ok "Index v30 servido correctamente."
    } else {
      Add-Failure "El index no contiene marca v30."
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

  try {
    $loginBody = @{
      username = "admin1"
      password = "Lopez2026!"
      device = @{
        id = "SMOKE-V30"
        label = "Smoke v30"
        model = "PowerShell"
        os = "Windows"
        appVersion = "v30"
      }
    } | ConvertTo-Json -Depth 6
    $login = Invoke-WebRequest -Uri "$BaseUrl/api/login" -Method POST -UseBasicParsing -ContentType "application/json" -Body $loginBody -SessionVariable smokeSession -TimeoutSec 8
    $loginPayload = $login.Content | ConvertFrom-Json
    if (-not $loginPayload.ok) {
      Add-Failure "Login smoke no devolvio ok=true."
    } else {
      $pdfBytes = [System.Text.Encoding]::ASCII.GetBytes("%PDF-1.4`n% smoke-v30`n")
      $uploadBody = @{
        orderCode = "SMOKE-V30"
        kind = "transfer"
        dataUrl = "data:application/pdf;base64,$([Convert]::ToBase64String($pdfBytes))"
      } | ConvertTo-Json -Depth 4
      $upload = Invoke-RestMethod -Uri "$BaseUrl/api/delivery/upload" -Method POST -ContentType "application/json" -Body $uploadBody -WebSession $smokeSession -TimeoutSec 8
      if ($upload.ok -and $upload.upload.mimeType -eq "application/pdf") {
        Add-Ok "API upload PDF OK."
      } else {
        Add-Failure "API upload PDF no devolvio mimeType application/pdf."
      }
    }
  } catch {
    Add-Failure "API upload PDF fallo. Detalle: $($_.Exception.Message)"
  }

  $flowScript = @'
const OrderEngine = require("./order-engine.js");
const DeliveryEngine = require("./delivery-engine.js");

function baseState() {
  return {
    products: [
      { codigo_producto: "A", name: "Producto A", price: 100, stock_fisico: 10, stock_reservado: 0, stock_disponible: 10 }
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
    deliveryAudit: [],
    deliverySettings: {
      bankAlias: "DISTRIBUIDORA.LOPEZ",
      bankAccountName: "Distribuidora Lopez",
      bankCbu: "0000003100010000000001",
      depotLat: -31.4167,
      depotLng: -64.1833
    }
  };
}

function prepareTransferOrder(state, suffix) {
  const order = OrderEngine.createOrder(state, {
    client: "Cliente Test",
    seller: "Sofia Benitez",
    items: [{ productCode: "A", qty: 2 }]
  }, "Sofia Benitez");
  OrderEngine.advanceOrder(state, order.code, "Administracion 1");
  const route = DeliveryEngine.createPlannedRoute(state, {
    orderCodes: [order.code],
    day: "2026-07-01",
    zone: `Centro ${suffix}`,
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
  return order;
}

const context = {
  username: "reparto1",
  user: "Reparto 1",
  role: "driver",
  deviceId: "DEV1",
  deviceLabel: "Reparto 1",
  gps: { lat: -31.421, lng: -64.181, accuracy: 8, source: "test" }
};

const stateWithoutReceipt = baseState();
const missingOrder = prepareTransferOrder(stateWithoutReceipt, "A");
let rejected = false;
try {
  DeliveryEngine.collectAndDeliver(stateWithoutReceipt, missingOrder.code, {
    method: "Transferencia",
    amountPaid: 200,
    pendingAmount: 0,
    deliveredItems: [{ productCode: "A", deliveredQty: 2 }],
    transferReceipt: {
      bank: "Banco Test",
      alias: "DISTRIBUIDORA.LOPEZ",
      cbu: "0000003100010000000001"
    },
    attachments: {}
  }, context);
} catch (error) {
  rejected = /comprobante/i.test(error.message);
}
if (!rejected) throw new Error("Transferencia sin comprobante no fue rechazada.");

const stateWithReceipt = baseState();
const paidOrder = prepareTransferOrder(stateWithReceipt, "B");
DeliveryEngine.collectAndDeliver(stateWithReceipt, paidOrder.code, {
  method: "Transferencia",
  amountPaid: 200,
  pendingAmount: 0,
  deliveredItems: [{ productCode: "A", deliveredQty: 2 }],
  transferReceipt: {
    amount: 200,
    bank: "Banco Test",
    alias: "DISTRIBUIDORA.LOPEZ",
    cbu: "0000003100010000000001",
    observations: "Operacion 123",
    attachment: {
      kind: "transfer",
      filename: "transfer-test.pdf",
      url: "/api/uploads/transfer-test.pdf",
      mimeType: "application/pdf"
    }
  },
  attachments: {
    transfer: {
      kind: "transfer",
      filename: "transfer-test.pdf",
      url: "/api/uploads/transfer-test.pdf",
      mimeType: "application/pdf"
    }
  }
}, context);

const saved = stateWithReceipt.orders[0].transferReceipts && stateWithReceipt.orders[0].transferReceipts[0];
if (!saved) throw new Error("No se guardo comprobante en el pedido.");
if (!saved.date || !saved.time || saved.amount !== 200 || saved.bank !== "Banco Test") {
  throw new Error("Comprobante guardado incompleto.");
}
if (stateWithReceipt.orders[0].status !== OrderEngine.STATUS.COLLECTED) {
  throw new Error("Transferencia con comprobante no paso a Cobrado.");
}

console.log("OK comprobantes v30");
'@

  try {
    $flowScript | node - | Out-Null
    if ($LASTEXITCODE -eq 0) {
      Add-Ok "Motor reparto: comprobante obligatorio v30 OK."
    } else {
      Add-Failure "Prueba de comprobantes v30 fallo."
    }
  } catch {
    Add-Failure "No se pudo ejecutar prueba de comprobantes v30. Detalle: $($_.Exception.Message)"
  }

  if ($Failures.Count -gt 0) {
    Write-Host ""
    Write-Host "Resultado: $($Failures.Count) falla(s)." -ForegroundColor Red
    exit 1
  }

  Write-Host ""
  Write-Host "Resultado: smoke v30 OK." -ForegroundColor Green
  exit 0
} finally {
  Pop-Location
}
