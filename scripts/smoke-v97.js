"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawn } = require("node:child_process");

const root = path.join(__dirname, "..");
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "dl-v97-"));
const port = 18800 + Math.floor(Math.random() * 500);
const stateFile = path.join(tempDir, "demo-state.json");
const usersFile = path.join(tempDir, "users.json");

function client(index) {
  const code = String(index).padStart(3, "0");
  return {
    codigo_cliente: `CLI-${code}`,
    name: `Cliente ${code}`,
    razon_social: `Razon ${code}`,
    cuit: `2030000${code}`,
    telefono: `3510000${code}`,
    domicilio: `Calle ${index}`,
    localidad: "Cordoba",
    zone: index % 2 ? "Norte" : "Centro",
    ruta: index % 2 ? "Ruta Norte" : "Ruta Centro",
    seller: index % 2 ? "Axel" : "Kevin Guibert",
    status: "Activo",
    balance: index % 5 === 0 ? 1000 : 0,
    limit: 10000,
    latitud: -31.4,
    longitud: -64.18
  };
}

const clients = Array.from({ length: 125 }, (_, index) => client(index + 1));
clients[11].name = "Cliente Zeta Unica";
fs.writeFileSync(stateFile, JSON.stringify({
  version: Date.now(),
  state: {
    clients,
    suppliers: [{ name: "Cliente 010", razon_social: "Razon 010", cuit: "2030000010" }],
    orders: [],
    accounts: [],
    products: [],
    sellers: [],
    notifications: [],
    globalAudit: []
  }
}), "utf8");

const child = spawn(process.execPath, [path.join(root, "server.js")], {
  cwd: root,
  env: {
    ...process.env,
    PORT: String(port),
    DL_PORT: String(port),
    DL_HOST: "127.0.0.1",
    DATA_DIR: tempDir,
    STATE_FILE: stateFile,
    USERS_FILE: usersFile,
    DL_VERSION: "8790-97",
    DL_DEFAULT_PASSWORD: "Lopez2026!",
    DL_LICENSE_ENFORCEMENT: "disabled",
    DL_INTEGRITY_ENFORCE: "warn"
  },
  stdio: ["ignore", "pipe", "pipe"]
});

async function waitForHealth(baseUrl) {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try {
      const response = await fetch(`${baseUrl}/api/health`);
      if (response.ok) return response.json();
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error("El servidor temporal v97 no inicio.");
}

(async () => {
  const baseUrl = `http://127.0.0.1:${port}`;
  const health = await waitForHealth(baseUrl);
  assert.equal(health.version, "8790-97");

  const loginPayload = {
    username: "admin1",
    password: "Lopez2026!",
    device: { id: "SMOKE-V97", label: "Smoke v97", model: "Node", os: process.platform, appVersion: "8790-97" }
  };
  let login = await fetch(`${baseUrl}/api/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(loginPayload)
  });
  if (login.status === 428) {
    const required = await login.json();
    loginPayload.legalAcceptance = {
      accepted: true,
      version: required.legal.currentVersion,
      hash: required.legal.hash
    };
    login = await fetch(`${baseUrl}/api/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(loginPayload)
    });
  }
  assert.equal(login.status, 200);
  const cookie = String(login.headers.get("set-cookie") || "").split(";")[0];
  assert.ok(cookie);

  const startedAt = performance.now();
  const pageResponse = await fetch(`${baseUrl}/api/clients?page=2&limit=50`, { headers: { Cookie: cookie } });
  const elapsedMs = Math.round((performance.now() - startedAt) * 10) / 10;
  assert.equal(pageResponse.status, 200);
  const page = await pageResponse.json();
  assert.equal(page.total, 125);
  assert.equal(page.page, 2);
  assert.equal(page.totalPages, 3);
  assert.equal(page.records.length, 50);
  assert.equal(new Set(page.records.map((item) => item.codigo_cliente)).size, 50);
  assert.ok(!page.records.some((item) => item.codigo_cliente === "CLI-001"));
  assert.ok(page.performance.queryMs >= 0);
  assert.ok(JSON.stringify(page).length < 100000);

  const searchResponse = await fetch(`${baseUrl}/api/clients?page=1&limit=50&search=Zeta%20Unica&zone=Centro`, { headers: { Cookie: cookie } });
  const search = await searchResponse.json();
  assert.equal(search.total, 1);
  assert.equal(search.records[0].codigo_cliente, "CLI-012");

  const deferredStateResponse = await fetch(`${baseUrl}/api/state?version=0&deferState=clients`, { headers: { Cookie: cookie } });
  const deferredState = await deferredStateResponse.json();
  assert.equal(deferredStateResponse.status, 200);
  assert.equal(deferredState.deferred, true);
  assert.equal(deferredState.state, null);

  const appSource = fs.readFileSync(path.join(root, "app.js"), "utf8");
  assert.match(appSource, /CLIENTS_PAGE_SIZE = 50/);
  assert.match(appSource, /CLIENTS_REQUEST_TIMEOUT_MS = 8000/);
  assert.match(appSource, /clientLoadRequest && clientLoadRequest\.query === query/);
  assert.match(appSource, /activeViewId\(\) !== "clientes"/);
  assert.match(appSource, /deferState=clients/);
  assert.match(appSource, /debounce\(\(\) => \{[\s\S]*?renderClients\(\{ force: true \}\);[\s\S]*?\}, 400\)/);

  console.log(JSON.stringify({
    ok: true,
    version: health.version,
    totalClients: page.total,
    pageSize: page.records.length,
    endpointElapsedMs: elapsedMs,
    endpointQueryMs: page.performance.queryMs,
    responseBytes: JSON.stringify(page).length,
    duplicateRequestsGuarded: true
  }, null, 2));
})().finally(() => {
  child.kill();
  fs.rmSync(tempDir, { recursive: true, force: true });
}).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
