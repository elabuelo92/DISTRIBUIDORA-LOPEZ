"use strict";
const assert = require("node:assert/strict"), fs = require("node:fs"), os = require("node:os"), path = require("node:path"), crypto = require("node:crypto");
const { spawn } = require("node:child_process");
const Accounts = require("../account-engine");
const root = path.resolve(__dirname, ".."), dir = fs.mkdtempSync(path.join(os.tmpdir(), "dl-p9-"));
const file = path.join(dir, "demo-state.json"), port = 25000 + Math.floor(Math.random() * 1000), base = `http://127.0.0.1:${port}`;
const state = { clients: [{ codigo_cliente: "C1", name: "Prueba P9", balance: 200 }], products: [], orders: [], accounts: [],
  collectionVisits: [{ id: "COB1", clientId: "C1", client: "Prueba P9", routeId: "R-P9", amount: 800, completedAt: "2026-10-20T12:00:00Z", history: [], payments: [{ requestId: "PAY1", cash: 800, transfer: 0 }] }],
  deliveryRoutes: [{ id: "R-P9", day: "2026-10-20", status: "Completada", driverUser: "reparto1", deviceId: "P9-DEVICE", stops: [], cashTotal: 800, transferTotal: 0, closure: { id: "CLOSE-P9", expectedCash: 800, reportedCash: 800 } }] };
Accounts.migrateState(state);
state.collectionVisits.push({ ...structuredClone(state.collectionVisits[0]), id: "COB2" });
fs.writeFileSync(file, JSON.stringify({ version: Date.now(), state }));
fs.writeFileSync(path.join(dir, "users.json"), JSON.stringify({ users: ["admin1", "reparto1"].map(username => {
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
  const input = { username, password: "SmokeTest2026!", device: { id: "P9-DEVICE", label: "Test", os: "Node", model: "Test" } };
  let result = await request("/api/login", "", input);
  if (result.status === 428) { input.legalAcceptance = { accepted: true, version: result.body.legal.currentVersion, hash: result.body.legal.hash }; result = await request("/api/login", "", input); }
  assert.equal(result.status, 200, JSON.stringify(result.body)); return result.cookie;
}
const read = () => JSON.parse(fs.readFileSync(file, "utf8")).state;
(async () => { try {
  let ready = false;
  for (let i = 0; i < 100; i++) { try { if ((await fetch(base + "/api/health")).ok) { ready = true; break; } } catch {} await new Promise(r => setTimeout(r, 100)); }
  assert.ok(ready, log);
  const admin = await login("admin1"), driver = await login("reparto1");
  const endpoint = "/api/collection-corrections", before = read();
  assert.equal((await request(endpoint)).status, 401);
  assert.equal((await request(endpoint, driver)).status, 403);
  const list = await request(endpoint + "?routeId=R-P9", admin);
  assert.equal(list.body.sources.length, 2);
  const input = { requestId: "P9-HTTP-00001", routeId: "R-P9", sourceId: "visita:COB1:PAY1", cashAmount: 500, transferAmount: 0, reason: "Correccion prueba aislada" };
  assert.equal((await request(endpoint, driver, { ...input, action: "preview" })).status, 403);
  const preview = await request(endpoint, admin, { ...input, action: "preview" });
  assert.equal(preview.status, 200, JSON.stringify(preview.body));
  assert.equal(read().clients[0].balance, 200);
  assert.equal((await request(endpoint, admin, { ...input, action: "apply", token: "invalid" })).status, 400);
  const apply = { ...input, action: "apply", token: preview.body.token };
  const results = await Promise.all([request(endpoint, admin, apply), request(endpoint, admin, apply)]);
  assert.ok(results.every(r => r.status === 200), JSON.stringify(results));
  assert.equal(read().collectionCorrections.length, 1);
  assert.equal(read().clients[0].balance, 500);
  assert.equal(read().accounts.filter(a => a.correctionId === input.requestId).length, 2);
  assert.equal((await request(endpoint, admin, { ...apply, cashAmount: 600 })).status, 400);
  assert.equal((await request(endpoint, admin, { ...apply, requestId: "P9-HTTP-00002" })).status, 400);
  for (const key of ["orders", "products", "deliveryRoutes", "deliveryClosures", "collectionVisits", "commissionSettlements"]) assert.deepEqual(read()[key], before[key], key);
  assert.ok(read().globalAudit.some(a => a.action === "CORRECCION_COBRANZA_CERRADA"));
  if (process.env.P9_PREVIEW !== "1") {
    const transfer = { ...input, requestId: "P9-HTTP-TRANSFER", sourceId: "visita:COB2:PAY1", cashAmount: 0, transferAmount: 600,
      bank: "Mercado Pago", reference: "OP-P9", dataUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aL1sAAAAASUVORK5CYII=" };
    const p = await request(endpoint, admin, { ...transfer, action: "preview" });
    assert.equal(p.status, 200, JSON.stringify(p.body));
    const t = { ...transfer, token: p.body.token, action: "apply" };
    const saved = await Promise.all([request(endpoint, admin, t), request(endpoint, admin, t)]);
    assert.ok(saved.every(r => r.status === 200), JSON.stringify(saved));
    assert.equal(read().clients[0].balance, 1300);
    assert.equal(read().bankReconciliation.length, 1);
    const bankId = read().bankReconciliation[0].id;
    for (let i = 0; i < 2; i++) assert.equal((await request(`/api/bank-reconciliation/transfers/${bankId}/status`, admin, { status: "Validada", operationNumber: "OP-P9" })).status, 200);
    assert.equal(read().clients[0].balance, 700);
    for (const key of ["orders", "deliveryRoutes", "deliveryClosures", "collectionVisits", "commissionSettlements"]) assert.deepEqual(read()[key], before[key], key);
  }
  if (process.env.P9_PREVIEW === "1") {
    console.log(`PREVIEW ${base} admin1 / SmokeTest2026! - synthetic only; ENTER stops`);
    await new Promise(resolve => { process.stdin.resume(); process.stdin.once("data", resolve); }); process.stdin.pause();
  }
  console.log("PASS P9 HTTP: admin only, readonly preview, stale token, concurrent replay exactly once, persisted audit and unchanged closed routes/orders/commissions.");
} finally { child.kill(); await new Promise(resolve => { if (child.exitCode !== null) resolve(); else child.once("exit", resolve); }); } })().catch(e => { console.error(e); process.exitCode = 1; });
