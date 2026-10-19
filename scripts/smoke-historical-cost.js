"use strict";
const assert = require("node:assert/strict");
const Engine = require("../order-engine");
const Report = require("../sales-commission-report");
const fixture = () => ({ products: ["A", "B"].map(code => ({ codigo_producto: code, name: code, costo: 30, price: 100,
  stock_fisico: 100, stock_actual: 100, stock_disponible: 100, activo: "SI" })),
  clients: [{ name: "Cliente" }], sellers: [], accounts: [], orders: [], activity: [], stockMovements: [] });
const s = fixture();
let order = Engine.createOrder(s, { client: "Cliente", seller: "Vendedor", items: [{ productCode: "A", qty: 2,
  unitCostAtSale: 1, costSnapshot: { unitCost: 1 } }] }, "Vendedor");
assert.equal(order.items[0].costSnapshot.unitCost, 30);
assert.equal(order.items[0].unitCostAtSale, undefined);
const original = structuredClone(order.items[0].costSnapshot);
const cutoff = s.costHistory.startedAt;
assert.equal(cutoff, original.capturedAt);
s.products[0].costo = 70;
s.products[1].costo = 50;
Engine.editOrder(s, order.code, { motive: "Prueba", items: [{ productCode: "B", qty: 1 },
  { productCode: "A", qty: 3, costSnapshot: { unitCost: 999 } }] }, { role: "admin", user: "Admin" });
order = s.orders.find(x => x.code === order.code);
assert.deepEqual(order.items.find(x => x.productCode === "A").costSnapshot, original);
assert.equal(order.items.find(x => x.productCode === "B").costSnapshot.unitCost, 50);
assert.equal(s.costHistory.startedAt, cutoff);
assert.equal(Report.buildStatistics(s.orders, { from: "2020-01-01", to: "2099-12-31", costHistory: s.costHistory }).costRecordingFrom, cutoff);
const filter = { from: "2020-01-01", to: "2099-12-31" };
let report = Report.buildStatistics([order], filter);
assert.equal(report.cmv, 140);
assert.equal(report.profit, order.amount - 140);
order.items.find(x => x.productCode === "A").returnedQty = 1;
report = Report.buildStatistics([order], filter);
assert.equal(report.cmv, 110);
assert.equal(report.returns, 100);
assert.equal(report.profit, order.amount - 100 - 110);
delete order.items[0].costSnapshot;
Engine.editOrder(s, order.code, { motive: "Conservar desconocido", items: [{ productCode: "B", qty: 1 }] }, { role: "admin", user: "Admin" });
order = s.orders.find(x => x.code === order.code);
assert.equal(order.items[0].costSnapshot, undefined);
report = Report.buildStatistics([order], filter);
assert.equal(report.cmv, null);
assert.equal(report.missingCosts[0].code, "B");
for (const cost of [undefined, null, "", " ", -1, NaN, Infinity, true]) {
  const state = fixture(); state.products[0].costo = cost;
  const created = Engine.createOrder(state, { client: "Cliente", items: [{ productCode: "A", qty: 1 }] }, "Admin");
  assert.equal(created.items[0].costSnapshot.unitCost, null);
  assert.equal(Report.buildStatistics([created], filter).profit, null);
}
const zero = fixture(); zero.products[0].costo = 0;
const free = Engine.createOrder(zero, { client: "Cliente", items: [{ productCode: "A", qty: 1 }] }, "Admin");
assert.equal(Report.buildStatistics([free], filter).cmv, 0);
const before = JSON.stringify(s);
Report.buildStatistics(s.orders, filter);
assert.equal(JSON.stringify(s), before);
const discounted = { code: "D", createdAt: "2026-10-18", amount: 180, items: [
  { productCode: "A", requestedQty: 2, returnedQty: 1, unitPrice: 100, lineTotal: 180, costSnapshot: { unitCost: 30 } }
] };
const partial = Report.buildStatistics([discounted], filter);
assert.equal(partial.returns, 90);
assert.equal(partial.cmv, 30);
assert.equal(partial.profit, 60);
discounted.items[0].returnedQty = 2;
delete discounted.items[0].costSnapshot;
const full = Report.buildStatistics([discounted], filter);
assert.equal(full.profit, 0);
assert.equal(full.missingCostLines, 0);
const bulk = Array.from({ length: 100 }, (_, i) => ({ ...discounted, code: `B-${i}` }));
const bulkBefore = JSON.stringify(bulk);
const start = performance.now();
for (let n = 0; n < 10; n++) Report.buildStatistics(bulk, filter);
assert.equal(JSON.stringify(bulk), bulkBefore);
console.log(`100 pedidos x 10 reportes: ${(performance.now() - start).toFixed(1)} ms (motor local, sin API/BD).`);
console.log("PASS historical cost: trusted catalog, immutable snapshot, edits/reordering/new lines, unknown legacy costs, zero/invalid costs, returns, no report mutations.");
