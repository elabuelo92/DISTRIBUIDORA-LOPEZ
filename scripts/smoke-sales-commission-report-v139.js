"use strict";

const assert = require("node:assert/strict");
const Report = require("../sales-commission-report");

const orders = [{
  code: "PED-1", seller: "Axel", client: "Cliente Uno", amount: 4500, createdAt: "2026-09-01T12:00:00Z",
  items: [
    { name: "General", requestedQty: 2, lineTotal: 3000 },
    { name: "Cigarrillos", requestedQty: 3, lineTotal: 1500 }
  ],
  commissions: { seller: { user: "Axel", baseAmount: 4500, total: 180, lines: [
    { productName: "General", quantity: 2, group: "mercaderia", baseAmount: 3000, percent: 5, commission: 150, ruleId: "R-1" },
    { productName: "Cigarrillos", quantity: 3, group: "cigarrillos", baseAmount: 1500, percent: 2, commission: 30, ruleId: "R-2" }
  ] } }
}];

const before = JSON.stringify(orders);
const report = Report.build(orders);
assert.equal(JSON.stringify(orders), before);
assert.equal(report.sellers.length, 1);
assert.deepEqual({ clients: report.sellers[0].clients, orders: report.sellers[0].orders, units: report.sellers[0].units, gross: report.sellers[0].gross, general: report.sellers[0].general, cigarettes: report.sellers[0].cigarettes, commission: report.sellers[0].commission }, {
  clients: 1, orders: 1, units: 5, gross: 4500, general: 3000, cigarettes: 1500, commission: 180
});
assert.deepEqual(report.details.map((line) => [line.quantity, line.percent, line.ruleId]), [[2, 5, "R-1"], [3, 2, "R-2"]]);
const cancelled = { ...orders[0], code: "PED-2", status: "Cancelado" };
const rejected = { ...orders[0], code: "PED-3", status: "Rechazado" };
assert.equal(Report.build([...orders, cancelled, rejected]).sellers[0].gross, 4500);
console.log("Reporte de ventas y comisiones por vendedor: OK");
