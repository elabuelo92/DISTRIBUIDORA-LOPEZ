"use strict";
const assert = require("node:assert/strict");
const Delivery = require("../delivery-engine");
const Order = require("../order-engine");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const old = { lat: -31.45, lng: -64.22 };
const corrected = { lat: -31.412345678, lng: -64.181234567 };
const client = { name: "GPS TEST", codigo_cliente: "GPS-TEST", latitud: old.lat, longitud: old.lng,
  location: { ...old }, geolocation: { ...old }, gps: { ...old } };
assert.deepEqual(Delivery.clientCoordinates(client), old);
client.gpsReview = { status: "pending_validation", proposal: corrected };
assert.deepEqual(Delivery.clientCoordinates(client), old, "Unapproved proposals do not become operational");
client.latitud = corrected.lat;
client.longitud = corrected.lng;
client.gpsReview.status = "approved";
assert.deepEqual(Delivery.clientCoordinates(client), corrected, "Canonical approved point beats all stale aliases");
for (const key of ["location", "geolocation", "gps"]) {
  assert.deepEqual(Delivery.clientCoordinates({ [key]: old }), old);
}
assert.deepEqual(Delivery.clientCoordinates({ latitude: old.lat, longitude: old.lng }), old);
assert.deepEqual(Delivery.clientCoordinates({ latitud: corrected.lat, location: old }), old, "Never mix components from different pairs");
assert.deepEqual(Delivery.clientCoordinates({ latitud: 0, longitud: -64 }), { lat: 0, lng: -64 });
for (const input of [null, {}, { latitud: "", longitud: "" }, { latitud: 0, longitud: 0 }, { latitud: 91, longitud: 0 }]) {
  assert.equal(Delivery.clientCoordinates(input), null);
}
const statuses = [Order.STATUS.READY_DISPATCH, Order.STATUS.DELIVERED, Order.STATUS.NOT_DELIVERED,
  Order.STATUS.POSTPONED, Order.STATUS.REJECTED];
const state = { clients: [client], orders: statuses.map((status, i) => ({ code: `GPS-${i}`, client: client.name,
  status, amount: 100, items: [], assembly: { bultosConfirmed: 1 } })), products: [],
  deliveryRoutes: [{ id: "GPS-ROUTE", day: "2026-10-12", status: "Planificada", stops: statuses.map((status, i) => ({
    orderCode: `GPS-${i}`, client: client.name, status, coordinates: { ...old }, sequence: i + 1
  })) }] };
const protectedOrders = JSON.stringify(state.orders);
Delivery.migrateState(state);
const stops = state.deliveryRoutes.find(r => r.id === "GPS-ROUTE").stops;
const pending = stops.find(stop => stop.orderCode === "GPS-0");
assert.deepEqual(pending.coordinates, corrected, "Pending stop refreshes");
stops.filter(stop => stop !== pending).forEach(stop => assert.deepEqual(stop.coordinates, old, "Completed visit retains historical point"));
assert.equal(JSON.stringify(state.orders), protectedOrders, "Orders remain untouched");
assert.ok(Delivery.navigationUrl(state, "GPS-0").includes(encodeURIComponent(`${corrected.lat},${corrected.lng}`)));
const closedRoute = state.deliveryRoutes.find(r => r.id === "GPS-ROUTE");
closedRoute.status = "Completada";
pending.coordinates = { ...old };
Delivery.migrateState(state);
assert.deepEqual(pending.coordinates, old, "Closed route retains its point even if stop status is inconsistent");
console.log("OK: approved GPS precedence, legacy pairs, pending approval, pending stop refresh, historical stops, closed routes, navigation, unchanged orders");
const app = fs.readFileSync(path.join(__dirname, "../app.js"), "utf8");
const signatureLine = app.split("\n").find(line => line.includes("const nextSignature =") && line.includes("located.map"));
assert.ok(signatureLine);
const signature = position => vm.runInNewContext(`${signatureLine}\nnextSignature`, {
  route: { id: "TEST" }, located: [{ stop: { orderCode: "GPS-0" }, position }]
});
assert.notEqual(signature(old), signature(corrected), "Map reframes when the same stop changes location");
assert.equal(signature(corrected), signature({ ...corrected }), "Unchanged points keep the same map signature");
console.log("OK: map signature responds to GPS changes without changing order IDs");
