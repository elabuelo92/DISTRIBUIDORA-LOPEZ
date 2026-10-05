"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const Delivery = require("../delivery-engine");
const Order = require("../order-engine");
const S = Order.STATUS;
// Reuse the synthetic fixture, without executing its separate smoke suite.
const fixture = fs.readFileSync(path.join(__dirname, "smoke-delivery-operations-v132.js"), "utf8");
const buildState = vm.runInNewContext(`(${fixture.slice(fixture.indexOf("function buildState"), fixture.indexOf("const state = buildState"))})`, { OrderEngine: Order });
const state = JSON.parse(JSON.stringify(buildState(3)));
Order.migrateState(state);
const admin = { role: "admin", username: "admin", user: "Admin", skipMigration: true };
const driver = { role: "driver", username: "dario", user: "Dario", deviceId: "TEST-FIRST", deviceLabel: "Dario", gps: { lat: -31.41, lng: -64.18, accuracy: 10 }, skipMigration: true };
const original = state.orders[0];
original.id = "stable-order-id";
original.stockSettled = true;
const commercialSnapshot = () => JSON.stringify({ id: original.id, code: original.code, client: original.client, seller: original.seller, items: original.items.map(({productCode, requestedQty, unitPrice, lineTotal}) => ({productCode, requestedQty, unitPrice, lineTotal})), amount: original.amount, assembly: original.assembly });
const before = commercialSnapshot();
const first = Delivery.createPlannedRoute(state, { orderCodes: state.orders.map(o => o.code), day: "2026-09-27", zone: "Centro", driverUser: "dario" }, admin);
Delivery.publishRoute(state, first.id, admin);
Delivery.claimRoute(state, first.id, driver);
Delivery.markStopException(state, original.code, { status: S.NOT_DELIVERED, reason: "Cerrado", observations: "Regresar otro dia" }, driver);
Delivery.markStopException(state, state.orders[1].code, { status: S.REJECTED, reason: "Rechazado", observations: "No desea recibir" }, driver);
assert.equal(Delivery.routeAlreadyContainsOrder(state, original.code), null, "An unfinished old route must not hide a failed stop");
assert.equal(Delivery.isRepeatVisit(state, original), true);
const oldStop = JSON.stringify(first.stops.find(s => s.orderCode === original.code));
Delivery.relocateOrders(state, first.id, { orderCodes: [original.code], targetRouteId: "" }, admin);
assert.equal(JSON.stringify(first.stops.find(s => s.orderCode === original.code)), oldStop);
assert.equal(original.reprogrammingPending, true);
assert.throws(() => Delivery.relocateOrders(state, first.id, { orderCodes: [state.orders[1].code], targetRouteId: "" }, admin));
const input = { orderCodes: [original.code], day: "2026-09-28", zone: "Norte", driverUser: "reparto2", secondVisit: true };
assert.throws(() => Delivery.createPlannedRoute(state, input, driver), /administracion/);
assert.throws(() => Delivery.createPlannedRoute(state, { ...input, day: "2026-02-30" }, admin), /fecha valida/);
assert.throws(() => Delivery.createPlannedRoute(state, { ...input, orderCodes: [state.orders[1].code] }, admin), /No entregados/);
assert.throws(() => Delivery.createPlannedRoute(state, { ...input, secondVisit: false, orderCodes: [state.orders[1].code] }, admin), /debe estar/);
const second = Delivery.createPlannedRoute(state, input, admin);
assert.equal(Delivery.routeAlreadyContainsOrder(state, original.code).id, second.id);
assert.throws(() => Delivery.createPlannedRoute(state, input, admin), /ya esta incluido/);
const movements = state.stockMovements.length;
Delivery.publishRoute(state, second.id, admin);
const secondDriver = { ...driver, username: "reparto2", deviceId: "TEST-SECOND" };
Delivery.claimRoute(state, second.id, secondDriver);
Delivery.collectAndDeliver(state, original.code, { method: "Efectivo", amountPaid: original.amount, paymentSplit: { cashAmount: original.amount, transferAmount: 0, creditAmount: 0 }, deliveredItems: [{ productCode: "P-132", deliveredQty: 1, returnedQty: 0 }] }, secondDriver);
assert.equal(original.status, S.COLLECTED);
assert.equal(original.reprogrammingPending, false);
assert.equal(state.orders.length, 3);
assert.equal(state.orders[0], original);
assert.equal(commercialSnapshot(), before);
assert.equal(state.stockMovements.length, movements);
assert.equal(JSON.stringify(first.stops.find(s => s.orderCode === original.code)), oldStop);
assert.ok(original.trace.some(t => t.status === S.NOT_DELIVERED));
assert.ok(state.deliveryAudit.some(a => a.action === "SEGUNDA_VISITA_PLANIFICADA"));
const rejected = state.orders[1];
const rejectionDate = new Date(rejected.deliveryException.at).toLocaleDateString("en-CA", { timeZone: "America/Argentina/Buenos_Aires" });
assert.equal(Delivery.matchesPlanningFilters(state, rejected), false);
assert.equal(Delivery.matchesPlanningFilters(state, rejected, { status: S.REJECTED, from: rejectionDate, to: rejectionDate }), true);
assert.equal(Delivery.matchesPlanningFilters(state, rejected, { status: S.REJECTED, to: "2000-01-01" }), false);
const ready = { code: "UNASSIGNED", status: S.READY_DISPATCH, createdAt: "2026-09-27T12:00:00Z" };
assert.equal(Delivery.matchesPlanningFilters(state, ready, { visit: "first", from: "2026-09-27", to: "2026-09-27" }), true);
assert.equal(Delivery.matchesPlanningFilters(state, ready, { visit: "second" }), false);
// Execute the actual frontend filtering function with a small DOM adapter.
const app = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");
const controls = { deliveryPlannerStatusFilter: "all", deliveryPlannerVisitFilter: "all" };
const uiState = { orders: [ready, rejected], deliveryRoutes: state.deliveryRoutes };
const ui = {
  state: uiState, DeliveryEngine: Delivery, byId: id => ({ value: controls[id] || "" }),
  normalizeSearchText: value => String(value).toLowerCase(), deliveryPlannerSearchTerm: "",
  deliveryPlannerFilter: "unassigned", deliveryPlannerZoneFilter: "all", deliveryPlannerSellerFilter: "all", deliveryPlannerSortKey: "client",
  deliveryPlannerRoute: o => Delivery.routeAlreadyContainsOrder(uiState, o.code),
  deliveryOrderDestinationInfo: () => ({ hasDestination: true }), orderHoursText: () => "",
  deliveryOrderHasGps: () => false, orderZoneText: () => "Centro", orderRouteText: () => "Centro", orderAddressText: () => "Calle 1",
  compareOrdersBySort: () => 0
};
vm.createContext(ui);
vm.runInContext(app.slice(app.indexOf("function deliveryPlannerCandidates()"), app.indexOf("function deliveryPlannerGroupKey")), ui);
assert.equal(ui.deliveryPlannerCandidates().length, 1);
controls.deliveryPlannerStatusFilter = S.REJECTED;
assert.equal(ui.deliveryPlannerCandidates()[0].code, rejected.code);
controls.deliveryPlannerTo = "2000-01-01";
assert.equal(ui.deliveryPlannerCandidates().length, 0);
console.log("OK: same order through second visit and collection; no extra stock movement; old stop retained; rejection, authorization, duplicate, date and visit filters verified.");
