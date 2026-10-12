"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ExcelJS = require("exceljs");
const app = fs.readFileSync(path.join(__dirname, "../app.js"), "utf8");
const server = fs.readFileSync(path.join(__dirname, "../server.js"), "utf8");
function extract(source, start, end) {
  const a = source.indexOf(start);
  const b = source.indexOf(end, a);
  assert.ok(a >= 0 && b > a);
  return source.slice(a, b);
}
let report = { seller: "all", from: "2026-10-01", to: "2026-10-12", products: [
  { product: "Aceite", qty: 273, gross: 67990.369999999, percent: 3.96, commission: 2692.418652 },
  { product: "Ajuste", qty: 0, gross: -100.25, percent: 0, commission: 0 }
] };
let account = null;
let payload;
let notice;
const context = vm.createContext({
  commissionReportData: () => report, commissionAccountData: () => account,
  formatDateTimeParts: (at) => ({ date: at }), normalizeSearchText: (s) => s.toLowerCase(),
  reportDateStamp: () => "2026-10-12", downloadXlsxReport: async (input) => { payload = input; },
  showCompactNotice: (message) => { notice = message; }
});
vm.runInContext(extract(app, "async function exportCommissionReportExcel()", "function settleCommissionReport()"), context);
const renderWorkbook = new Function("ExcelJS", "Buffer", `${extract(server, "async function reportWorkbookBase64(", "function applyProductPortfolioImport(")}\nreturn reportWorkbookBase64;`)(ExcelJS, Buffer);
async function exportSheet() {
  payload = undefined;
  notice = undefined;
  const before = JSON.stringify({ report, account });
  await context.exportCommissionReportExcel();
  assert.equal(notice, undefined);
  assert.equal(JSON.stringify({ report, account }), before);
  assert.ok(payload.fileName.endsWith(".xlsx"));
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(Buffer.from(await renderWorkbook(JSON.parse(JSON.stringify(payload)), { username: "test" }), "base64"));
  return workbook.worksheets[0];
}
(async () => {
  let sheet = await exportSheet();
  assert.equal(sheet.getCell("C4").type, ExcelJS.ValueType.Number);
  assert.equal(sheet.getCell("C4").value, report.products[0].gross);
  assert.equal(sheet.getCell("C4").numFmt, "$ #,##0.00");
  assert.equal(sheet.getCell("D4").value, 3.96);
  assert.equal(sheet.getCell("D4").numFmt, "0.00");
  assert.equal(sheet.getCell("E4").type, ExcelJS.ValueType.Number);
  assert.equal(sheet.getCell("C5").value, -100.25);
  assert.equal(sheet.getCell("E5").value, 0);
  assert.equal(sheet.getCell("A4").font.size, 13);
  assert.equal(sheet.views[0].ySplit, 3);
  assert.match(sheet.getCell("A2").value, /2026-10-01.*2026-10-12/);
  report.seller = "Vendedor Uno";
  account = { accrued: 300, paid: 400, balance: -100, payments: [
    { at: "2026-10-12", amount: 400, method: "Transferencia", reference: "REF-1", user: "Admin" }
  ] };
  sheet = await exportSheet();
  assert.equal(sheet.getCell("C10").value, -100);
  assert.equal(sheet.getCell("C13").value, 400);
  assert.equal(sheet.getCell("C13").numFmt, "$ #,##0.00");
  assert.equal(sheet.getCell("D13").value, "REF-1");
  assert.equal(sheet.getCell("E13").value, "Admin");
  report.products[0].gross = NaN;
  payload = undefined;
  await context.exportCommissionReportExcel();
  assert.equal(payload, undefined);
  assert.match(notice, /invalido/);
  console.log("PASS: real XLSX numeric amounts, decimals, percent, zero/negative values, filters, payments and unchanged source data.");
})().catch((error) => { console.error(error); process.exitCode = 1; });
