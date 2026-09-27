"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const vm = require("node:vm");
const { spawn } = require("node:child_process");
const Order = require("../order-engine");

const root = path.resolve(__dirname, "..");
const fixture = fs.readFileSync(path.join(__dirname, "smoke-delivery-operations-v132.js"), "utf8");
const buildState = vm.runInNewContext(`(${fixture.slice(fixture.indexOf("function buildState"), fixture.indexOf("const state = buildState"))})`, { OrderEngine: Order });
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "dl-gps-review-"));
const stateFile = path.join(tempDir, "demo-state.json");
const usersFile = path.join(tempDir, "users.json");
const state = JSON.parse(JSON.stringify(buildState(1)));
Order.migrateState(state);
fs.writeFileSync(stateFile, JSON.stringify({ version: Date.now(), state }), "utf8");
const port = 22000 + Math.floor(Math.random() * 1000);
const child = spawn(process.execPath, [path.join(root, "server.js")], {
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

async function waitHealth() {
  for (let attempt = 0; attempt < 100; attempt += 1) {
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
    const id = state.clients[0].codigo_cliente;
    const endpoint = `/api/clients/${encodeURIComponent(id)}/gps-review`;
    const previous = { lat: state.clients[0].latitud, lng: state.clients[0].longitud };
    assert.equal((await post(seller, endpoint, { action: "mark" })).status, 400);
    assert.equal((await post(admin, endpoint, { action: "mark" })).status, 200);
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
    assert.equal((await post(admin, endpoint, { action: "approve" })).status, 200);
    saved = JSON.parse(fs.readFileSync(stateFile, "utf8")).state.clients[0];
    assert.equal(saved.latitud, -31.412345678);
    assert.equal(saved.longitud, -64.181234567);
    assert.equal(saved.gpsReview.status, "approved");
    assert.ok(saved.gpsReviewHistory.length >= 4);
    assert.equal(JSON.parse(fs.readFileSync(stateFile, "utf8")).state.orders.length, 1);
    console.log(JSON.stringify({ ok: true, blockedDuringReview: true, originalOrderPreserved: true, precision: saved.gpsReview.proposal.accuracy }));
  } finally {
    child.kill();
    const resolved = fs.realpathSync(tempDir);
    const tempRoot = fs.realpathSync(os.tmpdir());
    if (!resolved.startsWith(tempRoot + path.sep)) throw new Error("Ruta temporal fuera de lugar.");
    fs.rmSync(resolved, { recursive: true, force: true });
  }
})().catch((error) => { console.error(error.stack || error.message); process.exitCode = 1; });
