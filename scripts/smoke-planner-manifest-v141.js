"use strict";

const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawn } = require("node:child_process");
const ExcelJS = require("exceljs");

const root = path.resolve(__dirname, "..");
const app = fs.readFileSync(path.join(root, "app.js"), "utf8");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");

assert.match(html, /id="exportDeliveryPlannerXlsxBtn"/);
assert.match(html, /id="exportDeliveryPlannerPdfBtn"/);
assert.doesNotMatch(html, /id="exportDeliveryPlannerCsvBtn"/);
assert.match(app, /selected\.length \? selected : deliveryPlannerCandidates\(\)/);
assert.match(app, /exportDeliveryPlannerManifest\("xlsx"\)/);
assert.match(app, /makeTablePdf\(`Manifiesto para planificar/);
assert.match(app, /const commands = \["0 G", "0 g", "0\.45 w"\]/);
assert.match(app, /"0\.92 g", `\$\{margin\} \$\{y\} \$\{availableWidth\} \$\{rowHeight\} re f`, "0 g", "0 G"/);
assert.match(app, /fontSize: 6\.4/);
assert.match(app, /rowHeight: 20/);

function passwordRecord(username, name, role, password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const passwordHash = crypto.pbkdf2Sync(password, salt, 120000, 32, "sha256").toString("hex");
  return { username, name, role, active: true, salt, passwordHash };
}

async function waitForServer(base, output) {
  for (let attempt = 0; attempt < 120; attempt += 1) {
    try {
      const response = await fetch(`${base}/api/health`);
      if (response.ok) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`Servidor de prueba no inicio. ${output()}`);
}

async function login(base) {
  const input = { username: "dario", password: "Planner-141", device: { id: "SMOKE-MANIFEST-141" } };
  let response = await fetch(`${base}/api/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
  if (response.status === 428) {
    const legal = await response.json();
    input.legalAcceptance = { accepted: true, version: legal.legal.currentVersion, hash: legal.legal.hash };
    response = await fetch(`${base}/api/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
  }
  assert.equal(response.status, 200, "Darío debe poder iniciar sesion.");
  return String(response.headers.get("set-cookie") || "").split(";")[0];
}

(async () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "dl-manifest-v141-"));
  const stateFile = path.join(tempDir, "demo-state.json");
  const usersFile = path.join(tempDir, "users.json");
  const port = Number(process.env.DL_TEST_PORT || (21650 + Math.floor(Math.random() * 120)));
  fs.writeFileSync(stateFile, JSON.stringify({ version: Date.now(), state: { products: [], clients: [], sellers: [], orders: [], accounts: [], activity: [], notifications: [], globalAudit: [], priceLists: [], deliveryRoutes: [] } }));
  fs.writeFileSync(usersFile, JSON.stringify({ users: [passwordRecord("dario", "Darío", "driver", "Planner-141")] }));
  const child = spawn(process.execPath, [path.join(root, "server.js")], {
    cwd: root,
    env: { ...process.env, DL_HOST: "127.0.0.1", DL_PORT: String(port), PORT: String(port), DATA_DIR: tempDir, STATE_FILE: stateFile, USERS_FILE: usersFile, DL_VERSION: "8790-141", DL_LICENSE_ENFORCEMENT: "disabled", DL_INTEGRITY_ENFORCE: "warn" },
    stdio: ["ignore", "pipe", "pipe"]
  });
  let serverOutput = "";
  child.stdout.on("data", (chunk) => { serverOutput += chunk.toString(); });
  child.stderr.on("data", (chunk) => { serverOutput += chunk.toString(); });
  const base = `http://127.0.0.1:${port}`;
  try {
    await waitForServer(base, () => serverOutput);
    const cookie = await login(base);
    const headers = ["#", "Pedido", "Cliente", "Domicilio / referencia", "Telefono", "Zona / ruta", "Bultos", "Importe", "Horario", "Vendedor", "Estado", "GPS"];
    const rows = [[1, "PED-141", "Cliente Prueba", "Calle 141 - Porton verde", "3510000141", "Centro / Lunes", 2, 123456.78, "08:00-12:00", "Axel", "Listo para Despacho", "Si"]];
    const response = await fetch(`${base}/api/reports/xlsx`, {
      method: "POST",
      headers: { Cookie: cookie, "Content-Type": "application/json" },
      body: JSON.stringify({
        fileName: "manifiesto-v141.xlsx",
        sheetName: "Planificacion",
        title: "Manifiesto para planificar - 2026-09-07",
        subtitle: "1 pedido - seleccion actual",
        headers,
        rows,
        columnWidths: [6, 15, 24, 46, 16, 24, 9, 14, 24, 16, 22, 8],
        columnFormats: ["0", "@", "@", "@", "@", "@", "0", "$ #,##0.00", "@", "@", "@", "@"],
        wrapColumns: [3, 4, 6, 9, 11]
      })
    });
    const payload = await response.json();
    assert.equal(response.status, 200, payload.error || "No se genero el Excel.");
    assert.equal(payload.mimeType, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(Buffer.from(payload.base64, "base64"));
    const sheet = workbook.getWorksheet("Planificacion");
    assert.equal(sheet.getCell("A1").value, "Manifiesto para planificar - 2026-09-07");
    assert.equal(sheet.getCell("A2").value, "1 pedido - seleccion actual");
    assert.deepEqual(sheet.getRow(3).values.slice(1), headers);
    assert.equal(sheet.getCell("B4").value, "PED-141");
    assert.equal(sheet.getCell("H4").value, 123456.78);
    assert.equal(sheet.getCell("H4").numFmt, "$ #,##0.00");
    assert.equal(Math.round(sheet.getColumn(4).width), 46);
    assert.equal(sheet.views[0].ySplit, 3);
    assert.equal(sheet.pageSetup.orientation, "landscape");
    console.log(JSON.stringify({ ok: true, version: "8790-141", pdfText: "black", pdfFontSize: 6.4, xlsxRealWorkbook: true, plannerRole: "dario", columns: headers.length }, null, 2));
  } finally {
    child.kill("SIGTERM");
  }
})().catch((error) => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
