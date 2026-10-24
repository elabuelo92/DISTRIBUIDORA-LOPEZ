"use strict";
const assert = require("node:assert/strict");
const E = require("../collection-correction-engine"), A = require("../account-engine");
const actor = { role: "admin", username: "test", user: "Test" };
const fixture = () => ({ clients: [{ codigo_cliente: "C", name: "Test", balance: 1000 }], orders: [{ code: "PED-X", client: "Test" }],
  deliveryRoutes: [{ id: "R", closure: { id: "CLOSE", expectedCash: 0 }, stops: [{ orderCode: "PED-X",
    collection: { cashAmount: 0, transferAmount: 0, transferPendingAmount: 1000 } }] }],
  bankReconciliation: [{ id: "T", client: "Test", orderCode: "PED-X", routeId: "R", amount: 1000,
    status: "Pendiente de Transferencia", accountPaymentApplied: false, attachment: { url: "/proof.png", filename: "proof.png" } }],
  accounts: [], products: [{ codigo_producto: "P", stock: 20 }], commissionSettlements: [{ id: "LIQ" }] });
const input = { requestId: "COR-PENDING-TEST", routeId: "R", sourceId: "pedido:PED-X", cashAmount: 900, transferAmount: 0, reason: "Se cobro efectivo" };
const s = fixture(), before = JSON.stringify(s);
const p = E.inspect(s, input, actor);
assert.equal(p.impact.reversal, 0);
assert.equal(p.impact.pendingTransferCancelled, 1000);
assert.equal(p.impact.transferDelta, -1000, "declared transfer removed; not an account debit");
assert.equal(p.impact.balanceAfter, 100);
const result = E.apply(s, { ...input, token: p.token }, actor);
assert.equal(JSON.stringify(s), before);
assert.equal(result.state.clients[0].balance, 100);
for (const key of ["orders", "products", "deliveryRoutes", "bankReconciliation", "commissionSettlements"]) assert.deepEqual(result.state[key], s[key], key);
assert.equal(E.apply(result.state, input, actor).repeated, true);
assert.equal(result.state.collectionCorrections.length, 1);
for (const operation of [
  () => A.validateTransfer(result.state, "T", {}, actor),
  () => A.attachTransferProof(result.state, "T", {}, actor),
  () => A.rejectTransferProof(result.state, "T", { reason: "test" }, actor),
  () => A.setTransferStatus(result.state, "T", "Validada", actor)
]) {
  const protectedState = JSON.stringify(result.state);
  assert.throws(operation, /reemplazada/);
  assert.equal(JSON.stringify(result.state), protectedState);
}
const changed = fixture(); changed.bankReconciliation[0].accountPaymentApplied = true;
changed.bankReconciliation[0].previousBalance = 1000; changed.bankReconciliation[0].newBalance = 0;
changed.clients[0].balance = 0;
assert.throws(() => E.apply(changed, { ...input, token: p.token }, actor), /cambiaron/);
const partial = fixture(); partial.clients[0].balance = 600;
partial.deliveryRoutes[0].stops[0].collection.transferAmount = 1000;
partial.bankReconciliation[0].amount = 600;
partial.bankReconciliation.push({ ...partial.bankReconciliation[0], id: "T-PAID", amount: 400,
  accountPaymentApplied: true, previousBalance: 1000, newBalance: 600 });
const inspected = E.inspect(partial, input, actor);
assert.equal(inspected.impact.reversal, 400);
assert.equal(inspected.impact.pendingTransferCancelled, 600);
assert.equal(inspected.impact.transferDelta, -1000);
assert.equal(inspected.impact.balanceAfter, 100);
const missing = fixture(); missing.bankReconciliation = [];
assert.throws(() => E.inspect(missing, input, actor), /trazabilidad/);
const ambiguous = fixture(); ambiguous.bankReconciliation[0].accountEntryId = "PAID-UNKNOWN";
assert.throws(() => E.inspect(ambiguous, input, actor), /ambigua/);
const legacyVisit = fixture();
legacyVisit.collectionCorrections = [{ id: "LEGACY", sourceId: "visita:V:PAY", original: { transferId: "T" }, replacement: { transferId: "NEW" } }];
assert.equal(A.correctionForTransfer(legacyVisit, "T").id, "LEGACY");
assert.equal(A.correctionForTransfer(legacyVisit, "NEW"), null, "replacement remains validatable");
console.log("PASS pending collection correction: only paid sums reversed, pending superseded, original closures/banks immutable, replay/stale token, all later credit/proof paths blocked");
