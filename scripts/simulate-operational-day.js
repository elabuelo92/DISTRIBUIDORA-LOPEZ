"use strict";

const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const net = require("node:net");
const os = require("node:os");
const path = require("node:path");
const { spawn } = require("node:child_process");

const root = path.join(__dirname, "..");
const durationMs = Number(process.env.DL_SIM_DURATION_MS || 600000);
const targetOrders = Number(process.env.DL_SIM_ORDERS || 100);
const targetBytes = Number(process.env.DL_SIM_STATE_BYTES || 44269298);
const sellerCount = Number(process.env.DL_SIM_SELLERS || 10);
const adminCount = Number(process.env.DL_SIM_ADMINS || 4);
const driverCount = Number(process.env.DL_SIM_DRIVERS || 1);
const receiverCount = Number(process.env.DL_SIM_RECEIVERS || 0);
const clientCount = Number(process.env.DL_SIM_CLIENTS || 300);
const historyCount = Number(process.env.DL_SIM_HISTORY || 254);
const simulateGps = process.env.DL_SIM_GPS === "1";
const cpuProfile = process.env.DL_SIM_CPU_PROFILE === "1";
const publicHealthUrl = String(process.env.DL_SIM_PUBLIC_HEALTH_URL || "");
const connectionClose = process.env.DL_SIM_CONNECTION_CLOSE === "1";
const deliverAll = process.env.DL_SIM_DELIVER_ALL === "1";
const allReaders = process.env.DL_SIM_ALL_READERS === "1";
const incrementalReads = process.env.DL_SIM_INCREMENTAL_READS === "1";
const sectionSync = process.env.DL_SIM_SECTION_SYNC === "1";
const readerIntervalMs = Number(process.env.DL_SIM_READER_INTERVAL_MS || 5000);
const reportPath = process.env.DL_SIM_REPORT_PATH || "";
assert.ok(readerIntervalMs >= 1000 && readerIntervalMs <= 60000);
assert.ok(durationMs >= 10000 && durationMs <= 900000);
assert.ok(targetOrders >= 1 && targetOrders <= 200);
assert.ok(targetBytes >= 1000000 && targetBytes <= 60000000);
assert.ok(sellerCount >= 1 && sellerCount <= 20);
assert.ok(adminCount >= 1 && adminCount <= 10);
assert.ok(driverCount >= 1 && driverCount <= 10);
assert.ok(receiverCount >= 0 && receiverCount <= 5);
assert.ok(Number.isInteger(clientCount) && clientCount >= 100 && clientCount <= 5000);
assert.ok(Number.isInteger(historyCount) && historyCount >= 0 && historyCount <= 5000);

const tempRoot = path.resolve(os.tmpdir());
const tempDir = fs.mkdtempSync(path.join(tempRoot, "dl-operational-sim-"));
const stateFile = path.join(tempDir, "demo-state.json");
const usersFile = path.join(tempDir, "users.json");
const password = `Sim-${crypto.randomBytes(12).toString("hex")}`;
const startedAt = new Date().toISOString();
const report = {
  version: "8790-163-simulation",
  startedAt,
  durationMs,
  targetOrders,
  deliverAll,
  actors: { sellers: sellerCount, admins: adminCount, depot: 1, drivers: driverCount, receivers: receiverCount },
  allReaders,
  incrementalReads,
  sectionSync,
  clientCount,
  historyCount,
  simulateGps,
  cpuProfile,
  readerIntervalMs,
  syntheticStateBytes: 0,
  transport: connectionClose ? "new-connection" : "pooled-connection",
  productionWrites: 0,
  recoveredNetworkCuts: 0,
  operations: {},
  failures: [],
  hostSamples: [],
  publicHealth: { checks: 0, failures: 0, slow: 0, maxMs: 0 },
  abortedForProductionHealth: false,
  abortedForHostPressure: false
};

