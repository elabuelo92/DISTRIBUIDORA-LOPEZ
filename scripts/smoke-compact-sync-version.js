"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const path = require("node:path");
const source = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");
const start = source.indexOf("function applyServerStatePayload(payload)");
const end = source.indexOf("async function postOperationalAction", start);
assert.ok(start >= 0 && end > start);
assert.ok(source.includes("applyOrderPatches([order], payload.refreshRequired ? null : payload.version)"),
  "mobile order confirmation must also retain the complete-sync cursor");
for (const role of ["admin", "seller", "driver"]) {
  const context = vm.createContext({
    syncVersion: 7, sellerCatalogVersion: 7, currentUser: { role },
    state: { orders: [{ code: "PED-1", amount: 100 }], deliveryRoutes: [] },
    OrderEngine: { buildShortageList: () => [] },
    persistLocalMeta() {}, scheduleRenderForCurrentUser() {},
    applyPresencePayload() {}, applyPresenceToState() {}, trackIncomingNotifications() {},
    normalizeState: (state) => state
  });
  vm.runInContext(source.slice(start, end), context);
  const partial = { version: 8, compact: true, refreshRequired: true,
    order: { code: "PED-1", amount: 80 }, route: { id: "R1", status: "En curso" } };
  context.applyServerStatePayload(partial);
  context.applyOperationalPatches(partial);
  assert.equal(context.state.orders[0].amount, 80, "show acknowledged local change");
  assert.equal(context.state.deliveryRoutes[0].id, "R1");
  assert.equal(context.syncVersion, 7, "partial response is not a complete sync cursor");
  assert.equal(context.sellerCatalogVersion, 7);
  context.applyServerStatePayload({ version: 8, state: { orders: [partial.order, { code: "PED-2" }], deliveryRoutes: [partial.route] } });
  assert.equal(context.syncVersion, 8);
  assert.equal(context.state.orders.length, 2, "next full sync includes concurrent operations");
  context.applyOperationalPatches({ version: 9, order: { code: "PED-1", amount: 75 } });
  assert.equal(context.syncVersion, 9, "legacy non-refresh patches remain compatible");
}
console.log("PASS compact sync cursor: admin, seller, driver retain pending refresh and accept subsequent complete sync");
