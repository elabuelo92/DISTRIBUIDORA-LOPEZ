"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const engine = require("../order-engine");

function product(code, name, rubro, price) {
  return {
    codigo_producto: code,
    name,
    rubro,
    stock_fisico: 100,
    stock_reservado: 0,
    stock_en_transito: 0,
    price
  };
}

function order(code, createdAt) {
  return {
    code,
    client: "Cliente prueba",
    seller: "Axel",
    sellerUsername: "david",
    createdAt,
    receivedAt: createdAt,
    updatedAt: createdAt,
    status: engine.STATUS.READY,
    inventoryMode: "reservation",
    items: [
      { productCode: "CIG-1", name: "Cigarrillos prueba", requestedQty: 2, reservedQty: 2, unitPrice: 1000, lineTotal: 2000 },
      { productCode: "MER-1", name: "Mercaderia prueba", requestedQty: 1, reservedQty: 1, unitPrice: 1000, lineTotal: 1000 }
    ]
  };
}

const state = {
  products: [
    product("CIG-1", "Cigarrillos prueba", "Cigarrillos", 1000),
    product("MER-1", "Mercaderia prueba", "Almacen", 1000)
  ],
  sellers: [{ name: "Axel" }],
  orders: [
    order("PED-HOY", "2026-08-14T15:00:00-03:00"),
    order("PED-ANTERIOR", "2026-08-13T15:00:00-03:00")
  ],
  commissionSettings: {
    accrual: { seller: "confirmado", driver: "entregado" },
    rules: [
      { id: "GEN-CIG", role: "seller", rubro: "Cigarrillos", percent: 1, active: true, priority: 40, startsAt: "2026-01-01T00:00:00.000Z" },
      { id: "GEN-RESTO", role: "seller", rubro: "*", percent: 3, active: true, isDefault: true, priority: 10, startsAt: "2026-01-01T00:00:00.000Z" },
      { id: "AXEL-CIG", role: "seller", username: "david", userLabel: "Axel", rubro: "Cigarrillos", percent: 2, active: true, priority: 100, startsAt: "2026-08-14T00:00:00-03:00" },
      { id: "AXEL-RESTO", role: "seller", username: "david", userLabel: "Axel", rubro: "*", percent: 5, active: true, priority: 90, startsAt: "2026-08-14T00:00:00-03:00" }
    ]
  }
};

engine.migrateState(state);
state.orders.forEach((item) => {
  item.commissions.seller.total = 30;
  item.commissions.seller.cigarettes = 20;
  item.commissions.seller.merchandise = 10;
  item.commissions.total = 30;
});
const oldBefore = JSON.stringify(state.orders.find((item) => item.code === "PED-ANTERIOR").commissions);
const result = engine.recalculateCommissions(state, {
  sellerNames: ["Axel"],
  usernames: ["david"],
  dateFrom: "2026-08-14T00:00:00-03:00",
  dateTo: "2026-08-14T23:59:59-03:00",
  motive: "Prueba automatizada v94"
}, { name: "Prueba", username: "admin1" });

const today = state.orders.find((item) => item.code === "PED-HOY");
assert.equal(result.count, 1);
assert.equal(result.previousTotal, 30);
assert.equal(today.commissions.seller.lines[0].percent, 2);
assert.equal(today.commissions.seller.lines[1].percent, 5);
assert.equal(today.commissions.seller.total, 90);
assert.equal(JSON.stringify(state.orders.find((item) => item.code === "PED-ANTERIOR").commissions), oldBefore);
assert.equal(state.commissionAudit[0].action, "COMISION_PEDIDO_RECALCULADA");

const appSource = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");
const resolverSource = appSource.match(/function resolveOrderEditProduct[\s\S]*?\n}/)?.[0] || "";
assert.match(resolverSource, /String\(product\.codigo_producto/);
assert.doesNotMatch(resolverSource, /state\.products\[0\]/);
assert.match(appSource, /changedProduct \? productPriceForListNumber\(product, assignedList\.number\)/);
assert.match(appSource, /function printSupplyPlanner\(\)/);
assert.match(appSource, /print-shortage-mark/);

console.log(JSON.stringify({ ok: true, result, sellerCommission: today.commissions.seller }, null, 2));
