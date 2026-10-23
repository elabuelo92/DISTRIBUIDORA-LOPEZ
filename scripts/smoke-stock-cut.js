"use strict";
const assert = require("node:assert/strict");
const Engine = require("../order-engine");
const { draftCountState } = require("../stock-count-storage");
function fixture() {
  return { products: [{ codigo_producto: "A", name: "A", stock_fisico: 100, stock_reservado: 20 },
    { codigo_producto: "B", name: "B", stock_fisico: 50, stock_reservado: 0 }],
    orders: [{ code: "PED-TEST", inventoryMode: "reservation", status: Engine.STATUS.ASSEMBLY,
      items: [{ productCode: "A", name: "A", requestedQty: 20, reservedQty: 20 }] }],
    accounts: [{ balance: 999.50 }], supplierAccounts: [{ balance: 123.45 }],
    physicalStockCuts: [], physicalStockCounts: [], physicalStockAdjustments: [], stockMovements: [] };
}
const state = fixture();
const input = { cutId: "CUT-FIXED-TEST-001" };
const cut = Engine.startPhysicalStockCut(state, input, "Admin1").cut;
assert.equal(Engine.startPhysicalStockCut(state, input, "Admin2").replayed, true);
assert.equal(state.physicalStockCuts.length, 1);
assert.throws(() => Engine.startPhysicalStockCut(state, { cutId: "CUT-FIXED-TEST-002" }, "Admin2"), /Ya hay/);
const frozen = JSON.stringify(cut.products);
// Simulate a dispatch of 15 and a receipt of 7 after the cut.
state.products[0].stock_fisico = 92;
state.products[0].stock_reservado = 5;
const protectedData = JSON.stringify([state.orders, state.accounts, state.supplierAccounts]);
const countInput = { ...input, productCode: "A", countId: "CNT-FIXED-TEST-001", expectedQty: 100, countedQty: 90 };
assert.equal(Engine.recordPhysicalCount(state, countInput, "Admin1").count.difference, -10);
assert.equal(state.products[0].stock_fisico, 92, "count does not change live stock");
assert.equal(Engine.recordPhysicalCount(state, countInput, "Admin2").replayed, true);
assert.throws(() => Engine.closePhysicalStockCut(state, input, "Admin1"), /diferencias/);
const adjust = { productCode: "A", countId: countInput.countId, reason: "Conteo al corte", expectedCurrentQty: 100 };
assert.throws(() => Engine.reconcilePhysicalCount(state, adjust, "Admin1"), /actual cambio/);
adjust.expectedCurrentQty = 92;
const once = Engine.reconcilePhysicalCount(state, adjust, "Admin1");
assert.equal(once.adjustment.newStock, 82, "100 at cut, 90 counted, -8 movement: 82, NOT 90");
assert.equal(state.products[0].stock_reservado, 5);
assert.equal(Engine.reconcilePhysicalCount(state, adjust, "Admin2").replayed, true);
assert.equal(state.stockMovements.length, 1);
assert.equal(state.stockMovements[0].qty, -10);
assert.equal(JSON.stringify(state.physicalStockCuts[0].products), frozen);
assert.equal(JSON.stringify([state.orders, state.accounts, state.supplierAccounts]), protectedData);
assert.throws(() => Engine.recordPhysicalCount(state, { ...countInput, countId: "CNT-FIXED-TEST-002" }, "Admin2"), /ya fue ajustado/);
const beforeClose = JSON.stringify(state);
const draft = draftCountState(state);
Engine.closePhysicalStockCut(draft, input, "Admin1");
assert.equal(JSON.stringify(state), beforeClose, "failed write cannot close cached cut");
assert.equal(Engine.closePhysicalStockCut(state, input, "Admin1").cut.status, "Cerrado");
assert.equal(Engine.closePhysicalStockCut(state, input, "Admin1").replayed, true);
assert.equal(Engine.reconcilePhysicalCount(state, adjust, "Admin2").replayed, true, "lost-response retry after close");
const reloaded = JSON.parse(JSON.stringify(state));
assert.equal(reloaded.physicalStockCuts[0].products[0].physical, 100);
Engine.startPhysicalStockCut(reloaded, { cutId: "CUT-FIXED-TEST-002" }, "Admin2");
assert.equal(Engine.activePhysicalStockCut(reloaded).products[0].physical, 82);
// Competing counts cannot both adjust the same baseline; reserve safety at commit.
const race = fixture(); Engine.startPhysicalStockCut(race, input, "Admin1");
Engine.recordPhysicalCount(race, countInput, "Admin1");
const newer = { ...countInput, countId: "CNT-FIXED-TEST-003", countedQty: 85 };
Engine.recordPhysicalCount(race, newer, "Admin2");
assert.throws(() => Engine.reconcilePhysicalCount(race, { ...adjust, expectedCurrentQty: 100 }, "Admin1"), /mas reciente/);
race.products[0].stock_fisico = 30;
const original = JSON.stringify(race);
assert.throws(() => Engine.reconcilePhysicalCount(race, { ...adjust, countId: newer.countId, expectedCurrentQty: 30 }, "Admin2"), /reservado/);
assert.equal(JSON.stringify(race), original);
const inconsistent = fixture();
Engine.startPhysicalStockCut(inconsistent, input, "Admin1");
Engine.recordPhysicalCount(inconsistent, countInput, "Admin1");
inconsistent.products[0].stock_reservado = 120;
const reservedSnapshot = JSON.stringify(inconsistent);
assert.throws(() => Engine.reconcilePhysicalCount(inconsistent, { ...adjust, expectedCurrentQty: 100 }, "Admin1"), /reservado/);
assert.equal(JSON.stringify(inconsistent), reservedSnapshot, "never silently clamp an existing reservation");
assert.throws(() => Engine.recordPhysicalCount(race, { ...newer, countId: "CNT-FIXED-TEST-004", cutId: "", expectedQty: 30 }, "Admin3"), /corte abierto/);
console.log("PASS persisted immutable cut, dispatch/receipt deltas, retries, one adjustment, stale preview/count rejection, reservations, unchanged orders/accounts, isolation and reload");
