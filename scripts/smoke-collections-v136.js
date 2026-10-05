"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const Delivery = require("../delivery-engine");
const Order = require("../order-engine");
const Account = require("../account-engine");

function fixture(count = 3) {
  const clients = Array.from({ length: count }, (_, index) => ({
    codigo_cliente: `TEST-${index + 1}`,
    name: `Cliente ${index + 1}`,
    status: "Activo",
    balance: 0,
    saldo_a_favor: 0,
    domicilio: `Calle ${index + 1}`,
    latitud: -31.4,
    longitud: -64.2
  }));
  const orders = clients.map((client, index) => ({
    code: `PED-136-${index + 1}`,
    client: client.name,
    clientId: client.codigo_cliente,
    seller: "Prueba",
    amount: 1000,
    status: Order.STATUS.READY_DISPATCH,
    inventoryMode: "direct",
    items: [{ productCode: `P-${index + 1}`, name: "Producto", requestedQty: 1, unitPrice: 1000, lineTotal: 1000 }],
    assembly: { orderNumber: index + 1, bultosConfirmed: 1, label: { generated: true, scanned: false, scannerOptional: true } },
    trace: [],
    createdAt: new Date().toISOString()
  }));
  const state = {
    clients, orders, products: [], sellers: [], activity: [], accounts: [], deliveryRoutes: [],
    deliveryAudit: [], deliveryClosures: [], stockMovements: [], shortages: [], notifications: []
  };
  const driver = {
    user: "Repartidor", username: "reparto1", role: "driver", deviceId: "DEVICE-1",
    deviceLabel: "Repartidor", gps: { lat: -31.4, lng: -64.2, accuracy: 10 }
  };
  const route = Delivery.createPlannedRoute(state, {
    orderCodes: orders.map((order) => order.code), day: "2026-09-27", zone: "Centro",
    driverUser: "reparto1", driverLabel: "Repartidor"
  }, driver);
  Delivery.publishRoute(state, route.id, driver);
  Delivery.claimRoute(state, route.id, driver);
  return { state, route, driver };
}

function collect(data, index, split, transferReceipt) {
  const order = data.state.orders[index];
  return Delivery.collectAndDeliver(data.state, order.code, {
    method: "Mixto",
    paymentSplit: split,
    deliveredItems: [{ productCode: order.items[0].productCode, deliveredQty: 1, returnedQty: 0 }],
    transferReceipt
  }, data.driver);
}

const data = fixture();
Delivery.updateSettings(data.state, {
  ...data.state.deliverySettings,
  bankAccounts: [{ bank: "Banco de Cordoba", alias: "prueba.cuenta", cbu: "000123" }]
}, { user: "Administracion", role: "admin" });
assert.equal(data.state.deliverySettings.bankAccounts[0].alias, "prueba.cuenta");
assert.throws(() => Delivery.updateSettings(data.state, {
  ...data.state.deliverySettings,
  bankAccounts: [{ bank: "Banco de Cordoba", alias: "prueba.cuenta" }, { bank: "Banco de Cordoba", alias: "prueba.cuenta" }]
}, { user: "Administracion", role: "admin" }), /duplicadas/);
const proof = { attachment: { url: "/test/receipt.png", filename: "receipt.png" } };
const mixed = collect(data, 0, { cashAmount: 400, transferAmount: 300, creditAmount: 300 }, proof);
assert.equal(mixed.order.collection.pendingAmount, 600);
assert.equal(data.state.clients[0].balance, 600);
assert.equal(mixed.order.collection.transferReceipt.bank, "Mercado Pago");
assert.equal(data.route.transferTotal, 300);
assert.equal(Account.accountSummary(data.state, data.state.clients[0]).customerCredit, 0);
Account.validateTransfer(data.state, mixed.order.collection.transferReceipt.id, {
  bank: "Mercado Pago", operationNumber: "TEST-136"
}, { user: "Administracion", role: "admin" });
assert.equal(data.state.clients[0].balance, 300);

const overpaid = collect(data, 1, { cashAmount: 1100, transferAmount: 0, creditAmount: 0 });
assert.equal(overpaid.order.collection.customerCreditAmount, 100);
assert.equal(overpaid.order.collection.amountPaid, 1000);
assert.equal(data.state.clients[1].saldo_a_favor, 100);
assert.equal(data.state.clients[1].balance, 0);
assert.equal(Account.accountSummary(data.state, data.state.clients[1]).customerCredit, 100);
assert.equal(Account.accountStatement(data.state, "client", data.state.clients[1].name).summary.customerCredit, 100);
assert.ok(data.state.accounts.some((entry) => entry.type === "Saldo a favor del cliente" && entry.credit === 100));

