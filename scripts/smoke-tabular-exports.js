"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const path = require("node:path");
const source = fs.readFileSync(path.join(__dirname, "../app.js"), "utf8");
const extract = (start, end) => source.slice(source.indexOf(start), source.indexOf(end, source.indexOf(start)));
const reports = [];
const notices = [];
const row = { code: "00170", name: 'Producto, con "comillas" y acento', rubric: "Rubro", brand: "Marca", supplier: "Proveedor", warehouse: "Central", available: 10, committed: 2, preparing: 1, assembled: 0, labeled: 0, readyDispatch: 1, expected: 14, counted: 0, difference: -14, differencePercent: -100, count: { user: "Test", at: "2026-10-12" } };
const context = vm.createContext({
  isAdminUser: () => true, window: { alert: (message) => notices.push(message) },
  physicalStockReportType: "all", physicalStockReportRows: () => [row],
  state: { physicalStockAdjustments: [{ productName: "Producto", previousStock: 10, newStock: 8, reason: "Control", user: "Test", at: "2026-10-12" }] },
  stockReportRows: () => [{ codigo: "00170", barras: "00000123", producto: "Producto", fisico: 14, costo: 12.5 }],
  formatOrderTime: String, reportDateStamp: () => "20261012", safeFilePart: String,
  downloadXlsxReport: async (report) => reports.push(report), showCompactNotice: (message) => notices.push(message)
});
vm.runInContext(extract("async function downloadTabularExcel(", "function exportStockPdf(") + extract("async function exportPhysicalStockCsv(", "function exportPhysicalStockPdf(") + extract("async function exportStockCsv(", "function pdfEscape("), context);
(async () => {
  const original = JSON.stringify(row);
  await context.exportPhysicalStockCsv();
  let report = reports.pop();
  assert.ok(report.fileName.endsWith(".xlsx"));
  assert.equal(report.headers.length, 18);
  assert.equal(report.rows[0].length, 18);
  assert.equal(report.rows[0][0], "00170");
  assert.equal(report.rows[0][1], row.name);
  assert.equal(report.rows[0][13], 0);
  assert.equal(report.rows[0][14], -14);
  assert.equal(typeof report.rows[0][15], "number");
  assert.equal(JSON.stringify(row), original);
  context.physicalStockReportType = "adjustments";
  await context.exportPhysicalStockCsv();
  report = reports.pop();
  assert.equal(report.headers.length, 6);
  assert.equal(report.rows[0][1], 10);
  assert.equal(report.rows[0][2], 8);
  await context.exportStockCsv();
  report = reports.pop();
  assert.equal(report.headers.length, 14);
  assert.equal(report.rows[0][1], "00000123");
  assert.equal(report.rows[0][11], 12.5);
  context.isAdminUser = () => false;
  await context.exportStockCsv();
  assert.equal(reports.length, 0);
  context.downloadXlsxReport = async () => { throw new Error("Sin conexion"); };
  await context.downloadTabularExcel("test.xlsx", ["Campo"], [["valor"]]);
  assert.equal(notices.pop(), "Sin conexion");
  for (const prefix of ["manifiesto-ruta", "cartera-completa-clientes", "cartera-completa-productos-precios", "lista-precios", "proveedores"]) {
    assert.ok(source.includes('downloadTabularExcel(`' + prefix), prefix + " must use real XLSX");
  }
  console.log("PASS tabular exports: fields, quantities, zero counts, identifiers, permissions, errors and seven XLSX entry points. No production writes.");
})().catch((error) => { console.error(error); process.exitCode = 1; });
