"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawn } = require("node:child_process");
const engine = require("../order-engine");

const root = path.join(__dirname, "..");
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "dl-v134-"));
const port = 21400 + Math.floor(Math.random() * 300);
const stateFile = path.join(tempDir, "demo-state.json");
const usersFile = path.join(tempDir, "users.json");
fs.copyFileSync(path.join(root, "data", "users.json"), usersFile);

const state = {
  products: [{ codigo_producto: "P-1", name: "Producto", rubro: "General", price: 100, stock_fisico: 100, stock_disponible: 100, activo: "SI" }],
  clients: [{ codigo_cliente: "C-1", name: "Cliente" }],
  sellers: [{ name: "Axel", username: "david", active: true }],
  orders: [], accounts: [], activity: [], stockMovements: [], notifications: [], globalAudit: [], commissionSettlements: []
};
engine.migrateState(state);
state.commissionSettings.rules = [{ id: "AXEL-10", role: "seller", username: "david", userLabel: "Axel", rubro: "*", percent: 10, startsAt: "2026-01-01T00:00:00.000Z", status: "Activa", active: true, priority: 50 }];
const order = engine.createOrder(state, { code: "PED-HTTP-134", client: "Cliente", seller: "Axel", sellerUsername: "david", items: [{ productCode: "P-1", qty: 20, unitPrice: 100 }] }, "Axel");
order.createdAt = "2026-09-05T14:00:00.000Z";
fs.writeFileSync(stateFile, JSON.stringify({ version: Date.now(), state }), "utf8");

const child = spawn(process.execPath, [path.join(root, "server.js")], {
  cwd: root,
  env: { ...process.env, DL_HOST: "127.0.0.1", DL_PORT: String(port), PORT: String(port), DATA_DIR: tempDir, STATE_FILE: stateFile, USERS_FILE: usersFile, DL_VERSION: "8790-134-test", DL_LICENSE_ENFORCEMENT: "disabled", DL_INTEGRITY_ENFORCE: "warn", DL_DEFAULT_PASSWORD: "Lopez2026!" },
  stdio: ["ignore", "pipe", "pipe"]
});
let serverError = "";
child.stderr.on("data", (chunk) => { serverError += chunk.toString(); });
const base = `http://127.0.0.1:${port}`;

async function waitHealth() {
  for (let index = 0; index < 100; index += 1) {
    try { const response = await fetch(`${base}/api/health`); if (response.ok) return; } catch {}
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`Servidor temporal v134 no inicio. ${serverError}`);
}

async function login() {
  const input = { username: "admin1", password: "Lopez2026!", device: { id: "SMOKE-V134", label: "Smoke v134", model: "Node", os: process.platform, appVersion: "8790-134-test" } };
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
  let response = await fetch(`${base}/api/commissions/account?seller=Axel&dateFrom=2026-09-01&dateTo=2026-09-30`, { headers: { Cookie: cookie } });
  let payload = await response.json();
  assert.equal(response.status, 200, payload.error);
  assert.equal(payload.statement.balance, 200);

  response = await fetch(`${base}/api/commissions/settlements`, { method: "POST", headers: { Cookie: cookie, "Content-Type": "application/json" }, body: JSON.stringify({ seller: "Axel", dateFrom: "2026-09-01", dateTo: "2026-09-30", amount: 75, method: "Transferencia", reference: "HTTP-134", motive: "Prueba HTTP parcial" }) });
  payload = await response.json();
  assert.equal(response.status, 200, payload.error);
  assert.equal(payload.statement.paid, 75);
  assert.equal(payload.statement.balance, 125);
  assert.equal(payload.settlement.allocations[0].orderCode, "PED-HTTP-134");

  response = await fetch(`${base}/api/commissions/settlements`, { method: "POST", headers: { Cookie: cookie, "Content-Type": "application/json" }, body: JSON.stringify({ seller: "Axel", dateFrom: "2026-09-01", dateTo: "2026-09-30", amount: 126, method: "Efectivo", motive: "Sobrepago" }) });
  payload = await response.json();
  assert.equal(response.status, 400);
  assert.match(payload.error, /superar el saldo/i);

  const persisted = JSON.parse(fs.readFileSync(stateFile, "utf8")).state;
  assert.equal(persisted.commissionSettlements.length, 1);
  assert.equal(persisted.orders[0].commissionPaidAmount, 75);
  console.log(JSON.stringify({ ok: true, prompt: 134, httpAccount: true, partialPaid: 75, balance: 125, overpaymentStatus: 400 }, null, 2));
})().finally(() => {
  child.kill();
  fs.rmSync(tempDir, { recursive: true, force: true });
}).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
