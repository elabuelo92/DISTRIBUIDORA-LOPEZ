"use strict";

const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawn } = require("node:child_process");

const root = path.join(__dirname, "..");
const volumes = String(process.env.DL_BENCH_VOLUMES || "10,50,100,200")
  .split(",")
  .map((value) => Number(value))
  .filter((value) => Number.isInteger(value) && value > 0);

function round(value) {
  return Math.round(Number(value || 0) * 10) / 10;
}

function adminUsers(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const passwordHash = crypto.pbkdf2Sync(password, salt, 120000, 32, "sha256").toString("hex");
  return { users: [{ username: "benchadmin", name: "Benchmark Admin", role: "admin", active: true, salt, passwordHash }] };
}

function fixture(volume) {
  const clients = Array.from({ length: Math.max(volume, 200) }, (_, index) => ({
    codigo_cliente: `C-${String(index + 1).padStart(4, "0")}`,
    name: `Cliente Benchmark ${String(index + 1).padStart(4, "0")}`,
    domicilio: `Calle ${index + 1}`,
    localidad: "Cordoba",
    zona: `Zona ${(index % 4) + 1}`,
    ruta: `Ruta ${(index % 4) + 1}`,
    status: "Activo",
    latitud: -31.4 + index / 100000,
    longitud: -64.18 + index / 100000
  }));
  const products = Array.from({ length: 700 }, (_, index) => ({
    codigo_producto: `P-${String(index + 1).padStart(4, "0")}`,
    codigo_barras: `779${String(index + 1).padStart(10, "0")}`,
    name: `Producto Benchmark ${String(index + 1).padStart(4, "0")}`,
    descripcion: `Producto Benchmark ${String(index + 1).padStart(4, "0")}`,
    stock: 1000,
    stock_actual: 1000,
    stock_fisico: 1000,
    price: 1000 + index
  }));
  const orders = Array.from({ length: volume }, (_, index) => {
    const client = clients[index];
    return {
      code: `PED-B${String(volume).padStart(3, "0")}-${String(index + 1).padStart(4, "0")}`,
      client: client.name,
      clientId: client.codigo_cliente,
      seller: `Vendedor ${(index % 4) + 1}`,
      amount: 5000 + index * 10,
      status: "Listo para Despacho",
      zone: client.zona,
      route: client.ruta,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      items: Array.from({ length: 5 }, (_, itemIndex) => ({
        productCode: products[(index + itemIndex) % products.length].codigo_producto,
        name: products[(index + itemIndex) % products.length].name,
        requestedQty: 1,
        reservedQty: 1,
        missingQty: 0,
        unitPrice: 1000 + itemIndex,
        lineTotal: 1000 + itemIndex
      })),
      assembly: { bultosConfirmed: (index % 4) + 1, label: { generated: true, scanned: true, packageLabels: [] } },
      trace: []
    };
  });
  return {
    products,
    clients,
    sellers: [],
    orders,
    activity: [],
    notifications: [],
    globalAudit: [],
    domainEvents: [],
    integrationOutbox: [],
    stockMovements: [],
    deliveryRoutes: [],
    deliveryAudit: [],
    deliveryClosures: [],
    accounts: [],
    priceLists: [],
    commissionAudit: [],
    performanceFixture: "x".repeat(2_000_000)
  };
}

