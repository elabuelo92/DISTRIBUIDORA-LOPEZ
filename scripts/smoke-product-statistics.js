"use strict";
const assert = require("node:assert/strict");
const Report = require("../sales-commission-report");
const filters = { from: "2026-10-01", to: "2026-10-31" };
const order = { code: "ONE", createdAt: "2026-10-24T12:00:00Z", amount: 380, items: [
  { productCode: "A", name: "Con costo", qty: 2, unitPrice: 100, lineTotal: 180, unitCostAtSale: 30, returnedQty: 1 },
  { productCode: "B", name: "Sin costo", qty: 2, lineTotal: 200 }
] };
const before = JSON.stringify(order);
const report = Report.buildStatistics([order, order], filters);
assert.equal(report.orders, 1);
const a = report.products.find(p => p.code === "A"), b = report.products.find(p => p.code === "B");
assert.deepEqual([a.units,a.billed,a.returns,a.gross,a.cost,a.profit], [1,180,90,90,30,60]);
assert.equal(b.cost, null); assert.equal(b.profit, null); assert.equal(b.missingCostUnits, 2);
assert.equal(report.cmv, null); assert.equal(report.profit, null);
assert.equal(report.products.reduce((s,p) => s + p.gross,0), report.netSales);
assert.equal(report.unallocatedSales, 0);
assert.equal(JSON.stringify(order), before);
const allReturned = Report.buildStatistics([{ ...order, amount: 200, items: [{ productCode: "B", qty: 2, returnedQty: 2, lineTotal: 200 }] }], filters);
assert.equal(allReturned.products[0].cost, 0);
assert.equal(allReturned.products[0].profit, 0);
const incomplete = Report.buildStatistics([{ ...order, amount: 400 }], filters);
assert.equal(incomplete.unallocatedSales, 20, "mismatched historical totals are visible, not silently allocated");
const mixed = Report.buildStatistics([order, { ...order, code: "TWO", items: [{ productCode: "A", qty: 1, lineTotal: 100 }] }], filters);
assert.equal(mixed.products.find(p => p.code === "A").cost, null);
console.log("PASS product statistics: per-line historical cost, partial returns, discounts, missing/partial coverage, reconciliation and no mutations.");
