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
    if ($index.Content -match "8790-34") {
      Add-Ok "Index v34 servido correctamente."
    } else {
      Add-Failure "El index no contiene marca v34."
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
const AccountEngine = require("./account-engine.js");

const state = {
  products: [{ codigo_producto: "A", name: "Producto A", price: 1000, stock_fisico: 20, stock_reservado: 0, stock_disponible: 20 }],
  clients: [{ name: "Cliente Banco", balance: 0, limit: 100000, domicilio: "Colon 500", localidad: "Cordoba", latitud: -31.421, longitud: -64.181 }],
  sellers: [{ name: "Sofia Benitez", sales: 0, commission: 0 }],
  orders: [],
  accounts: [],
  activity: [],
  stockMovements: [],
  deliveryRoutes: [],
  deliveryAudit: [],
  deliveryClosures: [],
  bankReconciliation: [],
  deliverySettings: {
    bankAlias: "DISTRIBUIDORA.LOPEZ",
    bankAccountName: "Distribuidora Lopez",
    bankCbu: "0000003100010000000001",
    depotLat: -31.4167,
    depotLng: -64.1833
  }
};

const order = OrderEngine.createOrder(state, {
  client: "Cliente Banco",
  seller: "Sofia Benitez",
  items: [{ productCode: "A", qty: 2 }]
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

DeliveryEngine.collectAndDeliver(state, order.code, {
  method: "Transferencia",
  amountPaid: 2000,
  pendingAmount: 0,
  deliveredItems: [{ productCode: "A", deliveredQty: 2, returnedQty: 0 }],
  transferReceipt: {
    amount: 2000,
    bank: "Banco Test",
    alias: "DISTRIBUIDORA.LOPEZ",
    cbu: "0000003100010000000001",
    observations: "Operacion 123"
  },
  attachments: {
    transfer: { kind: "transfer", filename: "comprobante.pdf", url: "/api/uploads/comprobante.pdf", mimeType: "application/pdf" },
    signature: { kind: "signature", filename: "firma.png", url: "/api/uploads/firma.png", mimeType: "image/png" }
  }
}, {
  username: "reparto1",
  user: "Reparto 1",
  role: "driver",
  deviceId: "DEV1",
  deviceLabel: "Reparto 1",
  gps: { lat: -31.421, lng: -64.181, accuracy: 8, source: "test" }
});

AccountEngine.migrateState(state);
const transfer = state.bankReconciliation[0];
if (!transfer) throw new Error("No se genero transferencia conciliable.");
if (transfer.status !== "Pendiente") throw new Error("La transferencia no quedo Pendiente.");
if (transfer.bank !== "Banco Test") throw new Error("Banco no registrado.");
if (transfer.alias !== "DISTRIBUIDORA.LOPEZ") throw new Error("Alias no registrado.");
if (transfer.cbu !== "0000003100010000000001") throw new Error("CBU no registrado.");
if (!transfer.date || !transfer.time || transfer.amount !== 2000) throw new Error("Fecha, hora o importe incorrectos.");
if (!transfer.matchKey.includes("banco test")) throw new Error("Clave de conciliacion sin banco normalizado.");

const validated = AccountEngine.setTransferStatus(state, transfer.id, "Validada", { user: "Administracion 1" });
if (validated.status !== "Validada" || !validated.validatedAt || validated.validatedBy !== "Administracion 1") throw new Error("Validacion no registrada.");
if (state.orders[0].transferReceipts[0].status !== "Validada") throw new Error("Estado no sincronizo con comprobante del pedido.");

const rejected = AccountEngine.setTransferStatus(state, transfer.id, "Rechazada", { user: "Administracion 1", reason: "No impacto en banco" });
if (rejected.status !== "Rechazada" || rejected.statusReason !== "No impacto en banco") throw new Error("Rechazo no registrado.");

let invalidRejected = false;
try {
  AccountEngine.setTransferStatus(state, transfer.id, "Pagada", { user: "Administracion 1" });
} catch {
  invalidRejected = true;
}
if (!invalidRejected) throw new Error("Estado invalido aceptado.");

console.log("OK conciliacion bancaria v34");
'@

  try {
    $flowScript | node - | Out-Null
    if ($LASTEXITCODE -eq 0) {
      Add-Ok "Motor cuentas: transferencia conciliable y estados v34 OK."
    } else {
      Add-Failure "Prueba de conciliacion bancaria v34 fallo."
    }
  } catch {
    Add-Failure "No se pudo ejecutar prueba de conciliacion bancaria v34. Detalle: $($_.Exception.Message)"
  }

  if ($Failures.Count -gt 0) {
    Write-Host ""
    Write-Host "Resultado: $($Failures.Count) falla(s)." -ForegroundColor Red
    exit 1
  }

  Write-Host ""
  Write-Host "Resultado: smoke v34 OK." -ForegroundColor Green
  exit 0
} finally {
  Pop-Location
}
