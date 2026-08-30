"use strict";

const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawn } = require("node:child_process");

const root = path.join(__dirname, "..");
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "dl-v119-"));
const port = 20750 + Math.floor(Math.random() * 150);
const stateFile = path.join(tempDir, "demo-state.json");
const usersFile = path.join(tempDir, "users.json");
fs.copyFileSync(path.join(root, "data", "users.json"), usersFile);
const usersPayload = JSON.parse(fs.readFileSync(usersFile, "utf8"));
usersPayload.users.filter((user) => ["admin1", "sofia"].includes(user.username)).forEach((user) => {
  const salt = crypto.randomBytes(16).toString("hex");
  user.salt = salt;
  user.passwordHash = crypto.pbkdf2Sync("Lopez2026!", salt, 120000, 32, "sha256").toString("hex");
  user.active = true;
});
fs.writeFileSync(usersFile, JSON.stringify(usersPayload, null, 2), "utf8");

const state = {
  products: [{
    codigo_producto: "P-PAPA", name: "PAPAS FILLS 90GR - BATATA", proveedor: "", supplier: "",
    costo: 1103, cost: 1103, price: 1432, precio_lista_2: 1432, stock: 100, stock_fisico: 100, stock_actual: 100
  }],
  clients: [{ codigo_cliente: "C-1", name: "Cliente v119", nombre_comercial: "Cliente v119", vendedor_asignado: "Sofia Benitez", seller: "Sofia Benitez", limit: 1000000, limite_credito: 1000000, status: "Activo" }],
  sellers: [{ name: "Sofia Benitez", username: "sofia" }],
  suppliers: [
    { name: "Fills S.A.S.", razon_social: "Fills S.A.S.", nombre_comercial: "Fills", balance: 0, movements: [] },
    { name: "Duplicado limpio", razon_social: "Duplicado limpio", balance: 0, movements: [] }
  ],
  supplierMovements: [{
    id: "REM-V119", type: "Remito", supplier: "Fills S.A.S.", remitNumber: "R-119", amount: 1200,
    products: [{ productCode: "P-PAPA", name: "PAPAS FILLS 90GR - BATATA", qty: 1, stockQty: 1, unitPrice: 1200 }]
  }],
  orders: [], accounts: [], activity: [], stockMovements: [], priceLists: [], priceListAudit: [], notifications: [], globalAudit: []
};
fs.writeFileSync(stateFile, JSON.stringify({ version: Date.now(), state }), "utf8");

const child = spawn(process.execPath, [path.join(root, "server.js")], {
  cwd: root,
  env: {
    ...process.env,
    DL_HOST: "127.0.0.1", DL_PORT: String(port), PORT: String(port), DATA_DIR: tempDir,
    STATE_FILE: stateFile, USERS_FILE: usersFile, DL_VERSION: "8790-119",
    DL_DEFAULT_PASSWORD: "Lopez2026!", DL_LICENSE_ENFORCEMENT: "disabled", DL_INTEGRITY_ENFORCE: "warn"
  },
  stdio: ["ignore", "pipe", "pipe"]
});
let serverOutput = "";
let serverExit = "running";
child.stdout.on("data", (chunk) => { serverOutput += chunk.toString(); });
child.stderr.on("data", (chunk) => { serverOutput += chunk.toString(); });
child.on("exit", (code, signal) => { serverExit = `exit=${code} signal=${signal || "none"}`; });
const base = `http://127.0.0.1:${port}`;

