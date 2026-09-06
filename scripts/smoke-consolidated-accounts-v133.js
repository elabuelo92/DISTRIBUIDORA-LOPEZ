"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawn } = require("node:child_process");
const orderEngine = require("../order-engine");

const root = path.join(__dirname, "..");
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "dl-v133-"));
const port = 28000 + Math.floor(Math.random() * 4000);
const stateFile = path.join(tempDir, "demo-state.json");
const usersFile = path.join(tempDir, "users.json");
fs.copyFileSync(path.join(root, "data", "users.json"), usersFile);

const state = {
  clients: [{ codigo_cliente: "C-133", name: "Cliente Cuenta 133", cuit: "20-133", balance: 1000, saldo_actual: 1000, limit: 5000, status: "Activo" }],
  suppliers: [{ name: "Proveedor Cuenta 133", cuit: "30-133", balance: 800, totalPurchased: 1200, totalPaid: 400, status: "A pagar", movements: [] }],
  accounts: [{ id: "ACC-BASE", date: "05/09/2026", type: "Venta", account: "Cliente Cuenta 133", method: "Cuenta corriente", debit: 1000, credit: 0, balance: 1000 }],
  supplierMovements: [{ id: "REM-133", type: "Remito", supplier: "Proveedor Cuenta 133", amount: 1200, date: "05/09/2026", economicValidated: true }],
  orders: [], products: [], sellers: [], activity: [], stockMovements: [], notifications: [], globalAudit: []
};
orderEngine.migrateState(state);
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

async function login() {
  const input = { username: "admin1", password: "Lopez2026!", device: { id: "SMOKE-V133", label: "Smoke v133" } };
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
  console.log(JSON.stringify({ ok: true, prompt: 133, clientBalance: 700, supplierBalance: 800, selectedMethod: "Transferencia", overpaymentStatus: 400, doubleClickAccount: true }, null, 2));
})().finally(() => {
  child.kill();
  fs.rmSync(tempDir, { recursive: true, force: true });
}).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
