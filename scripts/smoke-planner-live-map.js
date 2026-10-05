"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const source = fs.readFileSync(require("node:path").join(__dirname, "../app.js"), "utf8");
const nodes = new Map();
const byId = (id) => {
  if (!nodes.has(id)) nodes.set(id, { offsetParent: {}, textContent: "", innerHTML: "" });
  return nodes.get(id);
};
const markers = [];
let maps = 0;
let fits = 0;
const state = { orders: Array.from({ length: 100 }, (_, i) => ({ code: `P${i}`, client: `Cliente ${i}`, coordinates: i === 99 ? null : { lat: -31.4 + i / 10000, lng: -64.2 } })) };
const selection = new Set();
const context = vm.createContext({
  state, deliveryPlannerSelection: selection, byId, orderClient: (order) => order,
  DeliveryEngine: { clientCoordinates: (client) => client.coordinates },
  escapeHtml: String, canUseGoogleMaps: () => true, ensureGoogleMaps: async () => {},
  setTimeout: () => 1, clearTimeout() {},
  google: { maps: {
    importLibrary: async () => ({ Map: class { constructor() { maps++; } fitBounds() { fits++; } } }),
    Marker: class {
      constructor({ map }) { this.map = map; markers.push(this); }
      setMap(map) { this.map = map; }
      setPosition(position) { this.position = position; }
      setLabel(label) { this.label = label; }
      setTitle(title) { this.title = title; }
    },
    LatLngBounds: class { extend() {} }, event: { clearInstanceListeners() {} }
  } }
});
vm.runInContext(source.slice(source.indexOf("let plannerSelectionMap ="), source.indexOf("function clearPlannerMap()")), context);
const refresh = async () => {
  context.schedulePlannerSelectionMap();
  await vm.runInContext("refreshPlannerSelectionMap(plannerSelectionMapRevision)", context);
};
(async () => {
  await refresh();
  assert.equal(maps, 0, "Empty selection must not load a map");
  state.orders.forEach((order) => selection.add(order.code));
  await refresh();
  assert.equal(maps, 1);
  assert.equal(markers.length, 99);
  assert.match(byId("plannerSelectionMapStatus").textContent, /100 seleccionados: 99 con GPS, 1 sin GPS/);
  assert.match(byId("plannerSelectionMapMissing").innerHTML, /P99/);
  await refresh();
  assert.equal(fits, 1, "Unchanged selection must not refit or rebuild");
  assert.equal(markers.length, 99);
  selection.delete("P0");
  await refresh();
  assert.equal(markers.filter((marker) => marker.map).length, 98);
  selection.clear();
  await refresh();
  assert.equal(markers.filter((marker) => marker.map).length, 0);
  assert.equal(maps, 1);
  assert.match(byId("plannerSelectionMapStatus").textContent, /0 seleccionados/);
  console.log("PASS live planner map: 100 selections, missing GPS, marker reuse, deselection and clear.");
})().catch((error) => { console.error(error); process.exitCode = 1; });
