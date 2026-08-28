"use strict";

const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawn } = require("node:child_process");
const ExcelJS = require("exceljs");
const portfolio = require("../client-portfolio-engine");

const users = [
  { username: "seller-a", name: "Vendedor A", sellerName: "Vendedor A", role: "seller", active: true },
  { username: "seller-b", name: "Vendedor B", sellerName: "Vendedor B", role: "seller", active: true },
  { username: "seller-off", name: "Vendedor Inactivo", role: "seller", active: false }
];
const clients = [
  { codigo_cliente: "CAR-01", name: "A Lunes", vendedor_asignado: "Vendedor A", dia_visita: "Lunes", ruta: "Centro", zona: "Centro", ordenes_visita: { "centro|lunes": 2 }, domicilio: "Uno 1", telefono: "3511000001", latitud: -31.41, longitud: -64.18 },
  { codigo_cliente: "CAR-02", name: "A Martes", vendedor_asignado: "seller-a", dia_visita: "Martes", ruta: "Centro", zona: "Centro", domicilio: "Dos 2", telefono: "3511000002", latitud: -31.42, longitud: -64.19 },
  { codigo_cliente: "CAR-03", name: "A Lunes Jueves", vendedor_asignado: "Vendedor A", dias_visita: ["Lunes", "Jueves"], ruta: "Centro", zona: "Norte", ordenes_visita: { "centro|lunes": 1, "centro|jueves": 4 }, domicilio: "Tres 3", telefono: "3511000003", latitud: -31.43, longitud: -64.2 },
  { codigo_cliente: "CAR-04", name: "A Inactivo", vendedor_asignado: "Vendedor A", dia_visita: "Lunes", ruta: "Centro", zona: "Centro", estado: "Inactivo", domicilio: "Cuatro 4", telefono: "3511000004", latitud: -31.44, longitud: -64.21 },
  { codigo_cliente: "CAR-05", name: "B Lunes", vendedor_asignado: "Vendedor B", dia_visita: "Lunes", ruta: "Sur", zona: "Sur", domicilio: "Cinco 5", telefono: "3511000005", latitud: -31.45, longitud: -64.22 },
  { codigo_cliente: "CAR-06", name: "B Viernes", vendedor_asignado: "seller-b", dia_visita: "Viernes", ruta: "Sur", zona: "Sur", domicilio: "Seis 6", telefono: "3511000006", latitud: -31.46, longitud: -64.23 },
  { codigo_cliente: "CAR-07", name: "Sin Vendedor", dia_visita: "Lunes", ruta: "Este", zona: "Este", domicilio: "Siete 7", telefono: "3511000007", latitud: -31.47, longitud: -64.24 },
  { codigo_cliente: "CAR-08", name: "Vendedor Huerfano", vendedor_asignado: "No Existe", dia_visita: "Lunes", ruta: "Este", zona: "Este", domicilio: "Ocho 8", telefono: "3511000008", latitud: -31.48, longitud: -64.25 },
  { codigo_cliente: "CAR-09", name: "Sin Planificacion", vendedor_asignado: "Vendedor B", domicilio: "Nueve 9", telefono: "3511000009" },
  { codigo_cliente: "CAR-10", name: "Duplicado", vendedor_asignado: "Vendedor B", dia_visita: "2/7 LuVi", ruta: "Sur", zona: "Sur", domicilio: "Diez 10", telefono: "3511000010", latitud: -31.49, longitud: -64.26 },
  { codigo_cliente: "CAR-11", name: "Duplicado", vendedor_asignado: "Vendedor B", dia_visita: "Viernes", ruta: "Sur", zona: "Sur", domicilio: "Diez 10", telefono: "3511000011", latitud: -31.5, longitud: -64.27 }
];

