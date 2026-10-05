"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawn } = require("node:child_process");
const orderEngine = require("../order-engine");
const Delivery = require("../delivery-engine");
const vm = require("node:vm");
const crypto = require("node:crypto");

const root = path.join(__dirname, "..");
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "dl-v133-"));
const port = 28000 + Math.floor(Math.random() * 4000);
const stateFile = path.join(tempDir, "demo-state.json");
const usersFile = path.join(tempDir, "users.json");
fs.writeFileSync(usersFile, JSON.stringify({ users: ["admin1", "reparto1", "reparto2"].map((username) => {
  const salt = crypto.randomBytes(16).toString("hex");
  return { username, name: username, role: username === "admin1" ? "admin" : "driver", active: true, salt,
    passwordHash: crypto.pbkdf2Sync("Lopez2026!", salt, 120000, 32, "sha256").toString("hex") };
}) }));

const state = {
  clients: [{ codigo_cliente: "C-133", name: "Cliente Cuenta 133", cuit: "20-133", balance: 1000, saldo_actual: 1000, limit: 5000, status: "Activo" }],
  suppliers: [{ name: "Proveedor Cuenta 133", cuit: "30-133", balance: 800, totalPurchased: 1200, totalPaid: 400, status: "A pagar", movements: [] }],
  accounts: [{ id: "ACC-BASE", date: "05/09/2026", type: "Venta", account: "Cliente Cuenta 133", method: "Cuenta corriente", debit: 1000, credit: 0, balance: 1000 }],
  supplierMovements: [{ id: "REM-133", type: "Remito", supplier: "Proveedor Cuenta 133", amount: 1200, date: "05/09/2026", economicValidated: true }],
  orders: [], products: [], sellers: [], activity: [], stockMovements: [], notifications: [], globalAudit: []
};
orderEngine.migrateState(state);
const fixtureSource = fs.readFileSync(path.join(__dirname, "smoke-delivery-operations-v132.js"), "utf8");
const buildRoutes = vm.runInNewContext(`(${fixtureSource.slice(fixtureSource.indexOf("function buildState"), fixtureSource.indexOf("const state = buildState"))})`, { OrderEngine: orderEngine });
const routeFixture = buildRoutes(100);
state.clients.push(...routeFixture.clients);
state.orders = routeFixture.orders;
state.products = routeFixture.products;
orderEngine.migrateState(state);
const adminContext = { role: "admin", user: "admin1", username: "admin1", skipMigration: true };
const sourceRoute = Delivery.createPlannedRoute(state, { orderCodes: state.orders.slice(0, 50).map(o => o.code), day: "2026-10-04", zone: "Origen", driverUser: "reparto1" }, adminContext);
const targetRoute = Delivery.createPlannedRoute(state, { orderCodes: state.orders.slice(50).map(o => o.code), day: "2026-10-04", zone: "Destino", driverUser: "reparto2" }, adminContext);
Delivery.publishRoute(state, sourceRoute.id, adminContext);
Delivery.publishRoute(state, targetRoute.id, adminContext);
fs.writeFileSync(stateFile, JSON.stringify({ version: Date.now(), state }), "utf8");

const app = fs.readFileSync(path.join(root, "app.js"), "utf8");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
assert.match(app, /data-account-entity-type="client"/);
assert.match(app, /data-account-entity-type="supplier"/);
assert.match(app, /selectedMethod === "Transferencia Pendiente"/);
assert.match(html, /id="accountStatementDialog"/);

const child = spawn(process.execPath, [path.join(root, "server.js")], {
  cwd: root,
  env: { ...process.env, DL_HOST: "127.0.0.1", DL_PORT: String(port), PORT: String(port), DATA_DIR: tempDir, STATE_FILE: stateFile, USERS_FILE: usersFile, DL_VERSION: "8790-135-test", DL_LICENSE_ENFORCEMENT: "disabled", DL_INTEGRITY_ENFORCE: "warn", DL_DEFAULT_PASSWORD: "Lopez2026!" },
  stdio: ["ignore", "pipe", "pipe"]
});
let serverError = "";
let serverOutput = "";
let serverExit = null;
child.stderr.on("data", (chunk) => { serverError += chunk.toString(); });
child.stdout.on("data", (chunk) => { serverOutput += chunk.toString(); });
child.on("exit", (code) => { serverExit = code; });
const base = `http://127.0.0.1:${port}`;

