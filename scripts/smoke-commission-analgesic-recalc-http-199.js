"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawn } = require("node:child_process");
const recalc = require("../commission-analgesic-recalc");

const root = path.join(__dirname, "..");
const sourceUsers = process.env.SMOKE_SOURCE_USERS_FILE || path.join(root, "data", "users.json");
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "dl-commission-recalc-199-"));
const stateFile = path.join(tempDir, "demo-state.json");
const usersFile = path.join(tempDir, "users.json");
const port = 21500 + Math.floor(Math.random() * 200);
fs.copyFileSync(sourceUsers, usersFile);

const products = [
  { codigo_producto: "A-1", name: "Ibuprofeno 400", rubro: "Analgesicos", stock_fisico: 20, stock_reservado: 7, stock_disponible: 13, activo: "SI" },
  { codigo_producto: "C-1", name: "Cigarrillo prueba", rubro: "Cigarrillos", stock_fisico: 10, stock_reservado: 2, stock_disponible: 8, activo: "SI" }
];
const sellers = recalc.OPERATION.sellers.map(item => ({ name: item.name, username: item.usernames[0], active: true }));
const rules = [];
sellers.forEach((seller, index) => {
  rules.push(
    { id: `A-${index}`, role: "seller", username: seller.username, userLabel: seller.name, rubro: "Analgesicos", percent: 10, priority: 50, startsAt: recalc.OPERATION.dateFrom, active: true, status: "Activa" },
    { id: `C-${index}`, role: "seller", username: seller.username, userLabel: seller.name, rubro: "Cigarrillos", percent: 1, priority: 50, startsAt: recalc.OPERATION.dateFrom, active: true, status: "Activa" },
    { id: `G-${index}`, role: "seller", username: seller.username, userLabel: seller.name, rubro: "*", percent: 3, priority: 10, startsAt: recalc.OPERATION.dateFrom, active: true, status: "Activa" }
  );
});
const orders = sellers.map((seller, index) => ({
  code: `PED-HTTP-${index + 1}`, seller: seller.name, sellerUsername: seller.username,
  createdAt: "2026-11-02T15:00:00.000Z", status: "Entregado", commissionPaidAmount: 0,
  items: [
    { productCode: "A-1", name: "Ibuprofeno 400", requestedQty: 10, unitPrice: 100, lineTotal: 1000, rubro: "Analgesicos" },
    { productCode: "C-1", name: "Cigarrillo prueba", requestedQty: 2, unitPrice: 1000, lineTotal: 2000, rubro: "Cigarrillos" }
  ],
  commissions: {
    seller: { role: "seller", total: 50, lines: [
      { productCode: "A-1", productName: "Ibuprofeno 400", rubro: "Analgesicos", quantity: 10, baseAmount: 1000, percent: 3, commission: 30 },
      { productCode: "C-1", productName: "Cigarrillo prueba", rubro: "Cigarrillos", quantity: 2, baseAmount: 2000, percent: 1, commission: 20 }
    ] },
    driver: { role: "driver", total: 17, cigarettes: 7, merchandise: 10, lines: [{ productCode: "D-1", percent: 4, commission: 17 }] },
    total: 67, cigarettes: 27, merchandise: 40
  }
}));
const initialPayload = { version: 1, state: {
  products, sellers, orders,
  commissionSettings: { accrual: { seller: "pedido" }, rules },
  commissionSettlements: [], commissionAudit: [], accounts: [], clients: [], stockMovements: [], activity: [], notifications: [], globalAudit: []
} };
fs.writeFileSync(stateFile, JSON.stringify(initialPayload), "utf8");

