"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawn } = require("node:child_process");

const root = path.resolve(__dirname, "..");
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "dl-remit-reconcile-"));
const port = 21600 + Math.floor(Math.random() * 500);
const stateFile = path.join(tempDir, "demo-state.json");
const usersFile = path.join(tempDir, "users.json");
fs.copyFileSync(path.join(root, "data", "users.json"), usersFile);
const product = (code) => ({ codigo_producto: code, name: `Producto ${code}`, costo: 10, cost: 10, stock_fisico: 0, stock_actual: 0, stock: 0 });
fs.writeFileSync(stateFile, JSON.stringify({ version: 1, state: {
  products: [product("P-A"), product("P-B"), product("P-C")],
  suppliers: [{ name: "Proveedor Prueba", razon_social: "Proveedor Prueba", balance: 0, movements: [] }],
  supplierMovements: [{ id: "REM-TEST", supplier: "Proveedor Prueba", remitNumber: "R-1", amount: 0, declaredAmount: 50,
    economicValidated: false, products: [{ productCode: "P-A", name: "Producto P-A", qty: 5, stockQty: 5, unitPrice: 10, subtotal: 50 }] }],
  clients: [], sellers: [], orders: [], activity: [], priceLists: [], stockMovements: [], notifications: [], globalAudit: []
} }), "utf8");
const gpsDate = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Argentina/Buenos_Aires", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
const gpsHistory = [
  ["SESSION-A", "NATIVE-A", "Moto A", "native-background", -31.4],
  ["SESSION-A", "WEB-A", "Webview A", "native", -31.401],
  ["SESSION-B", "NATIVE-B", "Moto B", "native-background", -31.5],
  ["SESSION-B", "WEB-B", "Webview B", "native", -31.501]
].map(([sessionId, deviceId, deviceLabel, source, lat], index) => JSON.stringify({
  at: `${gpsDate}T13:0${index}:00-03:00`, sessionId, username: "axel", user: "Axel", role: "seller",
  deviceId, deviceLabel, source, lat, lng: -64.2, accuracy: 10
}));
fs.writeFileSync(path.join(tempDir, "gps-history.log"), `${gpsHistory.join("\n")}\n`, "utf8");
const child = spawn(process.execPath, [path.join(root, "server.js")], { cwd: root, env: {
  ...process.env, DL_HOST: "127.0.0.1", DL_PORT: String(port), PORT: String(port), DATA_DIR: tempDir,
  STATE_FILE: stateFile, USERS_FILE: usersFile, DL_VERSION: "8790-153", DL_LICENSE_ENFORCEMENT: "disabled",
  DL_INTEGRITY_ENFORCE: "warn", DL_DEFAULT_PASSWORD: "Lopez2026!"
}, stdio: ["ignore", "pipe", "pipe"] });
let serverError = "";
child.stderr.on("data", (chunk) => { serverError += chunk.toString(); });
child.stdout.on("data", (chunk) => { serverError += chunk.toString(); });
const base = `http://127.0.0.1:${port}`;

async function waitHealth() {
  for (let i = 0; i < 100; i += 1) {
    try { const response = await fetch(`${base}/api/health`); if (response.ok) return; } catch {}
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`Servidor temporal no inicio: ${serverError}`);
}

async function login(username = "admin1") {
  const input = { username, password: "Lopez2026!", device: { id: `SMOKE-${username}`, label: "Smoke remito" } };
  let response = await fetch(`${base}/api/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
  if (response.status === 428) {
    const required = await response.json();
    input.legalAcceptance = { accepted: true, version: required.legal.currentVersion, hash: required.legal.hash };
    response = await fetch(`${base}/api/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
  }
  assert.equal(response.status, 200, await response.text());
  return String(response.headers.get("set-cookie") || "").split(";")[0];
}

async function validate(cookie, body, expectedStatus) {
  const response = await fetch(`${base}/api/suppliers/remits/REM-TEST/validate`, { method: "POST",
    headers: { Cookie: cookie, "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const payload = await response.json();
  assert.equal(response.status, expectedStatus, payload.error || "validate");
  return payload;
}

(async () => {
  await waitHealth();
  const cookie = await login();
  const gpsResponse = await fetch(`${base}/api/admin/presence/daily-routes?date=${gpsDate}&role=seller`, { headers: { Cookie: cookie } });
  assert.equal(gpsResponse.status, 200);
  const gpsPayload = await gpsResponse.json();
  assert.equal(gpsPayload.routes.length, 2);
  assert.ok(gpsPayload.routes.every((route) => route.deviceIds.length === 2));
  assert.deepEqual(gpsPayload.routes.map((route) => route.deviceLabel).sort(), ["Moto A", "Moto B"]);
  const body = {
    invoiceNumber: "F-1", amount: 80, costsValidated: false, observations: "Reconciliacion controlada de productos y cantidades",
    validationOperationId: "SMOKE-REMIT-1", lineEdits: [{ index: 0, productCode: "P-B", stockQty: 3 }],
    addedLines: [{ productCode: "P-C", stockQty: 2 }]
  };
  const missingReason = await validate(cookie, { ...body, observations: "" }, 400);
  assert.match(missingReason.error, /Observaciones administrativas/);
  const result = await validate(cookie, body, 200);
  assert.equal(result.remit.products.length, 2);
  assert.equal(result.remit.products[0].productCode, "P-B");
  assert.equal(result.remit.products[0].stockAppliedQty, 3);
  assert.equal(result.remit.products[1].productCode, "P-C");
  assert.equal(result.remit.products[1].stockAppliedQty, 2);
  assert.equal(result.remit.lineCorrections.length, 2);
  const after = JSON.parse(fs.readFileSync(stateFile, "utf8")).state;
  assert.equal(after.products.find((item) => item.codigo_producto === "P-A").stock_fisico, 0);
  assert.equal(after.products.find((item) => item.codigo_producto === "P-B").stock_fisico, 3);
  assert.equal(after.products.find((item) => item.codigo_producto === "P-C").stock_fisico, 2);
  const replay = await validate(cookie, body, 200);
  assert.equal(replay.idempotentReplay, true);
  const afterReplay = JSON.parse(fs.readFileSync(stateFile, "utf8")).state;
  assert.equal(afterReplay.products.find((item) => item.codigo_producto === "P-B").stock_fisico, 3);
  const mismatch = await validate(cookie, { ...body, validationOperationId: "DIFFERENT-OP" }, 400);
  assert.match(mismatch.error, /ya fue validado/);
  const depotCookie = await login("deposito1");
  const depotState = await fetch(`${base}/api/state`, { headers: { Cookie: depotCookie } });
  assert.equal(depotState.status, 200);
  const depotPayload = await depotState.json();
  assert.equal((depotPayload.state?.suppliers || []).length, 0);
  assert.equal((depotPayload.state?.supplierMovements || []).length, 0);
  const depotSupplier = await fetch(`${base}/api/suppliers/remits/REM-TEST/validate`, {
    method: "POST", headers: { Cookie: depotCookie, "Content-Type": "application/json" }, body: JSON.stringify(body)
  });
  assert.equal(depotSupplier.status, 403);
  const depotOrders = await fetch(`${base}/api/orders`, { headers: { Cookie: depotCookie } });
  assert.equal(depotOrders.status, 403);
  console.log("Remito: correccion, agregado, stock e idempotencia OK");
})().catch((error) => { console.error(error); process.exitCode = 1; }).finally(() => {
  child.kill();
});
