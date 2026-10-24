"use strict";
const crypto = require("node:crypto");
const Accounts = require("./account-engine");
const clone = value => JSON.parse(JSON.stringify(value));
const hash = value => crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex");
function amount(value) {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0 || !Number.isSafeInteger(Math.round(value * 100)) || Math.abs(value * 100 - Math.round(value * 100)) > 0.00001) throw new Error("Importe invalido; usar hasta dos decimales.");
  return Math.round(value * 100) / 100;
}
const round = value => Math.round(value * 100) / 100;
function admin(actor) {
  if (actor?.role !== "admin") throw new Error("Requiere Administracion.");
}
function sources(state, routeId) {
  const route = (state.deliveryRoutes || []).find(r => r.id === routeId && r.closure);
  if (!route) throw new Error("Seleccionar una ruta con cierre registrado.");
  const result = [];
  for (const stop of route.stops || []) {
    if (stop.collection) result.push({ id: `pedido:${stop.orderCode}`, client: (state.orders || []).concat(state.archivedOrders || []).find(o => o.code === stop.orderCode)?.client,
      orderCode: stop.orderCode, original: stop.collection });
  }
  for (const visit of state.collectionVisits || []) {
    if (visit.routeId !== route.id) continue;
    for (const payment of visit.payments || []) result.push({ id: `visita:${visit.id}:${payment.requestId}`, client: visit.client, orderCode: visit.id, original: payment });
  }
  return { route, sources: result };
}
function inspect(state, input, actor) {
  admin(actor);
  const { route, sources: list } = sources(state, input.routeId);
  const matches = list.filter(s => s.id === input.sourceId);
  if (matches.length !== 1) throw new Error("Cobro original no encontrado o ambiguo.");
  const source = matches[0], original = source.original;
  if (original.cashAmount === undefined && original.cash === undefined) throw new Error("Cobro historico sin desglose; requiere revision manual.");
  const clients = (state.clients || []).filter(c => c.name && c.name === source.client);
  if (clients.length !== 1 || !(clients[0].codigo_cliente || clients[0].id)) throw new Error("Cliente sin identidad unica; revisar antes de corregir.");
  const client = clients[0];
  const oldCash = amount(original.cashAmount ?? original.cash ?? 0), oldTransfer = amount(original.transferAmount ?? original.transfer ?? 0);
  const declaredTransfer = Math.max(oldTransfer, amount(Number(original.transferPendingAmount || 0)));
  if (Number(original.customerCreditAmount || 0) > 0) throw new Error("El cobro genero saldo a favor; requiere conciliacion especifica.");
  const banks = (state.bankReconciliation || []).filter(b => source.id.startsWith("visita:") ? b.id === original.transferId : b.orderCode === source.orderCode && b.routeId === route.id);
  // Historical bank records must remain untouched and cannot later credit a reversed payment.
  if (banks.some(b => b.supplierPaymentId || b.targetSupplier)) throw new Error("Regularizar transferencias trianguladas antes de corregir.");
  if (banks.some(b => Accounts.correctionForTransfer(state, b.id))) throw new Error("La transferencia ya fue reemplazada por una correccion.");
  if (new Set(banks.map(b => b.id)).size !== banks.length || banks.some(b => !b.id)) throw new Error("Identidad bancaria ambigua.");
  if (Math.abs(round(banks.reduce((s, b) => s + amount(Number(b.amount)), 0)) - declaredTransfer) > 0.001) throw new Error("No coincide la trazabilidad bancaria del cobro original. Revisar los comprobantes vinculados.");
  const appliedBanks = banks.filter(b => b.accountPaymentApplied);
  const pendingBanks = banks.filter(b => !b.accountPaymentApplied);
  if (pendingBanks.some(b => b.accountEntryId || ["Transferencia Validada", "Pago Confirmado", "Cuenta Corriente Actualizada", "Validada"].includes(b.status))) throw new Error("Transferencia con acreditacion ambigua; revisar conciliacion.");
  if (appliedBanks.some(b => Math.abs(round(Number(b.previousBalance) - Number(b.newBalance)) - Number(b.amount)) > 0.001 || b.previousBalance == null || b.newBalance == null || !Number.isFinite(Number(b.previousBalance)) || !Number.isFinite(Number(b.newBalance)))) throw new Error("La transferencia tiene un impacto historico ambiguo; revisar conciliacion.");
  if ((state.collectionCorrections || []).some(c => c.routeId === route.id && c.sourceId === source.id)) throw new Error("Este cobro ya tiene una correccion administrativa.");
  const cash = amount(input.cashAmount), transfer = amount(input.transferAmount);
  const reason = String(input.reason || "").trim();
  if (reason.length < 5 || reason.length > 1000) throw new Error("Indicar un motivo de entre 5 y 1000 caracteres.");
  if (transfer > 0 && (!String(input.reference || "").trim() || !String(input.bank || "").trim() || !input.proofHash)) throw new Error("Transferencia: indicar banco, operacion y comprobante.");
  const appliedTransfer = round(appliedBanks.reduce((sum, b) => sum + Number(b.amount), 0));
  const pendingCancelled = round(pendingBanks.reduce((sum, b) => sum + Number(b.amount), 0));
  const oldApplied = round(oldCash + appliedTransfer), balance = amount(Number(client.balance ?? client.saldo_actual ?? 0));
  const credit = amount(Number(client.saldo_a_favor || 0));
  if (credit > 0) throw new Error("Cliente con saldo a favor: requiere conciliacion especifica antes de corregir.");
  const afterReversal = round(balance + oldApplied);
  if (cash + transfer > afterReversal + 0.001) throw new Error("El nuevo cobro supera la deuda luego del reverso.");
  const impact = { balanceBefore: balance, reversal: oldApplied, balanceAfterReversal: afterReversal,
    balanceAfter: round(afterReversal - cash), pendingValidation: transfer,
    balanceAfterValidation: round(afterReversal - cash - transfer), cashDelta: round(cash - oldCash), transferDelta: round(transfer - declaredTransfer),
    appliedTransferReversed: appliedTransfer, pendingTransferCancelled: pendingCancelled };
  const token = hash({ route, original, client, banks, input: { routeId: route.id, sourceId: source.id, cash, transfer, reason,
    bank: input.bank || "", reference: input.reference || "", proofHash: input.proofHash || "" } });
  return { route, source, client, oldCash, oldTransfer, appliedTransfer, banks, cash, transfer, reason, impact, token };
}
function apply(state, input, actor) {
  admin(actor);
  if (!/^[a-zA-Z0-9-]{10,100}$/.test(String(input.requestId || ""))) throw new Error("Identificador de operacion invalido.");
  const signature = hash({ routeId: input.routeId, sourceId: input.sourceId, cashAmount: input.cashAmount, transferAmount: input.transferAmount,
    reason: input.reason, bank: input.bank || "", reference: input.reference || "", proofHash: input.proofHash || "" });
  const previous = (state.collectionCorrections || []).find(c => c.id === input.requestId);
  if (previous) {
    if (previous.signature !== signature) throw new Error("El identificador ya fue utilizado con otros datos.");
    return { state, correction: previous, repeated: true };
  }
  const p = inspect(state, input, actor);
  if (input.token !== p.token) throw new Error("Los datos cambiaron. Volver a previsualizar antes de confirmar.");
  if (p.transfer > 0 && !input.attachment?.url) throw new Error("Falta el comprobante de la nueva transferencia.");
  const next = clone(state), at = new Date().toISOString();
  const client = next.clients.find(c => String(c.codigo_cliente || c.id) === String(p.client.codigo_cliente || p.client.id));
  const correction = { id: input.requestId, signature, routeId: p.route.id, closureId: p.route.closure.id, sourceId: p.source.id,
    clientId: client.codigo_cliente || client.id, client: client.name, orderCode: p.source.orderCode,
    at, user: actor.user || actor.username, username: actor.username, reason: p.reason,
    original: clone(p.source.original), impact: p.impact,
    supersededTransferIds: p.banks.map(b => b.id), bankSnapshot: clone(p.banks),
    reversal: { id: `${input.requestId}-REV`, cashAmount: -p.oldCash, transferAmount: -p.appliedTransfer, accountDebit: p.impact.reversal },
    replacement: { id: `${input.requestId}-NEW`, cashAmount: p.cash, transferAmount: p.transfer, reference: input.reference || "", bank: input.bank || "" } };
  next.accounts = next.accounts || [];
  const entry = (id, type, debit, credit, balance) => ({ id, type, createdAt: at, date: at.slice(0, 10), account: client.name,
    debit, credit, balance, user: correction.user, correctionId: correction.id, reference: p.source.id,
    routeId: p.route.id, closureId: p.route.closure.id, observations: p.reason });
  next.accounts.unshift(entry(correction.reversal.id, "Reverso administrativo de cobranza", p.impact.reversal, 0, p.impact.balanceAfterReversal));
  if (p.cash > 0) next.accounts.unshift({ ...entry(correction.replacement.id, "Cobro administrativo corregido", 0, p.cash, p.impact.balanceAfter), method: "Efectivo" });
  client.balance = client.saldo_actual = client.saldo_inicial = p.impact.balanceAfter;
  if (p.transfer > 0) {
    // Build only the new reconciliation record: legacy normalization must not rewrite the source.
    const pending = { orders: [], clients: [], accounts: [], bankReconciliation: [] };
    const bank = Accounts.registerPendingTransfer(pending, { code: `COR-${correction.id}`, client: client.name }, {
      id: `${correction.id}-TRF`, amount: p.transfer, attachment: input.attachment, bank: input.bank,
      observations: `${p.reason}. Correccion ${p.source.id}; cierre ${p.route.closure.id}`, source: "correccion_administrativa"
    }, actor);
    bank.correctionId = correction.id;
    next.bankReconciliation = [bank, ...(next.bankReconciliation || [])];
    correction.replacement.transferId = bank.id;
  }
  next.collectionCorrections = [...(next.collectionCorrections || []), correction];
  return { state: next, correction, repeated: false };
}
module.exports = { sources, inspect, apply };
