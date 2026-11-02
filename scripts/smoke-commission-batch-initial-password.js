"use strict";

const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const vm = require("node:vm");
const { spawn } = require("node:child_process");
const { once } = require("node:events");
const Engine = require("../order-engine");
const root = path.resolve(__dirname, "..");
const appSource = fs.readFileSync(path.join(root, "app.js"), "utf8");
const htmlSource = fs.readFileSync(path.join(root, "index.html"), "utf8");
assert.ok(appSource.includes('postOperationalAction("api/products/classification"'));
assert.ok(htmlSource.includes('id="stockEditClassificationSaveBtn"'));
assert.match(htmlSource, /Rubro\s*\/\s*Familia[\s\S]*?id="stockClassificationSelect"/);
assert.match(htmlSource, /<input name="rubro" type="hidden">/);
assert.match(htmlSource, /<input name="familia" type="hidden">/);
assert.ok(htmlSource.includes('id="initialPasswordChangeDialog"'));
const classificationClient = appSource.slice(appSource.indexOf("async function submitStockClassificationOnly("), appSource.indexOf("async function submitStockEdit(", appSource.indexOf("async function submitStockClassificationOnly(")));
assert.ok(!classificationClient.includes("saveState(") && !classificationClient.includes("allocatePendingOrders"));
assert.ok(classificationClient.includes("savedProduct.rubro !== rubro || savedProduct.familia !== familia"));
const classificationHelpersSource = appSource.slice(appSource.indexOf("function stockClassificationPairKey("), appSource.indexOf("function openStockEditDialog("));
const classificationHelpers = vm.runInNewContext(`(() => { ${classificationHelpersSource}; return stockClassificationChoices; })()`, {
  normalizeSearchText: (value) => String(value || "").toLowerCase().trim()
});
const classificationChoices = classificationHelpers([
  { rubro: "Limpieza", familia: "Pisos" },
  { rubro: "Limpieza", familia: "Cocina" },
  { rubro: "LIMPIEZA", familia: "Pisos" }
], { rubro: "Bebidas", familia: "S/D" });
assert.equal(classificationChoices.length, 3, "el selector ofrece pares unicos del catalogo e incluye el par actual");
assert.ok(classificationChoices.some((choice) => choice.rubro === "Bebidas" && choice.familia === "S/D"));

