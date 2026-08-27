"use strict";

const assert = require("node:assert/strict");
const engine = require("../order-engine");

function product(code, name, rubro, stock = 100) {
  return {
    codigo_producto: code,
    name,
    descripcion: name,
    rubro,
    stock_fisico: stock,
    stock_actual: stock,
    stock_reservado: 0,
    stock_disponible: stock,
    precio_lista_2: 100,
    price: 100,
    activo: "SI"
  };
}

function commissionState() {
  const state = {
    products: [
      product("GEN-1", "Producto general", "Mercaderia general"),
      product("CIG-1", "Cigarrillo prueba", "Cigarrillos")
    ],
    orders: [],
    sellers: [],
    accounts: [],
    activity: [],
    stockMovements: [],
    salesPolicy: { allowPreorderWithoutStock: false }
  };
  engine.migrateState(state);
  engine.saveCommissionRule(state, {
    role: "seller",
    userLabel: "Vendedor cobertura",
    rubro: "Mercaderia general",
    percent: 5,
    priority: 90,
    startsAt: "2026-01-01T00:00:00.000Z",
    status: "Activa",
    motive: "Prueba vendedor general"
  }, { name: "Admin", username: "admin" });
  engine.saveCommissionRule(state, {
    role: "seller",
    userLabel: "Vendedor cobertura",
    rubro: "Cigarrillos",
    percent: 2,
    priority: 90,
    startsAt: "2026-01-01T00:00:00.000Z",
    status: "Activa",
    motive: "Prueba vendedor cigarrillos"
  }, { name: "Admin", username: "admin" });
  return state;
}

function order(items, extra = {}) {
  return {
    code: extra.code || "PED-TEST",
    seller: "Vendedor cobertura",
    sellerUsername: "cobertura",
    portfolioOwner: "Otro vendedor",
    status: extra.status || engine.STATUS.READY,
    createdAt: "2026-08-25T12:00:00.000Z",
    items,
    ...extra
  };
}

function line(code, name, qty, unitPrice, extra = {}) {
  return {
    productCode: code,
    name,
    requestedQty: qty,
    unitPrice,
    lineTotal: qty * unitPrice,
    ...extra
  };
}

const state = commissionState();
const general = engine.calculateOrderCommissions(state, order([line("GEN-1", "Producto general", 10, 100)]));
assert.equal(general.seller.total, 50, "venta general al 5%");
assert.equal(general.seller.user, "Vendedor cobertura", "la comision pertenece al vendedor efectivo");
assert.equal(general.seller.lines[0].ruleSnapshot.percent, 5, "guarda snapshot historico de la regla");

const cigarettes = engine.calculateOrderCommissions(state, order([line("CIG-1", "Cigarrillo prueba", 10, 100)]));
assert.equal(cigarettes.seller.total, 20, "cigarrillos al 2%");

const mixed = engine.calculateOrderCommissions(state, order([
  line("GEN-1", "Producto general", 10, 100),
  line("CIG-1", "Cigarrillo prueba", 10, 100)
]));
assert.equal(mixed.seller.total, 70, "venta mixta por linea sin doble aplicacion");
assert.equal(mixed.seller.merchandise, 50);
assert.equal(mixed.seller.cigarettes, 20);

const discounted = engine.calculateOrderCommissions(state, order([
  line("GEN-1", "Producto general", 10, 100, { discountPct: 10, discountAmount: 100, lineTotal: 900 })
]));
assert.equal(discounted.seller.baseAmount, 900, "base neta con descuento");
assert.equal(discounted.seller.total, 45);

const fullyDiscounted = engine.calculateOrderCommissions(state, order([
  line("GEN-1", "Producto general", 10, 100, { discountPct: 100, discountAmount: 1000, lineTotal: 0 })
]));
assert.equal(fullyDiscounted.seller.baseAmount, 0, "descuento total conserva base cero");
assert.equal(fullyDiscounted.seller.total, 0, "descuento total no genera comision");

