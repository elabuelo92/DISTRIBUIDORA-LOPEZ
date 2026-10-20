"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const Engine = require("../order-engine");
const fixture = () => ({ products: [{ codigo_producto: "A", name: "Producto",
  stock_fisico: 310, stock_reservado: 10 }], orders: [], accounts: [], physicalStockCounts: [], stockMovements: [] });
const request = { countId: "CNT-TEST-COUNT-001", productCode: "A", expectedQty: 310, countedQty: 37, observation: "Conteo" };
const s = fixture();
const protectedBefore = JSON.stringify([s.products, s.orders, s.accounts, s.stockMovements]);
const count = Engine.recordPhysicalCount(s, request, "Admin");
assert.equal(count.count.serverRecorded, true);
assert.equal(JSON.stringify([s.products, s.orders, s.accounts, s.stockMovements]), protectedBefore);
assert.equal(Engine.recordPhysicalCount(s, request, "Admin").replayed, true);
assert.equal(s.physicalStockCounts.length, 1);
for (const patch of [{ countedQty: 38 }, { productCode: "X" }, { countedQty: -1 }, { countedQty: "37" },
  { countedQty: 1.5 }, { countId: "" }, { countId: "CNT-NEW-COUNT-002", expectedQty: 309 }]) {
  const before = JSON.stringify(s);
  assert.throws(() => Engine.recordPhysicalCount(s, { ...request, ...patch }, "Admin"));
  assert.equal(JSON.stringify(s), before);
}
const moved = JSON.parse(JSON.stringify(s));
moved.products[0].stock_fisico = 300;
assert.equal(Engine.recordPhysicalCount(moved, request, "Admin").replayed, true);
assert.throws(() => Engine.reconcilePhysicalCount(moved, { ...request, reason: "Prueba" }, "Admin"), /stock cambio/);
Engine.reconcilePhysicalCount(s, { ...request, reason: "Prueba" }, "Admin");
assert.equal(s.products[0].stock_fisico, 37);
assert.equal(s.products[0].stock_reservado, 10);
assert.equal(Engine.reconcilePhysicalCount(s, { ...request, reason: "Prueba" }, "Admin").replayed, true);
assert.equal(s.stockMovements.length, 1);

const source = fs.readFileSync(require.resolve("../app.js"), "utf8");
const start = source.indexOf("async function recordPhysicalStockCount(");
const end = source.indexOf("\nfunction openPhysicalStockAdjustDialog", start);
let fail = true, inFlightResolve, requests = [];
const drafts = new Map(), saving = new Set();
const ctx = vm.createContext({
  physicalCountDrafts: drafts, physicalCountSaving: saving, isAdminUser: () => true,
  physicalStockRows: () => [{ code: "A", expected: 310 }],
  findPhysicalStockInput: attr => ({ value: attr === "data-physical-count" ? "37" : "Conteo" }),
  numeric: Number, crypto: require("node:crypto"), renderForCurrentUser: () => {},
  pullStateFromServer: async () => {}, showCompactNotice: () => {},
  window: { alert: () => {} },
  postOperationalAction: async (_, input) => {
    requests.push(input);
    if (fail) throw new Error("Conexion interrumpida");
    await new Promise(resolve => { inFlightResolve = resolve; });
    return { count: { id: input.countId, serverRecorded: true } };
  }
});
vm.runInContext(source.slice(start, end), ctx);
(async () => {
  await ctx.recordPhysicalStockCount("A");
  assert.equal(drafts.get("A").rawCount, "37");
  assert.equal(saving.size, 0);
  fail = false;
  const pending = ctx.recordPhysicalStockCount("A");
  await ctx.recordPhysicalStockCount("A");
  assert.equal(requests.length, 2);
  assert.equal(requests[0].countId, requests[1].countId);
  assert.equal(drafts.has("A"), true);
  inFlightResolve(); await pending;
  assert.equal(drafts.size, 0); assert.equal(saving.size, 0);
  console.log("PASS count persistence: stock unchanged until approval; retry idempotent; stale counts blocked; drafts retained; double click blocked.");
})().catch(error => { console.error(error); process.exitCode = 1; });
