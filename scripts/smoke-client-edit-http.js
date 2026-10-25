"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");
const crypto = require("node:crypto");
const { spawn } = require("node:child_process");
const { once } = require("node:events");
const root = path.resolve(__dirname, "..");
const baseline = process.argv.includes("--baseline");
const snapshotArg = process.argv.indexOf("--snapshot");
const snapshotFile = snapshotArg >= 0 ? path.resolve(process.argv[snapshotArg + 1]) : null;
const snapshotHash = snapshotFile ? crypto.createHash("sha256").update(fs.readFileSync(snapshotFile)).digest("hex") : null;
const folder = fs.mkdtempSync(path.join(os.tmpdir(), "dl-p143-"));
const file = path.join(folder, "demo-state.json");
const probe = path.join(folder, "probe.jsonl");
const failureFile = path.join(folder, "failure.txt");
const password = "Isolated-Client-Test!";
const users = ["admin1", "admin2", "seller-test"].map(username => {
  const salt = crypto.randomBytes(16).toString("hex");
  return { username, name: username, role: username.startsWith("admin") ? "admin" : "seller", active: true, salt,
    passwordHash: crypto.pbkdf2Sync(password, salt, 120000, 32, "sha256").toString("hex") };
});
fs.writeFileSync(path.join(folder, "users.json"), JSON.stringify({ users }));
const clients = Array.from({ length: 2500 }, (_, i) => ({ codigo_cliente: `C${i}`, id: `internal-${i}`,
  name: `Cliente ${String(i).padStart(4, "0")}`, nombre_comercial: `Cliente ${String(i).padStart(4, "0")}`,
  telefono: "351000000", email: i === 1 ? "Admin2" : "", razon_social: `Razon ${i}`, cuit: "", condicion_fiscal: "Cons.Final",
  domicilio: "Calle 100", referencia: "Frente a plaza", localidad: "Cordoba", zona: "Norte", zone: "Norte", ruta: "Ruta A",
  vendedor_asignado: "seller-test", seller: "seller-test", forma_pago: "Contado", dias_credito: 7, limite_credito: 50000.25,
  limit: 50000.25, balance: 125.35, saldo_inicial: 125.35, saldo_actual: 125.35,
  latitud: -31.416712345, longitud: -64.183312345, gps: { lat: -31.416712345, lng: -64.183312345, accuracy: 8 },
  tipo_cliente: "Kiosco", status: "Activo", estado: "Activo", dias_visita: ["Lunes"], dia_visita: "Lunes",
  horarios_atencion: [], horario_atencion: "8 a 18", observaciones: "Conservar observaciones", condicion_comercial: "Contado" }));
const fixture = { clients, products: [{ codigo_producto: "A", name: "Test", stock_fisico: 100, stock_reservado: 10 }],
  orders: Array.from({ length: 3000 }, (_, i) => ({ code: `PED-TEST-${i}`, client: clients[i % clients.length].name,
    seller: "seller-test", status: "Entregado", amount: 100, items: [{ productCode: "A", requestedQty: 1, unitPrice: 100 }],
    observations: "Synthetic history ".repeat(100) })),
  accounts: [], stockMovements: [], deliveryRoutes: [], supplierAccounts: [{ balance: 456.78 }], activity: [] };
if (snapshotFile) {
  const copy = JSON.parse(fs.readFileSync(snapshotFile, "utf8")).state;
  fixture.clients = [clients[0], clients[1], ...(copy.clients || [])];
  for (const [key, value] of Object.entries(copy)) if (!["clients", "legalAcceptances"].includes(key)) fixture[key] = value;
}
fs.writeFileSync(file, JSON.stringify({ version: 1, state: fixture }));
const port = 26000 + Math.floor(Math.random() * 1000);
const base = `http://127.0.0.1:${port}`;
const child = spawn(process.env.DL_TEST_SERVER_NODE || process.execPath,
  ["--max-old-space-size=512", "--require", "./scripts/client-edit-performance-probe.js", "--require", "./scripts/local-write-failure-probe.js", baseline ? "scripts/client-edit-baseline-server.js" : "server.js"],
  { cwd: root, env: { ...process.env, DL_HOST: "127.0.0.1", DL_PORT: String(port), DATA_DIR: folder, STATE_FILE: file,
    USERS_FILE: path.join(folder, "users.json"), P143_PROBE_FILE: probe, LOCAL_TEST_WRITE_FAILURE: failureFile,
    DL_LICENSE_ENFORCEMENT: "disabled", DL_INTEGRITY_ENFORCE: "warn", DL_MAX_FULL_STATE_RESPONSES: "1" }, stdio: ["ignore", "pipe", "pipe"] });
