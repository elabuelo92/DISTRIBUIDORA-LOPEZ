"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawn } = require("node:child_process");
const { once } = require("node:events");
const Engine = require("../order-engine");
const p6 = process.argv.includes("--p6");
function fixture() {
  const state = { products: [{ codigo_producto: "814", name: "Jabon", price: 632, stock_fisico: 1873, stock_reservado: 97, stock_actual: 1873 }],
    clients: [{ codigo_cliente: "C1", name: "Cliente ficticio", balance: 0 }], accounts: [],
    orders: [{ code: "PED-TEST-3601", client: "Cliente ficticio", seller: "Sofia Benitez", inventoryMode: "reservation",
      stockSettled: true, accountPosted: false, status: "Rechazado", amount: 3160000, updatedAt: "2026-10-09T13:30:58.648Z",
      items: [{ lineId: "L1", productCode: "814", name: "Jabon", requestedQty: 5000, reservedQty: 5000, unitPrice: 632, lineTotal: 3160000 }], trace: [] }],
    stockMovements: [{ type: "Despacho", orderCode: "PED-TEST-3601", productCode: "814", qty: -5000 }], deliveryRoutes: [] };
  state.orders.push({ code: "PED-OTHER", client: "Cliente ficticio", inventoryMode: "reservation", stockSettled: false,
    status: Engine.STATUS.READY, amount: 61304, items: [{ productCode: "814", name: "Jabon", requestedQty: 97, reservedQty: 97, unitPrice: 632, lineTotal: 61304 }] });
  Engine.migrateState(state);
  if (p6) {
    state.orders[0].status = Engine.STATUS.NOT_DELIVERED;
    state.deliveryRoutes = [{ id: "HISTORICAL", status: "Completada", closure: { cash: 0 }, stops: [{ orderCode: state.orders[0].code, status: "No entregado" }] }];
  }
  return state;
}
function input(state) { return { cancelNotDelivered: p6, expectedUpdatedAt: state.orders[0].updatedAt, physicalReceived: true, noPreviousAdjustment: true, reason: "Recepcion completa ficticia" }; }
const actor = { role: "admin", user: "Prueba" };
const s = fixture();
const protectedData = JSON.stringify([s.accounts, s.clients, s.orders[0].items, s.orders[0].amount]);
const routesBefore = JSON.stringify(s.deliveryRoutes);
const request = input(s);
assert.equal(Engine.receiveRejectedOrderReturn(s, s.orders[0].code, request, actor).repeated, false);
assert.equal(s.products[0].stock_fisico, 6873);
assert.equal(s.products[0].stock_reservado, 97);
assert.equal(s.products[0].stock_disponible, 6776);
assert.equal(JSON.stringify(s.deliveryRoutes), routesBefore);
assert.equal(s.orders[0].status, p6 ? Engine.STATUS.CANCELLED : Engine.STATUS.REJECTED);
if (p6) assert.equal(s.orders[0].administrativeCancellation.previousStatus, Engine.STATUS.NOT_DELIVERED);
const snapshot = JSON.stringify(s);
assert.equal(Engine.receiveRejectedOrderReturn(s, s.orders[0].code, request, actor).repeated, true);
assert.equal(JSON.stringify(s), snapshot);
assert.equal(JSON.stringify([s.accounts, s.clients, s.orders[0].items, s.orders[0].amount]), protectedData);
const reload = JSON.parse(JSON.stringify(s));
Engine.migrateState(reload);
assert.equal(Engine.receiveRejectedOrderReturn(reload, s.orders[0].code, request, actor).repeated, true);
assert.equal(reload.products[0].stock_fisico, 6873);
for (const mutate of [
  state => { state.orders[0].status = p6 ? "Rechazado" : "No entregado"; },
  state => { state.orders[0].collection = { cashAmount: 100 }; },
  state => { state.orders[0].items[0].deliveredQty = 1; },
  state => { state.stockMovements[0].qty = -4999; },
  state => { state.stockMovements.push({ orderCode: state.orders[0].code, type: "Ajuste", qty: 5000 }); },
  state => { state.products = []; }
]) {
  const invalid = fixture(); mutate(invalid); const before = JSON.stringify(invalid);
  assert.throws(() => Engine.receiveRejectedOrderReturn(invalid, invalid.orders[0].code, input(invalid), actor));
  assert.equal(JSON.stringify(invalid), before);
}
assert.throws(() => Engine.receiveRejectedOrderReturn(fixture(), "PED-TEST-3601", request, { role: "driver" }), /Administracion/);
console.log("PASS engine: +5000 once, reservations unchanged, persistence retry, financial and original lines preserved, invalid cases atomic.");
if (p6) {
  for (const mutate of [
    state => { state.orders[0].commissionLiquidated = true; },
    state => { state.orders[0].commissionPaidAmount = 1; },
    state => { state.orders[0].collections = [{ cashAmount: 1 }]; },
    state => { state.deliveryRoutes[0].stops[0].collection = { cashAmount: 1 }; },
    state => { state.deliveryRoutes[0].stops.push({ orderCode: state.orders[0].code, status: "Pendiente" }); }
  ]) {
    const invalid = fixture(); mutate(invalid); const before = JSON.stringify(invalid);
    assert.throws(() => Engine.receiveRejectedOrderReturn(invalid, invalid.orders[0].code, input(invalid), actor));
    assert.equal(JSON.stringify(invalid), before);
  }
  for (const change of [{ expectedUpdatedAt: "stale" }, { physicalReceived: false }, { noPreviousAdjustment: false }, { reason: "" }, { cancelNotDelivered: false }]) {
    const invalid = fixture(); const before = JSON.stringify(invalid);
    assert.throws(() => Engine.receiveRejectedOrderReturn(invalid, invalid.orders[0].code, { ...input(invalid), ...change }, actor));
    assert.equal(JSON.stringify(invalid), before);
  }
  console.log("PASS P6: definitive cancellation, route/closure history intact, paid commissions, active stops, payments, stale and missing confirmations blocked.");
}