const dir = fs.mkdtempSync(path.join(os.tmpdir(), "dl-commission-batch-"));
const stateFile = path.join(dir, "demo-state.json");
const usersFile = path.join(dir, "users.json");
const port = 26500 + Math.floor(Math.random() * 500);
const base = `http://127.0.0.1:${port}`;
const adminPassword = "Batch-Test-Admin-2026!";
const tempPassword = "Temporary-First-2026!";
const nextPassword = "Seller-Own-Password-2026!";
const makeUser = (username, name, role, password, extra = {}) => {
  const salt = crypto.randomBytes(16).toString("hex");
  return { username, name, role, active: true, salt,
    passwordHash: crypto.pbkdf2Sync(password, salt, 120000, 32, "sha256").toString("hex"), ...extra };
};
const state = {
  products: [
    { codigo_producto: "A1", name: "Analgesico test", rubro: "ANALGESICOS", stock_fisico: 20, stock_reservado: 3 },
    { codigo_producto: "A2", name: "Analgesico familia test", rubro: "ANALGESICOS", familia: "FARMACIA", stock_fisico: 10, stock_reservado: 0 },
    { codigo_producto: "C1", name: "Cigarrillos test", rubro: "Cigarrillos", stock_fisico: 30, stock_reservado: 2 },
    { codigo_producto: "R1", name: "Mercaderia test", rubro: "Limpieza", stock_fisico: 40, stock_reservado: 4 }
  ],
  sellers: [
    { name: "Axel", username: "david" },
    { name: "Kevin Guibert", username: "kevin" },
    { name: "Matias", username: "matias" },
    { name: "Ruggero", username: "ruggero david" }
  ],
  orders: [{ code: "OLD-1", seller: "Axel", createdAt: "2026-10-20T12:00:00.000Z",
    commissions: { seller: { user: "Axel", baseAmount: 1000, cigarettes: 0, merchandise: 30, total: 30 } } }],
  stockMovements: [{ id: "STOCK-1", qty: 5 }],
  commissionSettlements: [{ id: "PAID-1", seller: "Axel", amount: 30 }],
  commissionSettings: { rules: [
    { id: "GLOBAL-REST", role: "seller", rubro: "*", percent: 3, startsAt: "2026-01-01T00:00:00.000Z", active: true },
    { id: "GLOBAL-CIG", role: "seller", rubro: "Cigarrillos", percent: 1, startsAt: "2026-01-01T00:00:00.000Z", active: true },
    { id: "AXEL-REST", role: "seller", username: "david", userLabel: "Axel", rubro: "*", percent: 3, startsAt: "2026-10-01T00:00:00.000Z", active: true },
    { id: "AXEL-CIG", role: "seller", username: "david", userLabel: "Axel", rubro: "Cigarrillos", percent: 1, startsAt: "2026-10-01T00:00:00.000Z", active: true },
    { id: "MATIAS-REST", role: "seller", username: "matias", userLabel: "Matias", rubro: "*", percent: 3, startsAt: "2026-10-01T00:00:00.000Z", active: true },
    { id: "MATIAS-CIG", role: "seller", username: "matias", userLabel: "Matias", rubro: "Cigarrillos", percent: 1, startsAt: "2026-10-01T00:00:00.000Z", active: true }
  ] }
};
Engine.migrateState(state);
fs.writeFileSync(stateFile, JSON.stringify({ version: 1, state }));
fs.writeFileSync(usersFile, JSON.stringify({ users: [
  makeUser("admin1", "Admin test", "admin", adminPassword),
  makeUser("lisandro", "Lisandro", "seller", "Lisandro-Test-2026!")
] }));
const excelShim = path.join(dir, "node_modules", "exceljs");
fs.mkdirSync(excelShim, { recursive: true });
fs.writeFileSync(path.join(excelShim, "index.js"), "module.exports = {};\n");

const child = spawn(process.execPath, [path.join(root, "server.js")], {
  cwd: root,
  env: { ...process.env, DL_HOST: "127.0.0.1", DL_PORT: String(port), PORT: String(port), DATA_DIR: dir,
    STATE_FILE: stateFile, USERS_FILE: usersFile, DL_MAINTENANCE_FILE: path.join(dir, "maintenance.json"),
    DL_LICENSE_ENFORCEMENT: "disabled", DL_INTEGRITY_ENFORCE: "warn", DL_DEFAULT_PASSWORD: adminPassword,
    NODE_PATH: [path.join(dir, "node_modules"), process.env.NODE_PATH || ""].filter(Boolean).join(path.delimiter) },
  stdio: ["ignore", "pipe", "pipe"]
});
let logs = "";
child.stdout.on("data", (chunk) => { logs = (logs + chunk).slice(-5000); });
child.stderr.on("data", (chunk) => { logs = (logs + chunk).slice(-5000); });
const exited = once(child, "exit");

