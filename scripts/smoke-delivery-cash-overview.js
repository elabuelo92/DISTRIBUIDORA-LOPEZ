"use strict";
const assert = require("node:assert/strict");
const Delivery = require("../delivery-engine");
const open = { id: "R1", name: "Ruta 1", driverUser: "reparto1", day: "2026-10-23", status: "En curso", cashTotal: 100000, transferTotal: 90000, stops: [] };
const closed = { ...open, id: "R2", status: "Completada", cashTotal: 80000, closedAt: "2026-10-24T15:00:00Z", closure: { expenseTotal: 10000, reportedCash: 70000 } };
const state = { deliveryRoutes: [open, closed, { ...open }, { ...closed, id: "OLD", closedAt: "2026-10-24T02:59:59Z" }, { ...open, id: "DRAFT", status: "Planificada" }, { ...open, id: "CANCEL", status: "Cancelada" }],
  collectionVisits: [{ routeId: "R1", payments: [{ cash: 100000 }] }],
  collectionCorrections: [{ id: "C1", routeId: "R2", impact: { cashDelta: -5000 } }, { id: "C1", routeId: "R2", impact: { cashDelta: -5000 } }] };
const snapshot = JSON.stringify(state);
const report = Delivery.cashOverview(state, "2026-10-24");
assert.equal(report.rows.length, 2);
assert.equal(report.openCash, 100000);
assert.equal(report.openRoutes, 1);
assert.equal(report.cash, 180000, "visits already included in route total are not added again");
assert.equal(report.expenses, 10000);
assert.equal(report.corrections, -5000);
assert.equal(report.expected, 165000);
assert.equal(report.rows[1].declared, 70000, "closure declaration remains historical");
assert.equal(report.rows[1].expected, 65000);
assert.equal(report.rows[0].declared, null);
assert.equal(JSON.stringify(state), snapshot);
assert.equal(Delivery.cashOverview({}, "2026-10-24").cash, 0);
const historical = { ...closed, stops: [], updatedAt: "2026-10-24T15:00:00Z", manualOrder: false, pendingTotal: 0, returnTotal: 0 };
const historyState = { orders: [], deliveryRoutes: [historical] };
const historicalSnapshot = JSON.stringify(historical);
Delivery.migrateState(historyState);
Delivery.migrateState(historyState);
assert.equal(JSON.stringify(historical), historicalSnapshot, "closed route normalization cannot rewrite timestamps or ordering");
console.log("PASS cash overview: cash only, visit/route deduplication, expenses, linked corrections, ART day boundaries, no mutations.");
