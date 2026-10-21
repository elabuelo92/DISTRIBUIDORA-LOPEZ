"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const crypto = require("node:crypto");
const { spawn } = require("node:child_process");
const { once } = require("node:events");
const root = path.resolve(__dirname, "..");
const folder = fs.mkdtempSync(path.join(os.tmpdir(), "dl-count-http-"));
const file = path.join(folder, "demo-state.json");
const password = "LocalCountTest-Only!";
const users = ["admin1", "seller-test"].map(username => {
  const salt = crypto.randomBytes(16).toString("hex");
  return { username, name: username, role: username === "admin1" ? "admin" : "seller", active: true,
    salt, passwordHash: crypto.pbkdf2Sync(password, salt, 120000, 32, "sha256").toString("hex") };
});
fs.writeFileSync(path.join(folder, "users.json"), JSON.stringify({ users }));
fs.writeFileSync(file, JSON.stringify({ version: 1, state: {
  products: [{ codigo_producto: "A", name: "Test A", stock_fisico: 100, stock_reservado: 10 },
    { codigo_producto: "B", name: "Test B", stock_fisico: 50, stock_reservado: 5 }],
  orders: [{ code: "PED-TEST-1", client: "Test", status: "En Armado", inventoryMode: "reservation",
    items: [{ productCode: "A", name: "Test A", requestedQty: 10, reservedQty: 10, missingQty: 0, unitPrice: 20 }] }],
  clients: [], accounts: [], supplierAccounts: [{ balance: 456.78 }],
  physicalStockCounts: [], physicalStockAdjustments: [], stockMovements: [], activity: []
} }));
const port = 23000 + Math.floor(Math.random() * 1000);
const base = `http://127.0.0.1:${port}`;
const child = spawn(process.execPath, ["--max-old-space-size=512", "server.js"], {
  cwd: root, env: { ...process.env, DL_HOST: "127.0.0.1", DL_PORT: String(port), DATA_DIR: folder,
    STATE_FILE: file, USERS_FILE: path.join(folder, "users.json"), DL_LICENSE_ENFORCEMENT: "disabled",
    DL_INTEGRITY_ENFORCE: "warn" }, stdio: ["ignore", "pipe", "pipe"]
});
let logs = "";
child.stdout.on("data", data => { logs += data; }); child.stderr.on("data", data => { logs += data; });
const exited = once(child, "exit");
const read = () => JSON.parse(fs.readFileSync(file)).state;
async function request(url, body, cookie, expected = 200) {
  const response = await fetch(`${base}${url}`, { method: body ? "POST" : "GET",
    headers: { "Content-Type": "application/json", ...(cookie ? { Cookie: cookie } : {}) },
    body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(15000) });
  const result = await response.json();
  assert.equal(response.status, expected, JSON.stringify(result).slice(0, 250));
  return { result, cookie: String(response.headers.get("set-cookie") || "").split(";")[0] };
}
async function login(username) {
  const input = { username, password, device: { id: `TEST-${username}`, label: "Isolated test" } };
  const legal = (await request("/api/legal")).result.legal;
  input.legalAcceptance = { accepted: true, version: legal.currentVersion, hash: legal.hash };
  return (await request("/api/login", input)).cookie;
}
async function main() {
  let ready = false;
  for (let i = 0; i < 150; i++) {
    try { await request("/api/health"); ready = true; break; } catch {}
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  assert.ok(ready, logs.slice(-2000));
  const admin = await login("admin1");
  const seller = await login("seller-test");
  const initial = await request("/api/state", null, admin);
  const post = (body, expected = 200, cookie = admin) => request("/api/stock/entry", body, cookie, expected);
  const before = initial.result.state;
  const physical = before.products.find(p => p.codigo_producto === "A").stock_fisico;
  const reserved = before.products.find(p => p.codigo_producto === "A").stock_reservado;
  assert.equal(reserved, 10, "fixture must exercise active reservations");
  const count = { action: "recordCount", countId: "CNT-HTTP-TEST-001", productCode: "A", expectedQty: physical, countedQty: physical - 10 };
  await post(count, 401, ""); await post(count, 403, seller);
  const counts = await Promise.all(Array.from({ length: 6 }, () => post(count)));
  assert.equal(counts.filter(p => !p.result.replayed).length, 1);
  for (const p of counts) { assert.equal(p.result.state, undefined); assert.ok(JSON.stringify(p.result).length < 12000); }
  assert.equal(read().physicalStockCounts.filter(c => c.id === count.countId).length, 1);
  assert.equal(read().products.find(p => p.codigo_producto === "A").stock_fisico, physical);
  const adjust = { action: "reconcileCount", productCode: "A", countId: count.countId, reason: "Prueba local", admin_password: password };
  const bytes = fs.readFileSync(file, "utf8");
  await post({ ...adjust, admin_password: "incorrect" }, 400);
  assert.equal(fs.readFileSync(file, "utf8"), bytes);
  const results = await Promise.all([
    ...Array.from({ length: 6 }, () => post(adjust)),
    request("/api/state", null, admin), request("/api/state", null, seller)
  ]);
  assert.equal(results.slice(0, 6).filter(p => !p.result.replayed).length, 1);
  const after = read();
  assert.equal(after.stockMovements.filter(m => m.id === `STK-${count.countId}`).length, 1);
  assert.equal(after.physicalStockAdjustments.filter(a => a.countId === count.countId).length, 1);
  assert.equal(after.products.find(p => p.codigo_producto === "A").stock_fisico, physical - 10);
  assert.equal(after.products.find(p => p.codigo_producto === "A").stock_reservado, reserved);
  for (const key of ["orders", "accounts", "supplierAccounts"]) assert.deepEqual(after[key], before[key], key);
  const sameCount = { ...count, countId: "CNT-HTTP-TEST-002", expectedQty: physical - 10, countedQty: physical - 10 };
  await post(sameCount); await post({ ...adjust, countId: sameCount.countId });
  assert.equal(read().stockMovements.length, after.stockMovements.length, "zero adjustment adds no movement");
  const low = { ...count, countId: "CNT-HTTP-TEST-003", expectedQty: physical - 10, countedQty: Math.max(0, reserved - 1) };
  if (reserved > 0) {
    await post(low); const unchanged = fs.readFileSync(file, "utf8");
    await post({ ...adjust, countId: low.countId }, 400);
    assert.equal(fs.readFileSync(file, "utf8"), unchanged);
  }
  await post({ ...count, countId: "CNT-HTTP-TEST-004", expectedQty: physical }, 400);
  const health = (await request("/api/health")).result;
  assert.equal(health.activeSessions, 2);
  console.log("PASS HTTP: simultaneous retries + state reads, one movement, no stock on count, reserves/accounts unchanged, stale/invalid/password/role checks, sessions retained");
  console.log(JSON.stringify({ responseBytes: Buffer.byteLength(JSON.stringify(results[0].result)), heapLimitMiB: 512, sessions: health.activeSessions }));
}
main().catch(error => { console.error(error); process.exitCode = 1; }).finally(async () => {
  child.kill(); await exited;
  if (path.dirname(folder) !== path.resolve(os.tmpdir()) || !path.basename(folder).startsWith("dl-count-http-")) throw new Error("Unexpected test path");
  fs.rmSync(folder, { recursive: true, force: true });
});