const aIdentities = portfolio.sellerIdentities(users[0]);
const bIdentities = portfolio.sellerIdentities(users[1]);
assert.deepEqual(portfolio.filterClients(clients, { scope: "today", sellerIdentities: aIdentities, sellerRoute: "Centro", workday: "Lunes" }).map((item) => item.codigo_cliente), ["CAR-03", "CAR-01"]);
assert.deepEqual(portfolio.filterClients(clients, { scope: "portfolio", sellerIdentities: aIdentities }).map((item) => item.codigo_cliente), ["CAR-01", "CAR-03", "CAR-02"]);
assert.deepEqual(portfolio.filterClients(clients, { scope: "today", sellerIdentities: bIdentities, workday: "Viernes" }).map((item) => item.codigo_cliente), ["CAR-06", "CAR-10", "CAR-11"]);
assert.equal(portfolio.filterClients(clients, { scope: "portfolio", sellerIdentities: bIdentities }).some((item) => item.codigo_cliente === "CAR-04"), false);

const diagnosis = portfolio.diagnose(clients, users);
assert.equal(diagnosis.summary.total, clients.length);
assert.equal(diagnosis.summary.withoutSeller, 1);
assert.equal(diagnosis.summary.withoutRoute, 1);
assert.equal(diagnosis.summary.withoutDay, 1);
assert.equal(diagnosis.summary.withoutGps, 1);
assert.equal(diagnosis.records.find((item) => item.id === "CAR-08").severity, "error");
assert.equal(diagnosis.records.filter((item) => item.issues.some((issue) => issue.code === "POSSIBLE_DUPLICATE")).length, 2);

const root = path.join(__dirname, "..");
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "dl-carteras-v118-"));
const port = 20700 + Math.floor(Math.random() * 80);
const stateFile = path.join(tempDir, "demo-state.json");
const usersFile = path.join(tempDir, "users.json");
const statePayload = JSON.parse(fs.readFileSync(path.join(root, "data", "demo-state.json"), "utf8"));
const mutableState = statePayload.state || statePayload;
mutableState.clients = clients;
fs.writeFileSync(stateFile, JSON.stringify(statePayload, null, 2));
fs.copyFileSync(path.join(root, "data", "users.json"), usersFile);
const testUsersPayload = JSON.parse(fs.readFileSync(usersFile, "utf8"));
const testSeller = testUsersPayload.users.find((user) => user.username === "kevin");
testSeller.salt = "commercialportfoliosmoke118";
testSeller.passwordHash = crypto.pbkdf2Sync("Lopez2026!", testSeller.salt, 120000, 32, "sha256").toString("hex");
users.forEach((user, index) => {
  const salt = `portfoliofixture${index}118`;
  testUsersPayload.users.push({
    ...user,
    salt,
    passwordHash: crypto.pbkdf2Sync("Lopez2026!", salt, 120000, 32, "sha256").toString("hex")
  });
});
fs.writeFileSync(usersFile, JSON.stringify(testUsersPayload, null, 2));

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
    DL_VERSION: "8790-118",
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

async function login(username) {
  const input = { username, password: "Lopez2026!", device: { id: `SMOKE-118-${username}`, model: "Node", os: process.platform, appVersion: "8790-118" } };
  let response = await fetch(`${base}/api/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
  if (response.status === 428) {
    const required = await response.json();
    input.legalAcceptance = { accepted: true, version: required.legal.currentVersion, hash: required.legal.hash };
    response = await fetch(`${base}/api/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
  }
  assert.equal(response.status, 200, `login ${username}`);
  return String(response.headers.get("set-cookie") || "").split(";")[0];
}

async function diagnosticRequest(cookie) {
  const response = await fetch(`${base}/api/commercial-portfolios/diagnostics`, { headers: { Cookie: cookie } });
  const payload = await response.json();
  return { response, payload };
}

async function jsonRequest(url, cookie, options = {}) {
  const response = await fetch(`${base}${url}`, { ...options, headers: { Cookie: cookie, "Content-Type": "application/json", ...(options.headers || {}) } });
  const payload = await response.json();
  return { response, payload };
}

