"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const Engine = require("../order-engine");
const source = fs.readFileSync(path.join(__dirname, "../app.js"), "utf8");
function extract(name) {
  const start = source.indexOf(`function ${name}(`);
  assert.ok(start >= 0, name);
  const next = source.slice(start + 1).search(/\n(?:async )?function /);
  return source.slice(start, next < 0 ? undefined : start + 1 + next);
}
assert.ok(!source.includes("openSupplyPlannerIfPending"), "no automatic opener or delayed callbacks");
assert.equal((source.match(/addEventListener\("click", openSupplyPlannerDialog\)/g) || []).length, 1);
assert.equal((source.match(/openSupplyPlannerDialog\(/g) || []).length, 1, "only declaration; invoked by the click listener");
const state = {
  products: [{ codigo_producto: "C", name: "Pending product", stock_fisico: 0, stock_en_transito: 2 }],
  orders: [{ code: "PENDING-142", client: "Test", status: Engine.STATUS.PENDING,
    items: [{ productCode: "C", name: "Pending product", requestedQty: 5, missingQty: 5 }] }],
  stockMovements: [], accounts: [{ balance: 30 }]
};
let active = "stock", selected = "products", admin = true, builds = 0, opens = 0;
const nodes = Object.fromEntries(["supplyPlannerSummary", "supplyPlannerTable", "stockMovements", "shortageList"].map(id => [id, { innerHTML: "" }]));
nodes.supplyPlannerDialog = { open: false, showModal() { this.open = true; opens++; } };
const context = {
  state, byId: id => nodes[id], activeViewId: () => active, isAdminUser: () => admin,
  operationalWorkspaces: { get: () => ({ selected }) },
  numeric: (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback,
  escapeHtml: value => String(value),
  OrderEngine: { buildShortageList(value) { builds++; return Engine.buildShortageList(value); } },
  fetch: () => assert.fail("the supply view must not fetch"),
  window: { setTimeout: () => assert.fail("no opening timers") }
};
vm.createContext(context);
for (const name of ["renderStockSupply", "renderSupplyPlanner", "openSupplyPlannerDialog"]) vm.runInContext(extract(name), context);
state.products.forEach(product => Engine.inventory(product));
const snapshot = JSON.stringify(state);
context.renderStockSupply(); context.renderSupplyPlanner();
assert.equal(builds, 0, "no report work outside supply");
selected = "supply"; active = "dashboard";
context.renderStockSupply();
assert.equal(builds, 0, "hidden remembered supply section is not rendered");
active = "stock";
context.renderStockSupply();
assert.equal(builds, 1);
assert.match(nodes.shortageList.innerHTML, /Compra necesaria 3/);
assert.equal(nodes.supplyPlannerTable.innerHTML, "", "closed detailed report remains unbuilt");
context.openSupplyPlannerDialog();
assert.equal(opens, 1); assert.equal(builds, 2);
assert.match(nodes.supplyPlannerTable.innerHTML, /Pending product/);
context.openSupplyPlannerDialog();
assert.equal(opens, 1); assert.equal(builds, 2, "duplicate activation is a no-op");
context.renderStockSupply();
assert.equal(builds, 3, "one shared shortage calculation for the visible section and dialog");
nodes.supplyPlannerDialog.open = false;
const closedHtml = nodes.supplyPlannerTable.innerHTML;
state.orders[0].items[0].missingQty = 4;
context.renderStockSupply(); context.renderSupplyPlanner();
assert.equal(opens, 1, "state refresh does not reopen");
assert.equal(nodes.supplyPlannerTable.innerHTML, closedHtml, "closed report is not rebuilt");
context.openSupplyPlannerDialog();
assert.match(nodes.supplyPlannerTable.innerHTML, /<strong>4<\/strong>/, "manual reopen sees fresh data");
nodes.supplyPlannerDialog.open = false; admin = false;
context.openSupplyPlannerDialog();
assert.equal(opens, 2, "admin-only action stays restricted");
state.orders[0].items[0].missingQty = 5;
assert.equal(JSON.stringify(state), snapshot, "rendering never modifies inventory, orders, movements or balances");
assert.equal(Engine.buildShortageList(state)[0].purchaseQty, 3, "backend calculation is preserved");
console.log("PASS P142: manual only, hidden report lazy, one click listener, no timer/API, fresh reopening, backend shortages/data unchanged");
