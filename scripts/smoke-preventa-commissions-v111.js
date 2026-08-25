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
  version: "8790-111",
  general: general.seller.total,
  cigarettes: cigarettes.seller.total,
  mixed: mixed.seller.total,
  discounted: discounted.seller.total,
  cancelled: cancelled.seller.total,
  returned: returned.seller.total,
  effectiveSeller: general.seller.user,
  stockBlockedWithoutPolicy: true,
  stockAllowedWithPolicy: true,
  historicalRuleSnapshot: general.seller.lines[0].ruleSnapshot
}, null, 2));
