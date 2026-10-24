"use strict";
const assert = require("node:assert/strict");
const Engine = require("../order-engine");
const state = { products: [{ codigo_producto: "A", name: "Articulo", rubro: "Limpieza",
  price: 100, stock_fisico: 100, stock_reservado: 0 }],
  orders: ["Cancelado", "Rechazado", "No entregado"].map((status, index) => ({
    code: `OLD-${index}`, status, client: "Prueba", seller: "Ana", createdAt: "2026-10-01T12:00:00.000Z",
    items: [{ productCode: "A", name: "Articulo", requestedQty: 2, unitPrice: 100, lineTotal: 200 }],
    assembly: { bultosConfirmed: 1, label: { generated: true, scanned: true } }
  })), commissionSettlements: [{ id: "SETTLED", amount: 10 }] };
Engine.migrateState(state);
for (const order of state.orders) {
  order.commissions.calculatedAt = "2026-10-01T12:01:00.000Z";
  assert.equal(order.commissions.total, 0);
}
state.orders[0].commissionLiquidated = true;
const before = JSON.stringify([state.orders, state.commissionSettlements]);
// Catalog rules may evolve, but zeroed historical lines retain their original rules and dates.
state.commissionSettings.rules.find(rule => rule.role === "seller" && rule.rubro === "*").percent = 19;
Engine.migrateState(state);
Engine.applyStockEntry(state, { productCode: "A", qty: 3, movementType: "Ingreso" }, "Admin");
Engine.migrateState(state);
assert.equal(JSON.stringify([state.orders, state.commissionSettlements]), before);
assert.equal(state.products[0].stock_fisico, 103);
assert.equal(state.products[0].stock_reservado, 0);
// Keep the legacy repair for an actual non-zero cancellation, then stabilize it.
state.orders[1].commissions.seller.lines[0].commission = 99;
Engine.migrateState(state);
assert.equal(state.orders[1].commissions.seller.lines[0].commission, 0);
state.orders[1].commissions.calculatedAt = "2026-10-02T12:01:00.000Z";
const repaired = JSON.stringify(state.orders[1].commissions);
Engine.migrateState(state);
assert.equal(JSON.stringify(state.orders[1].commissions), repaired);
state.orders[1].commissions.seller.lines.push(null);
Engine.migrateState(state);
assert.ok(state.orders[1].commissions.seller.lines.every(line => line && line.commission === 0));
console.log("PASS cancelled/rejected/not-delivered commission snapshots stable on stock receipt; legacy non-zero repair retained; settlements unchanged");
