"use strict";

const assert = require("node:assert/strict");
const Engine = require("../order-engine");

const state = {
  products: [{ codigo_producto: "P-138", name: "Producto oferta", price: 100, stock_fisico: 1000, stock_actual: 1000, stock_disponible: 1000, activo: "SI" }],
  clients: [{ codigo_cliente: "C-138", name: "Cliente oferta" }],
  sellers: [], accounts: [], orders: [], activity: [], stockMovements: [], notifications: [], globalAudit: []
};
const from = "2020-01-01";
const to = "2099-12-31";
const five = Engine.saveAuthorizedOffer(state, { productCode: "P-138", minimumQty: 10, discountPct: 5, validFrom: from, validTo: to }, { user: "Admin" });
Engine.saveAuthorizedOffer(state, { productCode: "P-138", minimumQty: 20, discountPct: 8, validFrom: from, validTo: to }, { user: "Admin" });
assert.throws(() => Engine.saveAuthorizedOffer(state, { productCode: "P-138", minimumQty: 10, discountPct: 4, validFrom: from, validTo: to }), /superpuesta/);
assert.throws(() => Engine.saveAuthorizedOffer(state, { productCode: "P-138", minimumQty: 10, discountPct: 5, specialUnitPrice: 90, validFrom: from }), /no ambos/);

function order(qty, code) {
  return Engine.createOrder(state, {
    code, client: "Cliente oferta", seller: "Vendedor",
    items: [{ productCode: "P-138", qty, unitPrice: 100 }]
  }, "Vendedor");
}

const nine = order(9, "PED-138-9");
const ten = order(10, "PED-138-10");
const twenty = order(20, "PED-138-20");
assert.equal(nine.amount, 900);
assert.equal(ten.amount, 950);
assert.equal(Engine.quoteOrder(state, { items: [{ productCode: "P-138", qty: 10, unitPrice: 100 }] }).amount, 950);
assert.equal(ten.items[0].authorizedOffer.id, five.id);
assert.equal(twenty.amount, 1840);
assert.equal(twenty.items[0].discountPct, 8);

let edited = order(10, "PED-138-EDIT");
edited = Engine.editOrder(state, edited.code, {
  motive: "Corregir cantidad",
  items: [{ productCode: "P-138", qty: 9, unitPrice: 100, discountPct: 5 }]
}, { user: "Admin", role: "admin" }).order;
assert.equal(edited.amount, 900, "No debe conservar oferta si baja del minimo.");
assert.equal(edited.items[0].authorizedOffer, null);
edited = Engine.editOrder(state, edited.code, {
  motive: "Ampliar cantidad",
  items: [{ productCode: "P-138", qty: 20, unitPrice: 100 }]
}, { user: "Admin", role: "admin" }).order;
assert.equal(edited.amount, 1840, "Al subir cantidad debe aplicar el nivel autorizado vigente.");
assert.equal(edited.items[0].discountPct, 8);

Engine.saveAuthorizedOffer(state, { ...five, discountPct: 6, active: true }, { user: "Admin" });
assert.equal(ten.amount, 950, "Las ventas guardadas no se recalculan al editar la oferta.");
assert.equal(order(10, "PED-138-NEW").amount, 940);
Engine.saveAuthorizedOffer(state, { ...five, discountPct: 6, active: false }, { user: "Admin" });
assert.equal(order(10, "PED-138-ENDED").amount, 1000);
assert.equal(state.commercialOfferAudit.length, 4);

console.log(JSON.stringify({ ok: true, tiers: [10, 20], historicalOrderPreserved: true, overlapRejected: true }));
