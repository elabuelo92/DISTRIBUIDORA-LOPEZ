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
const publicHealthUrl = String(process.env.DL_SIM_PUBLIC_HEALTH_URL || "");
assert.ok(durationMs >= 10000 && durationMs <= 900000);
assert.ok(targetOrders >= 1 && targetOrders <= 200);
assert.ok(targetBytes >= 1000000 && targetBytes <= 60000000);
assert.ok(sellerCount >= 1 && sellerCount <= 20);
assert.ok(adminCount >= 1 && adminCount <= 10);

const tempRoot = path.resolve(os.tmpdir());
const tempDir = fs.mkdtempSync(path.join(tempRoot, "dl-operational-sim-"));
const stateFile = path.join(tempDir, "demo-state.json");
const usersFile = path.join(tempDir, "users.json");
const password = `Sim-${crypto.randomBytes(12).toString("hex")}`;
const startedAt = new Date().toISOString();
const report = {
  version: "8790-146-simulation",
  startedAt,
  durationMs,
  targetOrders,
  actors: { sellers: sellerCount, admins: adminCount, drivers: 1 },
  syntheticStateBytes: 0,
  productionWrites: 0,
  operations: {},
  failures: [],
  hostSamples: [],
  publicHealth: { checks: 0, failures: 0, slow: 0, maxMs: 0 },
  abortedForProductionHealth: false,
  abortedForHostPressure: false
};

function sleep(ms) { return new Promise((resolve) => setTimeout(resolve, Math.max(0, ms))); }
function actorName(index) { return `Vendedor Sim ${index + 1}`; }
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
  const clients = Array.from({ length: 300 }, (_, index) => ({
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
  const orders = Array.from({ length: 254 }, (_, index) => ({
    code: `PED-SIM-H${index + 1}`,
    client: clients[index].name,
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
    entry("simdriver", "Reparto Sim", "driver")
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
  let raw = JSON.stringify({ version: Date.now(), state });
  state.performanceFixture = "x".repeat(Math.max(0, targetBytes - Buffer.byteLength(raw) - 2));
  raw = JSON.stringify({ version: Date.now(), state });
  fs.writeFileSync(stateFile, raw, "utf8");
  report.syntheticStateBytes = Buffer.byteLength(raw);
  fs.writeFileSync(usersFile, JSON.stringify(createUsers()), "utf8");
  const port = await freePort();
  const child = spawn(process.execPath, ["--max-old-space-size=768", path.join(root, "server.js")], {
    cwd: root,
    env: {
      ...process.env,
      DL_HOST: "127.0.0.1", DL_PORT: String(port), PORT: String(port),
      DATA_DIR: tempDir, STATE_FILE: stateFile, USERS_FILE: usersFile,
      DL_VERSION: report.version, DL_LICENSE_ENFORCEMENT: "disabled", DL_INTEGRITY_ENFORCE: "warn"
    },
    stdio: ["ignore", "pipe", "pipe"]
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
          ...(options.body ? { "Content-Type": "application/json" } : {})
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
      return { status: response.status, payload, cookie: String(response.headers.get("set-cookie") || "").split(";")[0] };
    } catch (error) {
      if (name !== "simHealth") record(name, performance.now() - start, 0, error.message || String(error));
      return { status: 0, payload: { error: error.message || String(error) } };
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
      if (!response.ok || !body.ok || body.runtimeVersion !== "8790-146") {
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
    const result = await request("createOrder", "api/orders", {
      actor, method: "POST", body: { client, items, source: "mobile", operationId: `SIM-OP-${String(index + 1).padStart(8, "0")}` }
    });
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
        actor: "simadmin1", method: "POST", body: { orderCodes: codes, action }
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
    const planned = await request("route.plan", "api/delivery/routes/plan", {
      actor: "simadmin4", method: "POST", body: {
        orderCodes: codes, day: "2026-09-16", zone: "Simulacion", driverUser: "simdriver", driverLabel: "Reparto Sim"
      }
    });
    if (planned.status !== 200 || !planned.payload.route?.id) return;
    const routeId = planned.payload.route.id;
    routes.push({ id: routeId, codes });
    codes.forEach((code) => routeCodes.add(code));
    await request("route.reorder", `api/delivery/routes/${encodeURIComponent(routeId)}/reorder`, {
      actor: "simadmin4", method: "POST", body: { orderCodes: [...codes].reverse() }
    });
    const published = await request("route.publish", `api/delivery/routes/${encodeURIComponent(routeId)}/publish`, {
      actor: "simadmin4", method: "POST", body: {}
    });
    if (published.status === 200) {
      const claimed = await request("route.claim", `api/delivery/routes/${encodeURIComponent(routeId)}/claim`, {
        actor: "simdriver", method: "POST", body: { deviceId: "SIM-DRIVER", deviceLabel: "Reparto Sim" }
      });
      if (claimed.status === 200 && routes.length === 1) {
        const first = codes.at(-1);
        const gps = { lat: -31.4, lng: -64.18, accuracy: 10, source: "simulation" };
        const status = await request("delivery.status", `api/delivery/orders/${encodeURIComponent(first)}/status`, {
          actor: "simdriver", method: "POST", body: { status: "En Reparto", deviceId: "SIM-DRIVER", gps }
        });
        if (status.status === 200) {
          const order = status.payload.order;
          await request("delivery.collect", `api/delivery/orders/${encodeURIComponent(first)}/collect`, {
            actor: "simdriver", method: "POST", body: {
              method: "Efectivo", amountPaid: order.amount, deviceId: "SIM-DRIVER", gps
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
    const background = (async () => {
      let lowMemoryConsecutive = 0;
      while (!stop && performance.now() < deadline) {
        const sample = hostSample(child.pid);
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
    const reader = (async () => {
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
    if (!report.abortedForProductionHealth) {
      while (queued.length) await processBatch(true);
      await publishRoute(ready.filter((code) => !routeCodes.has(code)), true);
    }
    const finalState = JSON.parse(fs.readFileSync(stateFile, "utf8")).state;
    report.created = created.length;
    report.ready = ready.length;
    report.planned = routeCodes.size;
    report.routes = routes.length;
    report.finalOrders = finalState.orders.length;
    report.finalLabeled = finalState.orders.filter((order) => order.code.startsWith("PED-") && created.includes(order.code) && order.assembly?.label?.generated).length;
    report.finalDelivered = finalState.orders.filter((order) => created.includes(order.code) && ["Entregado", "Cobrado"].includes(order.status)).length;
    report.elapsedMs = Math.round(performance.now() - testStart);
    report.completedAt = new Date().toISOString();
    if (report.failures.length) report.serverLogTail = output;
    for (const entry of Object.values(report.operations)) {
      Object.assign(entry, summarize(entry.durations));
      delete entry.durations;
    }
    report.ok = !report.abortedForProductionHealth && !report.abortedForHostPressure && report.failures.length === 0 &&
      report.created === targetOrders && report.ready === targetOrders &&
      report.planned === targetOrders && report.finalLabeled === targetOrders &&
      (targetOrders < 5 || report.finalDelivered >= 1);
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