const approvalState = commissionState();
const approvedOrder = engine.createOrder(approvalState, {
  code: "PED-APPROVAL-100",
  client: "Cliente prueba",
  seller: "Vendedor cobertura",
  sellerUsername: "cobertura",
  paymentMethod: "Contado",
  items: [{ productCode: "GEN-1", qty: 2, unitPrice: 100 }],
  commercialRequest: {
    type: "general_discount",
    productCode: "GEN-1",
    productName: "Producto general",
    proposedValue: 100,
    discountPct: 100,
    motive: "Mercaderia abonada previamente"
  }
}, "Vendedor cobertura");
const approvalResult = engine.resolveCommercialApproval(approvalState, approvedOrder.code, {
  decision: "approve",
  motive: "Autorizado para prueba"
}, { user: "Admin", username: "admin", role: "admin" });
assert.equal(approvalResult.order.amount, 0, "la aprobacion aplica el descuento total");
assert.equal(approvalResult.order.items[0].lineTotal, 0, "la linea aprobada queda en cero");
assert.equal(approvalResult.order.commissions.seller.total, 0, "la aprobacion recalcula la comision");
engine.migrateState(approvalState);
const migratedApprovedOrder = approvalState.orders.find((item) => item.code === approvedOrder.code);
assert.equal(migratedApprovedOrder.amount, 0, "la normalizacion conserva el total aprobado en cero");
assert.equal(migratedApprovedOrder.items[0].discountPct, 100, "la normalizacion conserva el descuento aprobado");
assert.equal(migratedApprovedOrder.items[0].lineTotal, 0, "la normalizacion no restaura el importe bruto");
assert.equal(migratedApprovedOrder.commissions.seller.total, 0, "la normalizacion conserva la comision en cero");

migratedApprovedOrder.items.forEach((item) => {
  delete item.discountPct;
  delete item.discountAmount;
  item.lineTotal = item.requestedQty * item.unitPrice;
});
migratedApprovedOrder.amount = 200;
migratedApprovedOrder.commissions = engine.calculateOrderCommissions(approvalState, migratedApprovedOrder);
engine.migrateState(approvalState);
const repairedHistoricalOrder = approvalState.orders.find((item) => item.code === approvedOrder.code);
assert.equal(repairedHistoricalOrder.amount, 0, "repara un pedido historico aprobado que recupero el bruto");
assert.equal(repairedHistoricalOrder.items[0].discountPct, 100, "recupera el descuento aprobado desde la solicitud auditada");
assert.equal(repairedHistoricalOrder.commissions.seller.total, 0, "repara la comision historica inconsistente");

const cancelled = engine.calculateOrderCommissions(state, order([
  line("GEN-1", "Producto general", 10, 100)
], { status: engine.STATUS.CANCELLED }));
assert.equal(cancelled.seller.total, 0, "anulacion revierte comision");

const returned = engine.calculateOrderCommissions(state, order([
  line("GEN-1", "Producto general", 10, 100, { returnedQty: 2 })
]));
assert.equal(returned.seller.baseAmount, 800, "devolucion descuenta base proporcional");
assert.equal(returned.seller.total, 40);

const stockState = commissionState();
stockState.products[0].stock_fisico = 0;
stockState.products[0].stock_actual = 0;
stockState.products[0].stock_disponible = 0;
engine.migrateState(stockState);
const quote = engine.quoteOrder(stockState, { items: [{ productCode: "GEN-1", qty: 1, unitPrice: 100 }] });
assert.throws(() => engine.assertPreventaStockPolicy(stockState, quote.items), (error) => error.code === "OUT_OF_STOCK_BLOCKED");
stockState.salesPolicy.allowPreorderWithoutStock = true;
assert.deepEqual(engine.assertPreventaStockPolicy(stockState, quote.items), []);

console.log(JSON.stringify({
  ok: true,
  version: "8790-113",
  general: general.seller.total,
  cigarettes: cigarettes.seller.total,
  mixed: mixed.seller.total,
  discounted: discounted.seller.total,
  fullyDiscounted: fullyDiscounted.seller.total,
  approvedDiscount: repairedHistoricalOrder.amount,
  cancelled: cancelled.seller.total,
  returned: returned.seller.total,
  effectiveSeller: general.seller.user,
  stockBlockedWithoutPolicy: true,
  stockAllowedWithPolicy: true,
  historicalRuleSnapshot: general.seller.lines[0].ruleSnapshot
}, null, 2));