async function waitHealth() {
  for (let index = 0; index < 300; index += 1) {
    try { const response = await fetch(`${base}/api/health`); if (response.ok) return; } catch {}
    if (serverExit !== null) break;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`Servidor temporal v133 no inicio. exit=${serverExit}. ${serverError || serverOutput}`);
}

async function login(username = "admin1") {
  const input = { username, password: "Lopez2026!", device: { id: `TEST-${username}`, label: "Smoke v133" } };
  let response = await fetch(`${base}/api/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
  if (response.status === 428) {
    const required = await response.json();
    input.legalAcceptance = { accepted: true, version: required.legal.currentVersion, hash: required.legal.hash };
    response = await fetch(`${base}/api/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
  }
  assert.equal(response.status, 200);
  return String(response.headers.get("set-cookie") || "").split(";")[0];
}

(async () => {
  await waitHealth();
  const cookie = await login();
  const driverCookie = await login("reparto1");
  const request = async (url, body, auth = cookie) => {
    const response = await fetch(`${base}${url}`, { method: "POST", headers: { Cookie: auth, "Content-Type": "application/json" }, body: JSON.stringify(body) });
    return { status: response.status, body: await response.json() };
  };
  const moveUrl = `/api/delivery/routes/${sourceRoute.id}/relocate`;
  const claimed = await request(`/api/delivery/routes/${sourceRoute.id}/claim`, { deviceId: "TEST-reparto1" }, driverCookie);
  assert.equal(claimed.status, 200, claimed.body.error);
  const moveBody = { orderCodes: [state.orders[0].code], targetRouteId: targetRoute.id };
  assert.equal((await request(moveUrl, moveBody, driverCookie)).status, 403);
  assert.equal((await request(moveUrl, moveBody, "")).status, 401);
  const competingMoves = await Promise.all([request(moveUrl, moveBody), request(moveUrl, moveBody)]);
  assert.deepEqual(competingMoves.map(r => r.status).sort(), [200, 400]);
  assert.equal(competingMoves.find(r => r.status === 200).body.routes.length, 2);
  const code = state.orders[1].code;
  const amount = state.orders[1].amount;
  const collectionBody = { method: "Efectivo", paymentSplit: { cashAmount: amount, transferAmount: 0, creditAmount: 0 }, deviceId: "TEST-reparto1", gps: { lat: -31.41, lng: -64.18, accuracy: 10 } };
  const competition = await Promise.all([
    request(moveUrl, { orderCodes: [code], targetRouteId: targetRoute.id }),
    request(`/api/delivery/orders/${code}/collect`, collectionBody, driverCookie)
  ]);
  assert.deepEqual(competition.map(r => r.status).sort(), [200, 400]);
  const afterRace = JSON.parse(fs.readFileSync(stateFile, "utf8")).state;
  assert.equal(afterRace.deliveryRoutes.flatMap(r => r.stops).filter(s => s.orderCode === code).length, 1);
  assert.equal(afterRace.orders.length, 100);
  const collectedCode = state.orders[2].code;
  const collected = await request(`/api/delivery/orders/${collectedCode}/collect`, {
    ...collectionBody, paymentSplit: { cashAmount: state.orders[2].amount, transferAmount: 0, creditAmount: 0 }
  }, driverCookie);
  assert.equal(collected.status, 200, collected.body.error);
  const blockedMove = await request(moveUrl, { orderCodes: [collectedCode], targetRouteId: targetRoute.id });
  assert.equal(blockedMove.status, 400);
  assert.match(blockedMove.body.error, /pendientes sin cobros/);
  console.log("PASS HTTP permisos, reubicacion simultanea y carrera reubicacion/cobro: sin duplicados.");
  let response = await fetch(`${base}/api/account-statements?type=client&id=C-133`, { headers: { Cookie: cookie } });
  let payload = await response.json();
  assert.equal(response.status, 200, payload.error);
  assert.equal(payload.statement.summary.balance, 1000);

  response = await fetch(`${base}/api/account-statements/payments`, {
    method: "POST",
    headers: { Cookie: cookie, "Content-Type": "application/json" },
    body: JSON.stringify({ type: "client", entityId: "C-133", amount: 300, method: "Transferencia", reference: "TRX-133", note: "Pago parcial probado" })
  });
  payload = await response.json();
  assert.equal(response.status, 200, payload.error);
  assert.equal(payload.payment.method, "Transferencia");
  assert.equal(payload.payment.previousBalance, 1000);
  assert.equal(payload.payment.balance, 700);

  response = await fetch(`${base}/api/account-statements/payments`, {
    method: "POST",
    headers: { Cookie: cookie, "Content-Type": "application/json" },
    body: JSON.stringify({ type: "client", entityId: "C-133", amount: 701, method: "Efectivo" })
  });
  payload = await response.json();
  assert.equal(response.status, 400);
  assert.match(payload.error, /superar el saldo/i);

  response = await fetch(`${base}/api/account-statements?type=supplier&id=Proveedor%20Cuenta%20133`, { headers: { Cookie: cookie } });
  payload = await response.json();
  assert.equal(response.status, 200, payload.error);
  assert.equal(payload.statement.summary.balance, 800);
  assert.equal(payload.statement.actions.requiresReconciliation, true);
  assert.ok(payload.statement.movements.some((movement) => movement.id === "REM-133"));

  const persisted = JSON.parse(fs.readFileSync(stateFile, "utf8")).state;
  assert.equal(persisted.clients[0].balance, 700);
  assert.equal(persisted.accounts.filter((entry) => entry.type === "Pago parcial cliente").length, 1);
  const transferBody = { type: "client", entityId: "C-133", amount: 200, method: "Transferencia a validar", reference: "PARCIAL-200", requestId: "CC-TRF-http-test-00001", dataUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aL1sAAAAASUVORK5CYII=" };
  const post = async (url, body) => {
    const result = await fetch(`${base}${url}`, { method: "POST", headers: { Cookie: cookie, "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const json = await result.json();
    assert.equal(result.status, 200, json.error);
    return json;
  };
  const pending = await post("/api/account-statements/payments", transferBody);
  assert.equal(pending.pendingValidation, true);
  assert.equal(pending.statement.summary.balance, 700);
  await post("/api/account-statements/payments", transferBody);
  await post(`/api/bank-reconciliation/transfers/${pending.transfer.id}/status`, { status: "Cuenta Corriente Actualizada", bank: "Proveedor Cuenta 133", operationNumber: "PARCIAL-200", targetSupplier: "Proveedor Cuenta 133" });
  let saved = JSON.parse(fs.readFileSync(stateFile, "utf8")).state;
  const linked = saved.bankReconciliation.find((item) => item.id === pending.transfer.id);
  assert.equal(saved.clients[0].balance, 500);
  assert.equal(saved.suppliers[0].balance, 800);
  assert.ok(linked.supplierPaymentId);
  await post(`/api/suppliers/payments/${linked.supplierPaymentId}/reconcile`, { observations: "Prueba triangulada" });
  saved = JSON.parse(fs.readFileSync(stateFile, "utf8")).state;
  assert.equal(saved.suppliers[0].balance, 600);
  assert.equal(saved.clients[0].balance, 500);
  assert.equal(saved.bankReconciliation.filter((item) => item.id === pending.transfer.id).length, 1);
  console.log("PASS HTTP comprobante parcial, reintento sin duplicar, triangulacion y conciliacion proveedor.");
  console.log(JSON.stringify({ ok: true, prompt: 133, initialPartialBalance: 700, clientBalance: 500, supplierBalance: 600, selectedMethod: "Transferencia", overpaymentStatus: 400, doubleClickAccount: true }, null, 2));
  if (process.argv.includes("--preview")) {
    await fetch(`${base}/api/logout`, { method: "POST", headers: { Cookie: cookie } });
    console.log(`PREVIEW ${base} (synthetic data, 600 seconds)`);
    await new Promise((resolve) => setTimeout(resolve, 600000));
  }
})().finally(() => {
  child.kill();
  fs.rmSync(tempDir, { recursive: true, force: true });
}).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
