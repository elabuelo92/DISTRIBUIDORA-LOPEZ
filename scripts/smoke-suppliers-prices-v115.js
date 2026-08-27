"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawn } = require("node:child_process");

const root = path.join(__dirname, "..");
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "dl-v115-"));
const port = 20500 + Math.floor(Math.random() * 200);
const stateFile = path.join(tempDir, "demo-state.json");
const usersFile = path.join(tempDir, "users.json");
fs.copyFileSync(path.join(root, "data", "users.json"), usersFile);

const state = {
  products: [
    { codigo_producto: "P-1", name: "Producto proveedor", proveedor: "Marca Proveedora", price: 1000, precio_lista_2: 1000, stock: 10 },
    { codigo_producto: "P-2", name: "Producto ajeno", proveedor: "Otro proveedor", price: 2000, precio_lista_2: 2000, stock: 10 }
  ],
  suppliers: [
    { name: "Proveedor Legal SA", razon_social: "Proveedor Legal SA", nombre_comercial: "Marca Proveedora", cuit: "30-11111111-1", balance: 500, movements: [{ id: "MOV-1", type: "Remito" }] },
    { name: "Proveedor Limpio", razon_social: "Proveedor Limpio", nombre_comercial: "Proveedor Limpio", balance: 0, movements: [] }
  ],
  supplierMovements: [{ id: "REM-1", type: "Remito", supplier: "Proveedor Legal SA", amount: 500 }],
  stockMovements: [{ id: "STK-1", type: "Compra", supplier: "Proveedor Legal SA", qty: 1 }],
  clients: [], sellers: [], orders: [], activity: [], priceLists: [], priceListAudit: [], notifications: [], globalAudit: []
};
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
    DL_VERSION: "8790-115",
    DL_LICENSE_ENFORCEMENT: "disabled",
    DL_INTEGRITY_ENFORCE: "warn",
    DL_DEFAULT_PASSWORD: "Lopez2026!"
  },
  stdio: ["ignore", "pipe", "pipe"]
});
let serverError = "";
child.stderr.on("data", (chunk) => { serverError += chunk.toString(); });
child.stdout.on("data", () => {});
const base = `http://127.0.0.1:${port}`;

async function waitHealth() {
  for (let index = 0; index < 100; index += 1) {
    try {
      const response = await fetch(`${base}/api/health`);
      if (response.ok) return response.json();
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`Servidor temporal v115 no inicio. ${serverError}`);
}

async function login() {
  const input = { username: "admin1", password: "Lopez2026!", device: { id: "SMOKE-V115", label: "Smoke v115", model: "Node", os: process.platform, appVersion: "8790-115" } };
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
  const response = await fetch(`${base}/${endpoint}`, { method: "POST", headers: { Cookie: cookie, "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const payload = JSON.parse(await response.text() || "{}");
  assert.equal(response.status, expectedStatus, payload.error || endpoint);
  return payload;
}

(async () => {
  const health = await waitHealth();
  assert.equal(health.version, "8790-115");
  const cookie = await login();

  const simulation = await post(cookie, "api/price-lists/simulate", {
    operation: "proveedor",
    proveedor: "Proveedor Legal SA",
    increasePct: -10,
    rounding: 1
  });
  assert.equal(simulation.simulation.affected, 1);
  assert.equal(simulation.simulation.items[0].productCode, "P-1");
  assert.equal(simulation.simulation.items[0].price, 900);

  const applied = await post(cookie, "api/price-lists/apply", {
    name: "Descuento proveedor v115",
    operation: "proveedor",
    proveedor: "Proveedor Legal SA",
    increasePct: -10,
    rounding: 1,
    status: "Activa",
    effectiveAt: new Date().toISOString(),
    motive: "Prueba automatizada de descuento por proveedor",
    confirmed: true
  });
  assert.equal(applied.simulation.affected, 1);
  assert.equal(applied.appliedNow, true);

  const linkedInspection = await post(cookie, "api/suppliers/manage", { supplier: "Proveedor Legal SA", action: "inspect" });
  assert.equal(linkedInspection.report.canDeletePermanently, false);
  assert.equal(linkedInspection.report.counts.products, 1);
  assert.equal(linkedInspection.report.counts.remits, 1);

  const blockedDelete = await post(cookie, "api/suppliers/manage", {
    supplier: "Proveedor Legal SA", action: "delete", motive: "No debe borrar", adminPassword: "Lopez2026!"
  }, 409);
  assert.equal(blockedDelete.report.canDeletePermanently, false);

  await post(cookie, "api/suppliers/manage", {
    supplier: "Proveedor Limpio", action: "delete", motive: "Clave incorrecta", adminPassword: "incorrecta"
  }, 403);

  await post(cookie, "api/suppliers/manage", {
    supplier: "Proveedor Legal SA", action: "archive", motive: "Conservar trazabilidad", adminPassword: "Lopez2026!"
  });

  const cleanInspection = await post(cookie, "api/suppliers/manage", { supplier: "Proveedor Limpio", action: "inspect" });
  assert.equal(cleanInspection.report.canDeletePermanently, true);
  await post(cookie, "api/suppliers/manage", {
    supplier: "Proveedor Limpio", action: "delete", motive: "Sin relaciones", adminPassword: "Lopez2026!"
  });

  const persisted = JSON.parse(fs.readFileSync(stateFile, "utf8")).state;
  assert.equal(persisted.products.find((item) => item.codigo_producto === "P-1").price, 900);
  assert.equal(persisted.products.find((item) => item.codigo_producto === "P-2").price, 2000);
  assert.equal(persisted.suppliers.find((item) => item.name === "Proveedor Legal SA").estado_operativo, "Inactivo");
  assert.equal(persisted.suppliers.some((item) => item.name === "Proveedor Limpio"), false);
  assert.equal(persisted.supplierMovements.length, 1);

  console.log(JSON.stringify({
    ok: true,
    version: health.version,
    supplierAliasMatched: true,
    discountedProducts: applied.simulation.affected,
    linkedDeleteBlocked: true,
    linkedSupplierArchived: true,
    unlinkedSupplierDeleted: true,
    historicalMovementPreserved: true
  }, null, 2));
})().finally(() => {
  child.kill();
  fs.rmSync(tempDir, { recursive: true, force: true });
}).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
