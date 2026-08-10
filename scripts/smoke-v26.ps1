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
    if ($index.Content -match "8790-26" -and $index.Content -match "account-engine.js") {
      Add-Ok "Index v26 servido correctamente."
    } else {
      Add-Failure "El index no contiene marca v26 o account-engine.js."
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

  $creditScript = @'
const OrderEngine = require("./order-engine.js");
const AccountEngine = require("./account-engine.js");
const state = {
  clients: [{ name: "Cliente Credito", balance: 900, limit: 1000, forma_pago: "Cuenta corriente", status: "Activo", dias_credito: 7 }],
  sellers: [{ name: "Vendedor Test", sales: 0 }],
  products: [{ codigo_producto: "CR1", name: "Producto Credito", stock: 10, stock_reservado: 0, price: 200 }],
  orders: [],
  accounts: [],
  activity: [],
  stockMovements: []
};
OrderEngine.migrateState(state);
AccountEngine.migrateState(state);
const quote = OrderEngine.quoteOrder(state, { items: [{ productCode: "CR1", qty: 1 }] });
const credit = AccountEngine.accountSummary(state, "Cliente Credito", quote.amount);
if (!credit.requiresAuthorization) throw new Error("La cuenta sobre limite no pidio autorizacion.");
if (AccountEngine.canAuthorize({ role: "seller" })) throw new Error("El vendedor no debe autorizar credito.");
if (!AccountEngine.canAuthorize({ role: "admin" })) throw new Error("El admin debe poder autorizar credito.");
console.log("OK credit");
'@

  try {
    $creditScript | node - | Out-Null
    if ($LASTEXITCODE -eq 0) {
      Add-Ok "Motor cuentas corrientes: validacion y autorizacion OK."
    } else {
      Add-Failure "Prueba de cuentas corrientes fallo."
    }
  } catch {
    Add-Failure "No se pudo ejecutar prueba de cuentas corrientes. Detalle: $($_.Exception.Message)"
  }

  if ($Failures.Count -gt 0) {
    Write-Host ""
    Write-Host "Resultado: $($Failures.Count) falla(s)." -ForegroundColor Red
    exit 1
  }

  Write-Host ""
  Write-Host "Resultado: smoke v26 OK." -ForegroundColor Green
  exit 0
} finally {
  Pop-Location
}