async function clientPortfolioDataUrl(rows) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Cartera clientes");
  sheet.addRow(["ID_Cliente", "Cliente", "CUIT", "Telefono", "Direccion", "Localidad", "Latitud", "Longitud", "Vendedor_ID", "Vendedor", "Zona", "Ruta", "Dias_Visita", "Orden", "Horario", "Activo"]);
  rows.forEach((row) => sheet.addRow(row));
  return `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${Buffer.from(await workbook.xlsx.writeBuffer()).toString("base64")}`;
}

(async () => {
  const health = await waitForHealth();
  assert.equal(health.version, "8790-118");
  const admin = await login("admin1");
  const seller = await login("kevin");
  const adminResult = await diagnosticRequest(admin);
  assert.equal(adminResult.response.status, 200, adminResult.payload.error);
  assert.equal(adminResult.payload.summary.total, clients.length);
  assert.equal(adminResult.payload.records.find((item) => item.id === "CAR-01").client.codigo_cliente, "CAR-01");
  const sellerResult = await diagnosticRequest(seller);
  assert.equal(sellerResult.response.status, 403);
  const reassigned = await jsonRequest("/api/clients/bulk-assign", admin, {
    method: "POST",
    body: JSON.stringify({
      clientIds: ["CAR-02"],
      days: ["Lunes", "Jueves"],
      route: "Centro",
      motive: "Prueba multiples dias v118",
      admin_password: "Lopez2026!"
    })
  });
  assert.equal(reassigned.response.status, 200, reassigned.payload.error);
  assert.deepEqual(reassigned.payload.updated[0].dias_visita, ["Lunes", "Jueves"]);
  assert.equal(reassigned.payload.updated[0].dia_visita, "Lunes / Jueves");
  const invalidPreview = await jsonRequest("/api/client-portfolio/preview", admin, {
    method: "POST",
    body: JSON.stringify({ fileName: "cartera-invalida.xlsx", fileDataUrl: await clientPortfolioDataUrl([["NO-EXISTE", "Fantasma", "", "", "", "", "", "", "", "", "", "", "Lunes", 1, "", "SI"]]) })
  });
  assert.equal(invalidPreview.response.status, 200);
  assert.equal(invalidPreview.payload.preview.summary.errors, 1);
  const validPreview = await jsonRequest("/api/client-portfolio/preview", admin, {
    method: "POST",
    body: JSON.stringify({ fileName: "cartera-valida.xlsx", fileDataUrl: await clientPortfolioDataUrl([["CAR-02", "A Martes", "", "", "", "", "", "", "seller-b", "Vendedor B", "Centro", "Centro", "Martes / Viernes", 7, "08-14", "SI"]]) })
  });
  assert.equal(validPreview.response.status, 200, validPreview.payload.error);
  assert.equal(validPreview.payload.preview.summary.updates, 1);
  const appliedImport = await jsonRequest("/api/client-portfolio/apply", admin, {
    method: "POST",
    body: JSON.stringify({ token: validPreview.payload.preview.token, motive: "Prueba importacion homologada", admin_password: "Lopez2026!", confirmed: true })
  });
  assert.equal(appliedImport.response.status, 200, appliedImport.payload.error);
  assert.equal(appliedImport.payload.record.updated, 1);
  const updatedClient = appliedImport.payload.applied[0].next;
  assert.equal(updatedClient.seller, "Vendedor B");
  assert.deepEqual(updatedClient.dias_visita, ["Martes", "Viernes"]);
  assert.equal(updatedClient.latitud, -31.42);
  assert.ok(appliedImport.payload.backup && appliedImport.payload.backup.id);

  console.log(JSON.stringify({
    ok: true,
    version: health.version,
    clientsChecked: clients.length,
    sellerAVisible: 3,
    sellerBFriday: 3,
    diagnosticErrors: adminResult.payload.summary.errors,
    diagnosticWarnings: adminResult.payload.summary.warnings,
    adminOnly: true,
    inactiveHiddenFromPreventa: true,
    multipleDaysPersisted: true,
    administrativeOrderApplied: true,
    homologatedImportApplied: true,
    blankGpsPreserved: true
  }, null, 2));
})().finally(() => {
  child.kill();
  fs.rmSync(tempDir, { recursive: true, force: true });
}).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
