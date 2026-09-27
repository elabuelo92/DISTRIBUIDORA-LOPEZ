"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawn } = require("node:child_process");
const OrderEngine = require("../order-engine");

const root = path.resolve(__dirname, "..");
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "dl-edit-v154-"));
const stateFile = path.join(tempDir, "demo-state.json");
const usersFile = path.join(tempDir, "users.json");
fs.copyFileSync(path.join(root, "data", "users.json"), usersFile);

const state = {
  products: [{ codigo_producto: "624", name: "TOA Doncella C/alas x 8", stock_fisico: 2000, stock_actual: 2000, stock: 2000, stock_reservado: 0, price: 999 }],
  clients: [{ name: "Cliente prueba", domicilio: "Calle 1", localidad: "Cordoba", zona: "Centro" }],
  sellers: [], orders: [], activity: [], stockMovements: [], deliveryRoutes: [], deliveryAudit: [],
  deliveryClosures: [], accounts: [], notifications: [], globalAudit: [], priceLists: []
};
const order = OrderEngine.createOrder(state, {
  client: "Cliente prueba", seller: "Prueba", items: [{ productCode: "624", qty: 11 }]
}, "Prueba v154");
fs.writeFileSync(stateFile, JSON.stringify({ version: Date.now(), state }), "utf8");

const port = 20800 + Math.floor(Math.random() * 1000);
const child = spawn(process.execPath, [path.join(root, "server.js")], {
  cwd: root,
  env: {
    ...process.env, DL_HOST: "127.0.0.1", DL_PORT: String(port), PORT: String(port),
    DATA_DIR: tempDir, STATE_FILE: stateFile, USERS_FILE: usersFile,
    DL_VERSION: "8790-154", DL_LICENSE_ENFORCEMENT: "disabled", DL_INTEGRITY_ENFORCE: "warn",
    DL_DEFAULT_PASSWORD: "Lopez2026!"
  },
  stdio: ["ignore", "pipe", "pipe"]
});
const base = `http://127.0.0.1:${port}`;
let serverError = "";
child.stderr.on("data", (chunk) => { serverError += chunk.toString(); });

async function waitHealth() {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    try {
      const response = await fetch(`${base}/api/health`);
      if (response.ok) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`Servidor temporal no inicio: ${serverError.slice(-500)}`);
}

async function login() {
  const input = {
    username: "admin1", password: "Lopez2026!",
    device: { id: "SMOKE-EDIT-V154", label: "Prueba local", model: "Node", os: process.platform, appVersion: "8790-154" }
  };
  let response = await fetch(`${base}/api/login`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input)
  });
  if (response.status === 428) {
    const required = await response.json();
    input.legalAcceptance = { accepted: true, version: required.legal.currentVersion, hash: required.legal.hash };
    response = await fetch(`${base}/api/login`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input)
    });
  }
  const payload = await response.json();
  assert.equal(response.status, 200, payload.error || "Login fallido");
  return String(response.headers.get("set-cookie") || "").split(";")[0];
}

async function edit(cookie, qty, options = {}) {
  const response = await fetch(`${base}/api/orders/${encodeURIComponent(order.code)}/edit`, {
    method: "POST",
    headers: { Cookie: cookie, "Content-Type": "application/json" },
    body: JSON.stringify({
      items: [{ productCode: "624", name: "TOA Doncella C/alas x 8", qty, unitPrice: 999 }],
      motive: "Prueba control de cantidad", expectedUpdatedAt: order.updatedAt, ...options
    })
  });
  return { status: response.status, body: await response.json() };
}

(async () => {
  try {
    await waitHealth();
    const cookie = await login();
    const rejected = await edit(cookie, 852);
    assert.equal(rejected.status, 409);
    assert.equal(rejected.body.unusualQuantities[0].beforeQty, 11);
    assert.equal(rejected.body.unusualQuantities[0].afterQty, 852);
    assert.equal(JSON.parse(fs.readFileSync(stateFile, "utf8")).state.orders[0].items[0].requestedQty, 11);

    const confirmed = await edit(cookie, 852, { confirmLargeQuantities: true });
    assert.equal(confirmed.status, 200, confirmed.body.error);
    assert.equal(confirmed.body.order.items[0].requestedQty, 852);

    const stale = await edit(cookie, 853, { confirmLargeQuantities: true });
    assert.equal(stale.status, 409);
    assert.equal(JSON.parse(fs.readFileSync(stateFile, "utf8")).state.orders[0].items[0].requestedQty, 852);
    console.log(JSON.stringify({ ok: true, version: "8790-154", rejected: 409, confirmed: 200, stale: 409 }));
  } finally {
    child.kill();
    const resolved = fs.realpathSync(tempDir);
    const tempRoot = fs.realpathSync(os.tmpdir());
    if (!resolved.startsWith(tempRoot + path.sep)) throw new Error("Ruta temporal fuera de lugar.");
    fs.rmSync(resolved, { recursive: true, force: true });
  }
})().catch((error) => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
