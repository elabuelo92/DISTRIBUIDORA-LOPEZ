"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawn } = require("node:child_process");
const ExcelJS = require("exceljs");

const root = path.join(__dirname, "..");
const sourceData = path.join(root, "data");
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "dl-v99-"));
const port = 19300 + Math.floor(Math.random() * 400);
const stateFile = path.join(tempDir, "demo-state.json");
const usersFile = path.join(tempDir, "users.json");
const portfolioFile = process.env.DL_TEST_PORTFOLIO || "C:\\Users\\Distribuidora Lopez\\Desktop\\Cartera de producto actualizado al 17 de ago.xlsx";

fs.copyFileSync(path.join(sourceData, "demo-state.json"), stateFile);
fs.copyFileSync(path.join(sourceData, "users.json"), usersFile);

const child = spawn(process.execPath, [path.join(root, "server.js")], {
  cwd: root,
  env: {
    ...process.env,
    PORT: String(port), DL_PORT: String(port), DL_HOST: "127.0.0.1", DATA_DIR: tempDir,
    STATE_FILE: stateFile, USERS_FILE: usersFile, DL_VERSION: "8790-99",
    DL_DEFAULT_PASSWORD: "Lopez2026!", DL_LICENSE_ENFORCEMENT: "disabled", DL_INTEGRITY_ENFORCE: "warn"
  },
  stdio: ["ignore", "pipe", "pipe"]
});

