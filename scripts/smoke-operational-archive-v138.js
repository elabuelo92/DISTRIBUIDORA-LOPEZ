"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const OrderEngine = require("../order-engine");
const MaintenanceEngine = require("../maintenance-engine");

const root = path.join(__dirname, "..");
const commission = (total, baseAmount) => ({
  basis: "stored",
  seller: { role: "seller", user: "Axel", accrual: "sale", baseAmount, cigarettes: 0, merchandise: total, total, lines: [] },
  driver: { role: "driver", user: "", accrual: "delivery", baseAmount: 0, cigarettes: 0, merchandise: 0, total: 0, lines: [] },
  cigarettes: 0,
  merchandise: total,
  total,
  calculatedAt: "2026-09-06T12:00:00-03:00"
});
const state = {
  clients: [{ codigo_cliente: "C-138", name: "Cliente conservado", referencia: "Porton verde" }],
  suppliers: [{ id: "S-138", name: "Proveedor conservado" }],
  sellers: [{ name: "Axel" }],
  commissionSettings: { rules: [{ id: "R-138", role: "seller", userName: "Axel", percent: 5, active: true }] },
  bankReconciliation: [{ id: "TR-138", orderCode: "PED-3000", amount: 500 }],
  products: [{ codigo_producto: "P-138", name: "Producto", stock_fisico: 10, stock_actual: 10, stock: 10, stock_reservado: 2, stock_disponible: 8 }],
  orders: [{
    code: "PED-3000", client: "Cliente conservado", seller: "Axel", amount: 200,
    status: OrderEngine.STATUS.PENDING, inventoryMode: "reservation", createdAt: "2026-09-06T12:00:00-03:00",
    items: [{ productCode: "P-138", name: "Producto", requestedQty: 2, reservedQty: 2, missingQty: 0, unitPrice: 100, lineTotal: 200 }],
    assembly: { orderNumber: 81, bultosConfirmed: 1, label: { generated: true, scanned: false } },
    trace: [], commissions: commission(10, 200)
  }],
  archivedOrders: [{
    code: "PED-2999", client: "Cliente conservado", seller: "Axel", amount: 100,
    status: OrderEngine.STATUS.DELIVERED, inventoryMode: "legacy-deducted", createdAt: "2026-09-05T12:00:00-03:00",
    items: [{ productCode: "P-138", name: "Producto", requestedQty: 1, unitPrice: 100, lineTotal: 100 }],
    assembly: { orderNumber: 80, bultosConfirmed: 1, label: { generated: true, scanned: true } },
    trace: [], commissions: commission(5, 100)
  }],
  deliveryRoutes: [{ id: "RUTA-138", stops: [{ orderCode: "PED-3000" }] }],
  archivedDeliveryRoutes: [],
  activity: [], notifications: [], accounts: [], shortages: []
};

OrderEngine.migrateState(state);
const preserved = {
  clients: JSON.stringify(state.clients),
  suppliers: JSON.stringify(state.suppliers),
  rules: JSON.stringify(state.commissionSettings.rules),
  bank: JSON.stringify(state.bankReconciliation),
  physical: state.products[0].stock_fisico
};
const result = MaintenanceEngine.archiveOperationalOrders(state, { motive: "Inicio de nueva etapa operativa", user: "Superadmin" });
OrderEngine.migrateState(state);

assert.equal(result.before.orders, 1);
assert.equal(result.before.routes, 1);
assert.equal(result.before.reserved, 2);
assert.equal(state.orders.length, 0);
assert.equal(state.deliveryRoutes.length, 0);
assert.deepEqual(new Set(state.archivedOrders.map((order) => order.code)), new Set(["PED-2999", "PED-3000"]));
assert.equal(state.archivedOrders.find((order) => order.code === "PED-3000").archiveReason, "Inicio de nueva etapa operativa");
assert.equal(state.products[0].stock_fisico, preserved.physical);
assert.equal(state.products[0].stock_reservado, 0);
assert.equal(state.products[0].stock_disponible, preserved.physical);
assert.equal(JSON.stringify(state.clients), preserved.clients);
assert.equal(JSON.stringify(state.suppliers), preserved.suppliers);
assert.equal(JSON.stringify(state.commissionSettings.rules), preserved.rules);
assert.equal(JSON.stringify(state.bankReconciliation), preserved.bank);
assert.equal(OrderEngine.nextOrderCode(state), "PED-3001");

const summary = OrderEngine.summarizeCommissions(state, { role: "seller", user: "Axel" });
assert.equal(summary.length, 1);
assert.equal(summary[0].orders, 2);
assert.equal(summary[0].total, 15);
const statement = OrderEngine.commissionAccountStatement(state, { seller: "Axel", dateFrom: "2026-09-01", dateTo: "2026-09-30" });
assert.equal(statement.orders.length, 2);
assert.equal(statement.balance, 15);

const app = fs.readFileSync(path.join(root, "app.js"), "utf8");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const server = fs.readFileSync(path.join(root, "server.js"), "utf8");
assert.match(html, /id="mobileNewClientReference"[\s\S]{0,120}required/);
assert.match(app, /const selected = state\.clients\.find\([\s\S]{0,100}\|\| null/);
assert.match(app, /mobileClient = ""/);
assert.match(app, /Scanner opcional/);
assert.doesNotMatch(app, /uploadDeliveryImage\(orderCode, "signature"/);
assert.match(app, /input\.type !== "number"[\s\S]{0,220}Number\(input\.value\) === 0/);
assert.match(server, /\[\.\.\.active, \.\.\.archived\]/);
assert.match(server, /maintenanceEngine\.archiveOperationalOrders/);

console.log(JSON.stringify({
  ok: true,
  version: "8790-138",
  activeOrders: state.orders.length,
  archivedOrders: state.archivedOrders.length,
  activeRoutes: state.deliveryRoutes.length,
  stockPhysical: state.products[0].stock_fisico,
  stockReserved: state.products[0].stock_reservado,
  commissionHistory: summary[0].total,
  nextOrderCode: OrderEngine.nextOrderCode(state),
  mastersPreserved: true
}, null, 2));
