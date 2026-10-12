"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ExcelJS = require("exceljs");
const source = fs.readFileSync(path.join(__dirname, "../server.js"), "utf8");
const start = source.indexOf("async function reportWorkbookBase64(");
const end = source.indexOf("function applyProductPortfolioImport(", start);
assert.ok(start >= 0 && end > start);
const context = vm.createContext({ ExcelJS, Buffer });
vm.runInContext(source.slice(start, end), context);
async function workbook(input) {
  const result = new ExcelJS.Workbook();
  await result.xlsx.load(Buffer.from(await context.reportWorkbookBase64(input, { username: "test" }), "base64"));
  return result.worksheets[0];
}
(async () => {
  const input = {
    sheetName: "Rendicion de ruta", headers: ["Cliente", "Pedido", "Total", "Efectivo", "Transferencia", "Banco", "Cuenta corriente", "Saldo a favor", "Diferencia"],
    rows: [["Cliente de prueba con nombre largo para controlar el ajuste de texto", "TEST-1", 250000, 100000, 50000, "Mercado Pago", 100000, 0, 0]],
    fontSize: 13, columnWidths: [32, 24, 19, 19, 19, 25, 19, 19, 19],
    columnFormats: ["@", "@", "$ #,##0.00", "$ #,##0.00", "$ #,##0.00", "@", "$ #,##0.00", "$ #,##0.00", "$ #,##0.00"], wrapColumns: [1, 2, 6]
  };
  const before = JSON.stringify(input);
  const sheet = await workbook(input);
  assert.equal(sheet.getCell("A2").font.size, 13);
  assert.equal(sheet.getCell("A1").font.size, 13);
  assert.ok(sheet.getRow(2).height >= 54);
  assert.equal(sheet.getCell("A2").alignment.wrapText, true);
  assert.equal(sheet.getCell("D2").value, 100000);
  assert.equal(sheet.getCell("G2").value, 100000);
  assert.equal(sheet.getCell("I2").value, 0);
  assert.equal(sheet.getCell("D2").numFmt, "$ #,##0.00");
  assert.equal(sheet.pageSetup.orientation, "landscape");
  assert.equal(sheet.pageSetup.fitToHeight, 0);
  assert.equal(sheet.views[0].ySplit, 1);
  assert.equal(JSON.stringify(input), before);
  const legacy = await workbook({ headers: ["Original"], rows: [[123]] });
  assert.notEqual(legacy.getCell("A2").font?.size, 13, "Other reports retain default sizing");
  const bounded = await workbook({ headers: ["Test"], rows: [[1]], fontSize: 999 });
  assert.equal(bounded.getCell("A2").font.size, 20);
  console.log("PASS workbook round trip: 13pt, wrapped rows, numeric amounts unchanged, print settings, default unchanged, bounded size. No files or production data written.");
})().catch((error) => { console.error(error); process.exitCode = 1; });
