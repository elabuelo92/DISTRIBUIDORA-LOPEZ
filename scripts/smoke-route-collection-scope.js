"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const path = require("node:path");
const AccountEngine = require("../account-engine");
const source = fs.readFileSync(path.join(__dirname, "../app.js"), "utf8");
const html = fs.readFileSync(path.join(__dirname, "../index.html"), "utf8");
const extract = (start, end) => source.slice(source.indexOf(start), source.indexOf(end, source.indexOf(start)));
const nodes = new Map();
const byId = (id) => {
  if (!nodes.has(id)) nodes.set(id, { value: "", textContent: "", hidden: false, showModal() {}, files: [] });
  return nodes.get(id);
};
const collection = (at, cash, transfer) => ({ at, collectibleAmount: cash + transfer, cashAmount: cash, transferAmount: transfer, creditAmount: 0 });
const state = {
  orders: [{ code: "P1", client: "Uno", amount: 100 }, { code: "P2", client: "Dos", amount: 200 }, { code: "P3", client: "Tres", amount: 300 }],
  deliveryRoutes: [
    { id: "R1", day: "2026-10-03", driverUser: "reparto1", stops: [
      { orderCode: "P1", collection: collection("2026-10-03T15:00:00Z", 100, 0) },
      { orderCode: "P2", collection: collection("2026-10-04T04:00:00Z", 0, 200) }
    ], closure: { id: "C1", expectedCash: 100, reportedCash: 90, cashDifference: -10, expectedTransfer: 200, reportedTransfer: 200, transferDifference: 0, totalDifference: -10, observations: "Control", user: "Admin" } },
    { id: "R2", day: "2026-10-03", stops: [{ orderCode: "P3", collection: collection("2026-10-03T16:00:00Z", 300, 0) }] }
  ]
};
const exportsSeen = [];
const notices = [];
const context = vm.createContext({ state, byId, numeric: (x, fallback) => Number(x) || fallback,
  isAdminUser: () => true, routeDayToday: () => "2026-10-03",
  showCompactNotice: (msg) => notices.push(msg),
  downloadXlsxReport: async (report) => exportsSeen.push(report),
  makeTablePdf: (title, headers, rows, options) => ({ title, headers, rows, options }),
  downloadBlob: (fileName, report) => exportsSeen.push({ fileName, ...report })
});
vm.runInContext(extract("const DELIVERY_COLLECTION_HEADERS =", "function renderDeliveryClosures()"), context);
byId("deliveryCollectionsDate").value = "2026-10-03";
const before = JSON.stringify(state);
(async () => {
  await context.exportDeliveryCollectionsManifest("xlsx");
  assert.equal(exportsSeen.length, 0, "No implicit all-routes export");
  assert.match(notices.pop(), /Seleccionar/);
  for (const format of ["xlsx", "pdf"]) {
    await context.exportDeliveryCollectionsManifest(format, "R1");
    const report = exportsSeen.pop();
    assert.match(report.fileName, /R1/);
    assert.ok(report.rows.some((row) => row[1] === "P1"));
    assert.ok(report.rows.some((row) => row[1] === "P2"), "Route includes collections after midnight");
    assert.ok(!report.rows.some((row) => row[1] === "P3"), "Other route never included");
    const totals = report.rows.find((row) => row[0] === "TOTALES");
    assert.equal(totals[2], 300);
    assert.equal(totals[3], 100);
    assert.equal(totals[4], 200);
    assert.ok(report.rows.some((row) => row[0] === "DIFERENCIA TOTAL" && row[1] === -10));
    assert.ok(report.rows.every((row) => row.length === report.headers.length));
  }
  await context.exportDeliveryCollectionsManifest("xlsx", "NO-EXISTE");
  assert.equal(exportsSeen.length, 0);
  await context.exportDeliveryCollectionsManifest("xlsx", "__day__");
  const daily = exportsSeen.pop();
  assert.equal(daily.rows.find((row) => row[0] === "TOTALES")[2], 400);
  await context.exportDeliveryCollectionsManifest("xlsx", "R2");
  assert.ok(exportsSeen.pop().rows.some((row) => String(row[1]).includes("PROVISORIO")));
  assert.equal(JSON.stringify(state), before, "Export never changes business data");

  const paymentContext = vm.createContext({ state, byId, renderDeliveryItems() {}, renderDeliveryBankOptions() {},
    updateDeliveryTransferFileStatus() {}, setDeliveryCollectionMessage: (msg) => notices.push(msg),
    clearDeliverySignature() {}, updateDeliveryPaymentDefaults() {}, money: { format: String } });
  vm.runInContext(extract("function openDeliveryCollection(", "function submitDeliveryCollection(").replace(/async\s*$/, ""), paymentContext);
  paymentContext.openDeliveryCollection("P1");
  assert.equal(byId("deliveryPaymentMethod").value, "");
  assert.equal(byId("deliveryCashAmount").value, "0");
  assert.match(html, /id="deliveryPaymentMethod" required>\s*<option value="">/);
  const submitPrefix = extract("async function submitDeliveryCollection(", "  updateDeliveryPendingAmount();");
  vm.runInContext(submitPrefix + "throw new Error('Unexpected submission');\n}", paymentContext);
  await paymentContext.submitDeliveryCollection({ preventDefault() {} });
  assert.match(notices.pop(), /Seleccionar el medio/);

  const orders = [
    { seller: "Axel", amount: 100, createdAt: "2026-10-01T03:00:00Z", commissions: { seller: { total: 5 } } },
    { seller: "Axel", amount: 900, createdAt: "2026-10-01T02:59:59Z" },
    { seller: "Axel", amount: 200, createdAt: "2026-11-01T02:59:59Z", commissions: { seller: { total: 10 } } },
    { seller: "Axel", amount: 900, createdAt: "2026-11-01T03:00:00Z" },
    { seller: "Otro", amount: 999, createdAt: "2026-10-03T12:00:00Z" },
    { seller: "Axel", amount: 999, createdAt: "2026-10-03T12:00:00Z", status: "Cancelado" }
  ];
  const monthContext = vm.createContext({ commissionHistoryOrders: () => orders, normalizeSearchText: (s) => String(s || "").toLowerCase(),
    numeric: Number, ORDER_STATUS: { CANCELLED: "Cancelado", REJECTED: "Rechazado", NOT_DELIVERED: "No entregado" } });
  vm.runInContext(extract("function commissionReportDateKey(", "function commissionWeekRange(") + extract("function sellerCurrentMonthTotals(", "function renderMobileSummary("), monthContext);
  const monthly = monthContext.sellerCurrentMonthTotals("Axel", new Date("2026-10-04T12:00:00Z"));
  assert.equal(monthly.sales, 300);
  assert.equal(monthly.commission, 15);

  const accountState = { clients: [{ codigo_cliente: "TEST", name: "Minimarket prueba", balance: 92993, saldo_actual: 92993, status: "Activo" }], orders: [], accounts: [], products: [], suppliers: [] };
  const paid = AccountEngine.registerClientPayment(accountState, { entityId: "TEST", amount: 87230, method: "Transferencia", reference: "PRUEBA" }, { user: "Prueba" });
  assert.equal(paid.payment.balance, 5763);
  console.log("PASS route isolation, cross-day collections, closure totals, provisional report, PDF/Excel payloads, explicit payment, month ART boundaries, partial payment 92993-87230=5763. No production writes.");
})().catch((error) => { console.error(error); process.exitCode = 1; });