async function waitHealth() {
  for (let index = 0; index < 100; index += 1) {
    try {
      const response = await fetch(`${base}/api/health`);
      if (response.ok) return response.json();
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`Servidor v119 no inicio (${serverExit}). ${serverOutput}`);
}

async function login(username) {
  const input = { username, password: "Lopez2026!", device: { id: `SMOKE-${username}`, label: "Smoke v119", model: "Node", os: process.platform, appVersion: "8790-119" } };
  let response = await fetch(`${base}/api/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
  if (response.status === 428) {
    const required = await response.json();
    input.legalAcceptance = { accepted: true, version: required.legal.currentVersion, hash: required.legal.hash };
    response = await fetch(`${base}/api/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
  }
  assert.equal(response.status, 200);
  return String(response.headers.get("set-cookie") || "").split(";")[0];
}

async function request(cookie, endpoint, body, expected = 200) {
  const response = await fetch(`${base}/${endpoint}`, {
    method: "POST", headers: { Cookie: cookie, "Content-Type": "application/json" }, body: JSON.stringify(body || {})
  });
  const payload = JSON.parse(await response.text() || "{}");
  assert.equal(response.status, expected, payload.error || endpoint);
  return payload;
}

(async () => {
  const health = await waitHealth();
  assert.equal(health.version, "8790-119");
  const adminCookie = await login("admin1");
  const sellerCookie = await login("sofia");

  const pinResult = await request(adminCookie, "api/admin/users/operation-pin", {
    username: "sofia", adminPassword: "Lopez2026!", motive: "Smoke v119"
  });
  assert.match(pinResult.pin, /^\d{4}$/);

  const clientResult = await request(sellerCookie, "api/clients/mobile", {
    operationId: "CLIENT-V119-PIN-0001", codigo_cliente: "C-PIN-119", nombre_comercial: "Cliente PIN v119",
    consumidor_final: true, telefono: "3510000119", domicilio: "Calle 119", localidad: "Cordoba", forma_pago: "Contado",
    limite_credito: 0, zona: "Centro", ruta: "Centro", dia_visita: "Lunes", operationPin: pinResult.pin,
    gps: { lat: -31.4167, lng: -64.1833, accuracy: 8, source: "gps" }
  });
  assert.equal(clientResult.idempotentReplay, false);

  const orderInput = {
    operationId: "ORDER-V119-IDEMP-0001", client: "Cliente v119", seller: "Sofia Benitez", source: "mobile", origin: "preventa",
    items: [{ productCode: "P-PAPA", name: "PAPAS FILLS 90GR - BATATA", qty: 2 }], paymentMethod: "Contado"
  };
  const firstOrder = await request(sellerCookie, "api/orders", orderInput);
  const replayOrder = await request(sellerCookie, "api/orders", orderInput);
  assert.equal(replayOrder.idempotentReplay, true);
  assert.equal(replayOrder.order.code, firstOrder.order.code);

  const margin = await request(adminCookie, "api/price-lists/apply", {
    name: "Margen papas 30", operation: "proveedor", proveedor: "Fills S.A.S.", marginPct: 30, rounding: 1,
    status: "Activa", effectiveAt: new Date(Date.now() - 1000).toISOString(), motive: "Smoke margen", confirmed: true
  });
  assert.equal(margin.appliedNow, true);
  assert.equal(margin.simulation.items[0].price, 1434);

  await request(adminCookie, "api/suppliers/remits/REM-V119/validate", {
    amount: 1200, invoiceNumber: "FC-119", costsValidated: true,
    lineValidations: [{ index: 0, productCode: "P-PAPA", cost: 1200, priceLists: [{ listNumber: 2, marginPct: 30, price: 1560 }] }]
  });
  await request(adminCookie, "api/suppliers/manage", {
    supplier: "Duplicado limpio", action: "delete", motive: "Depuracion duplicado", adminPassword: "Lopez2026!"
  });

  const persisted = JSON.parse(fs.readFileSync(stateFile, "utf8")).state;
  assert.equal(persisted.orders.filter((order) => order.createOperationId === orderInput.operationId).length, 1);
  assert.equal(persisted.products.find((product) => product.codigo_producto === "P-PAPA").costo, 1200);
  assert.equal(persisted.products.find((product) => product.codigo_producto === "P-PAPA").proveedor, "Fills S.A.S.");
  assert.equal(persisted.suppliers.some((supplier) => supplier.name === "Duplicado limpio"), false);
  assert.equal(fs.readFileSync(path.join(root, "app.js"), "utf8").includes("applyStateVisibility()"), false);

  console.log(JSON.stringify({
    ok: true,
    version: health.version,
    sellerPinGenerated: true,
    clientPinValidated: true,
    orderIdempotent: true,
    duplicateOrders: 0,
    providerMarginApplied: margin.simulation.items[0].price,
    remitCostUpdated: 1200,
    supplierDeletedWithoutFrontendError: true
  }, null, 2));
})().finally(() => {
  child.kill();
  fs.rmSync(tempDir, { recursive: true, force: true });
}).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
