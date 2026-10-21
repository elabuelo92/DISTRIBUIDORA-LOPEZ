"use strict";
const Accounts = require("./account-engine");

const clone = value => JSON.parse(JSON.stringify(value));
const money = value => {
  if (typeof value !== "number") throw new Error("El importe debe ser numerico.");
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0 || !Number.isSafeInteger(Math.round(number * 100))) throw new Error("Importe invalido.");
  return Math.round(number * 100) / 100;
};
function operationId(value) {
  const id = String(value || "");
  if (!/^[a-zA-Z0-9-]{10,100}$/.test(id)) throw new Error("Identificador de operacion invalido.");
  return id;
}
function clientFor(state, id) {
  const matches = (state.clients || []).filter(client => String(client.codigo_cliente || client.id || "") === String(id));
  if (matches.length !== 1) throw new Error("Seleccionar un cliente por ID unico.");
  // Existing accounting resolves names; reject ambiguous names instead of crediting another account.
  if ((state.clients || []).filter(client => String(client.name || "").trim().toLowerCase() === String(matches[0].name || "").trim().toLowerCase()).length !== 1) {
    throw new Error("Nombre de cliente ambiguo para cuenta corriente.");
  }
  return matches[0];
}
function routeFor(state, id, actor, operating = false, allowClosed = false) {
  const route = (state.deliveryRoutes || []).find(item => item.id === id);
  if (!route || (!allowClosed && (route.closure || route.closedAt || ["Cerrada", "Cancelada"].includes(route.status)))) throw new Error("Seleccionar una ruta abierta.");
  if (operating && route.status === "Planificada") throw new Error("Publicar la ruta antes de cobrar.");
  if (operating && actor.role !== "admin" && (actor.role !== "driver" || !actor.username ||
    route.driverUser !== actor.username || !actor.deviceId || route.deviceId !== actor.deviceId)) {
    throw new Error("La ruta no esta asignada a esta sesion de reparto.");
  }
  return route;
}

// Return a candidate state; callers persist it only after the complete operation succeeds.
function create(state, input, actor) {
  if (actor.role !== "admin") throw new Error("Requiere Administracion.");
  const id = `COB-${operationId(input.requestId)}`;
  const client = clientFor(state, input.clientId);
  const amount = money(input.amount);
  const previous = (state.collectionVisits || []).find(item => item.id === id);
  if (previous) {
    if (previous.clientId !== String(input.clientId) || previous.amount !== amount || previous.initialRouteId !== String(input.routeId || "")) throw new Error("Operacion repetida con datos diferentes.");
    return { state, visit: previous, repeated: true };
  }
  if (!amount || amount > money(client.balance ?? client.saldo_actual ?? 0)) throw new Error("El importe supera el saldo actual o es cero.");
  const allocated = (state.collectionVisits || []).filter(visit => visit.clientId === String(input.clientId) && visit.status !== "No cobrada")
    .reduce((sum, visit) => sum + (visit.completedAt ? 0 : summary(state, visit.id).pending) + summary(state, visit.id).pendingValidation, 0);
  if (money(allocated + amount) > money(client.balance ?? client.saldo_actual ?? 0)) throw new Error("El saldo ya tiene ordenes de cobro pendientes.");
  if (input.routeId) routeFor(state, input.routeId, actor);
  const next = clone(state);
  const at = new Date().toISOString();
  const visit = { id, clientId: String(input.clientId), client: client.name, amount,
    routeId: String(input.routeId || ""), initialRouteId: String(input.routeId || ""), status: "Pendiente", createdAt: at, createdBy: actor.username,
    history: [{ action: "CREADA", at, user: actor.username }], payments: [] };
  next.collectionVisits = [...(next.collectionVisits || []), visit];
  return { state: next, visit, repeated: false };
}