const child = spawn(process.execPath, [path.join(root, "server.js")], {
  cwd: root,
  env: {
    ...process.env,
    DL_HOST: "127.0.0.1", DL_PORT: String(port), PORT: String(port), DATA_DIR: tempDir,
    STATE_FILE: stateFile, USERS_FILE: usersFile, DL_VERSION: "8790-199-test",
    DL_LICENSE_ENFORCEMENT: "disabled", DL_INTEGRITY_ENFORCE: "warn", DL_DEFAULT_PASSWORD: "Lopez2026!"
  },
  stdio: ["ignore", "pipe", "pipe"]
});
let serverOutput = "";
child.stdout.on("data", chunk => { serverOutput += chunk.toString(); });
child.stderr.on("data", chunk => { serverOutput += chunk.toString(); });
child.on("error", error => { serverOutput += error.message; });
const base = `http://127.0.0.1:${port}`;

async function waitHealth() {
  let lastHealth = "";
  for (let attempt = 0; attempt < 120; attempt += 1) {
    try {
      const response = await fetch(`${base}/api/health`);
      if (response.ok) return;
      lastHealth = `${response.status} ${await response.text()}`;
    } catch (error) { lastHealth = error.message; }
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw new Error(`Servidor temporal no inicio. ${serverOutput} ${lastHealth}`);
}

async function login() {
  const input = { username: "admin1", password: "Lopez2026!", device: { id: "SMOKE-COM-199", label: "Smoke comisiones", model: "Node", os: process.platform, appVersion: "8790-199-test" } };
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
  let response = await fetch(`${base}/api/commissions/recalculate`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ operationId: recalc.OPERATION.id, previewOnly: true })
  });
  assert.equal(response.status, 401, "anonymous preview must be rejected");
  const cookie = await login();
  const stateBeforePreview = fs.readFileSync(stateFile, "utf8");

  response = await fetch(`${base}/api/commissions/recalculate`, {
    method: "POST", headers: { Cookie: cookie, "Content-Type": "application/json" },
    body: JSON.stringify({ operationId: recalc.OPERATION.id, previewOnly: true })
  });
  let payload = await response.json();
  assert.equal(response.status, 200, payload.error);
  assert.equal(payload.preview.count, 4);
  assert.equal(payload.preview.report.totals.commissionAmount, 400);
  assert.equal(fs.readFileSync(stateFile, "utf8"), stateBeforePreview, "preview HTTP must not persist state");

  response = await fetch(`${base}/api/commissions/recalculate`, {
    method: "POST", headers: { Cookie: cookie, "Content-Type": "application/json", "X-ERP-Response": "compact-v1" },
    body: JSON.stringify({ operationId: recalc.OPERATION.id, fingerprint: payload.preview.fingerprint })
  });
  payload = await response.json();
  assert.equal(response.status, 200, payload.error);
  assert.equal(payload.count, 4);
  assert.equal(payload.report.totals.commissionAmount, 400);
  const afterFirst = fs.readFileSync(stateFile, "utf8");
  const persisted = JSON.parse(afterFirst).state;
  assert.equal(persisted.orders[0].commissions.seller.lines[0].percent, 10);
  assert.equal(persisted.orders[0].commissions.seller.lines[1].percent, 1);
  assert.equal(persisted.orders[0].commissions.driver.total, 17);
  assert.ok(persisted.commissionAudit.some(entry => entry.operationId === recalc.OPERATION.id && entry.action === "COMISION_RECALCULO_OPERACION"));

  response = await fetch(`${base}/api/commissions/recalculate`, {
    method: "POST", headers: { Cookie: cookie, "Content-Type": "application/json" },
    body: JSON.stringify({ operationId: recalc.OPERATION.id, fingerprint: payload.fingerprint })
  });
  const duplicate = await response.json();
  assert.equal(response.status, 200, duplicate.error);
  assert.equal(duplicate.alreadyExecuted, true);
  assert.equal(fs.readFileSync(stateFile, "utf8"), afterFirst, "duplicate API retry must not write state again");

  console.log(JSON.stringify({ ok: true, previewNonMutating: true, anonymousBlocked: true, recalculatedOrders: 4, reportRows: payload.report.details.length, driverCommissionPreserved: true, auditSaved: true, duplicateBlocked: true }, null, 2));
})().finally(() => {
  child.kill();
  fs.rmSync(tempDir, { recursive: true, force: true });
}).catch(error => {
  console.error(error);
  process.exitCode = 1;
});