const short = collect(data, 2, { cashAmount: 500, transferAmount: 0, creditAmount: 500 });
assert.equal(short.order.collection.creditAmount, 500);
assert.equal(data.state.clients[2].balance, 500);
assert.throws(() => Delivery.closeRoute(data.state, data.route.id, {
  reportedCash: 3201, reportedTransfer: 300,
  differenceReason: "Diferencia de caja", observations: "Conteo verificado"
}, data.driver), /Administracion/);
assert.equal(data.route.closure, null);

const admin = { ...data.driver, user: "Administracion", role: "admin" };
const closed = Delivery.closeRoute(data.state, data.route.id, {
  reportedCash: 3201, reportedTransfer: 300,
  differenceReason: "Diferencia de caja", observations: "Conteo verificado"
}, admin);
assert.equal(closed.closure.approvedBy, "Administracion");
assert.equal(closed.closure.cashDifference, 1201);

const tolerance = fixture(1);
collect(tolerance, 0, { cashAmount: 1000, transferAmount: 0, creditAmount: 0 });
const normalClose = Delivery.closeRoute(tolerance.state, tolerance.route.id, {
  reportedCash: 0, reportedTransfer: 0,
  differenceReason: "Diferencia de caja", observations: "Faltante contado"
}, tolerance.driver);
assert.equal(normalClose.closure.cashDifference, -1000);
assert.equal(normalClose.closure.approvedBy, "");

