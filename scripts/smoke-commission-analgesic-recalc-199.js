"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const recalc = require("../commission-analgesic-recalc");

const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
const appSource = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");
const deploySource = fs.readFileSync(path.join(__dirname, "deploy", "safe-production-deploy.py"), "utf8");
assert.ok(html.includes('id="recalculateAnalgesicCommissionsBtn"'));
assert.ok(html.includes('id="downloadAnalgesicCommissionReportBtn"'));
assert.ok(appSource.includes('byId("recalculateAnalgesicCommissionsBtn").addEventListener'));
assert.ok(appSource.includes('byId("downloadAnalgesicCommissionReportBtn").addEventListener'));
assert.ok(deploySource.includes('if allow_before_18 and version != "8790-199"'));
assert.ok(deploySource.includes("--allow-before-18"));

const sellers = recalc.OPERATION.sellers;
const products = [
  { codigo_producto: "A-1", name: "Ibuprofeno 400", rubro: "Analgesicos", stock_fisico: 20, stock_reservado: 7, stock_disponible: 13 },
  { codigo_producto: "C-1", name: "Cigarrillo prueba", rubro: "Cigarrillos", stock_fisico: 10, stock_reservado: 2, stock_disponible: 8 }
];
const rules = [];
sellers.forEach((seller, index) => {
  const username = seller.usernames[0];
  rules.push(
    { id: `A-${index}`, role: "seller", username, userLabel: seller.name, rubro: "Analgesicos", percent: 10, priority: 50, startsAt: recalc.OPERATION.dateFrom, active: true, status: "Activa" },
    { id: `C-${index}`, role: "seller", username, userLabel: seller.name, rubro: "Cigarrillos", percent: 1, priority: 50, startsAt: recalc.OPERATION.dateFrom, active: true, status: "Activa" },
    { id: `G-${index}`, role: "seller", username, userLabel: seller.name, rubro: "*", percent: 3, priority: 10, startsAt: recalc.OPERATION.dateFrom, active: true, status: "Activa" }
  );
});

function makeOrder(seller, code, overrides = {}) {
  const items = [
    { productCode: "A-1", name: "Ibuprofeno 400", requestedQty: 10, unitPrice: 100, lineTotal: 1000, rubro: "Analgesicos" },
    { productCode: "C-1", name: "Cigarrillo prueba", requestedQty: 2, unitPrice: 1000, lineTotal: 2000, rubro: "Cigarrillos" }
  ];
  return {
    code, seller: seller.name, sellerUsername: seller.usernames[0], createdAt: "2026-11-02T15:00:00.000Z",
    status: "Entregado", items,
    commissionPaidAmount: 0,
    commissions: {
      seller: { role: "seller", total: 50, lines: [
        { productCode: "A-1", productName: "Ibuprofeno 400", rubro: "Analgesicos", quantity: 10, baseAmount: 1000, percent: 3, commission: 30 },
        { productCode: "C-1", productName: "Cigarrillo prueba", rubro: "Cigarrillos", quantity: 2, baseAmount: 2000, percent: 1, commission: 20 }
      ] },
      driver: { role: "driver", total: 17, cigarettes: 7, merchandise: 10, lines: [{ productCode: "D-1", percent: 4, commission: 17 }] },
      total: 67, cigarettes: 27, merchandise: 40
    },
    ...overrides
  };
}

const orders = sellers.map((seller, index) => makeOrder(seller, `PED-T-${index + 1}`));
orders.push(makeOrder(sellers[0], "PED-LIQUIDADO", { commissionLiquidated: true }));
orders.push(makeOrder(sellers[1], "PED-CON-PAGO", { commissionPaidAmount: 25 }));
orders.push(makeOrder(sellers[2], "PED-ANTERIOR", { createdAt: "2026-10-31T15:00:00.000Z" }));
const state = {
  products,
  commissionSettings: { accrual: { seller: "pedido" }, rules },
  sellers: sellers.map(item => ({ name: item.name, sales: 999, commission: 888, orders: 7 })),
  orders,
  commissionSettlements: [{ id: "SET-1", seller: sellers[1].name, orders: ["PED-CON-PAGO"], allocations: [{ orderCode: "PED-CON-PAGO", amount: 25 }] }],
  clients: [{ id: "CLIENTE-1", balance: 1234 }],
  stockMovements: [{ id: "STOCK-1", quantity: 6 }],
  globalAudit: [{ id: "AUD-1" }]
};

