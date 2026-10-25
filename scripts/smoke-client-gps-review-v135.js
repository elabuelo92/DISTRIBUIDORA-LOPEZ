"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const vm = require("node:vm");
const crypto = require("node:crypto");
const { spawn } = require("node:child_process");
const Order = require("../order-engine");

const root = path.resolve(__dirname, "..");
const fixture = fs.readFileSync(path.join(__dirname, "smoke-delivery-operations-v132.js"), "utf8");
const buildState = vm.runInNewContext(`(${fixture.slice(fixture.indexOf("function buildState"), fixture.indexOf("const state = buildState"))})`, { OrderEngine: Order });
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "dl-gps-review-"));
const stateFile = path.join(tempDir, "demo-state.json");
const usersFile = path.join(tempDir, "users.json");
const users = [["admin1", "admin", "Administracion 1"], ["sofia", "seller", "Sofia Benitez"], ["reparto1", "driver", "Reparto 1"], ["reparto2", "driver", "Reparto 2"]].map(([username, role, name]) => {
  const salt = crypto.randomBytes(16).toString("hex");
  return { username, role, name, sellerName: role === "seller" ? name : "", active: true, salt,
    passwordHash: crypto.pbkdf2Sync("SmokeTest2026!", salt, 120000, 32, "sha256").toString("hex") };
});
fs.writeFileSync(usersFile, JSON.stringify({ users }), "utf8");
const state = JSON.parse(JSON.stringify(buildState(1)));
state.suppliers = [{ name: "Proveedor Fotos", razon_social: "Proveedor Fotos", balance: 0 }];
state.clients[0].location = { lat: state.clients[0].latitud, lng: state.clients[0].longitud };
state.archivedOrders = [{ code: "PED-GPS-HISTORICO", client: state.clients[0].name, status: "Entregado", gps: { ...state.clients[0].location } }];
state.archivedDeliveryRoutes = [{ id: "GPS-HISTORICA", closure: { id: "CLOSE-HIST" }, stops: [{ orderCode: "PED-GPS-HISTORICO", coordinates: { ...state.clients[0].location } }] }];
state.deliveryRoutes = [{ id: "GPS-REFRESH-ROUTE", driverUser: "reparto1", status: "Planificada", day: "2026-10-12", manualOrder: true,
  stops: [{ orderCode: state.orders[0].code, client: state.clients[0].name, status: Order.STATUS.READY_DISPATCH,
    coordinates: { ...state.clients[0].location }, sequence: 1 }] }];
Order.migrateState(state);
fs.writeFileSync(stateFile, JSON.stringify({ version: Date.now(), state }), "utf8");
const port = 22000 + Math.floor(Math.random() * 1000);
const child = spawn(process.env.DL_TEST_SERVER_NODE || process.execPath, [path.join(root, "server.js")], {
  cwd: root,
  env: { ...process.env, DL_HOST: "127.0.0.1", DL_PORT: String(port), PORT: String(port),
    DATA_DIR: tempDir, STATE_FILE: stateFile, USERS_FILE: usersFile,
    DL_VERSION: "8790-156", DL_LICENSE_ENFORCEMENT: "disabled", DL_INTEGRITY_ENFORCE: "warn",
    DL_DEFAULT_PASSWORD: "SmokeTest2026!" },
  stdio: ["ignore", "pipe", "pipe"]
});
const base = `http://127.0.0.1:${port}`;
let serverError = "";
child.stderr.on("data", (chunk) => { serverError += chunk.toString(); });
child.stdout.on("data", () => {});

async function waitHealth() {
  for (let attempt = 0; attempt < 600; attempt += 1) {
    try { if ((await fetch(`${base}/api/health`)).ok) return; } catch {}
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`Servidor temporal no inicio: ${serverError.slice(-500)}`);
}

async function login(username) {
  const input = { username, password: "SmokeTest2026!", device: { id: `GPS-${username}`, label: "Prueba", model: "Node", os: process.platform } };
  let response = await fetch(`${base}/api/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
  if (response.status === 428) {
    const required = await response.json();
    input.legalAcceptance = { accepted: true, version: required.legal.currentVersion, hash: required.legal.hash };
    response = await fetch(`${base}/api/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
  }
  const payload = await response.json();
  assert.equal(response.status, 200, payload.error || `Login ${username} fallido`);
  return String(response.headers.get("set-cookie") || "").split(";")[0];
}

