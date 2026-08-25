"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const http = require("node:http");
const os = require("node:os");
const path = require("node:path");
const { spawn } = require("node:child_process");

const root = path.join(__dirname, "..");
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "dl-client-v109-"));
const port = 19900 + Math.floor(Math.random() * 80);
const stateFile = path.join(tempDir, "demo-state.json");
const usersFile = path.join(tempDir, "users.json");
fs.copyFileSync(path.join(root, "data", "demo-state.json"), stateFile);
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
    DL_VERSION: "8790-109",
    DL_DEFAULT_PASSWORD: "Lopez2026!",
    DL_LICENSE_ENFORCEMENT: "disabled",
    DL_INTEGRITY_ENFORCE: "warn"
  },
  stdio: ["ignore", "pipe", "pipe"]
});
let childOutput = "";
child.stdout.on("data", (chunk) => { childOutput += chunk.toString(); });
child.stderr.on("data", (chunk) => { childOutput += chunk.toString(); });

const base = `http://127.0.0.1:${port}`;
const createTimings = [];

async function waitForHealth() {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    try {
      const response = await fetch(`${base}/api/health`);
      if (response.ok) return response.json();
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`El servidor temporal v109 no inicio. ${childOutput.trim()}`);
}

async function login() {
  const input = {
    username: "admin1",
    password: "Lopez2026!",
    device: { id: "SMOKE-CLIENT-V109", label: "Smoke clientes v109", model: "Node", os: process.platform, appVersion: "8790-109" }
  };
  let response = await fetch(`${base}/api/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input)
  });
  if (response.status === 428) {
    const required = await response.json();
    input.legalAcceptance = { accepted: true, version: required.legal.currentVersion, hash: required.legal.hash };
    response = await fetch(`${base}/api/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input)
    });
  }
  assert.equal(response.status, 200);
  return String(response.headers.get("set-cookie") || "").split(";")[0];
}

function clientInput(index, operationId) {
  return {
    operationId,
    codigo_cliente: `SMOKE109-${index}`,
    nombre_comercial: `Cliente prueba v109 ${index}`,
    razon_social: `Cliente prueba v109 ${index}`,
    consumidor_final: true,
    telefono: `35190000${String(index).padStart(2, "0")}`,
    domicilio: `Calle prueba ${100 + index}`,
    localidad: "Cordoba",
    forma_pago: "Contado",
    limite_credito: 0,
    zona: "Centro",
    ruta: "Centro",
    vendedor_asignado: "Administracion 1",
    dia_visita: "Lunes",
    preventistaPassword: "Lopez2026!",
    gps: { lat: -31.4167 - index / 10000, lng: -64.1833, accuracy: 8, source: "gps" }
  };
}

async function postClient(cookie, input) {
  const response = await fetch(`${base}/api/clients/mobile`, {
    method: "POST",
    headers: { Cookie: cookie, "Content-Type": "application/json" },
    body: JSON.stringify(input)
  });
  const payload = await response.json();
  assert.equal(response.status, 200, payload.error || input.nombre_comercial);
  assert.equal(payload.ok, true);
  assert.ok(payload.clientId);
  if (payload.performance && Number.isFinite(Number(payload.performance.totalMs))) createTimings.push(Number(payload.performance.totalMs));
  return payload;
}

function postAndDropResponse(cookie, input) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(input);
    const request = http.request(`${base}/api/clients/mobile`, {
      method: "POST",
      headers: { Cookie: cookie, "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body) }
    });
    request.on("error", (error) => {
      if (error.code === "ECONNRESET") resolve();
      else reject(error);
    });
    request.end(body, () => setTimeout(() => {
      request.destroy();
      resolve();
    }, 5));
  });
}

async function operationStatus(cookie, operationId) {
  const response = await fetch(`${base}/api/clients/mobile/status?operationId=${encodeURIComponent(operationId)}`, { headers: { Cookie: cookie } });
  const payload = await response.json();
  assert.equal(response.status, 200, payload.error || operationId);
  return payload;
}

async function fullState(cookie) {
  const response = await fetch(`${base}/api/state?version=0`, { headers: { Cookie: cookie } });
  assert.equal(response.status, 200);
  return response.json();
}

(async () => {
  const health = await waitForHealth();
  assert.equal(health.version, "8790-109");
  const cookie = await login();
  const initial = await fullState(cookie);
  const initialCount = initial.state.clients.length;

  const lostOperationId = "CLIENT-SMOKE109-LOST-RESPONSE";
  const lostInput = clientInput(1, lostOperationId);
  await postAndDropResponse(cookie, lostInput);
  await new Promise((resolve) => setTimeout(resolve, 500));
  let recovered = await operationStatus(cookie, lostOperationId);
  if (!recovered.found) recovered = await postClient(cookie, lostInput);
  assert.ok(recovered.client || recovered.found);

  const replay = await postClient(cookie, lostInput);
  assert.equal(replay.idempotentReplay, true);
  assert.equal(replay.clientId, recovered.clientId || recovered.client.codigo_cliente);

  for (let index = 2; index <= 10; index += 1) {
    const operationId = `CLIENT-SMOKE109-${String(index).padStart(2, "0")}`;
    const created = await postClient(cookie, clientInput(index, operationId));
    assert.equal(created.idempotentReplay, false);
  }

  const final = await fullState(cookie);
  const created = final.state.clients.filter((client) => String(client.createOperationId || "").startsWith("CLIENT-SMOKE109"));
  assert.equal(final.state.clients.length, initialCount + 10);
  assert.equal(created.length, 10);
  assert.equal(new Set(created.map((client) => client.createOperationId)).size, 10);
  assert.equal(fs.readdirSync(tempDir).filter((name) => name.endsWith(".tmp")).length, 0);

  console.log(JSON.stringify({
    ok: true,
    version: health.version,
    requested: 10,
    created: created.length,
    duplicates: 0,
    confirmations: 10,
    lostResponseRecovered: true,
    atomicWrite: true,
    averageApiMs: Math.round(createTimings.reduce((total, value) => total + value, 0) / Math.max(1, createTimings.length)),
    maxApiMs: Math.max(0, ...createTimings)
  }, null, 2));
})().finally(() => {
  child.kill();
  fs.rmSync(tempDir, { recursive: true, force: true });
}).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