const beforePreview = JSON.stringify(state);
const driverBefore = JSON.stringify(state.orders.find(order => order.code === "PED-T-1").commissions.driver);
const preview = recalc.preview(state, recalc.OPERATION.id);
assert.equal(JSON.stringify(state), beforePreview, "preview must not mutate production state");
assert.equal(preview.count, 4);
assert.equal(preview.protectedCount, 2);
assert.equal(preview.difference, 280);
assert.equal(preview.report.totals.regularizedLines, 4);
assert.equal(preview.report.totals.protectedLines, 2);
assert.equal(preview.report.sellers.find(item => item.seller === "Axel").commissionAmount, 130);
assert.equal(preview.report.sellers.find(item => item.seller === "Axel").protectedCommissionAmount, 30);

const input = { operationId: recalc.OPERATION.id, fingerprint: preview.fingerprint };
const outcome = recalc.execute(state, input, { name: "Administracion", username: "admin-test" });
assert.equal(outcome.count, 4);
assert.equal(outcome.alreadyExecuted, false);
assert.equal(state.orders.find(order => order.code === "PED-T-1").commissions.seller.lines[0].percent, 10);
assert.equal(state.orders.find(order => order.code === "PED-T-1").commissions.seller.lines[1].percent, 1);
assert.equal(JSON.stringify(state.orders.find(order => order.code === "PED-T-1").commissions.driver), driverBefore);
assert.equal(state.orders.find(order => order.code === "PED-LIQUIDADO").commissions.seller.lines[0].percent, 3);
assert.equal(state.orders.find(order => order.code === "PED-CON-PAGO").commissions.seller.lines[0].percent, 3);
assert.equal(state.orders.find(order => order.code === "PED-ANTERIOR").commissions.seller.lines[0].percent, 3);
assert.equal(state.commissionSettlements[0].allocations[0].amount, 25);
assert.equal(state.products[0].stock_fisico, 20);
assert.equal(state.products[0].stock_reservado, 7);
assert.equal(state.clients[0].balance, 1234);
assert.deepEqual(state.stockMovements, [{ id: "STOCK-1", quantity: 6 }]);
assert.deepEqual(state.globalAudit, [{ id: "AUD-1" }]);
assert.ok(state.commissionAudit.some(entry => entry.operationId === recalc.OPERATION.id && entry.action === "COMISION_RECALCULO_OPERACION"));
const afterFirst = JSON.stringify(state);
const duplicate = recalc.execute(state, input, { name: "Administracion", username: "admin-test" });
assert.equal(duplicate.alreadyExecuted, true);
assert.equal(JSON.stringify(state), afterFirst, "a retry must not mutate state twice");

const staleState = {
  products: products.map(item => ({ ...item })),
  commissionSettings: { rules: rules.map(item => ({ ...item })) },
  sellers: sellers.map(item => ({ ...item })),
  orders: [makeOrder(sellers[0], "PED-STALE")], commissionAudit: [], commissionSettlements: []
};
const stalePreview = recalc.preview(staleState, recalc.OPERATION.id);
staleState.orders[0].items[0].unitPrice = 101;
assert.throws(() => recalc.execute(staleState, { operationId: recalc.OPERATION.id, fingerprint: stalePreview.fingerprint }), /cambiaron desde la vista previa/);

console.log("PASS 8790-199: preview non-mutating, date/seller scope, seller-only recalculation, protected settlements, stock/account unchanged, audit and idempotent retry.");
