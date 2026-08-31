"use strict";

const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawn } = require("node:child_process");

const root = path.join(__dirname, "..");
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "dl-v120-history-"));
const port = Number(process.env.DL_TEST_PORT || (21000 + Math.floor(Math.random() * 300)));
const keepServer = process.env.DL_V120_UI_KEEP === "1";
const stateFile = path.join(tempDir, "demo-state.json");
const usersFile = path.join(tempDir, "users.json");
const salt = crypto.randomBytes(16).toString("hex");
const passwordHash = crypto.pbkdf2Sync("History-120", salt, 120000, 32, "sha256").toString("hex");
fs.writeFileSync(usersFile, JSON.stringify({ users: [{ username: "sofia", name: "Sofia Benitez", sellerName: "Sofia Benitez", role: "seller", active: true, salt, passwordHash }] }, null, 2));

const orders = Array.from({ length: 12 }, (_, index) => {
  const number = index + 1;
  return {
    code: `PED-H${String(number).padStart(2, "0")}`,
    client: "Kiosco Historial",
    seller: "Sofia Benitez",
    sellerUsername: "sofia",
    amount: number * 100,
    status: number === 3 ? "Cancelado" : "Entregado",
    paymentMethod: number % 2 ? "Contado" : "Transferencia",
    createdAt: new Date(Date.UTC(2026, 7, number, 12, 0, 0)).toISOString(),
    items: [
      { productCode: "P-1", name: "Producto frecuente", requestedQty: number, unitPrice: 80, discountPct: 0, lineTotal: number * 80 },
      { productCode: `P-${number + 1}`, name: `Producto ${number}`, requestedQty: 1, unitPrice: 20, discountPct: 0, lineTotal: 20 }
    ]
  };
});
const state = {
  products: [],
  clients: [{ codigo_cliente: "C-HIST", name: "Kiosco Historial", nombre_comercial: "Kiosco Historial", vendedor_asignado: "Sofia Benitez", seller: "Sofia Benitez", status: "Activo" }],
  sellers: [{ name: "Sofia Benitez", username: "sofia" }],
  orders,
  noPurchaseVisits: [{ id: "V-1", clientCode: "C-HIST", client: "Kiosco Historial", seller: "Sofia Benitez", at: "2026-08-20T12:00:00.000Z" }],
  accounts: [], activity: [], notifications: [], globalAudit: [], priceLists: [], commissionAudit: []
};
fs.writeFileSync(stateFile, JSON.stringify({ version: Date.now(), state }), "utf8");

const child = spawn(process.execPath, [path.join(root, "server.js")], {
  cwd: root,
  env: { ...process.env, DL_HOST: "127.0.0.1", DL_PORT: String(port), PORT: String(port), DATA_DIR: tempDir, STATE_FILE: stateFile, USERS_FILE: usersFile, DL_VERSION: "8790-120", DL_LICENSE_ENFORCEMENT: "disabled", DL_INTEGRITY_ENFORCE: "warn" },
  stdio: ["ignore", "pipe", "pipe"]
});

let serverOutput = "";
let serverExit = "running";
child.stdout.on("data", (chunk) => { serverOutput += chunk.toString(); });
child.stderr.on("data", (chunk) => { serverOutput += chunk.toString(); });
child.on("error", (error) => { serverOutput += error.stack || error.message; });
child.on("exit", (code, signal) => { serverExit = `exit=${code} signal=${signal || "none"}`; });

async function request(pathname, options = {}) {
  const response = await fetch(`http://127.0.0.1:${port}/${pathname}`, {
    method: options.method || "GET",
    headers: { ...(options.cookie ? { Cookie: options.cookie } : {}), ...(options.body ? { "Content-Type": "application/json" } : {}) },
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  const text = await response.text();
  const payload = text ? JSON.parse(text) : {};
  return { response, payload, bytes: Buffer.byteLength(text), cookie: response.headers.get("set-cookie") || "" };
}

async function waitForServer() {
  for (let attempt = 0; attempt < 120; attempt += 1) {
    try {
      const result = await request("api/health");
      if (result.response.ok) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`Servidor v120 no inicio (${serverExit}). ${serverOutput}`);
}

(async () => {
  await waitForServer();
  const loginInput = { username: "sofia", password: "History-120", device: { id: "SMOKE-HISTORY-120" } };
  let login = await request("api/login", { method: "POST", body: loginInput });
  if (login.response.status === 428) {
    login = await request("api/login", { method: "POST", body: { ...loginInput, legalAcceptance: { accepted: true, version: login.payload.legal.currentVersion, hash: login.payload.legal.hash } } });
  }
  assert.equal(login.response.status, 200);
  const cookie = login.cookie.split(";")[0];

  const pageOne = await request("api/clients/C-HIST/history?page=1&limit=5", { cookie });
  assert.equal(pageOne.response.status, 200);
  assert.equal(pageOne.payload.orders.length, 5);
  assert.equal(pageOne.payload.pagination.total, 12);
  assert.equal(pageOne.payload.pagination.hasMore, true);
  assert.equal(pageOne.payload.orders[0].code, "PED-H12");
  assert.equal(Object.prototype.hasOwnProperty.call(pageOne.payload.orders[0], "items"), false);
  assert.equal(pageOne.payload.summary.lastTotal, 1200);
  assert.equal(pageOne.payload.summary.frequentProducts[0].name, "Producto frecuente");
  assert.equal(pageOne.payload.summary.lastVisitAt, "2026-08-20T12:00:00.000Z");

  const pageTwo = await request("api/clients/C-HIST/history?page=2&limit=5", { cookie });
  assert.equal(pageTwo.payload.orders.length, 5);
  assert.equal(pageTwo.payload.pagination.page, 2);

  const detail = await request("api/clients/C-HIST/history/PED-H12", { cookie });
  assert.equal(detail.response.status, 200);
  assert.equal(detail.payload.order.items.length, 2);
  assert.equal(detail.payload.order.items[0].unitPrice, 80);

  const audit = await request("api/preventa/audit-consultation", { cookie, method: "POST", body: { action: "CLIENTE_HISTORIAL_CONSULTA", seller: "Sofia Benitez", note: "C-HIST" } });
  assert.equal(audit.response.status, 200);
  assert.equal(audit.payload.compact, true);
  assert.equal(audit.payload.state, undefined);

  console.log(JSON.stringify({
    ok: true,
    pageSize: pageOne.payload.orders.length,
    totalOrders: pageOne.payload.pagination.total,
    listResponseBytes: pageOne.bytes,
    detailResponseBytes: detail.bytes,
    auditResponseBytes: audit.bytes,
    progressiveDetail: true,
    compactAudit: true
  }, null, 2));
  if (keepServer) {
    console.log(`UI_FIXTURE_READY http://127.0.0.1:${port}/ usuario=sofia clave=History-120`);
    await new Promise(() => {});
  }
})().catch((error) => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
}).finally(() => {
  child.kill("SIGTERM");
});
