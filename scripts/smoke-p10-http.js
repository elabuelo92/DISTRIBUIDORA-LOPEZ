"use strict";
const assert = require("node:assert/strict"), fs = require("node:fs"), os = require("node:os"), path = require("node:path"), crypto = require("node:crypto");
const { spawn } = require("node:child_process"), { fixture } = require("./smoke-p10-cancellation");
const root = path.resolve(__dirname, ".."), dir = fs.mkdtempSync(path.join(os.tmpdir(), "dl-p10-"));
const file = path.join(dir, "demo-state.json"), port = 26000 + Math.floor(Math.random() * 1000), base = `http://127.0.0.1:${port}`;
const state = fixture();
state.supplierMovements.push({ ...structuredClone(state.supplierMovements[0]), id: "REM-PENDING", remitNumber: "2-TEST", stockApplied: false, economicValidated: false, adminValidationStatus: "Pendiente de Validacion", amount: 0 });
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
  const input = { username, password: "SmokeTest2026!", device: { id: "P10-DEVICE", label: "Test", os: "Node", model: "Test" } };
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
  const endpoint = "/api/suppliers/remits/REM-P10/cancellation", detail = "/api/suppliers/remits/detail?supplier=" + encodeURIComponent("Proveedor prueba P10");
  const before = read(), input = { requestId: "P10-HTTP-00001", reason: "Anulacion prueba aislada" };
  assert.equal((await request(detail)).status, 401);
  assert.equal((await request(detail, driver)).status, 403);
  assert.equal((await request(detail, admin)).body.remits.length, 2);
  assert.equal((await request(endpoint, driver, { ...input, action: "preview" })).status, 403);
  const preview = await request(endpoint, admin, { ...input, action: "preview" });
  assert.equal(preview.status, 200, JSON.stringify(preview.body)); assert.deepEqual(read(), before);
  assert.equal((await request(endpoint, admin, { ...input, action: "apply", token: "invalid" })).status, 400);
  const apply = { ...input, action: "apply", token: preview.body.token };
  const results = await Promise.all([request(endpoint, admin, apply), request(endpoint, admin, apply)]);
  assert.ok(results.every(r => r.status === 200), JSON.stringify(results));
  assert.equal(read().products[0].stock_fisico, 20);
  assert.equal(read().products[0].stock_reservado, 5);
  assert.equal(read().suppliers[0].balance, 500);
  assert.equal(read().stockMovements.filter(m => m.cancellationId === input.requestId).length, 1);
  assert.equal(read().accounts.filter(m => m.cancellationId === input.requestId).length, 1);
  assert.equal((await request(endpoint, admin, { ...apply, requestId: "P10-HTTP-00002" })).status, 400);
  const validate = await request("/api/suppliers/remits/REM-P10/validate", admin, { amount: 1000, invoiceNumber: "F-1" });
  assert.equal(validate.status, 400, JSON.stringify(validate)); assert.match(validate.body.error, /anulado/);
  for (const key of ["orders", "clients", "deliveryRoutes", "deliveryClosures", "commissionSettlements"]) assert.deepEqual(read()[key], before[key], key);
  assert.equal(read().globalAudit.filter(a => a.action === "PROVEEDOR_REMITO_ANULADO").length, 1);
  const forged = read(); delete forged.supplierMovements.find(r => r.id === "REM-P10").cancellation;
  assert.equal((await request("/api/state", admin, { state: forged })).status, 409);
  if (process.env.P10_PREVIEW !== "1") {
    const valid = await request("/api/suppliers/remits/REM-PENDING/validate", admin, { amount: 1000, invoiceNumber: "F-TEST", costsValidated: false });
    assert.equal(valid.status, 200, JSON.stringify(valid));
    const path = "/api/suppliers/remits/REM-PENDING/cancellation", reason = "Reversion del ingreso de prueba";
    const p = await request(path, admin, { action: "preview", reason });
    assert.equal(p.status, 200, JSON.stringify(p));
    const applied = await request(path, admin, { action: "apply", reason, token: p.body.token, requestId: "P10-HTTP-REALFLOW" });
    assert.equal(applied.status, 200, JSON.stringify(applied));
    assert.equal(read().products[0].stock_fisico, 20);
    assert.equal(read().suppliers[0].balance, 500);
  }
  if (process.env.P10_PREVIEW === "1") {
    console.log(`PREVIEW ${base} admin1 / SmokeTest2026! - synthetic only; ENTER stops`);
    await new Promise(resolve => { process.stdin.resume(); process.stdin.once("data", resolve); }); process.stdin.pause();
  }
  console.log("PASS P10 HTTP: detail permissions, readonly preview, concurrent cancellation once, revalidation rejected, audit and protected historical data.");
} finally { child.kill(); await new Promise(resolve => { if (child.exitCode !== null) resolve(); else child.once("exit", resolve); }); } })().catch(e => { console.error(e); process.exitCode = 1; });
