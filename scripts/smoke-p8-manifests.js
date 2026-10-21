"use strict";
const assert = require("node:assert/strict"), fs = require("node:fs"), vm = require("node:vm");
const source = fs.readFileSync(require.resolve("../app.js"), "utf8");
const visit = { id: "COB-P8", clientId: "C1", client: "Cliente", routeId: "R1", amount: 900, payments: [{ cash: 400, transfer: 500, at: "2026-10-20T15:00:00Z", transferId: "T1" }], summary: { status: "Cobrada", pendingValidation: 0 } };
const state = { orders: [], clients: [{ codigo_cliente: "C1", domicilio: "Direccion" }], deliveryRoutes: [{ id: "R1", stops: [] }, { id: "R2", stops: [] }], collectionVisits: [visit], bankReconciliation: [{ id: "T1", bank: "Mercado Pago" }] };
const ctx = vm.createContext({ state, numeric: (v, d) => Number(v ?? d) });
for (const name of ["deliveryRouteManifestRows", "deliveryCollectionsManifestRows"]) {
  const start = source.indexOf(`function ${name}(`), end = source.indexOf("\n}", start) + 2;
  vm.runInContext(source.slice(start, end), ctx);
}
const before = JSON.stringify(state);
const route = ctx.deliveryRouteManifestRows(state.deliveryRoutes[0]);
assert.equal(route[0][1], "COB-P8"); assert.equal(route[0][8], 0); assert.equal(route[0][11], "Solo cobranza - sin entrega");
const rows = ctx.deliveryCollectionsManifestRows("2026-10-20", "R1");
assert.equal(rows[0][3], 400); assert.equal(rows[0][4], 500); assert.equal(rows[0][8], 0);
assert.equal(rows[1][3], 400); assert.equal(rows[1][4], 500);
assert.equal(ctx.deliveryCollectionsManifestRows("2026-10-20", "R2").length, 1);
assert.equal(ctx.deliveryCollectionsManifestRows("2026-10-19", "").length, 1);
assert.equal(JSON.stringify(state), before);
console.log("PASS P8 manifests: scoped route/day, separate collection label, numeric totals, no mutations.");