const temp = fs.mkdtempSync(path.join(os.tmpdir(), "dl-return-test-"));
const stateFile = path.join(temp, "demo-state.json");
fs.writeFileSync(stateFile, JSON.stringify({ version: Date.now(), state: fixture() }));
const port = 24000 + Math.floor(Math.random() * 1000);
const base = `http://127.0.0.1:${port}`;
const child = spawn(process.execPath, [path.join(__dirname, "../server.js")], { env: { ...process.env,
  DL_HOST: "127.0.0.1", DL_PORT: String(port), PORT: String(port), DATA_DIR: temp, STATE_FILE: stateFile,
  USERS_FILE: path.join(temp, "users.json"), DL_DEFAULT_PASSWORD: "SmokeTest2026!", DL_VERSION: "8790-169",
  DL_LICENSE_ENFORCEMENT: "disabled", DL_INTEGRITY_ENFORCE: "warn" }, stdio: ["ignore", "pipe", "pipe"] });
let errors = "";
child.stdout.on("data", data => { errors += data; });
child.stderr.on("data", data => { errors += data; });
async function login(username) {
  const body = { username, password: "SmokeTest2026!", device: { id: `RETURN-${username}`, label: "Test" } };
  const run = () => fetch(`${base}/api/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  let res = await run();
  if (res.status === 428) { const p = await res.json(); body.legalAcceptance = { accepted: true, version: p.legal.currentVersion, hash: p.legal.hash }; res = await run(); }
  assert.equal(res.status, 200);
  return res.headers.get("set-cookie").split(";")[0];
}
(async () => {
  try {
    let ready = false;
    for (let i = 0; i < 300; i++) {
      if (child.exitCode !== null) break;
      try { if ((await fetch(`${base}/api/health`, { signal: AbortSignal.timeout(500) })).ok) { ready = true; break; } } catch {}
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    assert.ok(ready, errors);
    const admin = await login("admin1"); const driver = await login("reparto1");
    const saved = () => JSON.parse(fs.readFileSync(stateFile, "utf8")).state;
    const req = input(saved());
    const post = cookie => fetch(`${base}/api/orders/PED-TEST-3601/receive-return`, { method: "POST", headers: { Cookie: cookie, "Content-Type": "application/json" }, body: JSON.stringify(req) });
    assert.equal((await post(driver)).status, 403);
    const results = await Promise.all([post(admin), post(admin)]);
    for (const res of results) assert.equal(res.status, 200, await res.clone().text());
    const bodies = await Promise.all(results.map(res => res.json()));
    assert.equal(bodies.filter(p => p.repeated).length, 1);
    assert.equal(saved().products[0].stock_fisico, 6873);
    assert.equal(saved().stockMovements.filter(m => m.type === (p6 ? "Devolucion por cancelacion" : "Devolucion de rechazo")).length, 1);
    assert.equal(saved().orders.length, 2);
    assert.equal(saved().orders[0].status, p6 ? "Cancelado" : "Rechazado");
    console.log("PASS HTTP: admin only, two simultaneous requests, one receipt and stock entry, same original order.");
  } finally {
    if (child.exitCode === null) { const exited = once(child, "exit"); child.kill(); await exited; }
    const resolved = fs.realpathSync(temp);
    assert.ok(resolved.startsWith(fs.realpathSync(os.tmpdir()) + path.sep));
    fs.rmSync(resolved, { recursive: true, force: true });
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
