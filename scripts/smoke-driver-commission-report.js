"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs"), vm = require("node:vm");
const Report = require("../sales-commission-report");
const order = (code, user = "Reparto 1", total = 10, date = "2026-10-18T12:00:00Z") => ({ code,
  client: "Cliente ficticio", status: "Cobrado", amount: 1000,
  commissionLiquidated: true, commissionPaidAmount: 100,
  commissions: { calculatedAt: date, driver: { user, baseAmount: 1000, cigarettes: 4, merchandise: total - 4, total, lines: [] } } });
const rows = [order("1"), order("2", "Reparto 2", 20), order("1", "Reparto 1", 999),
  order("3", "Reparto 1", 0), order("4", "Administracion 2", 5),
  order("early", "Reparto 1", 50, "2026-10-18T02:59:59Z"),
  order("late", "Reparto 1", 60, "2026-10-19T03:00:00Z"),
  order("bad-date", "Reparto 1", 5, "invalid"), order("bad-amount", "Reparto 1", null),
  { code: "missing", status: "Entregado", amount: 999999 }];
const freeze = value => { if (value && typeof value === "object") { Object.values(value).forEach(freeze); Object.freeze(value); } return value; };
const original = JSON.stringify(rows); freeze(rows);
const filters = { from: "2026-10-18", to: "2026-10-18" };
const report = Report.buildDriver(rows, filters);
assert.equal(report.details.length, 4);
assert.equal(report.total, 35);
assert.equal(report.drivers.length, 3);
assert.equal(report.issues.length, 2);
assert.equal(Report.buildDriver(rows, { ...filters, driver: "Reparto 1" }).total, 10);
assert.equal(Report.buildDriver([], filters).total, 0);
assert.throws(() => Report.buildDriver(rows, { from: "2026-02-30" }));
assert.throws(() => Report.buildDriver(rows, { from: "2026-10-19", to: "2026-10-18" }));
assert.equal(JSON.stringify(rows), original);
const app = fs.readFileSync(require.resolve("../app.js"), "utf8");
const start = app.indexOf("async function exportDriverCommissionReport()");
const end = app.indexOf("function renderCommissionsModule()", start);
let exported;
const context = vm.createContext({ driverCommissionData: () => report,
  downloadXlsxReport: async payload => { exported = payload; },
  showCompactNotice: message => { throw new Error(message); } });
vm.runInContext(app.slice(start, end), context);
(async () => {
  await context.exportDriverCommissionReport();
  assert.equal(exported.fileName, "comisiones-reparto-2026-10-18-2026-10-18.xlsx");
  assert.equal(exported.rows.find(row => row[1] === "TOTAL GENERAL")[8], 35);
  assert.equal(exported.rows.find(row => row[2] === "1")[8], 10);
  const ExcelJS = require("exceljs");
  const server = fs.readFileSync(require.resolve("../server.js"), "utf8");
  const a = server.indexOf("async function reportWorkbookBase64(");
  const b = server.indexOf("function applyProductPortfolioImport(", a);
  const render = new Function("ExcelJS", "Buffer", `${server.slice(a,b)}\nreturn reportWorkbookBase64;`)(ExcelJS, Buffer);
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(Buffer.from(await render(JSON.parse(JSON.stringify(exported)), { username: "test" }), "base64"));
  let checked = 0;
  workbook.worksheets[0].eachRow(row => {
    if (["1", "2", "3", "4"].includes(row.getCell(3).value)) {
      assert.equal(row.getCell(6).type, ExcelJS.ValueType.Number);
      assert.equal(row.getCell(9).type, ExcelJS.ValueType.Number); checked++;
    }
  });
  assert.equal(checked, 4);
  assert.equal(JSON.stringify(rows), original);
  console.log("PASS P3: stored amounts only, settled orders untouched, deduplication, filters, Argentina dates, missing-data warnings and numeric XLSX.");
})().catch(error => { console.error(error); process.exitCode = 1; });