let logs = "";
child.stdout.on("data", d => { logs += d; }); child.stderr.on("data", d => { logs += d; });
const exited = once(child, "exit");
const read = () => JSON.parse(fs.readFileSync(file)).state;
async function request(url, body, cookie, expected = 200) {
  const start = performance.now();
  const response = await fetch(base + url, { method: body ? "POST" : "GET", body: body ? JSON.stringify(body) : undefined,
    headers: { "Content-Type": "application/json", "X-ERP-Response": "compact-v1", ...(cookie ? { Cookie: cookie } : {}) }, signal: AbortSignal.timeout(60000) });
  const raw = await response.text(); const data = JSON.parse(raw);
  assert.equal(response.status, expected, raw.slice(0, 400));
  return { data, ms: performance.now() - start, bytes: Buffer.byteLength(raw), cookie: response.headers.get("set-cookie")?.split(";")[0] };
}
async function login(username) {
  const legal = (await request("/api/legal")).data.legal;
  return (await request("/api/login", { username, password, device: { id: `P143-${username}`, label: "Isolated" },
    legalAcceptance: { accepted: true, version: legal.currentVersion, hash: legal.hash } })).cookie;
}
const metrics = [];
async function main() {
  let ready = false;
  for (let i = 0; i < 120; i++) {
    try { await request("/api/health"); ready = true; break; } catch {}
    await new Promise(r => setTimeout(r, 100));
  }
  assert.ok(ready, logs.slice(-1500));
  const admin = await login("admin1");
  await request("/api/clients?page=1", null, admin);
  const businessDigest = state => crypto.createHash("sha256").update(JSON.stringify(Object.fromEntries(
    Object.entries(state).filter(([key]) => !["clients", "globalAudit", "activity", "notifications", "domainEvents", "integrationOutbox"].includes(key))
  ))).digest("hex");
  const initialState = read();
  const protectedDigest = businessDigest(initialState);
  const otherClientsDigest = crypto.createHash("sha256").update(JSON.stringify(initialState.clients.slice(1))).digest("hex");
  for (let i = 0; i < 5; i++) {
    const before = read().clients[0];
    const input = baseline ? { ...before, telefono: `35110000${i}`, motivo: "Prueba aislada", admin_password: password }
      : { patch: { telefono: `35110000${i}` }, expected: { telefono: before.telefono }, operationId: `P143-MEASURE-${i}`,
        motivo: "Prueba aislada", admin_password: password };
    const startProbe = fs.readFileSync(probe, "utf8").length;
    const saved = await request("/api/clients/C0/edit", input, admin);
    if (!baseline) {
      const stored = read().clients[0];
      for (const key of Object.keys(before)) if (!["telefono", "updatedAt", "editHistory"].includes(key)) assert.deepEqual(stored[key], before[key], key);
    }
    const refreshed = baseline ? await request("/api/clients?page=1", null, admin) : { ms: 0, bytes: 0 };
    metrics.push({ apiMs: saved.ms, listMs: refreshed.ms, totalMs: saved.ms + refreshed.ms,
      responseBytes: saved.bytes + refreshed.bytes, phases: fs.readFileSync(probe, "utf8").slice(startProbe).trim().split("\n").filter(Boolean).map(JSON.parse) });
  }
  let checks = [];
  if (!baseline) {
    const finalState = read();
    assert.equal(businessDigest(finalState), protectedDigest);
    assert.equal(crypto.createHash("sha256").update(JSON.stringify(finalState.clients.slice(1))).digest("hex"), otherClientsDigest);
    checks.push("business sections and every other customer unchanged across five saves");
  }
  if (!baseline && !snapshotFile) {
    checks.push(...await require("./client-edit-http-checks")({ request, read, admin, login, password, file, failureFile, base, folder }));
  }
  if (snapshotFile) assert.equal(crypto.createHash("sha256").update(fs.readFileSync(snapshotFile)).digest("hex"), snapshotHash);
  const result = { ok: true, baseline, fixtureBytes: fs.statSync(file).size, clients: fixture.clients.length, orders: fixture.orders.length,
    snapshotSourceUnchanged: snapshotFile ? true : null, sqlQueries: 0, metrics, checks };
  fs.writeFileSync(path.join(root, `docs/P143-${snapshotFile ? "volume-" : ""}${baseline ? "before" : "after"}-results.json`), JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result, null, 2));
}
main().catch(e => { console.error(e); process.exitCode = 1; }).finally(async () => {
  child.kill(); await exited;
});
