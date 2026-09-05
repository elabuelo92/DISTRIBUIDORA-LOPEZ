"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const engine = require("../order-engine");

function stateFixture() {
  return {
    products: [
      { codigo_producto: "P-ROJO", name: "Producto repetido", price: 1000, stock_fisico: 100, stock_actual: 100, stock_disponible: 100, activo: "SI" },
      { codigo_producto: "P-AZUL", name: "Producto repetido", price: 2000, stock_fisico: 100, stock_actual: 100, stock_disponible: 100, activo: "SI" },
      { codigo_producto: "P-OTRO", name: "Producto adicional", price: 500, stock_fisico: 100, stock_actual: 100, stock_disponible: 100, activo: "SI" }
    ],
    clients: [{ codigo_cliente: "C-1", name: "Cliente prueba" }],
    sellers: [], accounts: [], orders: [], activity: [], stockMovements: [], notifications: [], globalAudit: []
  };
}

const state = stateFixture();
const order = engine.createOrder(state, {
  code: "PED-V135",
  client: "Cliente prueba",
  seller: "Vendedor prueba",
  sellerUsername: "vendedor-prueba",
  items: [
    { productCode: "P-ROJO", qty: 2, unitPrice: 1000 },
    { productCode: "P-AZUL", qty: 3, unitPrice: 2000 },
    { productCode: "P-OTRO", qty: 1, unitPrice: 500 }
  ],
  commercialRequest: {
    type: "product_discount",
    productCode: "P-AZUL",
    productName: "Producto repetido",
    discountPct: 25,
    proposedValue: 25,
    motive: "Prueba de vinculacion exacta"
  }
}, "Vendedor prueba");

assert.equal(order.commercialApproval.targetLineKey, "code:p-azul");

engine.editOrder(state, order.code, {
  motive: "Reordenar lineas antes de aprobar",
  items: [
    { productCode: "P-OTRO", qty: 1, unitPrice: 500 },
    { productCode: "P-AZUL", qty: 3, unitPrice: 2000 },
    { productCode: "P-ROJO", qty: 2, unitPrice: 1000 }
  ]
}, { user: "Admin", username: "admin1", role: "admin" });

const result = engine.resolveCommercialApproval(state, order.code, {
  decision: "approve",
  motive: "Descuento autorizado"
}, { user: "Admin", username: "admin1", role: "admin" });

const red = result.order.items.find((item) => item.productCode === "P-ROJO");
const blue = result.order.items.find((item) => item.productCode === "P-AZUL");
const other = result.order.items.find((item) => item.productCode === "P-OTRO");
assert.equal(red.discountPct, 0, "un nombre repetido no debe recibir el descuento de otro codigo");
assert.equal(red.lineTotal, 2000);
assert.equal(blue.discountPct, 25);
assert.equal(blue.lineTotal, 4500);
assert.equal(other.discountPct, 0);
assert.equal(other.lineTotal, 500);
assert.equal(result.order.amount, 7000);
assert.equal(result.audit.changedLines.length, 1);
assert.equal(result.audit.changedLines[0].productCode, "P-AZUL");

const editedApproved = engine.editOrder(state, order.code, {
  motive: "Modificar cantidades luego de aprobar",
  items: [
    { productCode: "P-ROJO", qty: 1, unitPrice: 1000 },
    { productCode: "P-OTRO", qty: 2, unitPrice: 500 },
    { productCode: "P-AZUL", qty: 4, unitPrice: 2000 }
  ]
}, { user: "Admin", username: "admin1", role: "admin" }).order;
assert.equal(editedApproved.items.find((item) => item.productCode === "P-ROJO").discountPct, 0);
assert.equal(editedApproved.items.find((item) => item.productCode === "P-AZUL").discountPct, 25,
  "la edicion posterior conserva el descuento en el mismo codigo");
assert.equal(editedApproved.items.find((item) => item.productCode === "P-AZUL").lineTotal, 6000);

const removalState = stateFixture();
const pending = engine.createOrder(removalState, {
  code: "PED-V135-REMOVE",
  client: "Cliente prueba",
  seller: "Vendedor prueba",
  items: [{ productCode: "P-ROJO", qty: 1 }, { productCode: "P-AZUL", qty: 1 }],
  commercialRequest: {
    type: "price_change",
    productCode: "P-AZUL",
    productName: "Producto repetido",
    proposedValue: 1500,
    motive: "Precio especial"
  }
}, "Vendedor prueba");
assert.throws(() => engine.editOrder(removalState, pending.code, {
  motive: "Intento de quitar producto objetivo",
  items: [{ productCode: "P-ROJO", qty: 1 }]
}, { user: "Admin" }), /solicitud comercial pendiente/i);

const legacyState = stateFixture();
assert.throws(() => engine.createOrder(legacyState, {
  code: "PED-V135-LEGACY",
  client: "Cliente prueba",
  seller: "Vendedor prueba",
  items: [{ productCode: "P-ROJO", qty: 1 }, { productCode: "P-AZUL", qty: 1 }],
  commercialRequest: {
    type: "product_discount",
    productName: "Producto repetido",
    discountPct: 10,
    proposedValue: 10,
    motive: "Solicitud historica ambigua"
  }
}, "Vendedor prueba"), /mas de una linea/i, "un nombre historico ambiguo no debe aplicarse silenciosamente");
assert.equal(legacyState.products.reduce((sum, product) => sum + Number(product.stock_reservado || 0), 0), 0,
  "una solicitud rechazada no debe reservar stock parcialmente");

const foreignTargetState = stateFixture();
assert.throws(() => engine.createOrder(foreignTargetState, {
  code: "PED-V135-FOREIGN",
  client: "Cliente prueba",
  seller: "Vendedor prueba",
  items: [{ productCode: "P-ROJO", qty: 4 }],
  commercialRequest: {
    type: "product_discount",
    productCode: "P-OTRO",
    productName: "Producto adicional",
    discountPct: 20,
    proposedValue: 20,
    motive: "Producto ajeno al pedido"
  }
}, "Vendedor prueba"), /no pertenece al pedido/i);
assert.equal(foreignTargetState.products.find((product) => product.codigo_producto === "P-ROJO").stock_reservado || 0, 0,
  "un producto ajeno no debe dejar reservas al fallar");

const appSource = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");
assert.match(appSource, /const lines = summary\.lines;/, "el selector comercial debe limitarse al carrito");
assert.match(appSource, /\[\$\{request\.productCode\}\]/, "Administracion debe ver el codigo exacto al aprobar");

console.log(JSON.stringify({
  ok: true,
  prompt: 135,
  order: result.order.code,
  targetLineKey: result.order.commercialApproval.targetLineKey,
  changedProducts: result.audit.changedLines.map((item) => item.productCode),
  finalAmountAfterEdit: editedApproved.amount,
  duplicateNameProtected: true,
  pendingTargetRemovalProtected: true,
  ambiguousLegacyRequestRejected: true,
  rejectedRequestsLeaveStockUntouched: true,
  postApprovalEditPreservesBinding: true,
  cartOnlySelector: true,
  adminShowsProductCode: true
}, null, 2));
