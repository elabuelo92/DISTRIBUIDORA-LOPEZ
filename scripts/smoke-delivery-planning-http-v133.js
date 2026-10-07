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
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "dl-planning-v133-"));
const stateFile = path.join(tempDir, "demo-state.json");
const usersFile = path.join(tempDir, "users.json");
const state = JSON.parse(JSON.stringify(buildState(101)));
Order.migrateState(state);
state.orders[100].status = Order.STATUS.NOT_DELIVERED;
fs.writeFileSync(stateFile, JSON.stringify({ version: Date.now(), state }), "utf8");

const port = 21000 + Math.floor(Math.random() * 1000);
const child = spawn(process.execPath, [path.join(root, "server.js")], {
  cwd: root,
  env: {
    ...process.env, DL_HOST: "127.0.0.1", DL_PORT: String(port), PORT: String(port),
    DATA_DIR: tempDir, STATE_FILE: stateFile, USERS_FILE: usersFile,
    DL_VERSION: "8790-155", DL_LICENSE_ENFORCEMENT: "disabled", DL_INTEGRITY_ENFORCE: "warn",
    DL_DEFAULT_PASSWORD: "SmokeTest2026!"
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

async function login(username) {
  const input = {
    username, password: "SmokeTest2026!",
    device: { id: `SMOKE-PLAN-${username}`, label: "Prueba aislada", model: "Node", os: process.platform, appVersion: "8790-155" }
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
  assert.equal(response.status, 200, payload.error || `Login ${username} fallido`);
  return String(response.headers.get("set-cookie") || "").split(";")[0];
}

async function post(cookie, endpoint, input) {
  const response = await fetch(`${base}${endpoint}`, {
    method: "POST", headers: { Cookie: cookie, "Content-Type": "application/json" }, body: JSON.stringify(input)
  });
  return { status: response.status, body: await response.json() };
}

(async () => {
  try {
    await waitHealth();
    const admin = await login("admin1");
    const seller = await login("sofia");
    const codes = state.orders.slice(0, 100).map((order) => order.code);
    const invalidDriver = await post(admin, "/api/delivery/routes/plan", {
      orderCodes: codes.slice(0, 30), day: "2026-09-28", zone: "Malvinas", driverUser: "no-existe"
    });
    assert.equal(invalidDriver.status, 400);
    const planned = await post(admin, "/api/delivery/routes/plan", {
      orderCodes: codes.slice(0, 30), day: "2026-09-28", zone: "Malvinas", driverUser: "dario", driverLabel: "Texto falso"
    });
    assert.equal(planned.status, 200, planned.body.error);
    const routeId = planned.body.route.id;
    assert.equal(planned.body.route.name, "LUNES — MALVINAS — DARÍO");
    const denied = await post(seller, `/api/delivery/routes/${encodeURIComponent(routeId)}/orders`, { orderCodes: codes.slice(30) });
    assert.equal(denied.status, 403);
    const badBatch = await post(admin, `/api/delivery/routes/${encodeURIComponent(routeId)}/orders`, { orderCodes: [codes[30], codes[0]] });
    assert.equal(badBatch.status, 400);
    assert.equal(JSON.parse(fs.readFileSync(stateFile, "utf8")).state.deliveryRoutes[0].stops.length, 30);
    const appended = await post(admin, `/api/delivery/routes/${encodeURIComponent(routeId)}/orders`, { orderCodes: codes.slice(30) });
    assert.equal(appended.status, 200, appended.body.error);
    assert.equal(appended.body.route.stops.length, 100);
    const changed = await post(admin, `/api/delivery/routes/${encodeURIComponent(routeId)}/driver`, { driverUser: "reparto1" });
    assert.equal(changed.status, 200, changed.body.error);
    assert.equal(changed.body.route.driverUser, "reparto1");
    const secondCode = state.orders[100].code;
    const secondVisit = await post(admin, "/api/delivery/routes/plan", {
      orderCodes: [secondCode], day: "2026-09-29", zone: "Centro", driverUser: "dario", secondVisit: true
    });
    assert.equal(secondVisit.status, 200, secondVisit.body.error);
    assert.equal(secondVisit.body.route.stops[0].orderCode, secondCode);
    const persisted = JSON.parse(fs.readFileSync(stateFile, "utf8")).state;
    assert.equal(persisted.orders.length, 101);
    assert.equal(persisted.orders.filter((order) => order.status === Order.STATUS.READY_DISPATCH).length, 100);
    assert.equal(persisted.orders[100].status, Order.STATUS.NOT_DELIVERED);
    assert.equal(persisted.deliveryRoutes.find((route) => route.id === routeId).stops.length, 100);
    assert.ok(persisted.deliveryAudit.some((entry) => entry.action === "SEGUNDA_VISITA_PLANIFICADA" && entry.orderCode === secondCode));
    const published = await post(admin, `/api/delivery/routes/${encodeURIComponent(routeId)}/publish`, {});
    assert.equal(published.status, 200, published.body.error);
    const beforeReassignment = JSON.parse(fs.readFileSync(stateFile, "utf8")).state;
    const expected = { driverUser: "dario", expectedDriverUser: "reparto1", expectedUpdatedAt: published.body.route.updatedAt };
    const stale = await post(admin, `/api/delivery/routes/${encodeURIComponent(routeId)}/driver`, { ...expected, expectedUpdatedAt: "stale" });
    assert.equal(stale.status, 400);
    const deniedReassignment = await post(seller, `/api/delivery/routes/${encodeURIComponent(routeId)}/driver`, expected);
    assert.equal(deniedReassignment.status, 403);
    const reassigned = await post(admin, `/api/delivery/routes/${encodeURIComponent(routeId)}/driver`, expected);
    assert.equal(reassigned.status, 200, reassigned.body.error);
    assert.equal(reassigned.body.route.driverUser, "dario");
    assert.equal(reassigned.body.route.status, "Despachada");
    const afterReassignment = JSON.parse(fs.readFileSync(stateFile, "utf8")).state;
    for (const key of ["orders", "products", "accounts", "stockMovements"]) assert.deepEqual(afterReassignment[key], beforeReassignment[key], key);
    assert.deepEqual(afterReassignment.deliveryRoutes.filter(r => r.id !== routeId), beforeReassignment.deliveryRoutes.filter(r => r.id !== routeId));
    assert.deepEqual(reassigned.body.route.stops, published.body.route.stops);
    console.log("OK: published route reassignment via HTTP preserves orders, stock, accounts, stops and other routes; stale/admin guards passed.");
    console.log("OK: HTTP plan 30 + assign 70 + assign driver; second visit keeps original order; invalid user, duplicate batch and seller rejected without partial changes.");
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
