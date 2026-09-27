"use strict";

const assert = require("node:assert/strict");
const { performance } = require("node:perf_hooks");
const DeliveryEngine = require("../delivery-engine");

for (const count of [20, 50, 100]) {
  const clients = Array.from({ length: count }, (_, index) => ({
    name: `Cliente ${index}`,
    latitud: index === 3 ? null : -31.4 - ((index * 19) % count) / 1000,
    longitud: index === 3 ? null : -64.2 - ((index * 7) % count) / 1000
  }));
  const orders = clients.map((client, index) => ({ code: `PED-${index}`, client: client.name, status: "Listo para Despacho" }));
  const route = {
    id: `TEST-${count}`,
    status: "Planificada",
    stops: orders.map((order, index) => ({ orderCode: order.code, client: order.client, sequence: index + 1 }))
  };
  const state = { clients, orders, deliveryRoutes: [route], deliverySettings: { depotLat: -31.4, depotLng: -64.2 } };
  const before = JSON.stringify(state);
  const started = performance.now();
  const proposal = DeliveryEngine.proposeRouteOrder(state, route.id);
  const elapsedMs = performance.now() - started;
  assert.equal(JSON.stringify(state), before, "proposal must not mutate state");
  assert.equal(proposal.orderCodes.length, count);
  assert.deepEqual(new Set(proposal.orderCodes), new Set(orders.map((order) => order.code)));
  assert.equal(proposal.missingGps.length, 1);
  assert.equal(proposal.missingGps[0], "PED-3");
  assert.equal(proposal.orderCodes.at(-1), "PED-3");
  assert.ok(proposal.suggestedKm <= proposal.beforeKm, "suggested path should not be longer in this fixture");
  assert.ok(elapsedMs < 500, `proposal for ${count} stops took ${elapsedMs.toFixed(1)} ms`);
  console.log(`${count} pedidos: ${elapsedMs.toFixed(2)} ms; ${proposal.beforeKm} -> ${proposal.suggestedKm} km; sin GPS ${proposal.missingGps.length}`);
}

const locked = { clients: [], orders: [], deliveryRoutes: [{ id: "STARTED", status: "En curso", startedAt: new Date().toISOString(), stops: [] }] };
assert.throws(() => DeliveryEngine.proposeRouteOrder(locked, "STARTED"), /no haya comenzado/);
