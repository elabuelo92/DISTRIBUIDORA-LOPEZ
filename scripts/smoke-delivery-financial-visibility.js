"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const path = require("node:path");
const app = fs.readFileSync(path.join(__dirname, "../app.js"), "utf8");
const extract = (a, b) => app.slice(app.indexOf(a), app.indexOf(b, app.indexOf(a)));
const cases = [
  { status: "Entregado", collection: { cashAmount: 100000, transferAmount: 0, creditAmount: 150000 }, expected: ["Entregado", 100000, 150000] },
  { status: "Entregado", collection: { cashAmount: 100000, transferAmount: 50000, transferPendingAmount: 50000, creditAmount: 100000 }, expected: ["Entregado", 150000, 100000] },
  { status: "En reparto", collection: { cashAmount: 250000, creditAmount: 0 }, expected: ["Sin entrega confirmada", 250000, 0] },
  { status: "Entregado", collection: { cashAmount: 0, transferAmount: 0, transferPendingAmount: 250000, creditAmount: 0 }, expected: ["Entregado", 0, 250000] },
  { status: "Cobrado", collection: { cashAmount: 260000, creditAmount: 0, customerCreditAmount: 10000 }, expected: ["Entregado", 260000, 0] },
  { status: "Parcialmente Entregado", collection: { cashAmount: 100, creditAmount: 200, deliverySummary: { deliveredQty: 1, pendingQty: 2 } }, expected: ["Entrega parcial", 100, 200] },
  { status: "Entregado", collection: { cashAmount: 0, creditAmount: 0, deliverySummary: { deliveredQty: 0, returnedQty: 3, pendingQty: 0 } }, expected: ["Sin unidades entregadas", 0, 0] },
  { status: "No entregado", expected: ["No entregado", "Sin registro", "Sin registro"] },
  { status: "Cerrado", expected: ["Sin entrega confirmada", "Sin registro", "Sin registro"] }
];
const state = { orders: [], deliveryRoutes: [] };
const ctx = vm.createContext({ state, numeric: (v, d = 0) => Number.isFinite(Number(v)) ? Number(v) : d, money: { format: String }, orderClient: () => null, routeClientByName: () => null, orderAssemblyInfo: () => ({ bultos: 1 }), orderHoursText: () => "", orderZoneText: () => "" });
vm.runInContext(extract("const DELIVERY_COLLECTION_HEADERS =", "async function exportDeliveryCollectionsManifest("), ctx);
vm.runInContext(extract("const DELIVERY_MANIFEST_HEADERS =", "function exportDeliveryRouteManifest("), ctx);
for (const item of cases) {
  const before = JSON.stringify(item);
  assert.deepEqual(Array.from(ctx.deliveryStopFinancialCells(item)).slice(0, 3), item.expected);
  assert.equal(JSON.stringify(item), before);
}
assert.match(ctx.deliveryStopFinancialCells(cases[1])[3], /conciliacion/);
assert.match(ctx.deliveryStopFinancialText(cases[0]), /Pendiente en visita: 150000/);
const route = { id: "R1", stops: cases.map((item, i) => ({ ...item, orderCode: `P${i}`, amount: 250000 })) };
state.deliveryRoutes = [route];
const before = JSON.stringify(state);
const routeRows = ctx.deliveryRouteManifestRows(route);
assert.equal(routeRows.length, cases.length, "Includes stops without collection");
assert.ok(routeRows.every(row => row.length === 15));
const rows = ctx.deliveryCollectionsManifestRows("", "R1");
assert.ok(rows.every(row => row.length === 13));
assert.equal(rows[1][11], 100000, "Transfer receipt is not counted again as unpaid commercial balance");
assert.equal(JSON.stringify(state), before, "Read-only reporting");
console.log("PASS delivery independent from payment, mixed/partial/overpayment, promised transfer, legacy unknown, full return, route rows and immutable data.");
