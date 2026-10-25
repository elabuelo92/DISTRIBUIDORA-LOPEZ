"use strict";
const assert = require("node:assert/strict");
const E = require("../collection-correction-engine");
const A = require("../account-engine");
const actor = { role: "admin", username: "admin-test", user: "Prueba" };
function fixture(applied) {
  return { clients: [{ codigo_cliente: "C1", name: "Cliente prueba", balance: applied ? 200 : 700, saldo_a_favor: 25 }],
    orders: [{ code: "PED1", client: "Cliente prueba", amount: 1000, status: "Entregado" }], accounts: [],
    products: [{ id: "P1", stock: 40, reserved: 3 }], commissionSettlements: [{ id: "S1" }],
    deliveryRoutes: [{ id: "R1", cashTotal: 300, closure: { id: "CL1", expectedCash: 300 },
      stops: [{ orderCode: "PED1", collection: { cashAmount: 300, transferAmount: 500, transferPendingAmount: 500 } }] }],
    bankReconciliation: [{ id: "B1", orderCode: "PED1", routeId: "R1", client: "Cliente prueba", amount: 500,
      accountPaymentApplied: applied, status: applied ? "Validada" : "Comprobante Recibido",
      previousBalance: applied ? 700 : null, newBalance: applied ? 200 : null, attachment: { url: "/proof.png", filename: "proof.png" } }] };
}
for (const applied of [false, true]) {
  const state = fixture(applied), original = JSON.stringify(state);
  const input = { routeId: "R1", sourceId: "pedido:PED1", cashAmount: 200, transferAmount: 500,
    retainTransfer: true, reason: "Corregir solo el efectivo", requestId: `P144-RETAIN-${applied}` };
  const preview = E.inspect(state, input, actor);
  assert.equal(preview.impact.reversal, 300);
  assert.equal(preview.impact.appliedTransferReversed, 0);
  assert.equal(preview.impact.pendingValidation, 0);
  assert.equal(preview.impact.retainedPendingValidation, applied ? 0 : 500);
  const saved = E.apply(state, { ...input, token: preview.token }, actor);
  assert.equal(saved.state.clients[0].balance, applied ? 300 : 800);
  assert.equal(saved.state.clients[0].saldo_a_favor, 25, "unrelated customer credit unchanged");
  assert.equal(JSON.stringify(state), original);
  for (const key of ["orders", "deliveryRoutes", "products", "commissionSettlements", "bankReconciliation"]) assert.deepEqual(saved.state[key], state[key], key);
  assert.equal(saved.state.bankReconciliation.length, 1);
  assert.deepEqual(saved.correction.supersededTransferIds, []);
  assert.deepEqual(saved.correction.retainedTransferIds, ["B1"]);
  assert.equal(A.correctionForTransfer(saved.state, "B1"), null);
  assert.equal(saved.state.accounts.reduce((sum, a) => sum + a.debit - a.credit, 0), 100);
  assert.equal(E.apply(saved.state, input, actor).repeated, true);
  assert.throws(() => E.apply(saved.state, { ...input, retainTransfer: false }, actor), /otros datos/);
  assert.throws(() => E.inspect(state, { ...input, transferAmount: 400 }, actor), /importe original/);
  assert.throws(() => E.inspect(state, { ...input, retainTransfer: false }, actor), /comprobante/);
  const unrelated = structuredClone(state); unrelated.clients[0].latitud = -31.4; unrelated.deliveryRoutes[0].deviceLabel = "Nuevo nombre";
  assert.equal(E.inspect(unrelated, input, actor).token, preview.token, "unrelated GPS/device edits cannot invalidate financial preview");
  unrelated.clients[0].balance += 1;
  assert.notEqual(E.inspect(unrelated, input, actor).token, preview.token, "financial edits invalidate preview");
}
const withCredit = fixture(true);
withCredit.deliveryRoutes[0].stops[0].collection.customerCreditAmount = 10;
assert.throws(() => E.inspect(withCredit, { routeId: "R1", sourceId: "pedido:PED1" }, actor), /genero saldo a favor/);
console.log("PASS P144 collections: retain pending/validated transfer, no new proof/payment, unrelated credit intact, exact ledger delta, idempotency, financial concurrency and safe ambiguous-credit block.");
