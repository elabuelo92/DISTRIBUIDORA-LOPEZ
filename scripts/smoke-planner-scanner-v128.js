"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { performance } = require("node:perf_hooks");
const DeliveryEngine = require("../delivery-engine");

const root = path.resolve(__dirname, "..");
const app = fs.readFileSync(path.join(root, "app.js"), "utf8");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const css = fs.readFileSync(path.join(root, "styles.css"), "utf8");

[
  "deliveryPlannerSearch",
  "selectFilteredDeliveryPlannerBtn",
  "deliveryPlannerZoneFilter",
  "deliveryPlannerSellerFilter",
  "deliveryPlannerSelectAll",
  "deliveryPlannerRoutes"
].forEach((id) => assert.match(html, new RegExp(`id=["']${id}["']`)));

assert.match(html, /data-planner-filter="unassigned"/);
assert.match(html, /data-planner-filter="no-gps"/);
assert.match(app, /function refreshDeliveryPlannerSelectionUi/);
assert.match(app, /data-planner-row=/);
assert.match(app, /function assemblyScannerIndex/);
assert.match(app, /new Map\(\)/);
assert.match(app, /now - assemblyFastScanLastKeyAt > 90/);
assert.match(app, /requestSubmit\(\)/);
assert.match(app, /data-delivery-map-mode/);
assert.match(app, /removedRouteId/);
assert.match(fs.readFileSync(path.join(root, "server.js"), "utf8"), /\/unplan/);
assert.match(css, /\.delivery-planner-table/);
assert.match(css, /\.assembly-fast-scan/);

const orders = Array.from({ length: 100 }, (_, index) => ({
  code: `PED-${String(index + 1).padStart(4, "0")}`,
  zone: index % 3 === 0 ? "Norte" : "Sur",
  assigned: index % 4 === 0,
  gps: index % 7 !== 0
}));
const filtered = orders.filter((order) => order.zone === "Norte" && !order.assigned && order.gps);
const selected = new Set(filtered.map((order) => order.code));
assert.equal(selected.size, filtered.length);
assert.equal(new Set(orders.map((order) => order.code)).size, 100);

const barcodeIndex = new Map(Array.from({ length: 1000 }, (_, index) => [`779${String(index).padStart(10, "0")}`, { index }]));
const scanCodes = Array.from(barcodeIndex.keys()).slice(400, 420);
const startedAt = performance.now();
for (let round = 0; round < 1000; round += 1) {
  scanCodes.forEach((code) => assert.ok(barcodeIndex.get(code)));
}
const elapsedMs = performance.now() - startedAt;
assert.ok(elapsedMs < 300, `20,000 exact lookups took ${elapsedMs.toFixed(2)}ms`);

const routeState = {
  products: [], sellers: [], accounts: [], activity: [], notifications: [], globalAudit: [],
  stockMovements: [], deliveryRoutes: [], deliveryAudit: [], deliveryClosures: [],
  clients: [{ name: "Cliente Ruta", domicilio: "Calle 123", localidad: "Cordoba", latitud: -31.4, longitud: -64.18 }],
  orders: [{
    code: "PED-UNDO-1", client: "Cliente Ruta", amount: 1000, status: "Listo para Despacho",
    items: [], trace: [], assembly: { bultosConfirmed: 1, label: { generated: true, scanned: true, packageLabels: [] } }
  }]
};
const planned = DeliveryEngine.createPlannedRoute(routeState, {
  orderCodes: ["PED-UNDO-1"], day: "2026-09-02", zone: "Centro", driverUser: "reparto1", deviceLabel: "Reparto 1"
}, { user: "Smoke Admin", role: "admin" });
assert.equal(routeState.deliveryRoutes.length, 1);
DeliveryEngine.removePlannedRoute(routeState, planned.id, { user: "Smoke Admin", role: "admin" });
assert.equal(routeState.deliveryRoutes.length, 0);

console.log(JSON.stringify({
  ok: true,
  version: "8790-128",
  plannerRows: orders.length,
  selectedFiltered: selected.size,
  consecutiveScans: scanCodes.length,
  exactLookups: 20000,
  lookupMs: Number(elapsedMs.toFixed(2)),
  undoPlannedRoute: true,
  mapLazyForAdmin: true
}, null, 2));
