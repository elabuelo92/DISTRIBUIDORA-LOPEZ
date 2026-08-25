"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawn } = require("node:child_process");
const portfolio = require("../client-portfolio-engine");

const fixture = [
  { codigo_cliente: "P101-K1", name: "Kiosco Kevin Hoy", vendedor_asignado: "Kevin Guibert", dia_visita: "Lunes", ruta: "Centro", domicilio: "Colon 100", telefono: "1", localidad: "Cordoba" },
  { codigo_cliente: "P101-K2", name: "Kiosco Kevin Otro Dia", seller: "Kevin Guibert", dia_visita: "Martes", ruta: "Centro", domicilio: "Colon 200", telefono: "2", localidad: "Cordoba" },
  { codigo_cliente: "P101-C1", name: "Comercio Carlos", vendedor: "Carlos Roldan", dia_visita: "Lunes", ruta: "Norte", domicilio: "Patria 300", telefono: "3", localidad: "Cordoba" },
  { codigo_cliente: "P101-U1", name: "Cliente Sin Asignar", dia_visita: "Lunes", ruta: "Sur", domicilio: "Sabattini 400", telefono: "4", localidad: "Cordoba" }
];

const kevin = { sellerIdentities: ["Kevin Guibert", "kevin"], sellerRoute: "Centro", workday: "Lunes" };
assert.deepEqual(portfolio.filterClients(fixture, { ...kevin, scope: "today" }).map((item) => item.codigo_cliente), ["P101-K1"]);
assert.deepEqual(portfolio.filterClients(fixture, { ...kevin, scope: "portfolio" }).map((item) => item.codigo_cliente), ["P101-K1", "P101-K2"]);
assert.deepEqual(new Set(portfolio.filterClients(fixture, { ...kevin, scope: "outside" }).map((item) => item.codigo_cliente)), new Set(["P101-K2", "P101-C1", "P101-U1"]));
assert.deepEqual(portfolio.filterClients(fixture, { ...kevin, scope: "portfolio", search: "patria" }), []);
assert.deepEqual(portfolio.filterClients(fixture, { ...kevin, scope: "portfolio", search: "otro dia" }).map((item) => item.codigo_cliente), ["P101-K2"]);
assert.equal(portfolio.matchesWorkday({ dia_visita: "2/7 LuVi" }, "Lunes"), true);
assert.equal(portfolio.matchesWorkday({ dia_visita: "2/7 LuVi" }, "Viernes"), true);

const root = path.join(__dirname, "..");
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "dl-portfolio-v110-"));
const port = 20000 + Math.floor(Math.random() * 80);
const stateFile = path.join(tempDir, "demo-state.json");
const usersFile = path.join(tempDir, "users.json");
const statePayload = JSON.parse(fs.readFileSync(path.join(root, "data", "demo-state.json"), "utf8"));
const mutableState = statePayload.state || statePayload;
mutableState.clients = [...fixture, ...(mutableState.clients || []).filter((client) => !String(client.codigo_cliente || "").startsWith("P101-"))];
fs.writeFileSync(stateFile, JSON.stringify(statePayload, null, 2));
fs.copyFileSync(path.join(root, "data", "users.json"), usersFile);

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
    DL_VERSION: "8790-110",
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

async function login(username = "admin1") {
  const input = { username, password: "Lopez2026!", device: { id: `SMOKE-${username}`, model: "Node", os: process.platform, appVersion: "8790-110" } };
  let response = await fetch(`${base}/api/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
  if (response.status === 428) {
    const required = await response.json();
    input.legalAcceptance = { accepted: true, version: required.legal.currentVersion, hash: required.legal.hash };
    response = await fetch(`${base}/api/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
  }
  assert.equal(response.status, 200, `login ${username}`);
  return String(response.headers.get("set-cookie") || "").split(";")[0];
}

async function jsonRequest(url, cookie, options = {}) {
  const response = await fetch(`${base}${url}`, { ...options, headers: { Cookie: cookie, "Content-Type": "application/json", ...(options.headers || {}) } });
  const payload = await response.json();
  return { response, payload };
}

(async () => {
  const health = await waitForHealth();
  assert.equal(health.version, "8790-110");
  const adminCookie = await login();

  const rejected = await jsonRequest("/api/clients/bulk-assign", adminCookie, {
    method: "POST",
    body: JSON.stringify({ clientIds: ["P101-K2", "P101-U1"], seller: "Carlos Roldan", route: "Ruta Test", day: "Miercoles", motive: "Prueba atomica", admin_password: "incorrecta" })
  });
  assert.equal(rejected.response.status, 401);

  const applied = await jsonRequest("/api/clients/bulk-assign", adminCookie, {
    method: "POST",
    body: JSON.stringify({ clientIds: ["P101-K2", "P101-U1"], seller: "Carlos Roldan", route: "Ruta Test", zone: "Zona Test", day: "Miercoles", motive: "Prueba Prompt 101", admin_password: "Lopez2026!" })
  });
  assert.equal(applied.response.status, 200, applied.payload.error);
  assert.equal(applied.payload.affected, 2);
  assert.equal(applied.payload.updated.every((client) => client.seller === "Carlos Roldan" && client.ruta === "Ruta Test" && client.dia_visita === "Miercoles"), true);

  const carlosList = await jsonRequest("/api/clients?page=1&limit=50&seller=Carlos%20Roldan&search=P101-", adminCookie);
  assert.equal(carlosList.response.status, 200);
  assert.equal(new Set(carlosList.payload.records.map((client) => client.codigo_cliente)).has("P101-K2"), true);
  assert.equal(new Set(carlosList.payload.records.map((client) => client.codigo_cliente)).has("P101-U1"), true);

  const full = await jsonRequest("/api/state?version=0", adminCookie);
  const audit = full.payload.state.globalAudit.filter((entry) => entry.action === "CLIENTE_ASIGNACION_MASIVA" && entry.note === "Prueba Prompt 101");
  assert.equal(audit.length, 2);

  console.log(JSON.stringify({
    ok: true,
    version: health.version,
    kevinToday: 1,
    kevinPortfolio: 2,
    carlosToday: 1,
    outsideWithoutMixing: 3,
    bulkAssigned: applied.payload.affected,
    auditEntries: audit.length,
    wrongPasswordRejected: true
  }, null, 2));
})().finally(() => {
  child.kill();
  fs.rmSync(tempDir, { recursive: true, force: true });
}).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
