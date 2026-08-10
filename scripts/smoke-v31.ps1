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
    if ($index.Content -match "8790-31") {
      Add-Ok "Index v31 servido correctamente."
    } else {
      Add-Failure "El index no contiene marca v31."
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

  $editScript = @'
const OrderEngine = require("./order-engine.js");

const state = {
  products: [
    { codigo_producto: "A", name: "Producto A", price: 100, stock_fisico: 10, stock_reservado: 0, stock_disponible: 10 },
    { codigo_producto: "B", name: "Producto B", price: 250, stock_fisico: 10, stock_reservado: 0, stock_disponible: 10 }
  ],
  clients: [{ name: "Cliente Test", balance: 1000, saldo_actual: 1000, saldo_inicial: 1000 }],
  sellers: [{ name: "Sofia Benitez", sales: 0, commission: 0 }],
  orders: [],
  accounts: [],
  activity: []
};

const fresh = OrderEngine.createOrder(state, {
  client: "Cliente Test",
  seller: "Sofia Benitez",
  items: [{ productCode: "A", qty: 1 }]
}, "Sofia Benitez");

OrderEngine.editOrder(state, fresh.code, {
  items: [{ productCode: "B", qty: 2 }],
  observations: "Cambio producto",
  motive: "Cliente cambio pedido"
}, {
  user: "Administracion 1",
  username: "admin1",
  role: "admin",
  ip: "127.0.0.1"
});

const editedFresh = state.orders.find((order) => order.code === fresh.code);
if (editedFresh.amount !== 500) throw new Error("Pedido con reservas no recalculo importe.");
if (!editedFresh.editHistory?.[0]?.date || !editedFresh.editHistory[0].time || editedFresh.editHistory[0].ip !== "127.0.0.1") {
  throw new Error("Auditoria de pedido con reservas incompleta.");
}

state.orders.push({
  code: "PED-LEG",
  client: "Cliente Test",
  seller: "Sofia Benitez",
  products: "Producto A x1",
  amount: 100,
  status: OrderEngine.STATUS.READY,
  inventoryMode: "legacy-deducted",
  stockSettled: true,
  accountPosted: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  items: [{ productCode: "A", name: "Producto A", requestedQty: 1, reservedQty: 0, missingQty: 0, unitPrice: 100, lineTotal: 100 }]
});

OrderEngine.editOrder(state, "PED-LEG", {
  items: [{ productCode: "B", qty: 3 }],
  observations: "Ajuste historico",
  motive: "Correccion del pedido"
}, {
  user: "Administracion 1",
  username: "admin1",
  role: "admin",
  ip: "192.168.0.10"
});

const legacy = state.orders.find((order) => order.code === "PED-LEG");
if (legacy.amount !== 750) throw new Error("Pedido historico no recalculo importe.");
if (legacy.status !== OrderEngine.STATUS.READY) throw new Error("Pedido historico cambio estado indebidamente.");
if (legacy.items.some((item) => item.reservedQty !== 0 || item.missingQty !== 0)) throw new Error("Pedido historico toco reservas.");
if (state.clients[0].balance !== 1650) throw new Error("Saldo cliente no ajusto delta historico.");
if (!state.orderAudit?.some((entry) => entry.orderCode === "PED-LEG" && entry.ip === "192.168.0.10" && entry.date && entry.time)) {
  throw new Error("Auditoria global no guardo fecha/hora/IP.");
}

console.log("OK edicion pedidos v31");
'@

  try {
    $editScript | node - | Out-Null
    if ($LASTEXITCODE -eq 0) {
      Add-Ok "Motor pedidos: edicion administrativa v31 OK."
    } else {
      Add-Failure "Prueba de edicion v31 fallo."
    }
  } catch {
    Add-Failure "No se pudo ejecutar prueba de edicion v31. Detalle: $($_.Exception.Message)"
  }

  if ($Failures.Count -gt 0) {
    Write-Host ""
    Write-Host "Resultado: $($Failures.Count) falla(s)." -ForegroundColor Red
    exit 1
  }

  Write-Host ""
  Write-Host "Resultado: smoke v31 OK." -ForegroundColor Green
  exit 0
} finally {
  Pop-Location
}
