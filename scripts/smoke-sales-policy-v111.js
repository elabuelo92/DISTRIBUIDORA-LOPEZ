"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawn } = require("node:child_process");

const root = path.join(__dirname, "..");
const sourceDataDir = process.env.SMOKE_SOURCE_DATA_DIR || path.join(root, "data");
const sourceState = process.env.SMOKE_SOURCE_STATE_FILE || path.join(sourceDataDir, "demo-state.json");
const sourceUsers = process.env.SMOKE_SOURCE_USERS_FILE || path.join(sourceDataDir, "users.json");
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "dl-sales-policy-v111-"));
const stateFile = path.join(tempDir, "demo-state.json");
const usersFile = path.join(tempDir, "users.json");
const port = 20100 + Math.floor(Math.random() * 80);

const statePayload = JSON.parse(fs.readFileSync(sourceState, "utf8"));
const state = statePayload.state || statePayload;
state.salesPolicy = { allowPreorderWithoutStock: false };
state.clients = Array.isArray(state.clients) ? state.clients : [];
state.clients.unshift({ codigo_cliente: "POL-CLIENT", name: "Cliente Politica", nombre_comercial: "Cliente Politica", balance: 0, limit: 999999, limite_credito: 999999, status: "Activo", estado: "Activo" });
state.products = Array.isArray(state.products) ? state.products : [];
state.products.unshift({ codigo_producto: "POL-ZERO", name: "Producto Agotado Politica", descripcion: "Producto Agotado Politica", rubro: "General", stock_fisico: 0, stock_actual: 0, stock_reservado: 0, stock_disponible: 0, precio_lista_2: 100, price: 100, activo: "SI" });
fs.writeFileSync(stateFile, JSON.stringify(statePayload, null, 2));
fs.copyFileSync(sourceUsers, usersFile);

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
    DL_VERSION: "8790-111",
    DL_DEFAULT_PASSWORD: "Lopez2026!",
    DL_LICENSE_ENFORCEMENT: "disabled",
    DL_INTEGRITY_ENFORCE: "warn"
  },
  stdio: ["ignore", "pipe", "pipe"]
});
let output = "";
child.stdout.on("data", (chunk) => { output += chunk.toString(); });
child.stderr.on("data", (chunk) => { output += chunk.toString(); });
const base = `http://127.0.0.1:${port}`;

async function waitForHealth() {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    try {
      const response = await fetch(`${base}/api/health`);
      if (response.ok) return response.json();
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`Servidor temporal no disponible. ${output}`);
}

async function login() {
  const input = { username: "admin1", password: "Lopez2026!", device: { id: "SMOKE-POLICY", model: "Node", os: process.platform, appVersion: "8790-111" } };
  let response = await fetch(`${base}/api/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
  if (response.status === 428) {
    const required = await response.json();
    input.legalAcceptance = { accepted: true, version: required.legal.currentVersion, hash: required.legal.hash };
    response = await fetch(`${base}/api/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
  }
  assert.equal(response.status, 200, "login administrativo");
  return String(response.headers.get("set-cookie") || "").split(";")[0];
}

async function request(url, cookie, body) {
  const response = await fetch(`${base}${url}`, {
    method: "POST",
    headers: { Cookie: cookie, "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  return { response, payload: await response.json() };
}

(async () => {
  const health = await waitForHealth();
  assert.equal(health.version, "8790-111");
  const cookie = await login();
  const orderBody = { client: "Cliente Politica", seller: "Administracion", items: [{ productCode: "POL-ZERO", qty: 1, unitPrice: 100 }], paymentMethod: "Contado", source: "dashboard" };

  const blocked = await request("/api/orders", cookie, orderBody);
  assert.equal(blocked.response.status, 409);
  assert.equal(blocked.payload.code, "OUT_OF_STOCK_BLOCKED");

  const wrongPassword = await request("/api/admin/sales-policy", cookie, { allowPreorderWithoutStock: true, motive: "Prueba", adminPassword: "incorrecta" });
  assert.equal(wrongPassword.response.status, 403);

  const enabled = await request("/api/admin/sales-policy", cookie, { allowPreorderWithoutStock: true, motive: "Prueba automatizada", adminPassword: "Lopez2026!" });
  assert.equal(enabled.response.status, 200, enabled.payload.error);
  assert.equal(enabled.payload.salesPolicy.allowPreorderWithoutStock, true);

  const accepted = await request("/api/orders", cookie, orderBody);
  assert.equal(accepted.response.status, 200, accepted.payload.error);
  assert.equal(accepted.payload.order.items[0].missingQty, 1);

  console.log(JSON.stringify({ ok: true, version: health.version, blockedWithoutPolicy: true, wrongPasswordRejected: true, allowedWithPolicy: true, auditAction: "POLITICA_PREVENTA_STOCK_ACTUALIZADA" }, null, 2));
})().finally(() => {
  child.kill();
  fs.rmSync(tempDir, { recursive: true, force: true });
}).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
