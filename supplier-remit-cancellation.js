"use strict";
const crypto = require("node:crypto");
const Order = require("./order-engine");
const clone = value => JSON.parse(JSON.stringify(value));
const digest = value => crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex");
const round = value => Math.round(value * 100) / 100;
function number(value) {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0 || !Number.isSafeInteger(Math.round(value * 100))) throw new Error("Importe o cantidad historica invalida.");
  return value;
}
function get(state, id) {
  const matches = (state.supplierMovements || []).filter(m => m.id === id && m.type === "Remito");
  if (matches.length !== 1) throw new Error("Remito no encontrado o duplicado.");
  return matches[0];
}
function preview(state, id, input, actor) {
  if (actor?.role !== "admin") throw new Error("La anulacion requiere Administracion.");
  const remit = get(state, id);
  if (remit.cancellation) throw new Error("El remito ya esta anulado.");
  const reason = String(input.reason || "").trim();
  if (reason.length < 5 || reason.length > 1000) throw new Error("Indicar motivo de entre 5 y 1000 caracteres.");
  const suppliers = (state.suppliers || []).filter(s => s.name === remit.supplier);
  if (suppliers.length !== 1) throw new Error("Proveedor no encontrado o ambiguo.");
  const supplier = suppliers[0];
  if (typeof remit.stockApplied !== "boolean" || typeof remit.economicValidated !== "boolean" || remit.stockApplied !== remit.economicValidated) throw new Error("Remito historico sin estado consistente; requiere revision manual.");
  const amount = remit.economicValidated ? number(remit.amount) : 0;
  const balance = number(supplier.balance), purchased = number(supplier.totalPurchased || 0);
  if (amount > balance || amount > purchased) throw new Error("La anulacion generaria saldo a favor o compras negativas. Revisar pagos y conciliacion.");
  const quantities = new Map();
  if (remit.stockApplied) {
    if (!remit.products?.length) throw new Error("No hay detalle de stock aplicado.");
    for (const line of remit.products) {
      if (!line.productCode || !(number(line.stockAppliedQty) > 0)) throw new Error("Linea sin codigo exacto o cantidad aplicada.");
      quantities.set(String(line.productCode), (quantities.get(String(line.productCode)) || 0) + line.stockAppliedQty);
    }
  }
  const lines = [];
  for (const [code, qty] of quantities) {
    const matches = (state.products || []).filter(p => String(p.codigo_producto || p.code || "") === code);
    if (matches.length !== 1) throw new Error(`Producto ${code} no encontrado o ambiguo.`);
    const product = matches[0];
    const physical = number(product.stock_fisico ?? product.stock_actual ?? product.stock);
    const reserved = number(product.stock_reservado || 0);
    if (physical - qty < reserved) throw new Error(`Stock insuficiente o reservado para ${code}. No se modificaron pedidos ni reservas.`);
    const movements = (state.stockMovements || []).filter(m => m.productCode === code && m.supplier === remit.supplier && m.remitNumber === remit.remitNumber && m.type === "INGRESO POR REMITO DE PROVEEDOR");
    if (round(movements.reduce((sum, m) => sum + number(m.qty), 0)) !== round(qty)) throw new Error(`No coincide la trazabilidad del ingreso ${code}.`);
    lines.push({ code, name: product.name || product.descripcion, qty, before: physical, after: physical - qty, reserved, product, movements });
  }
  const economic = (state.accounts || []).filter(a => a.remitId === id && a.type === "Remito proveedor validado");
  if (round(economic.reduce((sum, a) => sum + number(a.debit), 0)) !== round(amount)) throw new Error("No coincide el movimiento economico original.");
  const impact = { amount, balanceBefore: balance, balanceAfter: round(balance - amount), purchasedAfter: round(purchased - amount),
    lines: lines.map(({ product, movements, ...line }) => line), stockApplied: remit.stockApplied };
  return { remit, supplier, reason, impact, token: digest({ remit, supplier, lines, economic, reason }) };
}
function cancel(state, id, input, actor) {
  if (actor?.role !== "admin") throw new Error("La anulacion requiere Administracion.");
  if (!/^[a-zA-Z0-9-]{10,100}$/.test(String(input.requestId || ""))) throw new Error("Identificador de operacion invalido.");
  const original = get(state, id);
  const existing = (state.supplierMovements || []).find(m => m.cancellation?.requestId === input.requestId);
  if (existing) {
    if (existing.id !== id || existing.cancellation.reason !== String(input.reason || "").trim()) throw new Error("Identificador reutilizado con otros datos.");
    return { state, remit: existing, repeated: true };
  }
  const p = preview(state, id, input, actor);
  if (input.token !== p.token) throw new Error("Los datos cambiaron. Volver a previsualizar.");
  const next = clone(state), remit = get(next, id), supplier = next.suppliers.find(s => s.name === remit.supplier);
  const at = new Date().toISOString();
  const cancellation = { requestId: input.requestId, at, user: actor.user || actor.username, username: actor.username, reason: p.reason, impact: p.impact,
    originalHash: digest(original) };
  next.stockMovements = next.stockMovements || [];
  for (const line of p.impact.lines) {
    const product = next.products.find(p => String(p.codigo_producto || p.code) === line.code);
    product.stock_fisico = line.after;
    Order.refreshProductInventory(product);
    next.stockMovements.unshift({ id: `ANU-${id}-${line.code}`, at, type: "Anulacion de remito proveedor", productCode: line.code, productName: line.name,
      qty: -line.qty, stockBefore: line.before, stockAfter: line.after, supplier: supplier.name, remitId: id, remitNumber: remit.remitNumber,
      cancellationId: input.requestId, user: cancellation.user, reason: p.reason });
  }
  if (p.impact.amount > 0) {
    supplier.balance = supplier.saldo_pendiente = p.impact.balanceAfter;
    supplier.totalPurchased = supplier.total_comprado = p.impact.purchasedAfter;
    supplier.status = supplier.balance > 0 ? "A pagar" : "Al dia";
    next.accounts = next.accounts || [];
    const localDate = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Argentina/Buenos_Aires", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(at));
    next.accounts.unshift({ id: `ANU-${id}`, createdAt: at, date: localDate, type: "Anulacion remito proveedor", account: supplier.name,
      method: "Cuenta proveedor", debit: 0, credit: p.impact.amount, balance: supplier.balance, remitId: id, remitNumber: remit.remitNumber,
      cancellationId: input.requestId, user: cancellation.user, observations: p.reason });
  }
  // Keep the source, attachments, prices and original applied quantities; append cancellation metadata.
  remit.cancellation = cancellation;
  supplier.movements = (supplier.movements || []).map(m => m.id === id ? { ...m, cancellation } : m);
  return { state: next, remit, repeated: false };
}
module.exports = { get, preview, cancel };
