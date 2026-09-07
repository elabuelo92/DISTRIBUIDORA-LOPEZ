"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const OrderEngine = require("../order-engine");
const AccountEngine = require("../account-engine");
const MaintenanceEngine = require("../maintenance-engine");

function order(code, seller, createdAt, status, qty) {
  return {
    code,
    client: `Cliente ${code}`,
    seller,
    createdAt,
    updatedAt: createdAt,
    status,
    amount: qty * 100,
    inventoryMode: "reservation",
    items: [{ productCode: "P-139", name: "Producto", requestedQty: qty, reservedQty: qty, missingQty: 0, unitPrice: 100, lineTotal: qty * 100 }],
    trace: []
  };
}

const state = {
  clients: [{ id: "C-139", name: "Cliente preservado", deuda_total: 0 }],
  suppliers: [{ id: "S-139", name: "Proveedor preservado" }],
  sellers: [{ name: "Axel" }, { name: "Ruggero" }],
  products: [{ codigo_producto: "P-139", name: "Producto", stock_fisico: 20, stock_actual: 20, stock: 20, stock_reservado: 2, stock_disponible: 18 }],
  orders: [order("PED-4000", "Axel", "2026-09-07T12:00:00.000Z", OrderEngine.STATUS.READY, 2)],
  archivedOrders: [
    order("PED-3999", "Axel", "2026-09-04T12:00:00.000Z", OrderEngine.STATUS.READY, 3),
    order("PED-3998", "Ruggero", "2026-09-05T12:00:00.000Z", OrderEngine.STATUS.READY_DISPATCH, 4),
    order("PED-3997", "Ruggero", "2026-09-04T13:00:00.000Z", OrderEngine.STATUS.DISPATCHED, 5),
    order("PED-3996", "Axel", "2026-08-20T12:00:00.000Z", OrderEngine.STATUS.READY, 2)
  ],
  deliveryRoutes: [],
  archivedDeliveryRoutes: [{ id: "RUTA-HISTORICA", stops: [{ orderCode: "PED-3997" }] }],
  commissionSettings: { rules: [] },
  bankReconciliation: [],
  accounts: [],
  activity: [],
  shortages: []
};

OrderEngine.migrateState(state);
AccountEngine.migrateState(state);
const masters = {
  clients: JSON.stringify(state.clients),
  suppliers: JSON.stringify(state.suppliers),
  physical: state.products[0].stock_fisico,
  archivedRoutes: JSON.stringify(state.archivedDeliveryRoutes)
};
const result = MaintenanceEngine.restoreOperationalOrders(state, {
  sellers: ["Axel", "Ruggero"],
  statuses: [OrderEngine.STATUS.READY, OrderEngine.STATUS.READY_DISPATCH],
  reservationStatuses: [OrderEngine.STATUS.PENDING, OrderEngine.STATUS.COMMERCIAL_APPROVAL, OrderEngine.STATUS.READY, OrderEngine.STATUS.ASSEMBLY, OrderEngine.STATUS.LABELED, OrderEngine.STATUS.READY_DISPATCH],
  dateFrom: "2026-09-04T03:00:00.000Z",
  expectedCount: 2
}, { motive: "Restauracion selectiva de prueba", user: "Superadmin" });
OrderEngine.migrateState(state);
AccountEngine.migrateState(state);

assert.equal(result.restored, 2);
assert.deepEqual(new Set(result.codes), new Set(["PED-3999", "PED-3998"]));
assert.equal(state.orders.length, 3);
assert.equal(state.archivedOrders.length, 2);
assert.equal(state.archivedOrders.some((item) => item.code === "PED-3997" && item.status === OrderEngine.STATUS.DISPATCHED), true);
assert.equal(state.archivedOrders.some((item) => item.code === "PED-3996"), true);
assert.equal(state.orders.find((item) => item.code === "PED-3998").status, OrderEngine.STATUS.READY_DISPATCH);
assert.equal(state.orders.find((item) => item.code === "PED-3999").status, OrderEngine.STATUS.READY);
assert.equal(state.orders.find((item) => item.code === "PED-3999").trace.at(-1).action, "PEDIDO_REACTIVADO_DESDE_HISTORICO");
assert.equal(new Set(state.orders.map((item) => item.code)).size, state.orders.length);
assert.equal(state.products[0].stock_fisico, masters.physical);
assert.equal(state.products[0].stock_reservado, 9);
assert.equal(JSON.stringify(state.clients), masters.clients);
assert.equal(JSON.stringify(state.suppliers), masters.suppliers);
assert.equal(JSON.stringify(state.archivedDeliveryRoutes), masters.archivedRoutes);

const insufficient = JSON.parse(JSON.stringify(state));
insufficient.products[0].stock_fisico = 9;
insufficient.products[0].stock_actual = 9;
insufficient.products[0].stock = 9;
insufficient.archivedOrders.push(order("PED-3995", "Axel", "2026-09-06T12:00:00.000Z", OrderEngine.STATUS.READY, 2));
const beforeFailure = JSON.stringify({ orders: insufficient.orders, archivedOrders: insufficient.archivedOrders });
assert.throws(() => MaintenanceEngine.restoreOperationalOrders(insufficient, {
  sellers: ["Axel"],
  statuses: [OrderEngine.STATUS.READY],
  reservationStatuses: [OrderEngine.STATUS.READY, OrderEngine.STATUS.READY_DISPATCH],
  dateFrom: "2026-09-06T03:00:00.000Z",
  expectedCount: 1
}, { motive: "Debe fallar por stock", user: "Superadmin" }), /Stock insuficiente/);
assert.equal(JSON.stringify({ orders: insufficient.orders, archivedOrders: insufficient.archivedOrders }), beforeFailure);

const app = fs.readFileSync("app.js", "utf8");
const html = fs.readFileSync("index.html", "utf8");
assert.match(html, /id="ordersRecordScope"[\s\S]{0,220}Historicos \(solo lectura\)/);
assert.match(app, /orderRecordScope === "historical"[\s\S]{0,220}archivedOrders/);
assert.match(app, /__archivedReadOnly[\s\S]{0,220}Solo lectura/);
assert.match(app, /openOrderTimeline\(code\)[\s\S]{0,220}archivedOrders/);

console.log(JSON.stringify({
  ok: true,
  version: "8790-139",
  restored: result.restored,
  activeOrders: state.orders.length,
  historicalOrders: state.archivedOrders.length,
  reserved: state.products[0].stock_reservado,
  stockGuard: true,
  routesPreserved: true,
  readOnlyHistory: true
}, null, 2));
