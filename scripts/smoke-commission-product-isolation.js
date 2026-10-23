"use strict";
const assert = require("node:assert/strict");
const Engine = require("../order-engine");
const Report = require("../sales-commission-report");
const fs = require("node:fs");
const vm = require("node:vm");
const state = { products: [
  { codigo_producto: "170", name: "Trapo de piso", rubro: "Limpieza" },
  { codigo_producto: "1701", name: "Trapo de piso reforzado", rubro: "Limpieza" },
  { codigo_producto: "171", name: "Trapo de piso", rubro: "Limpieza" },
  { codigo_producto: "172", name: "Escoba", rubro: "Limpieza" },
  { codigo_producto: "173", name: "Cigarrillo", rubro: "Cigarrillos" }
], orders: [{ code: "LIQ", commissionLiquidated: true, commissions: { seller: { total: 300 } } }],
commissionSettlements: [{ id: "LIQ-1", amount: 300 }] };
const history = JSON.stringify([state.orders, state.commissionSettlements]);
Engine.ensureCommissionSettings(state);
function rate(code, seller = "Ana") {
  return Engine.previewCommissionRule(state, { productCode: code, seller, baseAmount: 10000 }).percent;
}
Engine.saveCommissionRule(state, { productCode: "170", productName: "Trapo de piso", rubro: "*",
  percent: 20, priority: 200, motive: "Solo este articulo" }, { name: "Admin" });
assert.equal(rate("170"), 20);
for (const code of ["1701", "171", "172"]) assert.equal(rate(code), 3, `Isolation ${code}`);
assert.equal(rate("173"), 1);
assert.throws(() => Engine.saveCommissionRule(state, { productName: "Trapo de piso", percent: 20, motive: "Ambiguo" }), /no ambiguo/);
assert.throws(() => Engine.saveCommissionRule(state, { productCode: "NO-EXISTE", percent: 20, motive: "Codigo inexistente" }), /no ambiguo/);
Engine.saveCommissionRule(state, { productCode: "170", productName: "Trapo de piso", rubro: "*",
  userLabel: "Ana", percent: 25, priority: 300, motive: "Solo Ana y este articulo" }, { name: "Admin" });
assert.equal(rate("170"), 25);
assert.equal(rate("170", "Luis"), 20);
assert.equal(rate("1701"), 3);
assert.equal(rate("173"), 1);
// A legacy name-only rule may match an exact name, never a prefix/family.
state.commissionSettings.rules = [{ id: "NAME", productName: "Trapo de piso", rubro: "*", role: "seller", percent: 20 }];
assert.equal(rate("1701"), 3);
assert.equal(rate("172"), 3);
state.commissionSettings.rules = [{ id: "INACTIVE", isDefault: true, active: false, role: "seller", percent: 20 }];
assert.equal(rate("172"), 3, "Inactive default must not reappear as fallback");
assert.equal(JSON.stringify([state.orders, state.commissionSettlements]), history);
const report = Report.build([{ seller: "Ana", amount: 10000, items: [{}, {}], commissions: { seller: {
  user: "Ana", baseAmount: 10000, total: 288,
  lines: [{ quantity: 1, baseAmount: 600, percent: 1, commission: 6, group: "cigarrillos" },
    { quantity: 1, baseAmount: 9400, percent: 3, commission: 282, group: "mercaderia" }]
} } }]);
assert.equal(report.sellers[0].percent, 2.88, "Weighted average is not an individual product rate");
assert.deepEqual(report.details.map(row => row.percent), [1, 3]);
const orders = [{ seller: "Ana", createdAt: "2026-10-22", items: [], commissions: { seller: {
  user: "Ana", lines: [
    { productCode: "A", productName: "Producto", baseAmount: 600, percent: 1, commission: 6, quantity: 1 },
    { productCode: "A", productName: "Producto", baseAmount: 9400, percent: 3, commission: 282, quantity: 1 }
  ]
} } }];
const before = JSON.stringify(orders);
const context = vm.createContext({ commissionHistoryOrders: () => orders, commissionReportDateKey: value => value,
  byId: id => ({ value: id === "commissionReportSeller" ? "all" : "" }),
  numeric: (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback,
  normalizeSearchText: value => String(value).toLowerCase() });
const app = fs.readFileSync(require.resolve("../app.js"), "utf8");
vm.runInContext(app.slice(app.indexOf("function commissionReportData("), app.indexOf("function salesCommissionReportData(")), context);
const rows = context.commissionReportData().products;
assert.deepEqual(Array.from(rows, row => row.percent).sort(), [1, 3], "product report must not mislabel mixed historical rates as 2.88%");
assert.equal(rows.reduce((sum, row) => sum + row.commission, 0), 288);
assert.equal(JSON.stringify(orders), before);
console.log("PASS exact product/user scope, same names/different codes, prefixes, unrelated products, cigarettes, inactive fallback, immutable settlements; 2.88% mixed average reproduced");