async function request(url, body, cookie = "", expected = 200) {
  const response = await fetch(base + url, {
    method: body ? "POST" : "GET",
    headers: { "Content-Type": "application/json", "X-ERP-Response": "compact-v1", ...(cookie ? { Cookie: cookie } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
    signal: AbortSignal.timeout(30000)
  });
  const payload = await response.json();
  assert.equal(response.status, expected, `${url}: ${JSON.stringify(payload).slice(0, 500)}`);
  return { payload, cookie: String(response.headers.get("set-cookie") || "").split(";")[0] };
}

async function login(username, password) {
  const legal = (await request("/api/legal")).payload.legal;
  return (await request("/api/login", {
    username,
    password,
    device: { id: `BATCH-${username}`, label: "Aislado" },
    legalAcceptance: { accepted: true, version: legal.currentVersion, hash: legal.hash }
  })).cookie;
}

function readState() { return JSON.parse(fs.readFileSync(stateFile, "utf8")); }

(async () => {
  try {
    let ready = false;
    let healthDetails = "";
    for (let attempt = 0; attempt < 120; attempt += 1) {
      try {
        const response = await fetch(`${base}/api/health`);
        healthDetails = `${response.status} ${await response.text()}`;
        if (response.ok) { ready = true; break; }
      } catch (error) { healthDetails = error.message || String(error); }
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    assert.ok(ready, `${logs.slice(-1500)}\n${healthDetails.slice(0, 1000)}`);

    const admin = await login("admin1", adminPassword);
    const before = readState().state;
    const beforeProtected = JSON.stringify({ orders: before.orders, stockMovements: before.stockMovements, settlements: before.commissionSettlements });
    const targets = [
      ["david", "Axel"], ["kevin", "Kevin Guibert"], ["matias", "Matias"], ["ruggero david", "Ruggero"]
    ];
    const motive = "Prueba aislada: esquema desde 01/11/2026";
    const rules = targets.map(([username, userLabel]) => ({ role: "seller", username, userLabel, rubro: "ANALGESICOS",
      percent: 10, startsAt: "2026-11-01T03:00:00.000Z", status: "Activa", motive }));
    const batch = await request("/api/commissions/rules/batch", { motive, rules }, admin);
    assert.equal(batch.payload.changedCount, 4);
    let stored = readState();
    assert.equal(stored.state.commissionSettings.rules.filter((rule) => rule.rubro === "ANALGESICOS" && rule.percent === 10 && rule.active).length, 4);
    assert.equal(JSON.stringify({ orders: stored.state.orders, stockMovements: stored.state.stockMovements, settlements: stored.state.commissionSettlements }), beforeProtected);
    for (const [username, userLabel] of targets) {
      assert.equal(Engine.previewCommissionRule(stored.state, { role: "seller", username, userName: userLabel, productCode: "A1", at: "2026-10-31T12:00:00-03:00" }).percent, 3);
      assert.equal(Engine.previewCommissionRule(stored.state, { role: "seller", username, userName: userLabel, productCode: "A1", at: "2026-11-01T12:00:00-03:00" }).percent, 10);
      assert.equal(Engine.previewCommissionRule(stored.state, { role: "seller", username, userName: userLabel, productCode: "C1", at: "2026-11-01T12:00:00-03:00" }).percent, 1);
      assert.equal(Engine.previewCommissionRule(stored.state, { role: "seller", username, userName: userLabel, productCode: "R1", at: "2026-11-01T12:00:00-03:00" }).percent, 3);
    }
    const batchVersion = stored.version;
    const replay = await request("/api/commissions/rules/batch", { motive, rules }, admin);
    assert.equal(replay.payload.changedCount, 0);
    assert.equal(replay.payload.unchangedCount, 4);
    assert.equal(readState().version, batchVersion, "el reintento idempotente no reescribe estado");

    const usersInput = { username: "juan", name: "Juan", role: "seller", sellerName: "Juan", password: tempPassword,
      mustChangePassword: true, active: true, motive: "Alta solicitada", admin_password: adminPassword };
    const created = await request("/api/admin/users", usersInput, admin);
    assert.equal(created.payload.user.mustChangePassword, true);
    const seller = await login("juan", tempPassword);
    assert.equal((await request("/api/state", null, seller, 428)).payload.code, "PASSWORD_CHANGE_REQUIRED");
    assert.equal((await request("/api/account/change-password", { newPassword: "TooShort-1" }, seller, 400)).payload.ok, false);
    const changed = await request("/api/account/change-password", { newPassword: nextPassword }, seller);
    assert.equal(changed.payload.user.mustChangePassword, false);
    const legal = (await request("/api/legal")).payload.legal;
    await request("/api/login", { username: "juan", password: tempPassword, device: { id: "BATCH-OLD-PASS", label: "Aislado" },
      legalAcceptance: { accepted: true, version: legal.currentVersion, hash: legal.hash } }, "", 401);
    const sellerWithNewPassword = await login("juan", nextPassword);
    assert.ok(sellerWithNewPassword);
    const session = await request("/api/session", null, sellerWithNewPassword);
    assert.equal(session.payload.user.mustChangePassword, false);
    await request("/api/state", null, sellerWithNewPassword);
    const persistedJuan = JSON.parse(fs.readFileSync(usersFile, "utf8")).users.find((user) => user.username === "juan");
    assert.equal(persistedJuan.mustChangePassword, false);

    const beforeRollback = readState().state.commissionSettings.rules.length;
    const failed = await request("/api/commissions/rules/batch", { motive, rules: [
      { role: "seller", username: "atomic-test", userLabel: "Atomic test", rubro: "Otro", percent: 5, motive },
      { role: "seller", username: "atomic-test", userLabel: "Atomic test", productCode: "MISSING", productName: "Missing", percent: 5, motive }
    ] }, admin, 400);
    assert.ok(failed.payload.error);
    assert.equal(readState().state.commissionSettings.rules.length, beforeRollback, "lote invalido no deja escrituras parciales");

    stored = readState();
    const productBefore = stored.state.products.find((item) => item.codigo_producto === "A1");
    const productProtected = JSON.stringify({ stock: productBefore.stock, physical: productBefore.stock_fisico, reserved: productBefore.stock_reservado,
      available: productBefore.stock_disponible, cost: productBefore.costo, price: productBefore.precio_lista_2 });
    const stateVersion = stored.version;
    const invalidClassification = await request("/api/products/classification", {
      productCode: "A1", expected: { rubro: "ANALGESICOS", familia: "S/D" }, rubro: "ANALGESICOS", familia: "FAMILIA INVENTADA",
      motive: "Prueba de combinacion inexistente", admin_password: adminPassword
    }, admin, 400);
    assert.match(invalidClassification.payload.error, /combinacion Rubro \/ Familia existente/i);
    assert.equal(readState().version, stateVersion, "una combinacion fuera del catalogo no se persiste");
    const classification = await request("/api/products/classification", {
      productCode: "A1", expected: { rubro: "ANALGESICOS", familia: "S/D" }, rubro: "ANALGESICOS", familia: "FARMACIA",
      motive: "Normalizacion de familia", admin_password: adminPassword
    }, admin);
    assert.equal(classification.payload.changed, true);
    stored = readState();
    const productAfter = stored.state.products.find((item) => item.codigo_producto === "A1");
    assert.equal(productAfter.familia, "FARMACIA");
    assert.equal(JSON.stringify({ stock: productAfter.stock, physical: productAfter.stock_fisico, reserved: productAfter.stock_reservado,
      available: productAfter.stock_disponible, cost: productAfter.costo, price: productAfter.precio_lista_2 }), productProtected);
    assert.equal(JSON.stringify({ orders: stored.state.orders, stockMovements: stored.state.stockMovements, settlements: stored.state.commissionSettlements }), beforeProtected);
    const versionAfterClassification = stored.version;
    const replayClassification = await request("/api/products/classification", {
      productCode: "A1", expected: { rubro: "ANALGESICOS", familia: "FARMACIA" }, rubro: "ANALGESICOS", familia: "FARMACIA",
      motive: "Sin cambio", admin_password: adminPassword
    }, admin);
    assert.equal(replayClassification.payload.changed, false);
    assert.equal(readState().version, versionAfterClassification, "clasificacion sin cambios no reescribe estado");
    await request("/api/products/classification", {
      productCode: "A1", expected: { rubro: "ANALGESICOS", familia: "S/D" }, rubro: "OTRO", familia: "FARMACIA",
      motive: "Dato obsoleto", admin_password: adminPassword
    }, admin, 409);
    assert.notEqual(stateVersion, versionAfterClassification);
    console.log("PASS: lote de comisiones (vigencia, idempotencia, rollback e historial intacto), cambio obligatorio de clave inicial y edicion aislada de rubro/familia con selector unico, pares existentes, rechazo sin escritura e integridad de stock; solo fixture aislada.");
  } finally {
    child.kill();
    await exited;
    fs.rmSync(dir, { recursive: true, force: true });
  }
})().catch((error) => { console.error(error); process.exitCode = 1; });
