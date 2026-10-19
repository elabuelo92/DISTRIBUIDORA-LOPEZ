"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const crypto = require("node:crypto");
const Engine = require("../order-engine");
const fixture = () => ({ products: [{ codigo_producto: "A", name: "Producto", stock_fisico: 100,
  stock_actual: 100, stock: 100, stock_reservado: 20, stock_disponible: 80, stock_en_transito: 0 }],
  orders: [], activity: [], stockMovements: [], physicalStockCounts: [
    { id: "COUNT-1", productCode: "A", expectedQty: 100, countedQty: 90 }], physicalStockAdjustments: [] });
const input = { productCode: "A", countId: "COUNT-1", reason: "Conteo comprobado" };
for (const qty of [90, 120, 100]) {
  const state = fixture(); state.physicalStockCounts[0].countedQty = qty;
  Engine.reconcilePhysicalCount(state, input, "Admin");
  assert.equal(state.products[0].stock_fisico, qty);
  assert.equal(state.products[0].stock_reservado, 20);
  assert.equal(state.products[0].stock_disponible, qty - 20);
  const snapshot = JSON.stringify(state);
  assert.equal(Engine.reconcilePhysicalCount(state, input, "Admin").replayed, true);
  assert.equal(JSON.stringify(state), snapshot);
  assert.equal(state.stockMovements.length, qty === 100 ? 0 : 1);
}
for (const qty of [-1, 19, 1.5, null, "", true, "90"]) {
  const state = fixture(); state.physicalStockCounts[0].countedQty = qty;
  const before = JSON.stringify(state);
  assert.throws(() => Engine.reconcilePhysicalCount(state, input, "Admin"));
  assert.equal(JSON.stringify(state), before);
}
for (const mutate of [s => s.products[0].stock_fisico = 99, s => s.physicalStockCounts = []]) {
  const state = fixture(); mutate(state);
  const before = JSON.stringify(state);
  assert.throws(() => Engine.reconcilePhysicalCount(state, input, "Admin"));
  assert.equal(JSON.stringify(state), before);
}
assert.throws(() => Engine.reconcilePhysicalCount(fixture(), { ...input, reason: "" }, "Admin"));

// Evaluate the actual inventory helpers without starting a server or accessing production data.
const source = fs.readFileSync(require.resolve("../server.js"), "utf8");
const start = source.indexOf("function productRecordKey(");
const end = source.indexOf("\n}", source.indexOf("function applyInitialInventoryLoad(", start)) + 2;
assert.ok(start > 0 && end > start);
let backups = 0;
const context = vm.createContext({ orderEngine: Engine, crypto,
  normalizeSearchText: value => String(value || "").trim().toLowerCase(),
  numeric: (value, fallback) => Number.isFinite(Number(value)) ? Number(value) : fallback,
  createMaintenanceBackup: () => ({ id: `TEST-${++backups}` }),
  auditLocalParts: () => ({ date: "2026-10-18", time: "23:00" }) });
vm.runInContext(source.slice(start, end), context);
const load = () => ({ operationId: "INVENTORY-TEST-1", confirmed: true, confirmText: "CONFIRMAR",
  observation: "Conteo inicial", rows: [{ productCode: "A", quantityPhysical: 90, expectedPhysical: 100, expectedReserved: 0 }] });
for (const qty of ["", " ", -1, 1.5]) {
  const state = fixture(); const request = load(); request.rows[0].quantityPhysical = qty;
  assert.throws(() => context.applyInitialInventoryLoad(state, request, { name: "Admin" }));
  assert.equal(state.products[0].stock_fisico, 100);
}
const invalidCode = load(); invalidCode.rows[0].productCode = "WRONG"; invalidCode.rows[0].description = "Producto";
assert.throws(() => context.applyInitialInventoryLoad(fixture(), invalidCode, {}));
const stale = load(); stale.rows[0].expectedPhysical = 99;
assert.throws(() => context.applyInitialInventoryLoad(fixture(), stale, {}));
const noReason = load(); noReason.observation = "";
assert.throws(() => context.applyInitialInventoryLoad(fixture(), noReason, {}));
assert.equal(backups, 0);
const state = fixture();
context.applyInitialInventoryLoad(state, load(), { name: "Admin" });
assert.equal(state.products[0].stock_fisico, 90);
assert.equal(state.stockMovements.length, 1);
const saved = JSON.stringify(state);
assert.throws(() => context.applyInitialInventoryLoad(state, load(), {}), /ya fue aplicada/);
assert.equal(JSON.stringify(state), saved);
assert.equal(backups, 1);
const bulk = fixture(); bulk.products = Array.from({ length: 100 }, (_, i) => ({ ...fixture().products[0], codigo_producto: `B${i}`, stock_reservado: 0 }));
const batch = load(); batch.operationId = "BATCH-100-TEST";
batch.rows = bulk.products.map(p => ({ productCode: p.codigo_producto, quantityPhysical: 98, expectedPhysical: 100, expectedReserved: 0 }));
batch.rows[99].expectedPhysical = 99;
assert.throws(() => context.applyInitialInventoryLoad(bulk, batch, {}));
assert.ok(bulk.products.every(p => p.stock_fisico === 100));
assert.equal(backups, 1);
batch.rows[99].expectedPhysical = 100;
const started = performance.now();
context.applyInitialInventoryLoad(bulk, batch, {});
assert.ok(bulk.products.every(p => p.stock_fisico === 98));
assert.equal(bulk.stockMovements.length, 100);
assert.equal(bulk.initialInventoryLoads.length, 1);
console.log(`Lote de 100 productos: ${(performance.now() - started).toFixed(1)} ms (motor aislado).`);
console.log("PASS: conciliacion, reservas, motivos, reintentos, cantidades y carga inicial protegida (datos ficticios).");