async function runVolume(volume, offset) {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), `dl-v127-${volume}-`));
  const stateFile = path.join(tempDir, "demo-state.json");
  const usersFile = path.join(tempDir, "users.json");
  const password = "Benchmark-127";
  fs.writeFileSync(stateFile, JSON.stringify({ version: Date.now(), state: fixture(volume) }), "utf8");
  fs.writeFileSync(usersFile, JSON.stringify(adminUsers(password)), "utf8");
  const port = 21800 + offset;
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
      DL_VERSION: "8790-127-benchmark",
      DL_LICENSE_ENFORCEMENT: "disabled",
      DL_INTEGRITY_ENFORCE: "warn"
    },
    stdio: ["ignore", "pipe", "pipe"]
  });
  let output = "";
  child.stdout.on("data", (chunk) => { output += chunk.toString(); });
  child.stderr.on("data", (chunk) => { output += chunk.toString(); });
  const base = `http://127.0.0.1:${port}`;

  async function request(endpoint, options = {}) {
    const startedAt = performance.now();
    const response = await fetch(`${base}/${endpoint}`, {
      method: options.method || "GET",
      headers: { ...(options.cookie ? { Cookie: options.cookie } : {}), ...(options.body ? { "Content-Type": "application/json" } : {}) },
      body: options.body ? JSON.stringify(options.body) : undefined
    });
    const text = await response.text();
    const payload = text ? JSON.parse(text) : {};
    return {
      status: response.status,
      payload,
      bytes: Buffer.byteLength(text),
      elapsedMs: round(performance.now() - startedAt),
      serverTiming: response.headers.get("server-timing") || "",
      cookie: String(response.headers.get("set-cookie") || "").split(";")[0]
    };
  }

  try {
    let ready = false;
    for (let attempt = 0; attempt < 120; attempt += 1) {
      try {
        if ((await request("api/health")).status === 200) { ready = true; break; }
      } catch {}
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    if (!ready) throw new Error(`Servidor benchmark no inicio. ${output}`);
    const loginInput = { username: "benchadmin", password, device: { id: `BENCH-${volume}` } };
    let login = await request("api/login", { method: "POST", body: loginInput });
    if (login.status === 428) {
      loginInput.legalAcceptance = { accepted: true, version: login.payload.legal.currentVersion, hash: login.payload.legal.hash };
      login = await request("api/login", { method: "POST", body: loginInput });
    }
    assert.equal(login.status, 200, login.payload.error || "login benchmark");
    const cookie = login.cookie;
    const state = await request("api/state?version=0", { cookie });
    const clients = await request("api/clients?page=1&limit=50", { cookie });
    const delivery = await request("api/delivery", { cookie });
    const codes = fixture(volume).orders.map((order) => order.code);
    const plan = await request("api/delivery/routes/plan", {
      cookie,
      method: "POST",
      body: { orderCodes: codes, day: "2026-09-02", zone: "Benchmark", driverUser: "reparto1", driverLabel: "Reparto 1" }
    });
    assert.equal(plan.status, 200, plan.payload.error || "planificar");
    const routeId = plan.payload.route.id;
    const reorder = await request(`api/delivery/routes/${encodeURIComponent(routeId)}/reorder`, {
      cookie,
      method: "POST",
      body: { orderCodes: [...codes].reverse() }
    });
    assert.equal(reorder.status, 200, reorder.payload.error || "reordenar");
    const publish = await request(`api/delivery/routes/${encodeURIComponent(routeId)}/publish`, { cookie, method: "POST", body: {} });
    assert.equal(publish.status, 200, publish.payload.error || "publicar");
    return {
      volume,
      operations: {
        state: { ms: state.elapsedMs, bytes: state.bytes },
        clients: { ms: clients.elapsedMs, bytes: clients.bytes, serverTiming: clients.serverTiming },
        delivery: { ms: delivery.elapsedMs, bytes: delivery.bytes },
        plan: { ms: plan.elapsedMs, bytes: plan.bytes, compact: Boolean(plan.payload.compact) },
        reorder: { ms: reorder.elapsedMs, bytes: reorder.bytes, compact: Boolean(reorder.payload.compact) },
        publish: { ms: publish.elapsedMs, bytes: publish.bytes, compact: Boolean(publish.payload.compact) }
      }
    };
  } finally {
    child.kill();
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

(async () => {
  const startedAt = new Date().toISOString();
  const results = [];
  for (let index = 0; index < volumes.length; index += 1) results.push(await runVolume(volumes[index], index));
  const report = { ok: true, version: "8790-127-benchmark", startedAt, completedAt: new Date().toISOString(), results };
  const target = results.find((result) => result.volume === 100);
  if (target) {
    assert.equal(target.operations.plan.compact, true, "planificacion debe responder con parche compacto");
    assert.equal(target.operations.reorder.compact, true, "reordenamiento debe responder con parche compacto");
    assert.equal(target.operations.publish.compact, true, "publicacion debe responder con parche compacto");
    assert.ok(target.operations.plan.bytes < 500_000, `planificacion de 100 demasiado grande: ${target.operations.plan.bytes}`);
    assert.ok(target.operations.publish.bytes < 1_500_000, `publicacion de 100 demasiado grande: ${target.operations.publish.bytes}`);
    assert.ok(target.operations.publish.ms < 3000, `publicacion de 100 demasiado lenta: ${target.operations.publish.ms} ms`);
  }
  if (process.env.DL_BENCH_OUTPUT) fs.writeFileSync(path.resolve(process.env.DL_BENCH_OUTPUT), `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.log(JSON.stringify(report, null, 2));
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
