"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const Report = require("../sales-commission-report");

const validOrder = {
  code: "PED-TEST-RETURN",
  seller: "Axel",
  client: "Cliente de prueba",
  status: "Entregado",
  createdAt: "2026-10-28T12:00:00-03:00",
  amount: 18025,
  items: [{ productCode: "CIG-1", name: "Producto de prueba", qty: 25, returnedQty: 2,
    lineTotal: 18025, unitPrice: 721, unitCostAtSale: 100 }],
  commissions: { seller: { user: "Axel", baseAmount: 18025, total: 540.75, lines: [
    { productCode: "CIG-1", productName: "Producto de prueba", quantity: 25, baseAmount: 18025,
      group: "mercaderia", percent: 3, commission: 540.75, ruleId: "HIST-1" }
  ] } }
};
const makeExcluded = (code, status, extra = {}) => ({ ...validOrder, code, status, ...extra });
const orders = [validOrder,
  makeExcluded("PED-CANCEL", "Cancelado"),
  makeExcluded("PED-REJECT", "Rechazado"),
  makeExcluded("PED-VOID", "Anulado"),
  makeExcluded("COLLECTION", "Entregado", { type: "orden_de_cobro" }),
  makeExcluded("BALANCE", "Entregado", { items: [{ name: "Saldo a cobrar", qty: 1, lineTotal: 100 }] })];
const before = JSON.stringify(orders);

const commission = Report.build(orders);
assert.equal(commission.sellers.length, 1);
assert.equal(commission.sellers[0].orders, 1);
assert.equal(commission.sellers[0].units, 25);
assert.equal(commission.sellers[0].returnedUnits, 2);
assert.equal(commission.sellers[0].netUnits, 23);
assert.equal(commission.sellers[0].commission, 540.75, "stored commission snapshot must remain unchanged");
assert.deepEqual(commission.details.map(row => [row.quantity, row.returnedQuantity, row.netQuantity]), [[25, 2, 23]]);

const stats = Report.buildStatistics(orders, { from: "2026-10-01", to: "2026-10-31" });
assert.equal(stats.orders, 1);
assert.equal(stats.products.length, 1);
assert.deepEqual([stats.products[0].requestedUnits, stats.products[0].returnedUnits, stats.products[0].units], [25, 2, 23]);
assert.equal(stats.products[0].billed, 18025);
assert.equal(stats.products[0].returns, 1442);
assert.equal(stats.products[0].gross, 16583);
assert.equal(JSON.stringify(orders), before, "reports must not mutate orders or historical commission records");

const app = fs.readFileSync(path.join(__dirname, "../app.js"), "utf8");
const filters = { commissionReportSeller: { value: "all" }, commissionReportFrom: { value: "2026-10-01" }, commissionReportTo: { value: "2026-10-31" } };
const context = vm.createContext({
  byId: id => filters[id], commissionHistoryOrders: () => orders,
  commissionReportDateKey: value => String(value || "").slice(0, 10),
  normalizeSearchText: value => String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim(),
  numeric: (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback,
  DLSalesCommissionReport: Report
});
const dataStart = app.indexOf("function commissionReportData() {");
const dataEnd = app.indexOf("\nfunction salesCommissionReportData()", dataStart);
const salesStart = dataEnd;
const salesEnd = app.indexOf("\nfunction renderSalesCommissionReport()", salesStart);
assert.ok(dataStart >= 0 && dataEnd > dataStart && salesEnd > salesStart);
vm.runInContext(app.slice(dataStart, dataEnd) + app.slice(salesStart, salesEnd), context);
const uiData = context.commissionReportData();
assert.equal(uiData.orders.length, 1);
assert.equal(uiData.excludedOrders.length, 3);
assert.equal(uiData.excludedCollectionOrders.length, 2);
assert.deepEqual([uiData.products[0].qty, uiData.products[0].returnedQty, uiData.products[0].netQty], [25, 2, 23]);
assert.equal(context.salesCommissionReportData().sellers[0].commission, 540.75);

console.log("PASS sales/commission reconciliation: same eligible order set, requested/returned/net units, excluded statuses and collection orders, unchanged historical commission amounts, no data mutation.");
