"use strict";
const assert = require("node:assert/strict");
const Report = require("../sales-commission-report");
const filter = { from: "2026-10-12", to: "2026-10-18" };
const order = (code, extra = {}) => ({ code, seller: "Kevin", status: "Entregado", createdAt: "2026-10-12T03:00:00Z", amount: 200,
  items: [{ productCode: "A", name: "Producto", qty: 2, unitPrice: 100, lineTotal: 200, unitCostAtSale: 30 }], ...extra });
const orders = [order("1"), order("2", { seller: "Ruggero" }), order("1"),
  order("cancel", { status: "Cancelado" }), order("reject", { status: "Rechazado" }),
  order("collect", { type: "orden_de_cobro" }), order("legacy", { items: [{ name: "Saldo a cobrar", qty: 1, lineTotal: 200 }] }),
  order("before", { createdAt: "2026-10-12T02:59:59Z" }), order("after", { createdAt: "2026-10-19T03:00:00Z" }),
  order("bad", { createdAt: "invalid" })];
const original = JSON.stringify(orders);
const report = Report.buildStatistics(orders, filter);
assert.equal(report.orders, 2);
assert.equal(report.gross, 400);
assert.equal(report.cmv, 120);
assert.equal(report.profit, 280);
assert.equal(report.products[0].units, 4);
assert.equal(report.sellers.length, 2);
assert.equal(report.sellers.reduce((sum, row) => sum + row.gross, 0), report.gross);
assert.equal(report.invalidDates, 1);
assert.equal(JSON.stringify(orders), original);
assert.equal(Report.buildStatistics([order("same", { status: "Cancelado" }), order("same")], filter).orders, 0);
const missing = Report.buildStatistics([order("missing", { items: [{ productCode: "A", qty: 2, lineTotal: 200 }] })], filter);
assert.equal(missing.cmv, null);
assert.equal(missing.profit, null);
assert.equal(missing.missingCostLines, 1);
assert.equal(Report.buildStatistics([], filter).gross, 0);
assert.throws(() => Report.buildStatistics([], { from: "2026-10-19", to: "2026-10-18" }));
assert.throws(() => Report.buildStatistics([], { from: "2026-02-30", to: "2026-10-18" }));
assert.deepEqual(Report.currentWeek(new Date("2026-10-19T01:00:00Z")), filter);
console.log("PASS weekly statistics: Argentina date boundaries, exclusions, archive deduplication, seller/product totals, CMV coverage, no mutations, invalid/empty periods.");
const fs = require("node:fs"), path = require("node:path"), vm = require("node:vm");
const app = fs.readFileSync(path.join(__dirname, "../app.js"), "utf8");
let exported;
const context = vm.createContext({ statisticsPeriodReport: () => report,
  downloadXlsxReport: async value => { exported = value; },
  showCompactNotice: message => { throw new Error(message); } });
const start = app.indexOf("async function exportStatisticsPeriod()");
const end = app.indexOf('byId("statisticsFrom").addEventListener', start);
assert.ok(start >= 0 && end > start);
vm.runInContext(app.slice(start, end), context);
context.exportStatisticsPeriod().then(async () => {
  assert.equal(exported.fileName, "estadisticas-2026-10-12-2026-10-18.xlsx");
  const summary = exported.sheets.find(s => s.sheetName === "Resumen");
  assert.equal(summary.rows.find(row => row[0] === "Ventas brutas")[3], 400);
  assert.equal(summary.rows.find(row => row[0] === "CMV")[3], 120);
  assert.equal(summary.rows.find(row => row[0] === "Ganancia bruta")[3], 280);
  assert.ok(summary.rows.some(row => row[1] === "Kevin" && typeof row[3] === "number"));
  const ExcelJS = require("exceljs");
  const server = fs.readFileSync(path.join(__dirname, "../server.js"), "utf8");
  const a = server.indexOf("async function reportWorkbookBase64(");
  const b = server.indexOf("function applyProductPortfolioImport(", a);
  assert.ok(a >= 0 && b > a);
  const render = new Function("ExcelJS", "Buffer", `${server.slice(a,b)}\nreturn reportWorkbookBase64;`)(ExcelJS, Buffer);
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(Buffer.from(await render(JSON.parse(JSON.stringify(exported)), { username: "test" }), "base64"));
  assert.equal(workbook.worksheets.length, 2);
  const products = workbook.getWorksheet("Productos");
  assert.equal(products.getCell("G4").value, 120);
  assert.equal(products.getCell("H4").value, 280);
  assert.equal(products.getCell("H4").type, ExcelJS.ValueType.Number);
  assert.equal(products.getCell("H4").numFmt, "#,##0.00");
  const sheet = workbook.getWorksheet("Resumen");
  const expected = new Map([["Ventas brutas",400],["CMV",120],["Ganancia bruta",280]]);
  sheet.eachRow(row => {
    if (!expected.has(row.getCell(1).value)) return;
    assert.equal(row.getCell(4).type, ExcelJS.ValueType.Number);
    assert.equal(row.getCell(4).value, expected.get(row.getCell(1).value));
    expected.delete(row.getCell(1).value);
  });
  assert.equal(expected.size, 0);
  console.log("PASS real XLSX generated/read: sales, CMV and gross profit remain numeric.");
  console.log("PASS Excel export contract: selected period, numeric money and complete report sections.");
}).catch(error => { console.error(error); process.exitCode = 1; });
