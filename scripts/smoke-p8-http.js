"use strict";
const assert = require("node:assert/strict"), fs = require("node:fs"), os = require("node:os"), path = require("node:path");
const { spawn } = require("node:child_process");
const Accounts = require("../account-engine");
const crypto = require("node:crypto");
const root = path.resolve(__dirname, ".."), dir = fs.mkdtempSync(path.join(os.tmpdir(), "dl-p8-"));
const file = path.join(dir, "demo-state.json"), port = 24000 + Math.floor(Math.random() * 1000), base = `http://127.0.0.1:${port}`;
const state = { clients: [{ codigo_cliente: "C1", name: "Cliente P8", balance: 1000, latitud: -31.4, longitud: -64.2 }], products: [], orders: [], accounts: [],
  deliveryRoutes: ["R-P8", "R-P8-2"].map(id => ({ id, day: "2026-10-20", status: "En curso", driverUser: "reparto1", deviceId: "P8-DEVICE", stops: [], cashTotal: 0, transferTotal: 0 })) };
Accounts.migrateState(state);
fs.writeFileSync(file, JSON.stringify({ version: Date.now(), state }));
fs.writeFileSync(path.join(dir, "users.json"), JSON.stringify({ users: ["admin1", "reparto1", "reparto2"].map(username => {
  const salt = crypto.randomBytes(16).toString("hex");
  return { username, name: username, role: username === "admin1" ? "admin" : "driver", active: true, salt,
    passwordHash: crypto.pbkdf2Sync("SmokeTest2026!", salt, 120000, 32, "sha256").toString("hex") };
}) }));
const child = spawn(process.execPath, [path.join(root, "server.js")], { cwd: root, env: { ...process.env, DL_HOST: "127.0.0.1", DL_PORT: String(port), PORT: String(port), DATA_DIR: dir, STATE_FILE: file,
  USERS_FILE: path.join(dir, "users.json"), DL_MAINTENANCE_FILE: path.join(dir, "maintenance-mode.json"), DL_LICENSE_ENFORCEMENT: "disabled", DL_INTEGRITY_ENFORCE: "warn", DL_DEFAULT_PASSWORD: "SmokeTest2026!" }, stdio: ["ignore", "pipe", "pipe"] });
let log = ""; child.stdout.on("data", b => { log = (log + b).slice(-3000); }); child.stderr.on("data", b => { log = (log + b).slice(-3000); });
async function request(url, cookie = "", body) {
  const response = await fetch(base + url, { method: body ? "POST" : "GET", headers: { Cookie: cookie, "Content-Type": "application/json" }, ...(body ? { body: JSON.stringify(body) } : {}) });
  return { status: response.status, body: await response.json(), cookie: String(response.headers.get("set-cookie") || "").split(";")[0] };
}
async function login(username) {
  const input = { username, password: "SmokeTest2026!", device: { id: "P8-DEVICE", label: "Test", os: "Node", model: "Test" } };
  let result = await request("/api/login", "", input);
  if (result.status === 428) { input.legalAcceptance = { accepted: true, version: result.body.legal.currentVersion, hash: result.body.legal.hash }; result = await request("/api/login", "", input); }
  assert.equal(result.status, 200, JSON.stringify(result.body)); return result.cookie;
}
const read = () => JSON.parse(fs.readFileSync(file, "utf8")).state;
(async () => { try {
  let ready = false;
  for (let i = 0; i < 100; i++) { try { if ((await fetch(base + "/api/health")).ok) { ready = true; break; } } catch {} await new Promise(r => setTimeout(r, 100)); }
  assert.ok(ready, log);
  const admin = await login("admin1"), driver = await login("reparto1"), other = await login("reparto2");
  const before = read();
  const create = { requestId: "P8-CREATE-0001", clientId: "C1", amount: 900, routeId: "R-P8" };
  assert.equal((await request("/api/collection-visits", driver, create)).status, 403);
  const created = await Promise.all([request("/api/collection-visits", admin, create), request("/api/collection-visits", admin, create)]);
  assert.ok(created.every(r => r.status === 200), JSON.stringify(created));
  assert.equal(read().collectionVisits.length, 1);
  const id = created[0].body.visit.id;
  assert.equal((await request("/api/collection-visits", other)).body.visits.length, 0);
  const close = { deviceId: "P8-DEVICE", reportedCash: 0, reportedTransfer: 0, gps: { lat: -31.4, lng: -64.2, accuracy: 10 } };
  assert.equal((await request("/api/delivery/routes/R-P8/close", admin, close)).status, 400);
  const payment = { requestId: "P8-PAYMENT-0001", cashAmount: 400, deviceId: "P8-DEVICE" };
  assert.equal((await request(`/api/collection-visits/${id}/collect`, other, payment)).status, 400);
  const paid = await Promise.all([request(`/api/collection-visits/${id}/collect`, driver, payment), request(`/api/collection-visits/${id}/collect`, driver, payment)]);
  assert.ok(paid.every(r => r.status === 200), JSON.stringify(paid));
  assert.equal(read().clients[0].balance, 600);
  assert.equal(read().collectionVisits[0].payments.length, 1);
  const proof = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aL1sAAAAASUVORK5CYII=";
  const transfer = { requestId: "P8-TRANSFER-001", transferAmount: 500, deviceId: "P8-DEVICE", reference: "OP-1", dataUrl: proof };
  for (let i = 0; i < 2; i++) { const r = await request(`/api/collection-visits/${id}/collect`, driver, transfer); assert.equal(r.status, 200, JSON.stringify(r.body)); }
  assert.equal(read().clients[0].balance, 600);
  const bank = read().bankReconciliation[0];
  for (let i = 0; i < 2; i++) assert.equal((await request(`/api/bank-reconciliation/transfers/${bank.id}/status`, admin, { status: "Validada", operationNumber: "OP-1" })).status, 200);
  assert.equal(read().clients[0].balance, 100);
  assert.equal((await request("/api/collection-visits", driver)).body.visits[0].summary.status, "Cobrada");
  const closed = await request("/api/delivery/routes/R-P8/close", admin, { ...close, reportedCash: 400, reportedTransfer: 500 });
  assert.equal(closed.status, 200, JSON.stringify(closed.body));
  assert.equal(closed.body.closure.expectedCash, 400);
  assert.equal(closed.body.closure.totalDifference, 0);
  for (const key of ["orders", "products", "stockMovements", "commissionSettlements"]) assert.deepEqual(read()[key], before[key], key);
  if (process.env.P8_PREVIEW === "1") {
    console.log(`PREVIEW ${base} admin1 / SmokeTest2026! - synthetic data only; ENTER stops`);
    await new Promise(resolve => { process.stdin.resume(); process.stdin.once("data", resolve); });
  }
  console.log("PASS P8 HTTP: concurrent creation/collection/replay, role isolation, proof validation once, closure totals, unchanged stock/sales/commissions.");
} finally { child.kill(); await new Promise(resolve => { if (child.exitCode !== null) resolve(); else child.once("exit", resolve); }); } })().catch(e => { console.error(e); process.exitCode = 1; });
