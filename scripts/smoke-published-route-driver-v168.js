"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const path = require("node:path");
const Order = require("../order-engine");
const Delivery = require("../delivery-engine");
const source = fs.readFileSync(path.join(__dirname, "smoke-delivery-operations-v132.js"), "utf8");
const buildState = vm.runInNewContext(`(${source.slice(source.indexOf("function buildState"), source.indexOf("const state = buildState"))})`, { OrderEngine: Order });
const admin = { role: "admin", user: "Admin prueba", username: "admin1", skipMigration: true };
const state = JSON.parse(JSON.stringify(buildState(76)));
Order.migrateState(state);
const eduardo = Delivery.createPlannedRoute(state, { day: "2026-10-07", zone: "Miercoles R1 Eduardo", driverUser: "reparto2", driverLabel: "reparto2", orderCodes: state.orders.slice(0, 35).map(o => o.code) }, admin);
const chino = Delivery.createPlannedRoute(state, { day: "2026-10-07", zone: "Miercoles R2 Chino", driverUser: "reparto2", driverLabel: "reparto2", orderCodes: state.orders.slice(35).map(o => o.code) }, admin);
Delivery.publishRoute(state, eduardo.id, admin);
Delivery.publishRoute(state, chino.id, admin);
Delivery.claimRoute(state, chino.id, { ...admin, username: "reparto2", deviceId: "QUFR0", deviceLabel: "QUFR0" });
const before = JSON.parse(JSON.stringify(state));
const beforeEduardo = before.deliveryRoutes.find(r => r.id === eduardo.id);
const beforeChino = before.deliveryRoutes.find(r => r.id === chino.id);
const expected = { expectedUpdatedAt: eduardo.updatedAt, expectedDriverUser: eduardo.driverUser };
for (const [mutate, actor, snapshot] of [
  [() => {}, { ...admin, role: "driver" }, expected],
  [() => {}, admin, {}],
  [() => {}, admin, { ...expected, expectedDriverUser: "reparto1" }],
  [() => {}, admin, { ...expected, expectedUpdatedAt: "stale" }],
  [r => { r.deviceId = "PHONE"; }, admin, expected],
  [r => { r.startedAt = "2026-10-07"; }, admin, expected],
  [r => { r.closure = {}; }, admin, expected],
  [r => { r.stops[0].collection = { cash: 100 }; }, admin, expected],
  [r => { r.stops[0].status = "Entregado"; }, admin, expected],
  [r => { r.cashTotal = 100; }, admin, expected]
]) {
  const copy = structuredClone(before);
  mutate(copy.deliveryRoutes.find(r => r.id === eduardo.id));
  const frozen = JSON.stringify(copy);
  assert.throws(() => Delivery.assignPlannedRouteDriver(copy, eduardo.id, "reparto1", "Reparto 1", actor, snapshot));
  assert.equal(JSON.stringify(copy), frozen, "Rejected operation must not mutate state");
}
Delivery.assignPlannedRouteDriver(state, eduardo.id, "reparto1", "Reparto 1", admin, expected);
assert.equal(eduardo.driverUser, "reparto1");
assert.equal(eduardo.status, "Despachada");
assert.equal(eduardo.deviceId, beforeEduardo.deviceId);
assert.deepEqual(eduardo.stops, beforeEduardo.stops);
assert.deepEqual(chino, beforeChino);
for (const key of Object.keys(before).filter(k => !["deliveryRoutes", "deliveryAudit"].includes(k))) assert.deepEqual(state[key], before[key], key);
assert.equal(state.deliveryAudit.length, before.deliveryAudit.length + 1);
const afterAssignment = structuredClone(state);
assert.throws(() => Delivery.claimRoute(state, eduardo.id, { role: "driver", username: "reparto2", deviceId: "QUFR0", skipMigration: true }));
assert.deepEqual(state, afterAssignment);
Delivery.claimRoute(state, eduardo.id, { role: "driver", username: "reparto1", deviceId: "EDUARDO", skipMigration: true });
assert.equal(eduardo.deviceId, "EDUARDO");
assert.deepEqual(chino, beforeChino);
console.log("OK: 35 orders reassigned without stock/account/order changes; Chino unchanged; role, concurrency, collections and claim guards verified.");