async function post(cookie, endpoint, input) {
  const response = await fetch(`${base}${endpoint}`, { method: "POST", headers: { Cookie: cookie, "Content-Type": "application/json" }, body: JSON.stringify(input) });
  const text = await response.text();
  let body;
  try { body = JSON.parse(text); } catch { throw new Error(`${endpoint} HTTP ${response.status}: ${text.slice(0, 500)}; server: ${serverError.slice(-500)}`); }
  return { status: response.status, body };
}

(async () => {
  try {
    await waitHealth();
    const admin = await login("admin1");
    const seller = await login("sofia");
    const driver = await login("reparto1");
    const otherDriver = await login("reparto2");
    const id = state.clients[0].codigo_cliente;
    const endpoint = `/api/clients/${encodeURIComponent(id)}/gps-review`;
    const previous = { lat: state.clients[0].latitud, lng: state.clients[0].longitud };
    assert.equal((await post(seller, endpoint, { action: "mark" })).status, 400);
    assert.equal((await post(admin, endpoint, { action: "mark" })).status, 200);
    const originalData = JSON.parse(fs.readFileSync(stateFile, "utf8")).state;
    const driverInput = { action: "submit", expectedUpdatedAt: originalData.clients[0].updatedAt,
      gps: { lat: -31.412345678, lng: -64.181234567, accuracy: 8.75, source: "gps", deviceAt: new Date().toISOString() },
      deviceId: "GPS-reparto1", deviceLabel: "Telefono reparto" };
    assert.equal((await post(otherDriver, endpoint, driverInput)).status, 403, "Other driver cannot submit for this client");
    assert.equal((await post(driver, endpoint, { ...driverInput, action: "approve" })).status, 403);
    assert.equal((await post(driver, endpoint, { ...driverInput, action: "mark" })).status, 403);
    assert.equal((await post(driver, endpoint, { ...driverInput, expectedUpdatedAt: "stale" })).status, 409);
    assert.equal((await post(driver, endpoint, { ...driverInput, gps: { ...driverInput.gps, deviceAt: "2020-01-01" } })).status, 400);
    const captured = await post(driver, endpoint, driverInput);
    assert.equal(captured.status, 200, captured.body.error);
    assert.equal(captured.body.client.gpsReview.status, "pending_validation");
    const afterCapture = JSON.parse(fs.readFileSync(stateFile, "utf8")).state;
    assert.equal(afterCapture.clients[0].latitud, previous.lat);
    assert.equal(afterCapture.clients[0].gpsReview.proposal.role, "driver");
    assert.equal(afterCapture.clients[0].gpsReview.proposal.username, "reparto1");
    for (const key of ["orders", "accounts", "products"]) assert.deepEqual(afterCapture[key], originalData[key], `${key} unchanged by capture`);
    assert.equal((await post(driver, endpoint, driverInput)).status, 409, "Duplicate capture cannot replace proposal");
    assert.equal((await post(admin, endpoint, { action: "reject", reason: "Volver a medir" })).status, 200);
    assert.equal((await post(admin, endpoint, { action: "mark" })).status, 200);
    const markedState = await (await fetch(`${base}/api/state?version=0`, { headers: { Cookie: seller } })).json();
    assert.equal(markedState.state.clients.find((c) => c.codigo_cliente === id).gpsReview.status, "needs_correction");
    const blocked = await post(seller, "/api/orders", { operationId: "GPS-REVIEW-ORDER-1", client: state.clients[0].name, items: [{ productCode: "P-132", qty: 1 }] });
    assert.equal(blocked.status, 409);
    assert.match(blocked.body.error, /UBICACION PENDIENTE/);
    assert.equal((await post(seller, endpoint, { action: "submit", gps: { lat: -31.412345678, lng: -64.181234567, accuracy: 0 } })).status, 400);
    const submitted = await post(seller, endpoint, {
      action: "submit", gps: { lat: -31.412345678, lng: -64.181234567, accuracy: 8.75, source: "gps", deviceAt: new Date().toISOString() },
      deviceId: "GPS-DEVICE", deviceLabel: "Telefono prueba"
    });
    assert.equal(submitted.status, 200, submitted.body.error);
    assert.equal(submitted.body.client.gpsReview.status, "pending_validation");
    assert.equal(submitted.body.client.gpsReviewHistory.length, 0, "El vendedor no recibe auditoria interna.");
    let saved = JSON.parse(fs.readFileSync(stateFile, "utf8")).state.clients[0];
    assert.equal(saved.latitud, previous.lat);
    assert.equal(saved.longitud, previous.lng);
    assert.equal(saved.gpsReview.proposal.accuracy, 8.75);
    assert.equal((await post(admin, endpoint, { action: "reject", reason: "No coincide" })).status, 200);
    assert.equal(JSON.parse(fs.readFileSync(stateFile, "utf8")).state.clients[0].latitud, previous.lat);
    assert.equal((await post(seller, endpoint, {
      action: "submit", gps: { lat: -31.412345678, lng: -64.181234567, accuracy: 8.75, source: "gps" }
    })).status, 200);
    const beforeApproval = JSON.parse(fs.readFileSync(stateFile, "utf8")).state;
    assert.equal((await post(admin, endpoint, { action: "approve", expectedUpdatedAt: "stale" })).status, 409);
    assert.deepEqual(JSON.parse(fs.readFileSync(stateFile, "utf8")).state.clients[0], beforeApproval.clients[0]);
    assert.equal((await post(admin, endpoint, { action: "approve", expectedUpdatedAt: beforeApproval.clients[0].updatedAt })).status, 200);
    for (const key of ["orders", "archivedOrders", "archivedDeliveryRoutes", "deliveryRoutes", "accounts", "products"]) {
      assert.deepEqual(JSON.parse(fs.readFileSync(stateFile, "utf8")).state[key], beforeApproval[key], `GPS approval preserves ${key}`);
    }
    saved = JSON.parse(fs.readFileSync(stateFile, "utf8")).state.clients[0];
    assert.equal(saved.latitud, -31.412345678);
    assert.equal(saved.longitud, -64.181234567);
    assert.equal(saved.gpsReview.status, "approved");
    const approvedState = await (await fetch(`${base}/api/state?version=${markedState.version}`, { headers: { Cookie: seller } })).json();
    assert.equal(approvedState.state.clients.find((c) => c.codigo_cliente === id).gpsReview.status, "approved");
    const delivery = await (await fetch(`${base}/api/delivery`, { headers: { Cookie: admin } })).json();
    assert.deepEqual(delivery.routes.find(r => r.id === "GPS-REFRESH-ROUTE").stops[0].coordinates,
      { lat: -31.412345678, lng: -64.181234567 }, "Delivery refresh uses approved GPS despite stale location alias");
    const sellerClient = approvedState.state.clients.find(c => c.codigo_cliente === id);
    assert.equal(sellerClient.latitud, -31.412345678);
    assert.equal(sellerClient.longitud, -64.181234567);
    assert.ok(saved.gpsReviewHistory.length >= 4);
    assert.equal(JSON.parse(fs.readFileSync(stateFile, "utf8")).state.orders.length, 1);
    const readState = () => JSON.parse(fs.readFileSync(stateFile, "utf8")).state;
    const protectedState = JSON.stringify(readState().orders);
    const protectedProducts = JSON.stringify(readState().products);
    for (const reviewStatus of ["needs_correction", "pending_validation", "rejected"]) {
      assert.equal((await post(admin, endpoint, { action: "mark" })).status, 200);
      if (reviewStatus !== "needs_correction") {
        assert.equal((await post(seller, endpoint, { action: "submit", gps: { lat: -31.5, lng: -64.2, accuracy: 9, source: "gps" } })).status, 200);
      }
      if (reviewStatus === "rejected") assert.equal((await post(admin, endpoint, { action: "reject", reason: "Prueba" })).status, 200);
      const beforeCancel = readState().clients[0];
      const input = { action: "cancel", reason: "Marcado por error", expectedUpdatedAt: beforeCancel.updatedAt };
      assert.equal((await post(seller, endpoint, input)).status, 400);
      assert.equal((await post(admin, endpoint, { ...input, expectedUpdatedAt: "stale" })).status, 409);
      assert.equal((await post(admin, endpoint, { ...input, reason: " " })).status, 400);
      assert.deepEqual(readState().clients[0], beforeCancel, "Invalid cancellations do not change data");
      assert.equal((await post(admin, endpoint, input)).status, 200);
      const cancelled = readState().clients[0];
      assert.equal(cancelled.gpsReview.status, "cancelled");
      assert.equal(cancelled.gpsReview.proposal, null);
      assert.deepEqual(cancelled.gpsReviewHistory[0].before.gpsReview, beforeCancel.gpsReview);
      assert.equal(cancelled.gpsReviewHistory[0].action, "cancel");
      for (const key of Object.keys(beforeCancel).filter(k => !["gpsReview", "gpsReviewHistory", "updatedAt"].includes(k))) {
        assert.deepEqual(cancelled[key], beforeCancel[key], `Preserve ${key}`);
      }
      assert.equal((await post(admin, endpoint, input)).status, 400, "Cannot cancel twice");
      const sellerState = await (await fetch(`${base}/api/state?version=0`, { headers: { Cookie: seller } })).json();
      assert.equal(sellerState.state.clients.find(c => c.codigo_cliente === id).gpsReview.status, "cancelled");
      assert.equal(JSON.stringify(readState().orders), protectedState);
      assert.equal(JSON.stringify(readState().products), protectedProducts);
    }
    console.log("OK: cancellation from all three blocked states, admin-only, stale protection, audit, coordinates and unrelated fields preserved, seller synchronization.");
    if (process.argv.includes("--visual")) await require("./p144-gps-browser-check").check(base, admin, driver, readState, id, state.orders[0].code);
    const unblocked = await post(seller, "/api/orders", { operationId: "GPS-CANCEL-ORDER-1", client: state.clients[0].name, items: [{ productCode: "P-132", qty: 1 }] });
    assert.ok(unblocked.status >= 200 && unblocked.status < 300, unblocked.body.error || "Sales should resume after cancellation");
    console.log(JSON.stringify({ ok: true, blockedDuringReview: true, originalOrderPreserved: true, precision: saved.gpsReview.proposal.accuracy }));
    const beforeRemits = JSON.parse(fs.readFileSync(stateFile, "utf8")).state;
    const stockBefore = JSON.stringify(beforeRemits.products);
    const balancesBefore = JSON.stringify(beforeRemits.suppliers.map(s => s.balance));
    const photo = "data:image/png;base64,iVBORw0KGgo=";
    const pdf = "data:application/pdf;base64,JVBERi0xLjQ=";
    const remitBody = { supplier: "Proveedor Fotos", remitNumber: "MULTI-1", items: [{ productCode: "P-132", name: "Producto operativo", qty: 2, stockQty: 2, unitPrice: 10 }], fileDataUrls: [photo, pdf, photo] };
    const invalid = await post(admin, "/api/suppliers/remits", { ...remitBody, fileDataUrls: [photo, "invalid"] });
    assert.equal(invalid.status, 400);
    const concurrent = await Promise.all([post(admin, "/api/suppliers/remits", remitBody), post(admin, "/api/suppliers/remits", remitBody)]);
    assert.equal(concurrent.filter(r => r.status === 200).length, 1, JSON.stringify(concurrent));
    assert.equal(concurrent.filter(r => r.status === 400).length, 1);
    const savedRemit = concurrent.find(r => r.status === 200).body.remit;
    assert.equal(savedRemit.uploads.length, 2);
    assert.equal(savedRemit.upload.url, savedRemit.uploads[0].url);
    for (const upload of savedRemit.uploads) assert.equal((await fetch(base + upload.url, { headers: { Cookie: admin } })).status, 200);
    assert.equal((await post(admin, "/api/suppliers/remits", { ...remitBody, remitNumber: "MULTI-2" })).status, 200);
    assert.equal((await post(admin, "/api/suppliers/remits", { ...remitBody, remitNumber: "MULTI-3", fileDataUrls: Array(11).fill(photo) })).status, 400);
    const legacy = { ...remitBody, remitNumber: "LEGACY", fileDataUrl: photo };
    delete legacy.fileDataUrls;
    assert.equal((await post(admin, "/api/suppliers/remits", legacy)).status, 200);
    const afterRemits = JSON.parse(fs.readFileSync(stateFile, "utf8")).state;
    assert.equal(afterRemits.supplierMovements.filter(m => m.remitNumber === "MULTI-1").length, 1);
    assert.equal(JSON.stringify(afterRemits.products), stockBefore);
    assert.equal(JSON.stringify(afterRemits.suppliers.map(s => s.balance)), balancesBefore);
    console.log("PASS remitos: multiple files, deduplication, concurrent duplicate blocked, separate numbers, limits, legacy and downloads; stock/debt unchanged pending validation.");
  } finally {
    child.kill();
    await new Promise(resolve => child.once("exit", resolve));
    const resolved = fs.realpathSync(tempDir);
    const tempRoot = fs.realpathSync(os.tmpdir());
    if (!resolved.startsWith(tempRoot + path.sep)) throw new Error("Ruta temporal fuera de lugar.");
    fs.rmSync(resolved, { recursive: true, force: true });
  }
})().catch((error) => { console.error(error.stack || error.message); process.exitCode = 1; });
