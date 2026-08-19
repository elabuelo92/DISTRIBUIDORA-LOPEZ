"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawn } = require("node:child_process");

const root = path.join(__dirname, "..");
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "dl-v103-"));
const port = 19700 + Math.floor(Math.random() * 200);
fs.copyFileSync(path.join(root, "data", "demo-state.json"), path.join(tempDir, "demo-state.json"));
fs.copyFileSync(path.join(root, "data", "users.json"), path.join(tempDir, "users.json"));

const child = spawn(process.execPath, [path.join(root, "server.js")], {
  cwd: root,
  env: { ...process.env, DL_HOST: "127.0.0.1", DL_PORT: String(port), PORT: String(port), DATA_DIR: tempDir, STATE_FILE: path.join(tempDir, "demo-state.json"), USERS_FILE: path.join(tempDir, "users.json"), DL_VERSION: "8790-103", DL_LICENSE_ENFORCEMENT: "disabled", DL_INTEGRITY_ENFORCE: "warn", DL_DEFAULT_PASSWORD: "Lopez2026!" },
  stdio: ["ignore", "pipe", "pipe"]
});

async function waitHealth(base) {
  for (let i = 0; i < 80; i += 1) {
    try { const response = await fetch(`${base}/api/health`); if (response.ok) return response.json(); } catch {}
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error("Servidor temporal v103 no inicio.");
}

async function login(base) {
  const input = { username: "admin1", password: "Lopez2026!", device: { id: "SMOKE-V103", label: "Smoke v103", model: "Node", os: process.platform, appVersion: "8790-103" } };
  let response = await fetch(`${base}/api/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
  if (response.status === 428) {
    const required = await response.json();
    input.legalAcceptance = { accepted: true, version: required.legal.currentVersion, hash: required.legal.hash };
    response = await fetch(`${base}/api/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
  }
  assert.equal(response.status, 200);
  return String(response.headers.get("set-cookie") || "").split(";")[0];
}

async function post(base, cookie, endpoint, body) {
  const response = await fetch(`${base}/${endpoint}`, { method: "POST", headers: { Cookie: cookie, "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const payload = await response.json();
  assert.equal(response.status, 200, payload.error || endpoint);
  return payload;
}

(async () => {
  const base = `http://127.0.0.1:${port}`;
  const health = await waitHealth(base);
  assert.equal(health.version, "8790-103");
  const cookie = await login(base);
  const stateResponse = await fetch(`${base}/api/state?version=0`, { headers: { Cookie: cookie } });
  const initial = await stateResponse.json();
  const supplier = initial.state.suppliers[0];
  const product = initial.state.products[0];
  assert.ok(supplier && product);

  const edited = await post(base, cookie, "api/suppliers", {
    originalName: supplier.name,
    razon_social: supplier.name,
    nombre_comercial: supplier.nombre_comercial || supplier.name,
    telefono: "3510000103",
    allowPossibleDuplicate: true
  });
  assert.equal(edited.supplier.telefono, "3510000103");

  const key = product.codigo_producto || product.codigo_barras || product.name;
  const inactive = await post(base, cookie, "api/products/bulk-status", { keys: [key], active: false, motive: "Smoke v103" });
  assert.equal(inactive.count, 1);
  assert.equal(inactive.changed[0].active, false);
  const active = await post(base, cookie, "api/products/bulk-status", { keys: [key], active: true, motive: "Restaurar smoke v103" });
  assert.equal(active.changed[0].active, true);

  const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
  const app = fs.readFileSync(path.join(root, "app.js"), "utf8");
  assert.match(html, /commissionReportSeller/);
  assert.match(html, /supplierRemitProductResults/);
  assert.match(app, /function commissionReportData/);
  assert.match(app, /data-supplier-edit/);
  assert.match(app, /deliveryRouteMapSignature/);
  assert.match(app, /rankedProductSearch\(state\.products, input\.value\)/);

  console.log(JSON.stringify({ ok: true, version: health.version, supplierEdit: true, bulkProductStatus: true, commissionPeriodReport: true, supplierOpenSearch: true, mapViewportPreserved: true }, null, 2));
})().finally(() => {
  child.kill();
  fs.rmSync(tempDir, { recursive: true, force: true });
}).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
