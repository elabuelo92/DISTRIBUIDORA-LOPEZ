"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const Delivery = require("../delivery-engine");
const source = fs.readFileSync(require.resolve("../app.js"), "utf8");
const collection = { at: "2026-10-18T12:00:00Z", collectibleAmount: 150000,
  cashAmount: 100000, transferAmount: 0, creditAmount: 0, transferPendingAmount: 50000 };
const state = { orders: [{ code: "TEST-P5", client: "Cliente ficticio P5", amount: 150000 }],
  deliveryRoutes: [{ id: "TEST-ROUTE", stops: [{ orderCode: "TEST-P5", status: "Entregado", collection }] }] };
const context = vm.createContext({ state, numeric: (value, fallback) => Number(value) || fallback });
const start = source.indexOf("function deliveryStopFinancialCells(");
const end = source.indexOf("async function exportDeliveryCollectionsManifest(", start);
vm.runInContext(source.slice(start, end), context);
function check(expectedCredit, expectedDifference) {
  const before = JSON.stringify(state);
  const rows = context.deliveryCollectionsManifestRows("2026-10-18", "TEST-ROUTE");
  assert.equal(rows[0][6], expectedCredit);
  assert.equal(rows[0][8], expectedDifference);
  assert.equal(rows.at(-1)[6], expectedCredit);
  assert.equal(rows.at(-1)[8], expectedDifference);
  assert.equal(JSON.stringify(state), before);
}
check(50000, 0);
const route = state.deliveryRoutes[0];
Object.assign(route, { cashTotal: 100000, transferTotal: 50000, pendingTotal: 50000 });
const beforeClosure = JSON.stringify(state);
const closure = Delivery.routeClosureSummary(route, { reportedCash: 100000, reportedTransfer: 0 });
assert.equal(closure.expectedTransfer, 0);
assert.equal(closure.promisedTransfer, 50000);
assert.equal(closure.pendingAmount, 50000);
assert.equal(closure.totalDifference, 0);
assert.equal(JSON.stringify(state), beforeClosure);
collection.transferAmount = 20000;
collection.transferPendingAmount = 50000;
check(30000, 0);
collection.transferAmount = 50000;
check(0, 0);
collection.transferPendingAmount = 0;
collection.transferAmount = 0;
collection.creditAmount = 50000;
check(50000, 0);
collection.creditAmount = 40000;
check(40000, -10000);
console.log("PASS P5 manifest: promised transfer remains debt, partial/mixed payments, real discrepancy retained, no data mutation.");
