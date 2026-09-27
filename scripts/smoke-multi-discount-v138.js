"use strict";

const assert = require("node:assert/strict");
const Engine = require("../order-engine");

function fixture() {
  return {
    products: ["ROJO", "AZUL", "VERDE"].map((color) => ({
      codigo_producto: `P-${color}`, name: `Producto ${color}`, price: 1000,
      stock_fisico: 100, stock_actual: 100, stock_disponible: 100, activo: "SI"
    })),
    clients: [{ codigo_cliente: "C-1", name: "Cliente" }],
    sellers: [], accounts: [], orders: [], activity: [], stockMovements: [], notifications: [], globalAudit: []
  };
}

const state = fixture();
const order = Engine.createOrder(state, {
  code: "PED-MULTI-138", client: "Cliente", seller: "Vendedor",
  items: ["ROJO", "AZUL", "VERDE"].map((color) => ({ productCode: `P-${color}`, qty: 2 })),
  commercialRequest: {
    type: "multi_product_discount", productCodes: ["P-ROJO", "P-VERDE"],
    discountPct: 10, proposedValue: 10, motive: "Dos productos seleccionados"
  }
}, "Vendedor");
assert.equal(order.commercialApproval.targetLineIds.length, 2);
assert.equal(new Set(order.items.map((item) => item.lineId)).size, 3);
assert.equal(order.amount, 6000);
assert.throws(() => Engine.editOrder(state, order.code, {
  motive: "Quitar objetivo", items: [{ productCode: "P-ROJO", qty: 2 }, { productCode: "P-AZUL", qty: 2 }]
}, { user: "Admin", role: "admin" }), /solicitud comercial pendiente/);

Engine.editOrder(state, order.code, {
  motive: "Reordenar", items: ["VERDE", "AZUL", "ROJO"].map((color) => ({ productCode: `P-${color}`, qty: 2 }))
}, { user: "Admin", role: "admin" });
const result = Engine.resolveCommercialApproval(state, order.code, {
  decision: "approve", motive: "Autorizado"
}, { user: "Admin", role: "admin" });
assert.equal(result.order.items.find((item) => item.productCode === "P-AZUL").discountPct, 0);
assert.equal(result.order.items.find((item) => item.productCode === "P-ROJO").discountPct, 10);
assert.equal(result.order.items.find((item) => item.productCode === "P-VERDE").discountPct, 10);
assert.equal(result.order.amount, 5600);
assert.equal(result.audit.changedLines.length, 2);

const rejectState = fixture();
const reject = Engine.createOrder(rejectState, {
  code: "PED-REJECT-138", client: "Cliente", seller: "Vendedor",
  items: ["ROJO", "AZUL"].map((color) => ({ productCode: `P-${color}`, qty: 1 })),
  commercialRequest: {
    type: "multi_product_discount", productCodes: ["P-ROJO", "P-AZUL"],
    discountPct: 20, proposedValue: 20, motive: "Solicitud"
  }
}, "Vendedor");
Engine.resolveCommercialApproval(rejectState, reject.code, { decision: "reject", motive: "No autorizado" }, { user: "Admin" });
assert.equal(reject.amount, 2000);
assert.equal(reject.items.every((item) => item.discountPct === 0), true);

console.log(JSON.stringify({ ok: true, targetLineIds: 2, authorizedAmount: 5600, rejectedAmount: 2000 }));