function sleep(ms) { return new Promise((resolve) => setTimeout(resolve, Math.max(0, ms))); }
function actorName(index) { return `Vendedor Sim ${index + 1}`; }
function driverName(index) { return index === 0 ? "simdriver" : `simdriver${index + 1}`; }
function summarize(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const at = (percent) => sorted[Math.min(sorted.length - 1, Math.ceil(sorted.length * percent) - 1)] || 0;
  return { count: sorted.length, p50Ms: at(0.5), p95Ms: at(0.95), p99Ms: at(0.99), maxMs: sorted.at(-1) || 0 };
}
function record(name, ms, status, error) {
  const entry = report.operations[name] ||= { durations: [], httpErrors: 0, timeouts: 0 };
  entry.durations.push(Math.round(ms));
  if (status >= 400 || error) {
    entry.httpErrors += 1;
    if (/abort|timeout/i.test(String(error || ""))) entry.timeouts += 1;
    if (report.failures.length < 50) report.failures.push({ operation: name, status, error: String(error || "").slice(0, 180) });
  }
}
function fixture() {
  const clients = Array.from({ length: clientCount }, (_, index) => ({
    codigo_cliente: `SIM-C${index + 1}`,
    name: `Cliente Sim ${index + 1}`,
    domicilio: `Calle Sim ${index + 1}`,
    localidad: "Cordoba",
    zona: `Zona ${index % 4 + 1}`,
    ruta: `Ruta ${index % 4 + 1}`,
    vendedor_titular: actorName(index % sellerCount),
    seller: actorName(index % sellerCount),
    status: "Activo",
    latitud: -31.4 + index / 100000,
    longitud: -64.18 + index / 100000
  }));
  const products = Array.from({ length: 711 }, (_, index) => ({
    codigo_producto: `SIM-P${index + 1}`,
    codigo_barras: `779${String(index + 1).padStart(10, "0")}`,
    name: `Producto Sim ${index + 1}`,
    descripcion: `Producto Sim ${index + 1}`,
    stock: 10000,
    stock_actual: 10000,
    stock_fisico: 10000,
    price: 1000 + index
  }));
  const orders = Array.from({ length: historyCount }, (_, index) => ({
    code: `PED-SIM-H${index + 1}`,
    client: clients[index % clients.length].name,
    seller: actorName(index % sellerCount),
    amount: 5000,
    status: "Cobrado",
    createdAt: "2026-09-01T12:00:00.000Z",
    items: [{ productCode: "SIM-P1", name: "Producto Sim 1", requestedQty: 5, unitPrice: 1000, lineTotal: 5000 }],
    assembly: { bultosConfirmed: 1, label: { generated: true, scanned: false } },
    trace: []
  }));
  return {
    products, clients, sellers: [], orders, activity: [], notifications: [], globalAudit: [],
    domainEvents: [], integrationOutbox: [], stockMovements: [], deliveryRoutes: [],
    deliveryAudit: [], deliveryClosures: [], accounts: [], priceLists: [], commissionAudit: [],
    performanceFixture: ""
  };
}
function createUsers() {
  const salt = crypto.randomBytes(16).toString("hex");
  const passwordHash = crypto.pbkdf2Sync(password, salt, 120000, 32, "sha256").toString("hex");
  const entry = (username, name, role, extra = {}) => ({ username, name, role, active: true, salt, passwordHash, ...extra });
  return { users: [
    ...Array.from({ length: sellerCount }, (_, index) => entry(`simseller${index + 1}`, actorName(index), "seller", { sellerName: actorName(index) })),
    ...Array.from({ length: adminCount }, (_, index) => entry(`simadmin${index + 1}`, `Admin Sim ${index + 1}`, "admin")),
    entry("simdepot", "Deposito Sim", "depot"),
    ...Array.from({ length: driverCount }, (_, index) => entry(driverName(index), `Reparto Sim ${index + 1}`, "driver")),
    ...Array.from({ length: receiverCount }, (_, index) => entry(`simreceiver${index + 1}`, `Recepcion Sim ${index + 1}`, "receiver"))
  ] };
}
async function freePort() {
  const server = net.createServer();
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const port = server.address().port;
  await new Promise((resolve) => server.close(resolve));
  return port;
}
function hostSample(childPid) {
  const sample = {
    at: new Date().toISOString(),
    load1: Math.round(os.loadavg()[0] * 100) / 100,
    freeMemMb: Math.round(os.freemem() / 1048576)
  };
  if (process.platform === "linux") {
    try {
      const status = fs.readFileSync(`/proc/${childPid}/status`, "utf8");
      sample.simRssMb = Math.round(Number(status.match(/^VmRSS:\s+(\d+)/m)?.[1] || 0) / 1024);
    } catch {}
    try {
      const meminfo = fs.readFileSync("/proc/meminfo", "utf8");
      sample.availableMemMb = Math.round(Number(meminfo.match(/^MemAvailable:\s+(\d+)/m)?.[1] || 0) / 1024);
    } catch {}
  }
  report.hostSamples.push(sample);
  return sample;
}

