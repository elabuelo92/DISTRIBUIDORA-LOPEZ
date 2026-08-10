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
    if ($index.Content -match "8790-28") {
      Add-Ok "Index v28 servido correctamente."
    } else {
      Add-Failure "El index no contiene marca v28."
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

  $adminEditScript = @'
const OrderEngine = require("./order-engine.js");

const state = {
  inventoryMode: "reservation",
  products: [
    {
      codigo_producto: "A",
      name: "Producto A",
      price: 100,
      precio_lista_1: 100,
      stock_fisico: 10,
      stock_reservado: 2,
      stock_disponible: 8
    },
    {
      codigo_producto: "B",
      name: "Producto B",
      price: 50,
      precio_lista_1: 50,
      stock_fisico: 5,
      stock_reservado: 0,
      stock_disponible: 5
    }
  ],
  sellers: [{ name: "Sofia Benitez", sales: 200, commission: 6 }],
  orders: [{
    code: "PED-EDIT",
    client: "Cliente Test",
    seller: "Sofia Benitez",
    status: OrderEngine.STATUS.READY,
    inventoryMode: "reservation",
    amount: 200,
    products: "Producto A x2",
    observations: "Original",
    items: [
      { productCode: "A", name: "Producto A", requestedQty: 2, reservedQty: 2, missingQty: 0, unitPrice: 100, lineTotal: 200 }
    ],
    trace: []
  }],
  shortages: [],
  activity: []
};

const result = OrderEngine.editOrder(state, "PED-EDIT", {
  motive: "Cliente cambio cantidades",
  observations: "Cambio validado por administracion",
  items: [
    { productCode: "A", qty: 1 },
    { productCode: "B", qty: 2 }
  ]
}, {
  user: "Administracion 1",
  username: "admin1",
  role: "admin",
  ip: "127.0.0.1"
});

const order = result.order;
if (order.amount !== 200) throw new Error("Importe recalculado incorrecto.");
if (order.items.length !== 2) throw new Error("No quedaron dos productos.");
if (order.items[0].requestedQty !== 1 || order.items[1].requestedQty !== 2) throw new Error("Cantidades editadas incorrectas.");
if (state.products[0].stock_reservado !== 1) throw new Error("Reserva Producto A incorrecta.");
if (state.products[1].stock_reservado !== 2) throw new Error("Reserva Producto B incorrecta.");
if (!Array.isArray(order.editHistory) || order.editHistory.length !== 1) throw new Error("No se guardo auditoria.");
if (order.editHistory[0].ip !== "127.0.0.1") throw new Error("No se guardo IP.");
if (order.editHistory[0].motive !== "Cliente cambio cantidades") throw new Error("No se guardo motivo.");
if (!order.editHistory[0].before || !order.editHistory[0].after) throw new Error("Auditoria sin antes/despues.");
if (!String(order.observations).includes("Cambio validado")) throw new Error("Observaciones no actualizadas.");
if (!state.activity.some((item) => item.type === "Auditoria")) throw new Error("Actividad de auditoria ausente.");

state.orders[0].status = OrderEngine.STATUS.DELIVERED;
let blocked = false;
try {
  OrderEngine.editOrder(state, "PED-EDIT", {
    motive: "Intento no permitido",
    items: [{ productCode: "A", qty: 1 }]
  }, { user: "Administracion 1", role: "admin" });
} catch (error) {
  blocked = /antes del despacho/.test(error.message);
}
if (!blocked) throw new Error("No bloqueo edicion de pedido entregado.");

console.log("OK admin edit");
'@

  try {
    $adminEditScript | node - | Out-Null
    if ($LASTEXITCODE -eq 0) {
      Add-Ok "Motor pedidos: edicion administrativa auditada OK."
    } else {
      Add-Failure "Prueba de edicion administrativa fallo."
    }
  } catch {
    Add-Failure "No se pudo ejecutar prueba de edicion administrativa. Detalle: $($_.Exception.Message)"
  }

  if ($Failures.Count -gt 0) {
    Write-Host ""
    Write-Host "Resultado: $($Failures.Count) falla(s)." -ForegroundColor Red
    exit 1
  }

  Write-Host ""
  Write-Host "Resultado: smoke v28 OK." -ForegroundColor Green
  exit 0
} finally {
  Pop-Location
}
