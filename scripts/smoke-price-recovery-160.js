"use strict";
const assert = require("node:assert/strict");
const { planRecovery, recover, INCIDENT } = require("./recover-price-incident-20260928");
const state = { products: [], priceListAudit: [], orders: [{ id: "existing", total: 8600 }], clients: [{ id: "client" }], stockMovements: [], priceLists: [{ id: "PL-L2", number: 2, items: [] }] };
for (let i = 0; i < 32; i++) {
  const code = `PRD-717-${i}`, previous = 200 + i, at = "2026-09-28T13:47:19.184Z";
  state.products.push({ codigo_producto: code, costo: 100, stock: 12, price: i === 31 ? previous : 8600, precio_lista_2: i === 31 ? previous : 8600, precio_lista_1: 150, priceUpdatedAt: at });
  state.priceListAudit.push({ id: `audit-${i}`, listId: INCIDENT, productCode: code, previousPrice: previous, newPrice: 8600, at });
  state.priceLists[0].items.push({ productCode: code, price: 8600 });
}
state.products.push({ codigo_producto: "717", price: 8600 });
const before = structuredClone(state), payload = { version: 1, state };
assert.equal(planRecovery(state).plan.length, 31);
const conflict = structuredClone(state);
conflict.products[0].priceUpdatedAt = "invalid";
assert.throws(() => planRecovery(conflict), /Later change/);
conflict.products[0].priceUpdatedAt = state.products[0].priceUpdatedAt;
conflict.priceListAudit.push({ productCode: conflict.products[0].codigo_producto, at: "2026-09-28T14:00:00Z" });
assert.throws(() => planRecovery(conflict), /Later change/);
assert.equal(recover(payload).plan.length, 31);
assert.deepEqual(state.orders, before.orders);
assert.deepEqual(state.clients, before.clients);
assert.deepEqual(state.stockMovements, before.stockMovements);
for (let i = 0; i < 31; i++) {
  assert.equal(state.products[i].price, 200 + i);
  assert.equal(state.products[i].precio_lista_1, 150);
  assert.equal(state.products[i].stock, 12);
  assert.equal(state.products[i].costo, 100);
}
assert.deepEqual(state.products[31], before.products[31]);
assert.deepEqual(state.products[32], before.products[32]);
assert.equal(state.globalAudit.length, 31);
assert.equal(planRecovery(state).plan.length, 0);
console.log("Recovery: 31 exact restorations, later edits protected, existing orders/stock unchanged, repeat safe OK");