const app = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");
const partial = fixture(1);
partial.state.clients[0].balance = 92993;
partial.state.clients[0].saldo_actual = 92993;
partial.state.clients[0].saldo_inicial = 92993;
const partialInput = { entityId: partial.state.clients[0].codigo_cliente, amount: 87230, requestId: "CC-TRF-test-partial-0001", reference: "OP-123", attachment: { url: "/test-proof.pdf", filename: "test-proof.pdf" } };
const pendingPayment = Account.registerClientTransferRequest(partial.state, partialInput, admin);
partial.state.suppliers = [{ name: "Tabacalera prueba", balance: 100000, movements: [] }];
assert.equal(partial.state.clients[0].balance, 92993);
assert.equal(pendingPayment.pendingValidation, true);
Account.registerClientTransferRequest(partial.state, partialInput, admin);
assert.equal(partial.state.bankReconciliation.filter((item) => item.id === partialInput.requestId).length, 1);
Account.validateTransfer(partial.state, pendingPayment.transfer.id, { bank: "Tabacalera prueba", operationNumber: "OP-123", targetSupplier: "Tabacalera prueba" }, admin);
assert.equal(partial.state.clients[0].balance, 5763);
Account.validateTransfer(partial.state, pendingPayment.transfer.id, { bank: "Mercado Pago", operationNumber: "OP-123" }, admin);
assert.equal(partial.state.clients[0].balance, 5763);
assert.equal(partial.state.accounts.filter((item) => item.transferId === pendingPayment.transfer.id).length, 1);
assert.equal(partial.state.supplierMovements.filter((item) => item.transferId === pendingPayment.transfer.id).length, 1);
assert.equal(partial.state.suppliers[0].balance, 100000);
assert.equal(partial.state.supplierMovements[0].reconciled, false);
const moved = fixture(3);
const target = { ...moved.route, id: "OTHER-ROUTE", stops: [], deviceId: "DEVICE-2", driverUser: "reparto2" };
moved.state.deliveryRoutes.push(target);
const originalItems = JSON.stringify(moved.state.orders.map((order) => [order.code, order.client, order.items, order.amount, order.assembly, order.stockSettled]));
const originalStock = JSON.stringify(moved.state.stockMovements);
assert.throws(() => Delivery.relocateOrders(moved.state, moved.route.id, { orderCodes: [moved.state.orders[0].code], targetRouteId: target.id }, moved.driver), /administracion/);
const beforeInvalid = JSON.stringify(moved.state);
assert.throws(() => Delivery.relocateOrders(moved.state, moved.route.id, { orderCodes: [moved.state.orders[0].code, "MISSING"], targetRouteId: target.id }, admin));
assert.equal(JSON.stringify(moved.state), beforeInvalid);
Delivery.relocateOrders(moved.state, moved.route.id, { orderCodes: [moved.state.orders[0].code], targetRouteId: target.id }, admin);
assert.equal(target.stops.length, 1);
assert.equal(moved.route.stops.length, 2);
assert.equal(moved.route.relocations[0].stop.orderCode, moved.state.orders[0].code);
assert.equal(target.deviceId, "DEVICE-2");
Delivery.relocateOrders(moved.state, target.id, { orderCodes: [moved.state.orders[0].code], targetRouteId: "" }, admin);
assert.equal(moved.state.orders[0].status, Order.STATUS.READY_DISPATCH);
assert.equal(Delivery.routeAlreadyContainsOrder(moved.state, moved.state.orders[0].code), null);
const replanned = Delivery.createPlannedRoute(moved.state, { orderCodes: [moved.state.orders[0].code], day: "2026-10-04", zone: "Nueva", driverUser: "reparto1" }, admin);
Delivery.publishRoute(moved.state, replanned.id, admin);
assert.equal(JSON.stringify(moved.state.stockMovements), originalStock);
assert.equal(JSON.stringify(moved.state.orders.map((order) => [order.code, order.client, order.items, order.amount, order.assembly, order.stockSettled])), originalItems);
target.closure = { id: "CLOSED" };
assert.throws(() => Delivery.relocateOrders(moved.state, moved.route.id, { orderCodes: [moved.state.orders[1].code], targetRouteId: target.id }, admin));
const batch = fixture(100);
const batchTarget = { ...batch.route, id: "BATCH-TARGET", stops: [] };
batch.state.deliveryRoutes.push(batchTarget);
const batchStart = performance.now();
Delivery.relocateOrders(batch.state, batch.route.id, { orderCodes: batch.state.orders.map((order) => order.code), targetRouteId: batchTarget.id }, admin);
assert.equal(batch.route.stops.length, 0);
assert.equal(batchTarget.stops.length, 100);
assert.equal(new Set(batchTarget.stops.map((stop) => stop.orderCode)).size, 100);
console.log(`PASS reubicacion batch de 100 pedidos: ${(performance.now() - batchStart).toFixed(2)} ms (motor local, no incluye red/persistencia).`);
const expenseData = fixture(1);
collect(expenseData, 0, { cashAmount: 1000, transferAmount: 0, creditAmount: 0 });
const unchangedOrder = JSON.stringify(expenseData.state.orders);
const expenses = [{ concept: "Gasoil", amount: 700 }, { concept: "Peaje", amount: 50 }];
const expenseInput = { reportedCash: 250, reportedTransfer: 0, expenses };
const preview = Delivery.routeClosureSummary(expenseData.route, expenseInput);
assert.equal(preview.grossCash, 1000);
assert.equal(preview.expenseTotal, 750);
assert.equal(preview.expectedCash, 250);
assert.equal(preview.cashDifference, 0);
for (const invalid of [[{ concept: "", amount: 1 }], [{ concept: "Gas", amount: -1 }], [{ concept: "Gas", amount: 1001 }], [{ concept: "Gas", amount: "nan" }]]) {
  assert.throws(() => Delivery.routeClosureSummary(expenseData.route, { expenses: invalid }));
}
const expenseClose = Delivery.closeRoute(expenseData.state, expenseData.route.id, expenseInput, expenseData.driver);
assert.deepEqual(expenseClose.closure.expenses, expenses);
assert.equal(expenseClose.closure.totalDifference, 0);
assert.equal(expenseData.route.cashTotal, 1000);
assert.equal(JSON.stringify(expenseData.state.orders), unchangedOrder);
assert.throws(() => Delivery.closeRoute(expenseData.state, expenseData.route.id, expenseInput, expenseData.driver), /ya tiene cierre/);
const start = app.indexOf("function deliveryCollectionsManifestRows(");
const end = app.indexOf("async function exportDeliveryCollectionsManifest(", start);
assert.ok(start >= 0 && end > start);
const reportContext = { state: data.state, numeric: (value) => Number(value) || 0, routeDayToday: () => "2026-09-27" };
vm.createContext(reportContext);
vm.runInContext(`${app.slice(start, end)}\nthis.manifestRows = deliveryCollectionsManifestRows;`, reportContext);
const manifest = reportContext.manifestRows(new Date().toLocaleDateString("en-CA", { timeZone: "America/Argentina/Buenos_Aires" }));
assert.equal(manifest.length, 4);
assert.deepEqual(Array.from(manifest.slice(0, 3), (row) => Number(row[8])), [0, 0, 0]);
assert.equal(manifest.at(-1)[8], 0);

console.log(JSON.stringify({ ok: true, mixedDebt: 600, customerCredit: 100, cashTolerance: 1000, adminApproval: 1201 }));
