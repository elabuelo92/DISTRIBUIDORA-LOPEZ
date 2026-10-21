"use strict";
const assert = require("node:assert/strict");
const Engine = require("../supplier-remit-cancellation");
const actor = { role: "admin", username: "admin-test" };
function fixture() {
  return { suppliers: [{ name: "Proveedor prueba P10", balance: 1500, totalPurchased: 2000, movements: [{ id: "REM-P10", amount: 1000 }] }],
    supplierMovements: [{ id: "REM-P10", type: "Remito", supplier: "Proveedor prueba P10", remitNumber: "1-TEST", date: "2026-10-20", amount: 1000, stockApplied: true, economicValidated: true,
      products: [{ productCode: "P1", name: "Producto prueba", stockAppliedQty: 10, stockQty: 10, qty: 10, subtotal: 1000 }], uploads: [{ url: "/api/supplier-uploads/test.png" }] }],
    products: [{ codigo_producto: "P1", name: "Producto prueba", stock_fisico: 30, stock_reservado: 5, costo: 100, precio: 200 }],
    stockMovements: [{ id: "ST1", type: "INGRESO POR REMITO DE PROVEEDOR", productCode: "P1", supplier: "Proveedor prueba P10", remitNumber: "1-TEST", qty: 10 }],
    accounts: [{ id: "AC1", remitId: "REM-P10", type: "Remito proveedor validado", account: "Proveedor prueba P10", debit: 1000, credit: 0 }],
    orders: [], deliveryRoutes: [], commissionSettlements: [], clients: [] };
}
function input(state) { const reason = "Prueba de anulacion auditada"; return { reason, token: Engine.preview(state, "REM-P10", { reason }, actor).token, requestId: "P10-TEST-00001" }; }
function run() {
  const state = fixture(), before = structuredClone(state), data = input(state);
  assert.deepEqual(state, before, "Preview must be read-only");
  const result = Engine.cancel(state, "REM-P10", data, actor);
  assert.deepEqual(state, before, "Engine must not mutate input");
  assert.equal(result.state.products[0].stock_fisico, 20);
  assert.equal(result.state.products[0].stock_reservado, 5);
  assert.equal(result.state.products[0].costo, 100);
  assert.equal(result.state.suppliers[0].balance, 500);
  assert.equal(result.state.suppliers[0].totalPurchased, 1000);
  assert.equal(result.state.stockMovements.length, 2);
  assert.equal(result.state.accounts.length, 2);
  assert.deepEqual(result.state.accounts[1], before.accounts[0]);
  assert.deepEqual(result.remit.products, before.supplierMovements[0].products);
  assert.deepEqual(result.remit.uploads, before.supplierMovements[0].uploads);
  assert.deepEqual(Engine.cancel(result.state, "REM-P10", data, actor).state, result.state);
  assert.throws(() => Engine.cancel(result.state, "REM-P10", { ...data, requestId: "P10-TEST-00002" }, actor), /anulado/);
  assert.throws(() => Engine.cancel(result.state, "REM-P10", { ...data, reason: "Otro motivo" }, actor), /reutilizado/);
  assert.throws(() => Engine.preview(state, "REM-P10", data, { role: "driver" }), /Administracion/);
  const stale = fixture(); stale.products[0].stock_fisico++;
  assert.throws(() => Engine.cancel(stale, "REM-P10", data, actor), /cambiaron/);
  for (const mutate of [s => s.products[0].stock_reservado = 25, s => s.suppliers[0].balance = 900, s => s.stockMovements = [], s => s.accounts = [], s => s.supplierMovements[0].stockApplied = undefined]) {
    const s = fixture(); mutate(s); const b = structuredClone(s);
    assert.throws(() => input(s)); assert.deepEqual(s, b);
  }
  const pending = fixture(); pending.supplierMovements[0].stockApplied = false; pending.supplierMovements[0].economicValidated = false; pending.accounts = [];
  const p = Engine.cancel(pending, "REM-P10", input(pending), actor);
  assert.deepEqual(p.state.products, pending.products); assert.deepEqual(p.state.accounts, []);
  assert.equal(p.state.suppliers[0].balance, pending.suppliers[0].balance);
  const duplicateLines = fixture(); duplicateLines.supplierMovements[0].products = [{ productCode: "P1", stockAppliedQty: 4 }, { productCode: "P1", stockAppliedQty: 6 }];
  assert.equal(Engine.cancel(duplicateLines, "REM-P10", input(duplicateLines), actor).state.stockMovements.length, 2);
  const Account = require("../account-engine"), mixed = fixture();
  mixed.clients = [{ codigo_cliente: "C-MIX", name: "Proveedor prueba P10", balance: 300, dias_credito: 7 }];
  Account.migrateState(mixed);
  const mixedBefore = structuredClone(mixed.clients);
  const reversed = Engine.cancel(mixed, "REM-P10", input(mixed), actor).state;
  Account.migrateState(reversed);
  assert.deepEqual(reversed.clients, mixedBefore, "Supplier reversal is not a client payment");
  const vm = require("node:vm"), fs = require("node:fs");
  const context = vm.createContext({ document: { addEventListener() {} } });
  vm.runInContext(fs.readFileSync(require.resolve("../collection-corrections-ui"), "utf8"), context);
  assert.equal(vm.runInContext('accountCollectionNet({type:"Anulacion remito proveedor",credit:1000})', context), 0);
  console.log("PASS P10: preview, reversal once, replay, stale/roles, stock reservations, original ledger/attachments/costs, pending remits, duplicate lines.");
}
if (require.main === module) run();
module.exports = { fixture, input, actor };
