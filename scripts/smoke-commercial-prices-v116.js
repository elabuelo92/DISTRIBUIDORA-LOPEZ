"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawn } = require("node:child_process");
const orderEngine = require("../order-engine");

const root = path.join(__dirname, "..");
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "dl-v116-"));
const port = 20700 + Math.floor(Math.random() * 200);
const stateFile = path.join(tempDir, "demo-state.json");
const usersFile = path.join(tempDir, "users.json");
fs.copyFileSync(path.join(root, "data", "users.json"), usersFile);

const state = {
  products: [
    { codigo_producto: "P-1", name: "Producto uno", price: 1000, precio_lista_1: 950, precio_lista_2: 1000, stock_fisico: 100, stock_actual: 100, stock_disponible: 100, activo: "SI" },
    { codigo_producto: "P-2", name: "Producto dos", price: 2500, precio_lista_1: 2400, precio_lista_2: 2500, stock_fisico: 100, stock_actual: 100, stock_disponible: 100, activo: "SI" }
  ],
  clients: [{ codigo_cliente: "C-1", name: "Cliente prueba", nombre_comercial: "Cliente prueba", creditLimit: 100000 }],
  sellers: [], accounts: [], orders: [], activity: [], stockMovements: [], priceLists: [], priceListAudit: [], notifications: [], globalAudit: []
};
orderEngine.migrateState(state);
const order = orderEngine.createOrder(state, {
  code: "PED-V116",
  client: "Cliente prueba",
  seller: "Vendedor prueba",
  sellerUsername: "vendedor-prueba",
  paymentMethod: "Contado",
  items: [{ productCode: "P-1", qty: 2, unitPrice: 1000 }],
  commercialRequest: { type: "general_discount", proposedValue: 10, discountPct: 10, motive: "Descuento de prueba" }
}, "Vendedor prueba");
assert.equal(order.amount, 2000);
fs.writeFileSync(stateFile, JSON.stringify({ version: Date.now(), state }), "utf8");

const child = spawn(process.execPath, [path.join(root, "server.js")], {
  cwd: root,
  env: {
    ...process.env,
    DL_HOST: "127.0.0.1", DL_PORT: String(port), PORT: String(port),
    DATA_DIR: tempDir, STATE_FILE: stateFile, USERS_FILE: usersFile,
    DL_VERSION: "8790-116", DL_LICENSE_ENFORCEMENT: "disabled", DL_INTEGRITY_ENFORCE: "warn",
    DL_DEFAULT_PASSWORD: "Lopez2026!"
  },
  stdio: ["ignore", "pipe", "pipe"]
});
let serverError = "";
child.stderr.on("data", (chunk) => { serverError += chunk.toString(); });
const base = `http://127.0.0.1:${port}`;

async function waitHealth() {
  for (let index = 0; index < 100; index += 1) {
    try {
      const response = await fetch(`${base}/api/health`);
      if (response.ok) return response.json();
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`Servidor temporal v116 no inicio. ${serverError}`);
}

async function login() {
  const input = { username: "admin1", password: "Lopez2026!", device: { id: "SMOKE-V116", label: "Smoke v116", model: "Node", os: process.platform, appVersion: "8790-116" } };
  let response = await fetch(`${base}/api/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
  if (response.status === 428) {
    const required = await response.json();
    input.legalAcceptance = { accepted: true, version: required.legal.currentVersion, hash: required.legal.hash };
    response = await fetch(`${base}/api/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
  }
  assert.equal(response.status, 200);
  return String(response.headers.get("set-cookie") || "").split(";")[0];
}

async function post(cookie, endpoint, body) {
  const response = await fetch(`${base}/${endpoint}`, { method: "POST", headers: { Cookie: cookie, "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const payload = JSON.parse(await response.text() || "{}");
  assert.equal(response.status, 200, payload.error || endpoint);
  return payload;
}

(async () => {
  const health = await waitHealth();
  assert.equal(health.version, "8790-116");
  const cookie = await login();

  const approval = await post(cookie, "api/orders/PED-V116/commercial-approval", { decision: "approve", motive: "Autorizado en smoke v116" });
  assert.equal(approval.compact, true);
  assert.equal(approval.amountBefore, 2000);
  assert.equal(approval.amountAfter, 1800);
  assert.equal(approval.discountApplied, 200);
  assert.equal(approval.order.items[0].discountPct, 10);
  assert.equal(approval.order.items[0].lineTotal, 1800);

  const derived = await post(cookie, "api/price-lists/derive", {
    sourceList: 2, targetList: 1, discountPct: 8, confirmed: true, motive: "Prueba Lista 1 desde Lista 2"
  });
  assert.equal(derived.compact, true);
  assert.equal(derived.affected, 2);

  const persisted = JSON.parse(fs.readFileSync(stateFile, "utf8")).state;
  const productOne = persisted.products.find((item) => item.codigo_producto === "P-1");
  const productTwo = persisted.products.find((item) => item.codigo_producto === "P-2");
  const persistedOrder = persisted.orders.find((item) => item.code === "PED-V116");
  assert.equal(productOne.precio_lista_1, 920);
  assert.equal(productTwo.precio_lista_1, 2300);
  assert.equal(productOne.precio_lista_2, 1000);
  assert.equal(productTwo.precio_lista_2, 2500);
  assert.equal(productOne.price, 1000);
  assert.equal(persistedOrder.amount, 1800, "la regeneracion de listas no altera pedidos historicos");

  const appSource = fs.readFileSync(path.join(root, "app.js"), "utf8");
  const htmlSource = fs.readFileSync(path.join(root, "index.html"), "utf8");
  assert.match(appSource, /function exportSelectedPriceListPdf\(\)/);
  assert.match(htmlSource, /id="exportPriceListPdfBtn"/);

  console.log(JSON.stringify({
    ok: true, version: health.version, approvedOrderTotal: approval.amountAfter,
    discountApplied: approval.discountApplied, listOneProductOne: productOne.precio_lista_1,
    listOneProductTwo: productTwo.precio_lista_1, listTwoPreserved: true,
    historicalOrderPreserved: true, pdfExportAvailable: true
  }, null, 2));
})().finally(() => {
  child.kill();
  fs.rmSync(tempDir, { recursive: true, force: true });
}).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