async function main() {
  const state = fixture();
  const sectionManifests = new Map();
  const stateEndpoint = (user, version) => `api/state?version=${version}${sectionSync ? "&syncFormat=sections-v1" : ""}${sectionSync && sectionManifests.has(user) ? `&sections=${encodeURIComponent(JSON.stringify(sectionManifests.get(user)))}` : ""}`;
  let raw = JSON.stringify({ version: Date.now(), state });
  state.performanceFixture = "x".repeat(Math.max(0, targetBytes - Buffer.byteLength(raw) - 2));
  raw = JSON.stringify({ version: Date.now(), state });
  fs.writeFileSync(stateFile, raw, "utf8");
  report.syntheticStateBytes = Buffer.byteLength(raw);
  fs.writeFileSync(usersFile, JSON.stringify(createUsers()), "utf8");
  const port = await freePort();
  const child = spawn(process.execPath, ["--max-old-space-size=768",
    ...(cpuProfile ? ["--require", path.join(__dirname, "profile-isolated-server.js")] : []), path.join(root, "server.js")], {
    cwd: root,
    env: {
      ...process.env,
      DL_HOST: "127.0.0.1", DL_PORT: String(port), PORT: String(port),
      DATA_DIR: tempDir, STATE_FILE: stateFile, USERS_FILE: usersFile,
      DL_VERSION: report.version, DL_LICENSE_ENFORCEMENT: "disabled", DL_INTEGRITY_ENFORCE: "warn"
    },
    stdio: cpuProfile ? ["ignore", "pipe", "pipe", "ipc"] : ["ignore", "pipe", "pipe"]
  });
  let output = "";
  child.stdout.on("data", (chunk) => { output = (output + chunk.toString()).slice(-4000); });
  child.stderr.on("data", (chunk) => { output = (output + chunk.toString()).slice(-4000); });
  if (process.platform === "linux") {
    try { os.setPriority(child.pid, 10); }
    catch { report.priorityWarning = "No se pudo bajar la prioridad del proceso aislado."; }
  }
  const base = `http://127.0.0.1:${port}`;
  let stop = false;
  const cookies = new Map();
  const readVersions = new Map();
  const created = [];
  const ready = [];
  const queued = [];
  const routeCodes = new Set();
  const routes = [];
  let healthConsecutive = 0;

  async function request(name, endpoint, options = {}) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), options.timeoutMs || 45000);
    const start = performance.now();
    try {
      const response = await fetch(`${base}/${endpoint}`, {
        method: options.method || "GET",
        headers: {
          ...(options.actor ? { Cookie: cookies.get(options.actor) || "" } : {}),
          ...(options.body ? { "Content-Type": "application/json" } : {}),
          ...(connectionClose ? { Connection: "close" } : {})
        },
        body: options.body ? JSON.stringify(options.body) : undefined,
        signal: controller.signal
      });
      const text = await response.text();
      let payload = {};
      if (options.parse !== false && text) {
        try { payload = JSON.parse(text); }
        catch { payload = { error: text.slice(0, 300) }; }
      }
      const expectedLegalGate = name === "login" && response.status === 428;
      record(name, performance.now() - start, expectedLegalGate ? 200 : response.status,
        response.status >= 400 && !expectedLegalGate ? payload.error || text.slice(0, 180) : "");
      const metric = report.operations[name];
      metric.wireBytes = (metric.wireBytes || 0) + (Number(response.headers.get("Content-Length")) || 0);
      metric.decodedBytes = (metric.decodedBytes || 0) + Buffer.byteLength(text);
      if (payload.partial) metric.partialResponses = (metric.partialResponses || 0) + 1;
      return { status: response.status, payload, retryAfterSeconds: Number(response.headers.get("Retry-After")) || 5, cookie: String(response.headers.get("set-cookie") || "").split(";")[0] };
    } catch (error) {
      const detail = [error.message, error.cause?.code, error.cause?.message].filter(Boolean).join(" | ");
      if (name !== "simHealth") record(name, performance.now() - start, 0, detail);
      return { status: 0, payload: { error: detail } };
    } finally { clearTimeout(timer); }
  }
  async function login(username) {
    const input = { username, password, device: { id: `SIM-${username}`, label: "Simulacion aislada", model: "Node", os: process.platform, appVersion: report.version } };
    let result = await request("login", "api/login", { method: "POST", body: input });
    if (result.status === 428) {
      input.legalAcceptance = { accepted: true, version: result.payload.legal.currentVersion, hash: result.payload.legal.hash };
      result = await request("login", "api/login", { method: "POST", body: input });
    }
    assert.equal(result.status, 200, `${username}: ${result.payload.error || "login fallo"}`);
    cookies.set(username, result.cookie);
  }
  async function publicProbe() {
    if (!publicHealthUrl) return;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000);
    const start = performance.now();
    try {
      const response = await fetch(publicHealthUrl, { signal: controller.signal });
      const body = await response.json();
      const elapsed = Math.round(performance.now() - start);
      report.publicHealth.checks += 1;
      report.publicHealth.maxMs = Math.max(report.publicHealth.maxMs, elapsed);
      if (!response.ok || !body.ok || (process.env.DL_SIM_EXPECTED_PUBLIC_VERSION && body.runtimeVersion !== process.env.DL_SIM_EXPECTED_PUBLIC_VERSION)) {
        report.publicHealth.failures += 1;
        healthConsecutive += 1;
      } else if (elapsed > 8000) {
        report.publicHealth.slow += 1;
        healthConsecutive += 1;
      } else healthConsecutive = 0;
    } catch {
      report.publicHealth.checks += 1;
      report.publicHealth.failures += 1;
      healthConsecutive += 1;
    } finally { clearTimeout(timer); }
    if (healthConsecutive >= 2) {
      stop = true;
      report.abortedForProductionHealth = true;
    }
  }
  async function create(index) {
    const actor = `simseller${index % sellerCount + 1}`;
    const client = `Cliente Sim ${index % 300 + 1}`;
    const items = Array.from({ length: 5 }, (_, item) => ({ productCode: `SIM-P${(index * 5 + item) % 711 + 1}`, qty: item % 2 + 1 }));
    const operationId = `SIM-OP-${String(index + 1).padStart(8, "0")}`;
    const body = { client, items, source: "mobile", operationId };
    let result = await request("createOrder", "api/orders", { actor, method: "POST", body });
    if (result.status === 0 || result.status >= 500) {
      const check = await request("createOrder.reconcile", `api/orders/mobile/status?operationId=${encodeURIComponent(operationId)}`, { actor });
      if (check.status === 200 && check.payload.found && check.payload.order) {
        result = { status: 200, payload: { order: check.payload.order } };
        report.recoveredNetworkCuts += 1;
      } else if (check.status === 200 && !check.payload.found) {
        await sleep(250);
        result = await request("createOrder.retry", "api/orders", { actor, method: "POST", body });
        if (result.status === 200) report.recoveredNetworkCuts += 1;
      }
    }
    if (result.status === 200 && result.payload.order?.code) {
      created.push(result.payload.order.code);
      queued.push(result.payload.order.code);
    }
  }
  async function processBatch(force = false) {
    if (!queued.length || (stop && !force)) return;
    const codes = queued.splice(0, 10);
    for (const action of ["assembly", "labels", "verify-ready"]) {
      const result = await request(`workflow.${action}`, "api/orders/bulk-workflow", {
        actor: "simdepot", method: "POST", body: { orderCodes: codes, action }
      });
      if (result.status !== 200 || (result.payload.errors || []).length) {
        if (report.failures.length < 50) report.failures.push({ operation: `workflow.${action}`, error: JSON.stringify(result.payload.errors || result.payload.error).slice(0, 180) });
        return;
      }
    }
    ready.push(...codes);
  }
  async function publishRoute(codes, force = false) {
    if (!codes.length || (stop && !force)) return;
    const batchSize = Math.ceil(targetOrders / driverCount);
    if (driverCount > 1 && codes.length > batchSize) {
      for (let offset = 0; offset < codes.length; offset += batchSize) await publishRoute(codes.slice(offset, offset + batchSize), force);
      return;
    }
    const driver = driverName(routes.length % driverCount);
    const deviceId = `SIM-${driver}`;
    const planned = await request("route.plan", "api/delivery/routes/plan", {
      actor: "simadmin1", method: "POST", body: {
        orderCodes: codes, day: "2026-09-16", zone: "Simulacion", driverUser: driver, driverLabel: driver
      }
    });
    if (planned.status !== 200 || !planned.payload.route?.id) return;
    const routeId = planned.payload.route.id;
    routes.push({ id: routeId, codes });
    codes.forEach((code) => routeCodes.add(code));
    await request("route.reorder", `api/delivery/routes/${encodeURIComponent(routeId)}/reorder`, {
      actor: "simadmin1", method: "POST", body: { orderCodes: [...codes].reverse() }
    });
    const published = await request("route.publish", `api/delivery/routes/${encodeURIComponent(routeId)}/publish`, {
      actor: "simadmin1", method: "POST", body: {}
    });
    if (published.status === 200) {
      const claimed = await request("route.claim", `api/delivery/routes/${encodeURIComponent(routeId)}/claim`, {
        actor: driver, method: "POST", body: { deviceId, deviceLabel: driver }
      });
      if (claimed.status === 200 && deliverAll) {
        const orderByCode = new Map((published.payload.orders || []).map((order) => [order.code, order]));
        const gps = { lat: -31.4, lng: -64.18, accuracy: 10, source: "simulation" };
        for (const stop of claimed.payload.route.stops || []) {
          const order = orderByCode.get(stop.orderCode);
          if (!order) {
            report.failures.push({ operation: "delivery.collect", error: `Missing order ${stop.orderCode}` });
            break;
          }
          const result = await request("delivery.collect", `api/delivery/orders/${encodeURIComponent(order.code)}/collect`, {
            actor: driver, method: "POST", body: {
              method: "Efectivo", amountPaid: order.amount, deviceId, gps
            }
          });
          if (result.status !== 200) break;
        }
      } else if (claimed.status === 200 && routes.length === 1) {
        const first = codes.at(-1);
        const gps = { lat: -31.4, lng: -64.18, accuracy: 10, source: "simulation" };
        const status = await request("delivery.status", `api/delivery/orders/${encodeURIComponent(first)}/status`, {
          actor: driver, method: "POST", body: { status: "En Reparto", deviceId, gps }
        });
        if (status.status === 200) {
          const order = status.payload.order;
          await request("delivery.collect", `api/delivery/orders/${encodeURIComponent(first)}/collect`, {
            actor: driver, method: "POST", body: {
              method: "Efectivo", amountPaid: order.amount, deviceId, gps
            }
          });
        }
      }
    }
  }

  try {
    for (let attempt = 0; attempt < 120; attempt += 1) {
      const health = await request("simHealth", "api/health", { timeoutMs: 5000 });
      if (health.status === 200) break;
      if (attempt === 119) throw new Error(`Servidor aislado no inicio: ${output}`);
      await sleep(100);
    }
    await publicProbe();
    assert.equal(report.publicHealth.failures, 0, "Produccion ya no estaba sana antes de iniciar la carga.");
    for (const user of createUsers().users) await login(user.username);
    const testStart = performance.now();
    const deadline = testStart + durationMs;
    const gpsTasks = simulateGps ? Promise.allSettled(createUsers().users
      .filter(user => ["seller", "driver"].includes(user.role)).map(async (user, index) => {
        await sleep(index * 200);
        while (!stop && performance.now() < deadline) {
          await request(`${user.role}.gps`, "api/presence/location", {
            actor: user.username, method: "POST",
            body: { gps: { lat: -31.4 + index / 100000, lng: -64.18, accuracy: 10,
              deviceAt: new Date().toISOString(), source: "gps" } }
          });
          await sleep(user.role === "driver" ? 10000 : 30000);
        }
      })) : Promise.resolve([]);
    const background = (async () => {
      let lowMemoryConsecutive = 0;
      while (!stop && performance.now() < deadline) {
        const sample = hostSample(child.pid);
        console.error(JSON.stringify({ progressSeconds: Math.round((performance.now() - testStart) / 1000), created: created.length, ready: ready.length, planned: routeCodes.size, failures: report.failures.length, freeMemMb: sample.freeMemMb }));
        lowMemoryConsecutive = sample.availableMemMb !== undefined && sample.availableMemMb < 800
          ? lowMemoryConsecutive + 1 : 0;
        if (lowMemoryConsecutive >= 2) {
          report.abortedForHostPressure = true;
          stop = true;
          break;
        }
        await publicProbe();
        await sleep(15000);
      }
    })();
    const reader = allReaders ? Promise.allSettled(createUsers().users.map(async (user) => {
      if (incrementalReads) await sleep(Math.random() * 3000);
      while (!stop && performance.now() < deadline) {
        const version = incrementalReads ? readVersions.get(user.username) || 0 : 0;
        const endpoint = user.role === "driver" ? "api/delivery" : stateEndpoint(user.username, version);
        const result = await request(`${user.role}.concurrentRead`, endpoint, { actor: user.username, parse: incrementalReads });
        if (result.status === 200 && result.payload.sections) sectionManifests.set(user.username, result.payload.sections);
        if (incrementalReads && result.status === 200 && result.payload.version) readVersions.set(user.username, Number(result.payload.version));
        if (user.role === "admin") await request("admin.clients", "api/clients?page=1&limit=25", { actor: user.username });
        const interval = incrementalReads ? (user.role === "seller" || user.role === "driver" ? 15000 : 10000) : readerIntervalMs;
        const retry = result.status === 503 ? result.retryAfterSeconds * 1000 : 0;
        await sleep(Math.max(interval, retry) + (incrementalReads ? Math.random() * 2000 : 0));
      }
    })) : (async () => {
      let cycle = 0;
      while (!stop && performance.now() < deadline) {
        const seller = `simseller${cycle % sellerCount + 1}`;
        await request("seller.state", "api/state?version=0", { actor: seller, parse: false });
        await request("admin.clients", "api/clients?page=1&limit=25", { actor: `simadmin${cycle % adminCount + 1}` });
        await request("driver.delivery", "api/delivery", { actor: "simdriver" });
        cycle += 1;
        await sleep(5000);
      }
    })();
    const worker = (async () => {
      let firstRoute = false;
      while (!stop && performance.now() < deadline) {
        await processBatch();
        if (!firstRoute && ready.length >= Math.max(1, Math.floor(targetOrders / 3)) && performance.now() >= testStart + durationMs / 2) {
          firstRoute = true;
          await publishRoute(ready.filter((code) => !routeCodes.has(code)));
        }
        await sleep(2000);
      }
    })();
    const inFlight = new Set();
    for (let index = 0; index < targetOrders && !stop; index += 1) {
      await sleep(testStart + durationMs * index / targetOrders - performance.now());
      if (performance.now() >= deadline || stop) break;
      while (inFlight.size >= 3 && !stop) await Promise.race(inFlight);
      const task = create(index).finally(() => inFlight.delete(task));
      inFlight.add(task);
    }
    await Promise.allSettled([...inFlight]);
    stop = true;
    await Promise.allSettled([background, reader, worker]);
    const gpsResults = await gpsTasks;
    assert.equal(gpsResults.filter(result => result.status === "rejected").length, 0, "Fallo del generador GPS aislado");
    if (!report.abortedForProductionHealth && !report.abortedForHostPressure) {
      while (queued.length) await processBatch(true);
      await publishRoute(ready.filter((code) => !routeCodes.has(code)), true);
    }
    if (incrementalReads) {
      const finalVersion = Number(JSON.parse(fs.readFileSync(stateFile, "utf8")).version);
      const catchupStart = performance.now();
      const catchupDeadline = Date.now() + 60000;
      const actors = createUsers().users;
      const catchups = await Promise.allSettled(actors.map(async (user, index) => {
        await sleep(index * 250);
        while ((readVersions.get(user.username) || 0) < finalVersion && Date.now() < catchupDeadline) {
          const result = await request("sync.catchup", stateEndpoint(user.username, readVersions.get(user.username) || 0), { actor: user.username });
          if (result.status === 200 && result.payload.sections) sectionManifests.set(user.username, result.payload.sections);
          if (result.status === 200 && result.payload.version) readVersions.set(user.username, Number(result.payload.version));
          if ((readVersions.get(user.username) || 0) < finalVersion) await sleep(Math.min(60000, result.retryAfterSeconds * 1000 || 5000) + Math.random() * 2000);
        }
      }));
      report.convergence = {
        targetVersion: finalVersion, elapsedMs: Math.round(performance.now() - catchupStart),
        failedTasks: catchups.filter((item) => item.status === "rejected").length,
        laggingUsers: actors.filter((user) => (readVersions.get(user.username) || 0) < finalVersion).map((user) => user.username)
      };
    }
    const performanceResult = await request("performance", "api/admin/performance", { actor: "simadmin1" });
    report.serverPerformance = performanceResult.payload;
    const writeMetrics = report.serverPerformance && report.serverPerformance.stateWrites;
    assert.ok(writeMetrics && writeMetrics.sampleCount > 0, "Faltan muestras de persistencia.");
    for (const field of ["p95Ms", "p95SerializationMs", "p95DiskMs"]) {
      assert.ok(Number.isFinite(writeMetrics[field]) && writeMetrics[field] >= 0, `Metrica invalida: ${field}`);
    }
    const finalState = JSON.parse(fs.readFileSync(stateFile, "utf8")).state;
    report.created = created.length;
    report.ready = ready.length;
    report.planned = routeCodes.size;
    report.routes = routes.length;
    report.finalOrders = finalState.orders.length;
    report.finalLabeled = finalState.orders.filter((order) => order.code.startsWith("PED-") && created.includes(order.code) && order.assembly?.label?.generated).length;
    report.finalDelivered = finalState.orders.filter((order) => created.includes(order.code) && ["Entregado", "Cobrado"].includes(order.status)).length;
    const newOrders = finalState.orders.filter((order) => created.includes(order.code));
    const originalByCode = new Map(finalState.orders.map((order) => [order.code, order]));
    const historicalCore = (order) => JSON.stringify({
      code: order.code, client: order.client, seller: order.seller, amount: order.amount, status: order.status,
      items: (order.items || []).map((item) => [item.productCode, item.requestedQty, item.unitPrice, item.lineTotal]),
      bultos: order.assembly?.bultosConfirmed || 0
    });
    const requestedByProduct = new Map();
    newOrders.forEach((order) => (order.items || []).forEach((item) => {
      requestedByProduct.set(item.productCode, (requestedByProduct.get(item.productCode) || 0) + Number(item.requestedQty || 0));
    }));
    const finalProducts = new Map(finalState.products.map((product) => [product.codigo_producto, product]));
    const stockDifferences = state.products.filter((product) => {
      const after = finalProducts.get(product.codigo_producto);
      return !after || Math.abs((Number(product.stock_fisico) - Number(after.stock_fisico)) - (requestedByProduct.get(product.codigo_producto) || 0)) > 0.01;
    });
    const routeStops = finalState.deliveryRoutes.flatMap((route) => route.stops || []);
    const totalSold = newOrders.reduce((sum, order) => sum + Number(order.amount || 0), 0);
    const totalCollected = newOrders.reduce((sum, order) => sum + Number(order.collection?.amountPaid || 0), 0);
    report.integrity = {
      historicalOrdersUnchanged: state.orders.every((order) => historicalCore(order) === historicalCore(originalByCode.get(order.code) || {})),
      originalClientsPreserved: finalState.clients.length === state.clients.length,
      originalProductsPreserved: finalState.products.length === state.products.length,
      createdUnique: new Set(created).size === targetOrders && new Set(finalState.orders.map((order) => order.code)).size === finalState.orders.length,
      lineCount: newOrders.reduce((sum, order) => sum + (order.items || []).length, 0),
      stockDifferenceProducts: stockDifferences.length,
      routeStops: routeStops.length,
      routeStopsUnique: new Set(routeStops.map((stop) => stop.orderCode)).size === routeStops.length,
      bultos: newOrders.reduce((sum, order) => sum + Number(order.assembly?.bultosConfirmed || 0), 0),
      totalSold: Math.round(totalSold * 100) / 100,
      totalCollected: Math.round(totalCollected * 100) / 100
    };
    report.elapsedMs = Math.round(performance.now() - testStart);
    report.completedAt = new Date().toISOString();
    report.runtime = { node: process.version, platform: process.platform, cpus: os.cpus().length, totalMemoryMb: Math.round(os.totalmem() / 1048576) };
    if (report.failures.length) report.serverLogTail = output;
    for (const entry of Object.values(report.operations)) {
      Object.assign(entry, summarize(entry.durations));
      delete entry.durations;
    }
    report.performanceGate = {
      limitMs: 5000,
      exceeded: Object.entries(report.operations).filter(([, entry]) => entry.maxMs > 5000)
        .map(([operation, entry]) => ({ operation, maxMs: entry.maxMs }))
    };
    report.ok = !report.abortedForProductionHealth && !report.abortedForHostPressure && report.failures.length === 0 &&
      report.performanceGate.exceeded.length === 0 &&
      (!incrementalReads || (report.convergence?.failedTasks === 0 && report.convergence?.laggingUsers?.length === 0)) &&
      report.created === targetOrders && report.ready === targetOrders &&
      report.planned === targetOrders && report.finalLabeled === targetOrders &&
      (deliverAll ? report.finalDelivered === targetOrders : (targetOrders < 5 || report.finalDelivered >= 1)) &&
      report.integrity.historicalOrdersUnchanged && report.integrity.originalClientsPreserved && report.integrity.originalProductsPreserved &&
      report.integrity.createdUnique && report.integrity.lineCount === targetOrders * 5 && report.integrity.stockDifferenceProducts === 0 &&
      report.integrity.routeStops === targetOrders && report.integrity.routeStopsUnique && report.integrity.bultos === targetOrders &&
      (!deliverAll || Math.abs(report.integrity.totalSold - report.integrity.totalCollected) < 0.01);
    if (cpuProfile) await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error("CPU profile timed out")), 15000);
      child.once("message", message => {
        clearTimeout(timeout);
        if (message.error) reject(new Error(message.error)); else resolve();
      });
      child.send("finish-profile");
    });
    if (reportPath) fs.writeFileSync(path.resolve(reportPath), JSON.stringify(report, null, 2));
    console.log(JSON.stringify(report, null, 2));
    if (!report.ok) process.exitCode = 1;
  } finally {
    child.kill();
    await Promise.race([new Promise((resolve) => child.once("exit", resolve)), sleep(5000)]);
    if (child.exitCode === null) child.kill("SIGKILL");
  }
}

main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(() => {
  const resolved = path.resolve(tempDir);
  if (path.dirname(resolved) !== tempRoot || !path.basename(resolved).startsWith("dl-operational-sim-")) {
    throw new Error(`Ruta temporal inesperada: ${resolved}`);
  }
  fs.rmSync(resolved, { recursive: true, force: true });
});
