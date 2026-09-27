"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const Delivery = require("../delivery-engine");
const Order = require("../order-engine");

const root = path.resolve(__dirname, "..");
const fixture = fs.readFileSync(path.join(__dirname, "smoke-delivery-operations-v132.js"), "utf8");
const buildState = vm.runInNewContext(`(${fixture.slice(fixture.indexOf("function buildState"), fixture.indexOf("const state = buildState"))})`, { OrderEngine: Order });
const state = JSON.parse(JSON.stringify(buildState(100)));
Order.migrateState(state);
const context = { role: "admin", username: "admin1", user: "Administracion", skipMigration: true };
const codes = state.orders.map((order) => order.code);
const ordersBefore = JSON.stringify(state.orders);
assert.throws(() => Delivery.createPlannedRoute(state, {
  orderCodes: codes.slice(0, 30), day: "2026-02-30", zone: "Malvinas", driverUser: "dario"
}, context), /fecha valida/);

const route = Delivery.createPlannedRoute(state, {
  orderCodes: codes.slice(0, 30), day: "2026-09-28", zone: "Malvinas", driverUser: "dario", driverLabel: "Darío"
}, context);
assert.equal(Delivery.routeDisplayName(route), "LUNES — MALVINAS — DARÍO");
assert.equal(route.stops.length, 30);

const beforeFailedBatch = JSON.stringify(route.stops);
assert.throws(() => Delivery.appendOrdersToPlannedRoute(state, route.id, [codes[30], codes[0]], context), /ya esta incluido/);
assert.equal(JSON.stringify(route.stops), beforeFailedBatch, "a mixed invalid batch must be atomic");

Delivery.appendOrdersToPlannedRoute(state, route.id, codes.slice(30), context);
assert.equal(route.stops.length, 100);
assert.equal(new Set(route.stops.map((stop) => stop.orderCode)).size, 100);
assert.equal(state.deliveryRoutes.length, 1);
assert.equal(state.deliveryAudit.filter((entry) => entry.action === "PEDIDOS_ASIGNADOS_RUTA").length, 1);
assert.equal(JSON.stringify(state.orders), ordersBefore, "planning must not change processed orders");

Delivery.assignPlannedRouteDriver(state, route.id, "reparto1", "Reparto 1", context);
assert.equal(route.driverUser, "reparto1");
assert.equal(Delivery.routeDisplayName(route), "LUNES — MALVINAS — REPARTO 1");
assert.equal(route.stops.length, 100);
assert.equal(JSON.stringify(state.orders), ordersBefore);

const reversed = route.stops.map((stop) => stop.orderCode).reverse();
Delivery.reorderRoute(state, route.id, reversed, context);
assert.equal(route.stops[0].orderCode, reversed[0]);
assert.equal(route.stops[99].sequence, 100);
assert.equal(route.manualOrder, true);
assert.equal(JSON.stringify(state.orders), ordersBefore);

Delivery.publishRoute(state, route.id, context);
assert.equal(state.orders.filter((order) => order.status === Order.STATUS.DISPATCHED).length, 100);
assert.throws(() => Delivery.appendOrdersToPlannedRoute(state, route.id, [codes[0]], context), /sin publicar/);
assert.throws(() => Delivery.assignPlannedRouteDriver(state, route.id, "dario", "Darío", context), /sin publicar/);
assert.equal(route.driverUser, "reparto1");
assert.equal(route.stops.length, 100);

const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const app = fs.readFileSync(path.join(root, "app.js"), "utf8");
const server = fs.readFileSync(path.join(root, "server.js"), "utf8");
assert.match(html, /id="assignSelectedToDeliveryRouteBtn"/);
assert.match(html, /id="deliveryPlannerTargetRoute"/);
assert.match(app, /data-route-drag/);
assert.match(app, /data-assign-route-driver/);
assert.match(server, /\/orders\$\/\);/);
assert.match(server, /\/driver\$\/\);/);
console.log("OK: 100 orders planned in two batch operations, driver reassigned, compact route reordered, published; no premature order mutations or partial invalid batches.");
