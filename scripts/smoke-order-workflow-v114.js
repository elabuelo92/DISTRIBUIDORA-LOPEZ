"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawn } = require("node:child_process");
const orderEngine = require("../order-engine");

const root = path.join(__dirname, "..");
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "dl-v114-"));
const port = 20300 + Math.floor(Math.random() * 200);
const stateFile = path.join(tempDir, "demo-state.json");
const usersFile = path.join(tempDir, "users.json");
fs.copyFileSync(path.join(root, "data", "users.json"), usersFile);

const state = {
  products: [{ codigo_producto: "P-V114", name: "Producto v114", descripcion: "Producto v114", stock_fisico: 100, stock_actual: 100, stock: 100, stock_reservado: 0, stock_en_transito: 0, price: 1000 }],
  clients: [{ name: "Cliente v114", domicilio: "Prueba 114", localidad: "Cordoba", zona: "Centro", ruta: "Centro" }],
  sellers: [],
  orders: [],
  activity: [],
  stockMovements: [],
  deliveryRoutes: [],
  deliveryAudit: [],
  deliveryClosures: [],
  accounts: [],
  performanceFixture: "x".repeat(2_000_000)
};
const created = orderEngine.createOrder(state, {
  client: "Cliente v114",
  seller: "Sofia",
  items: [{ productCode: "P-V114", qty: 2 }]
}, "Smoke v114");
assert.equal(created.status, orderEngine.STATUS.READY);
fs.writeFileSync(stateFile, JSON.stringify({ version: Date.now(), state }), "utf8");

const child = spawn(process.execPath, [path.join(root, "server.js")], {
  cwd: root,
  env: {
    ...process.env,
    DL_HOST: "127.0.0.1",
    DL_PORT: String(port),
    PORT: String(port),
    DATA_DIR: tempDir,
    STATE_FILE: stateFile,
    USERS_FILE: usersFile,
    DL_VERSION: "8790-114",
    DL_LICENSE_ENFORCEMENT: "disabled",
    DL_INTEGRITY_ENFORCE: "warn",
    DL_DEFAULT_PASSWORD: "Lopez2026!"
  },
  stdio: ["ignore", "pipe", "pipe"]
});

const base = `http://127.0.0.1:${port}`;

async function waitHealth() {
  for (let index = 0; index < 100; index += 1) {
    try {
      const response = await fetch(`${base}/api/health`);
      if (response.ok) return response.json();
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error("Servidor temporal v114 no inicio.");
}

async function login() {
  const input = { username: "admin1", password: "Lopez2026!", device: { id: "SMOKE-V114", label: "Smoke v114", model: "Node", os: process.platform, appVersion: "8790-114" } };
  let response = await fetch(`${base}/api/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
  if (response.status === 428) {
    const required = await response.json();
    input.legalAcceptance = { accepted: true, version: required.legal.currentVersion, hash: required.legal.hash };
    response = await fetch(`${base}/api/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
  }
  assert.equal(response.status, 200);
  return String(response.headers.get("set-cookie") || "").split(";")[0];
}

async function post(cookie, endpoint, body, expectedStatus = 200) {
  const started = performance.now();
  const response = await fetch(`${base}/${endpoint}`, { method: "POST", headers: { Cookie: cookie, "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const raw = await response.text();
  const payload = JSON.parse(raw || "{}");
  assert.equal(response.status, expectedStatus, payload.error || endpoint);
  return { payload, bytes: Buffer.byteLength(raw), elapsedMs: Math.round((performance.now() - started) * 10) / 10 };
}

(async () => {
  const health = await waitHealth();
  assert.equal(health.version, "8790-114");
  const cookie = await login();
  const code = created.code;
  const fullStateResponse = await fetch(`${base}/api/state?version=0`, { headers: { Cookie: cookie } });
  const fullStateRaw = await fullStateResponse.text();
  assert.equal(fullStateResponse.status, 200);
  const fullStateBytes = Buffer.byteLength(fullStateRaw);

  const assembly = await post(cookie, "api/orders/bulk-workflow", { orderCodes: [code], action: "assembly" });
  assert.equal(assembly.payload.compact, true);
  assert.equal(assembly.payload.orders[0].status, orderEngine.STATUS.ASSEMBLY);
  assert.ok(assembly.bytes < 100_000, `Respuesta masiva demasiado grande: ${assembly.bytes}`);

  const blockedBeforeLabel = await post(cookie, "api/orders/bulk-workflow", { orderCodes: [code], action: "verify-ready" });
  assert.equal(blockedBeforeLabel.payload.changed, 0);
  assert.match(blockedBeforeLabel.payload.errors[0].error, /Escanear fisicamente/);

  const labeled = await post(cookie, "api/orders/bulk-workflow", { orderCodes: [code], action: "labels" });
  assert.equal(labeled.payload.orders[0].status, orderEngine.STATUS.LABELED);
  assert.ok(labeled.bytes < 100_000, `Respuesta de etiqueta demasiado grande: ${labeled.bytes}`);

  const blockedBeforeScan = await post(cookie, "api/orders/bulk-workflow", { orderCodes: [code], action: "verify-ready" });
  assert.equal(blockedBeforeScan.payload.changed, 0);
  assert.match(blockedBeforeScan.payload.errors[0].error, /Escanear fisicamente/);

  const scanned = await post(cookie, `api/orders/${encodeURIComponent(code)}/scan`, { scanValue: code });
  assert.equal(scanned.payload.compact, true);
  assert.equal(scanned.payload.order.status, orderEngine.STATUS.READY_DISPATCH);
  assert.ok(scanned.bytes < 100_000, `Respuesta de scanner demasiado grande: ${scanned.bytes}`);

  const verified = await post(cookie, "api/orders/bulk-workflow", { orderCodes: [code], action: "verify-ready" });
  assert.equal(verified.payload.errors.length, 0);
  assert.equal(verified.payload.processed[0].status, orderEngine.STATUS.READY_DISPATCH);

  const directDispatch = await post(cookie, "api/orders/bulk-workflow", { orderCodes: [code], action: "dispatch" }, 400);
  assert.match(directDispatch.payload.error, /Despacho requiere etiqueta, scanner y hoja de ruta/);

  const persisted = JSON.parse(fs.readFileSync(stateFile, "utf8"));
  const savedOrder = persisted.state.orders.find((order) => order.code === code);
  assert.equal(savedOrder.status, orderEngine.STATUS.READY_DISPATCH);
  assert.equal(savedOrder.assembly.label.scanned, true);
  assert.ok((savedOrder.trace || []).some((entry) => entry.action === "PEDIDO_ETIQUETA_GENERADA"));
  assert.ok((savedOrder.trace || []).some((entry) => entry.action === "PEDIDO_ETIQUETA_ESCANEADA"));

  console.log(JSON.stringify({
    ok: true,
    version: health.version,
    fullStateBytes,
    responseBytes: { assembly: assembly.bytes, labeled: labeled.bytes, scanned: scanned.bytes },
    elapsedMs: { assembly: assembly.elapsedMs, labeled: labeled.elapsedMs, scanned: scanned.elapsedMs },
    physicalScannerRequired: true,
    directDispatchBlocked: true,
    finalStatus: savedOrder.status
  }, null, 2));
})().finally(() => {
  child.kill();
  fs.rmSync(tempDir, { recursive: true, force: true });
}).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
