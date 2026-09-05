"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const engine = require("../order-engine");

const state = {
  products: [
    { codigo_producto: "P-1", name: "Producto uno", rubro: "General", price: 100, stock_fisico: 100, stock_disponible: 100, activo: "SI" },
    { codigo_producto: "P-2", name: "Producto dos", rubro: "General", price: 200, stock_fisico: 100, stock_disponible: 100, activo: "SI" }
  ],
  clients: [{ codigo_cliente: "C-1", name: "Cliente prueba" }],
  sellers: [{ name: "Axel", username: "david", active: true }],
  orders: [], accounts: [], activity: [], stockMovements: [], notifications: [], globalAudit: [], commissionSettlements: []
};
engine.migrateState(state);
state.commissionSettings.rules = [{
  id: "AXEL-GENERAL", role: "seller", username: "david", userLabel: "Axel", rubro: "*", percent: 10,
  startsAt: "2026-01-01T00:00:00.000Z", status: "Activa", active: true, priority: 50
}];

const first = engine.createOrder(state, {
  code: "PED-COM-1", client: "Cliente prueba", seller: "Axel", sellerUsername: "david",
  items: [{ productCode: "P-1", qty: 10, unitPrice: 100 }]
}, "Axel");
first.createdAt = "2026-09-01T13:00:00.000Z";
const second = engine.createOrder(state, {
  code: "PED-COM-2", client: "Cliente prueba", seller: "Axel", sellerUsername: "david",
  items: [{ productCode: "P-2", qty: 10, unitPrice: 200 }]
}, "Axel");
second.createdAt = "2026-09-02T13:00:00.000Z";

assert.equal(first.commissions.seller.lines[0].quantity, 10, "la linea guarda la cantidad vendida real");
assert.equal(second.commissions.seller.lines[0].unitPrice, 200, "la linea guarda el precio historico");

let statement = engine.commissionAccountStatement(state, { seller: "Axel", dateFrom: "2026-09-01", dateTo: "2026-09-30" });
assert.equal(statement.accrued, 300);
assert.equal(statement.paid, 0);
assert.equal(statement.balance, 300);

const partial = engine.registerCommissionPayment(state, {
  seller: "Axel", dateFrom: "2026-09-01", dateTo: "2026-09-30", amount: 150,
  method: "Transferencia", reference: "TRX-134", motive: "Pago parcial semanal"
}, { name: "Admin", username: "admin1" });
assert.equal(partial.settlement.allocations.length, 2);
assert.equal(partial.settlement.allocations[0].amount, 100);
assert.equal(partial.settlement.allocations[1].amount, 50);
assert.equal(state.orders.find((order) => order.code === "PED-COM-1").commissionLiquidated, true);
assert.equal(state.orders.find((order) => order.code === "PED-COM-2").commissionLiquidated, false);
assert.equal(state.orders.find((order) => order.code === "PED-COM-2").commissionPaidAmount, 50);
assert.equal(partial.statement.balance, 150);

const settlementsBeforeOverpay = state.commissionSettlements.length;
assert.throws(() => engine.registerCommissionPayment(state, {
  seller: "Axel", dateFrom: "2026-09-01", dateTo: "2026-09-30", amount: 151,
  method: "Efectivo", motive: "Pago superior"
}, { name: "Admin" }), /superar el saldo/i);
assert.equal(state.commissionSettlements.length, settlementsBeforeOverpay);

const finalPayment = engine.registerCommissionPayment(state, {
  seller: "Axel", dateFrom: "2026-09-01", dateTo: "2026-09-30", amount: 150,
  method: "Efectivo", reference: "REC-134", motive: "Cancelacion del saldo"
}, { name: "Admin", username: "admin1" });
assert.equal(finalPayment.statement.balance, 0);
assert.equal(finalPayment.statement.paid, 300);
assert.equal(state.orders.find((order) => order.code === "PED-COM-2").commissionLiquidated, true);
assert.equal(state.commissionAudit.filter((entry) => entry.action === "COMISION_PAGO_REGISTRADO").length, 2);

const appSource = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");
const serverSource = fs.readFileSync(path.join(__dirname, "..", "server.js"), "utf8");
assert.match(appSource, /line\.quantity \?\? item\.requestedQty/, "el informe prioriza la cantidad real");
assert.match(appSource, /<tfoot><tr><td>TOTAL/, "el PDF muestra total visible");
assert.match(appSource, /class="num"/, "el PDF alinea importes y porcentajes");
assert.match(serverSource, /orderEngine\.registerCommissionPayment/, "el backend calcula y aplica el pago");

console.log(JSON.stringify({
  ok: true,
  prompt: 134,
  accrued: finalPayment.statement.accrued,
  paid: finalPayment.statement.paid,
  balance: finalPayment.statement.balance,
  partialPayment: partial.settlement.amount,
  firstOrderSettled: state.orders.find((order) => order.code === "PED-COM-1").commissionLiquidated,
  secondOrderSettledAfterFinalPayment: state.orders.find((order) => order.code === "PED-COM-2").commissionLiquidated,
  overpaymentBlocked: true,
  quantitySnapshot: first.commissions.seller.lines[0].quantity,
  paymentAuditEntries: state.commissionAudit.filter((entry) => entry.action === "COMISION_PAGO_REGISTRADO").length
}, null, 2));