async function waitForHealth(baseUrl) {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    try {
      const response = await fetch(`${baseUrl}/api/health`);
      if (response.ok) return response.json();
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error("El servidor temporal v99 no inicio.");
}

async function adminLogin(baseUrl) {
  const payload = { username: "admin1", password: "Lopez2026!", device: { id: "SMOKE-V99", label: "Smoke v99", model: "Node", os: process.platform, appVersion: "8790-99" } };
  let response = await fetch(`${baseUrl}/api/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
  if (response.status === 428) {
    const required = await response.json();
    payload.legalAcceptance = { accepted: true, version: required.legal.currentVersion, hash: required.legal.hash };
    response = await fetch(`${baseUrl}/api/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
  }
  assert.equal(response.status, 200);
  return String(response.headers.get("set-cookie") || "").split(";")[0];
}

async function jsonRequest(url, cookie, options = {}) {
  const response = await fetch(url, { ...options, headers: { Cookie: cookie, "Content-Type": "application/json", ...(options.headers || {}) } });
  const payload = await response.json();
  return { response, payload };
}

(async () => {
  assert.ok(fs.existsSync(portfolioFile), `No existe la planilla de prueba: ${portfolioFile}`);
  const baseUrl = `http://127.0.0.1:${port}`;
  const health = await waitForHealth(baseUrl);
  assert.equal(health.version, "8790-99");
  const cookie = await adminLogin(baseUrl);

  const initialState = await jsonRequest(`${baseUrl}/api/state?version=0`, cookie);
  assert.equal(initialState.response.status, 200);
  const priceListNumbers = (initialState.payload.state.priceLists || []).map((list) => Number(list.number));
  assert.equal(new Set(priceListNumbers).size, priceListNumbers.length, "No debe haber listas de precios duplicadas.");

  const template = await jsonRequest(`${baseUrl}/api/product-portfolio/template`, cookie);
  assert.equal(template.response.status, 200);
  const templateBook = new ExcelJS.Workbook();
  await templateBook.xlsx.load(Buffer.from(template.payload.base64, "base64"));
  assert.equal(templateBook.worksheets[0].getRow(1).getCell(1).value, "Accion");
  assert.equal(templateBook.worksheets[0].getRow(1).getCell(17).value, "Observaciones_Importacion");

  const fileDataUrl = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${fs.readFileSync(portfolioFile).toString("base64")}`;
  const preview = await jsonRequest(`${baseUrl}/api/product-portfolio/preview`, cookie, {
    method: "POST", body: JSON.stringify({ fileName: path.basename(portfolioFile), fileDataUrl })
  });
  assert.equal(preview.response.status, 200);
  assert.equal(preview.payload.preview.summary.total, 310);
  assert.equal(preview.payload.preview.rows.length, 310);
  assert.ok(preview.payload.preview.summary.unresolved >= 1);

  const invalidWorkbook = await jsonRequest(`${baseUrl}/api/product-portfolio/preview`, cookie, {
    method: "POST",
    body: JSON.stringify({
      fileName: "archivo-renombrado.xlsx",
      fileDataUrl: `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${Buffer.from("no es un excel").toString("base64")}`
    })
  });
  assert.equal(invalidWorkbook.response.status, 400);
  assert.match(invalidWorkbook.payload.error, /no es un XLSX valido/i);

  const mobileClient = await jsonRequest(`${baseUrl}/api/clients/mobile`, cookie, {
    method: "POST",
    body: JSON.stringify({
      codigo_cliente: `SMOKE-CLIENT-${Date.now()}`,
      nombre_comercial: "Cliente smoke compacto",
      consumidor_final: true,
      telefono: "3510000000",
      domicilio: "Calle prueba 123",
      localidad: "Cordoba",
      forma_pago: "Contado",
      limite_credito: 0,
      zona: "Centro",
      ruta: "Centro",
      vendedor_asignado: "Administracion 1",
      dia_visita: "Lunes",
      preventistaPassword: "Lopez2026!",
      gps: { lat: -31.4167, lng: -64.1833, accuracy: 8, source: "gps" }
    })
  });
  assert.equal(mobileClient.response.status, 200);
  assert.equal(mobileClient.payload.compact, true);
  assert.equal(mobileClient.payload.state, undefined);
  assert.equal(mobileClient.payload.client.name, "Cliente smoke compacto");

  const report = await jsonRequest(`${baseUrl}/api/reports/xlsx`, cookie, {
    method: "POST", body: JSON.stringify({ fileName: "smoke-v99.xlsx", sheetName: "Prueba", headers: ["Codigo", "Producto", "Cantidad"], rows: [["P1", "Producto prueba", 2]] })
  });
  assert.equal(report.response.status, 200);
  const reportBook = new ExcelJS.Workbook();
  await reportBook.xlsx.load(Buffer.from(report.payload.base64, "base64"));
  assert.equal(reportBook.worksheets[0].getRow(2).getCell(2).value, "Producto prueba");

  const legacy = await jsonRequest(`${baseUrl}/api/product-portfolio/import-json`, cookie, { method: "POST", body: JSON.stringify({ confirmed: true, motive: "No aplicar", products: [{ descripcion: "Riesgo" }] }) });
  assert.equal(legacy.response.status, 410);

  const appSource = fs.readFileSync(path.join(root, "app.js"), "utf8");
  assert.match(appSource, /orderEditPriceList\(order\)/);
  assert.match(appSource, /forceProductIndex/);
  assert.match(appSource, /debounce\(\(\) => renderMobileProductOptions\(\), 600\)/);
  assert.match(appSource, /byId\("supplierRemitDialog"\)\.close\("default"\)/);
  assert.match(appSource, /shortageStockStatusFilter/);
  assert.match(appSource, /routeSalesCategoryFilter/);
  assert.match(appSource, /routeSalesGrouping/);
  assert.match(appSource, /function reconcileDeliveryPaymentInput\(source\)/);
  assert.match(appSource, /source === "transfer" && method\.value === "Efectivo"/);
  assert.match(appSource, /method\.value = "Mixto"/);

  console.log(JSON.stringify({
    ok: true,
    version: health.version,
    portfolioRows: preview.payload.preview.summary.total,
    updates: preview.payload.preview.summary.updates,
    unchanged: preview.payload.preview.summary.unchanged,
    unresolved: preview.payload.preview.summary.unresolved,
    missingCurrent: preview.payload.preview.summary.missing,
    legacyImporterBlocked: true,
    xlsxTemplateAndReport: true,
    invalidXlsxHandled: true,
    mixedPaymentAutoBalance: true,
    mobileClientCompactResponse: true
  }, null, 2));
})().finally(() => {
  child.kill();
  fs.rmSync(tempDir, { recursive: true, force: true });
}).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
