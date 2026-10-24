"use strict";
const assert = require("node:assert/strict");
const Engine = require("../collection-correction-engine");
const Accounts = require("../account-engine");
const actor = { role: "admin", username: "admin-test", user: "Administrador prueba" };
const fixture = () => ({ clients: [{ codigo_cliente: "C1", name: "Prueba", balance: 200 }], accounts: [],
  orders: [{ code: "PED-TEST", client: "Prueba", amount: 1000, status: "Entregado", items: [{ code: "X", qty: 1 }] }],
  products: [{ code: "X", stock: 40 }], commissionSettlements: [{ id: "LIQ1", amount: 15 }],
  deliveryClosures: [{ id: "CLOSE1", expectedCash: 800 }],
  deliveryRoutes: [{ id: "R1", closure: { id: "CLOSE1", expectedCash: 800 }, cashTotal: 800,
    stops: [{ orderCode: "PED-TEST", collection: { cashAmount: 800, transferAmount: 0, collectibleAmount: 1000, previousBalance: 0, newBalance: 200 } }] }] });
const input = { requestId: "P9-TEST-00001", routeId: "R1", sourceId: "pedido:PED-TEST", cashAmount: 500, transferAmount: 0, reason: "Error de medio de pago" };
function commit(state, extra = {}) {
  const data = { ...input, ...extra };
  const preview = Engine.inspect(state, data, actor);
  return Engine.apply(state, { ...data, token: preview.token }, actor);
}
const state = fixture(), saved = JSON.stringify(state);
const corrected = commit(state);
assert.equal(JSON.stringify(state), saved, "input immutable");
assert.equal(corrected.state.clients[0].balance, 500);
assert.equal(corrected.state.accounts.length, 2);
for (const key of ["orders", "products", "deliveryClosures", "deliveryRoutes", "commissionSettlements"]) assert.deepEqual(corrected.state[key], state[key], key);
assert.equal(Engine.apply(corrected.state, input, actor).repeated, true);
assert.throws(() => Engine.apply(corrected.state, { ...input, cashAmount: 600 }, actor), /identificador/);
assert.throws(() => commit(corrected.state, { requestId: "P9-TEST-00002" }), /ya tiene/);
assert.throws(() => Engine.inspect(state, input, { role: "driver" }), /Administracion/);
assert.throws(() => commit(state, { reason: "" }), /motivo/);
assert.throws(() => commit(state, { cashAmount: 1000.001 }), /Importe/);
assert.throws(() => commit(state, { cashAmount: -1 }), /Importe/);
assert.throws(() => commit(state, { cashAmount: 1001 }), /supera/);
const token = Engine.inspect(state, input, actor).token;
const changed = fixture(); changed.clients[0].balance = 300;
assert.throws(() => Engine.apply(changed, { ...input, token }, actor), /cambiaron/);
const closedChange = fixture(); closedChange.deliveryRoutes[0].closure.expectedCash = 900;
assert.throws(() => Engine.apply(closedChange, { ...input, token }, actor), /cambiaron/);
const transfer = commit(state, { cashAmount: 100, transferAmount: 700, proofHash: "proof-test", reference: "OP1", bank: "Mercado Pago", attachment: { url: "/test-proof.png" } });
assert.equal(transfer.state.clients[0].balance, 900, "transfer does not reduce balance before validation");
assert.equal(transfer.state.bankReconciliation.length, 1);
for (const key of ["orders", "deliveryClosures", "deliveryRoutes"]) assert.deepEqual(transfer.state[key], state[key]);
const bank = transfer.state.bankReconciliation[0];
Accounts.validateTransfer(transfer.state, bank.id, { operationNumber: "OP1" }, actor);
assert.equal(transfer.state.clients[0].balance, 200);
Accounts.validateTransfer(transfer.state, bank.id, { operationNumber: "OP1" }, actor);
assert.equal(transfer.state.clients[0].balance, 200, "validation once");
const validated = fixture();
validated.deliveryRoutes[0].stops[0].collection = { cashAmount: 0, transferAmount: 800 };
validated.bankReconciliation = [{ id: "B1", orderCode: "PED-TEST", routeId: "R1", amount: 800, accountPaymentApplied: true, previousBalance: 1000, newBalance: 200 }];
assert.equal(commit(validated).state.clients[0].balance, 500);
assert.deepEqual(commit(validated).state.bankReconciliation, validated.bankReconciliation);
const newBank = commit(validated, { cashAmount: 0, transferAmount: 800, proofHash: "proof2", reference: "OP2", bank: "Banco", attachment: { url: "/proof2.png" } });
assert.deepEqual(newBank.state.bankReconciliation.find(b => b.id === "B1"), validated.bankReconciliation[0], "original bank immutable");
validated.bankReconciliation[0].accountPaymentApplied = false;
validated.clients[0].balance = 1000;
assert.equal(commit(validated).state.clients[0].balance, 500, "pending transfer is not reversed as paid");
validated.bankReconciliation[0].accountPaymentApplied = true; validated.bankReconciliation[0].supplierPaymentId = "SUP1";
assert.throws(() => commit(validated), /trianguladas/);
const visit = fixture(); visit.deliveryRoutes[0].stops = [];
visit.collectionVisits = [{ id: "COB1", client: "Prueba", routeId: "R1", payments: [{ requestId: "PAY1", cash: 800, transfer: 0 }] }];
assert.equal(commit(visit, { sourceId: "visita:COB1:PAY1" }).state.clients[0].balance, 500);
console.log("PASS P9: immutable closures/orders/stock/settlements, reversal+replacement, partial, cash/transfer, bank validation once, replay, stale preview, roles and ambiguous cases blocked.");
