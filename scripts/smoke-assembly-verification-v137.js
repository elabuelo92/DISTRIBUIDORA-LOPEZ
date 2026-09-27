"use strict";

const assert = require("node:assert/strict");
const Order = require("../order-engine");

for (const lineCount of [5, 20, 50]) {
  const order = {
    code: `PED-137-${lineCount}`,
    client: "Cliente de prueba",
    status: Order.STATUS.LABELED,
    amount: lineCount * 100,
    updatedAt: "2026-09-27T12:00:00.000Z",
    items: Array.from({ length: lineCount }, (_, index) => ({
      productCode: `P-${index + 1}`,
      name: `Producto ${index + 1}`,
      requestedQty: index + 1,
      unitPrice: 100,
      lineTotal: (index + 1) * 100
    })),
    assembly: { orderNumber: 1, bultosConfirmed: 1, label: { generated: true, scanned: false } },
    trace: []
  };
  const state = { orders: [order], activity: [] };
  const keys = order.items.map(Order.assemblyLineKey);
  Order.setAssemblyItemVerification(state, order.code, keys, { user: "Deposito", expectedUpdatedAt: order.updatedAt });
  assert.equal(order.assembly.verifiedItemKeys.length, lineCount);
  assert.equal(order.assembly.label.scanned, false);
  assert.throws(() => Order.setAssemblyItemVerification(state, order.code, ["otra-linea"]), /no pertenecen/);
  assert.throws(() => Order.setAssemblyItemVerification(state, order.code, keys, { expectedUpdatedAt: "anterior" }), /cambio/);
  Order.setAssemblyItemVerification(state, order.code, keys.slice(1), { user: "Deposito", expectedUpdatedAt: order.updatedAt });
  assert.equal(order.assembly.verifiedItemKeys.length, lineCount - 1);
  assert.equal(order.status, Order.STATUS.LABELED);
  Order.markOrderReadyForDispatch(state, order.code, { user: "Deposito", skipMigration: true });
  assert.equal(order.status, Order.STATUS.READY_DISPATCH);
  assert.equal(order.assembly.verifiedItemKeys.length, lineCount - 1);
  assert.equal(order.assembly.label.scannerOmitted, true);
}

console.log(JSON.stringify({ ok: true, lineCounts: [5, 20, 50], scannerRequired: false }));