function collect(state, id, input, actor) {
  const current = (state.collectionVisits || []).find(item => item.id === id);
  if (!current) throw new Error("Orden de cobro no encontrada.");
  const sourceRoute = routeFor(state, current.routeId, actor, true, true);
  const requestId = operationId(input.requestId);
  const cash = money(input.cashAmount ?? 0);
  const transfer = money(input.transferAmount ?? 0);
  const signature = JSON.stringify([cash, transfer, input.reference || "", input.proofHash || input.attachment?.url || "", input.bank || "Mercado Pago"]);
  const replay = current.payments.find(item => item.requestId === requestId);
  if (replay) {
    if (replay.signature !== signature) throw new Error("Operacion repetida con importes diferentes.");
    return { state, visit: current, repeated: true };
  }
  if (sourceRoute.closure || sourceRoute.closedAt || ["Cerrada", "Cancelada"].includes(sourceRoute.status)) throw new Error("La ruta ya fue cerrada.");
  if (current.completedAt || current.status === "No cobrada") throw new Error("La visita ya fue finalizada.");
  if ((state.collectionVisits || []).some(visit => visit.id !== id && visit.payments.some(payment => payment.requestId === requestId))) throw new Error("Identificador de pago utilizado en otra orden de cobro.");
  const client = clientFor(state, current.clientId);
  const pending = summary(state, id).pending;
  if (!cash && !transfer) throw new Error("Registrar un cobro mayor a cero.");
  if (money(cash + transfer) > pending || money(cash + transfer + summary(state, id).pendingValidation) > money(client.balance ?? 0)) throw new Error("El cobro supera el saldo pendiente.");
  if (transfer && (!input.attachment?.url || !String(input.reference || "").trim())) throw new Error("Adjuntar comprobante y numero de operacion.");
  const next = clone(state);
  const visit = next.collectionVisits.find(item => item.id === id);
  const route = next.deliveryRoutes.find(item => item.id === visit.routeId);
  let payment;
  if (cash) {
    payment = Accounts.registerClientPayment(next, { entityId: current.clientId, method: "Efectivo", amount: cash,
      reference: id, note: `Orden de cobro ${id}` }, actor).payment;
    payment.collectionVisitId = id;
    payment.routeId = route.id;
    route.cashTotal = money(money(route.cashTotal || 0) + cash);
  }
  let proof;
  if (transfer) {
    proof = Accounts.registerPendingTransfer(next, { code: "", client: client.name }, {
      id: `COB-TRF-${requestId}`, source: "orden_cobro", routeId: route.id, amount: transfer,
      bank: input.bank || "Mercado Pago", attachment: input.attachment, observations: input.reference
    }, actor);
    proof.collectionVisitId = id;
    route.transferTotal = money(money(route.transferTotal || 0) + transfer);
  }
  const at = new Date().toISOString();
  visit.payments.push({ requestId, signature, cash, transfer, at, user: actor.username, paymentId: payment?.id || "", transferId: proof?.id || "" });
  const pendingProof = visit.payments.some(payment => payment.transferId &&
    !(next.bankReconciliation || []).find(proof => proof.id === payment.transferId)?.accountPaymentApplied);
  visit.status = pending === money(cash + transfer) ? (pendingProof ? "Pendiente de validacion" : "Cobrada") : "Parcial";
  if (pending === money(cash + transfer)) visit.completedAt = at;
  visit.history.push({ action: "COBRO_REGISTRADO", at, user: actor.username, requestId });
  return { state: next, visit, repeated: false };
}

// Read the current reconciliation, not a stale status saved before bank validation.
function summary(state, id) {
  const visit = (state.collectionVisits || []).find(item => item.id === id);
  if (!visit) throw new Error("Orden de cobro no encontrada.");
  let cash = 0, validatedTransfer = 0, pendingValidation = 0;
  for (const payment of visit.payments || []) {
    cash += payment.cash;
    if (!payment.transferId) continue;
    const proof = (state.bankReconciliation || []).find(item => item.id === payment.transferId);
    if (proof?.accountPaymentApplied) validatedTransfer += payment.transfer;
    else pendingValidation += payment.transfer;
  }
  const paid = money(cash + validatedTransfer);
  const pending = money(Math.max(0, visit.amount - paid - pendingValidation));
  const client = clientFor(state, visit.clientId);
  return { id, cash: money(cash), validatedTransfer: money(validatedTransfer), paid,
    pendingValidation: money(pendingValidation), pending,
    status: visit.status === "No cobrada" ? visit.status : paid >= visit.amount ? "Cobrada"
      : pendingValidation ? "Pendiente de validacion" : paid ? "Parcial" : "Pendiente",
    gps: { lat: client.latitud ?? null, lng: client.longitud ?? null },
    clientBalance: money(client.balance ?? client.saldo_actual ?? 0) };
}

function assign(state, id, input, actor) {
  if (actor.role !== "admin") throw new Error("Requiere Administracion.");
  const current = (state.collectionVisits || []).find(item => item.id === id);
  if (!current) throw new Error("Orden de cobro no encontrada.");
  if (current.completedAt || current.payments.length || current.status !== "Pendiente") throw new Error("Solo reasignar visitas pendientes sin cobros.");
  if (current.routeId) routeFor(state, current.routeId, actor);
  const routeId = String(input.routeId || "");
  if (routeId) routeFor(state, routeId, actor);
  if (current.routeId === routeId) return { state, visit: current, repeated: true };
  const next = clone(state), visit = next.collectionVisits.find(item => item.id === id);
  visit.history.push({ action: "REASIGNADA", at: new Date().toISOString(), user: actor.username, previousRouteId: visit.routeId, routeId });
  visit.routeId = routeId;
  return { state: next, visit, repeated: false };
}

function notCollected(state, id, input, actor) {
  const current = (state.collectionVisits || []).find(item => item.id === id);
  if (!current) throw new Error("Orden de cobro no encontrada.");
  routeFor(state, current.routeId, actor, true);
  const reason = String(input.reason || "").trim();
  if (!reason || reason.length > 500) throw new Error("Indicar motivo de no cobro (hasta 500 caracteres).");
  if (current.completedAt) return { state, visit: current, repeated: true };
  const next = clone(state), visit = next.collectionVisits.find(item => item.id === id);
  visit.status = current.payments.length ? "Parcial" : "No cobrada";
  visit.completedAt = new Date().toISOString();
  visit.history.push({ action: "NO_COBRADA", at: new Date().toISOString(), user: actor.username, reason });
  return { state: next, visit, repeated: false };
}
module.exports = { create, collect, assign, notCollected, summary };
