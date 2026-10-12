"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const source = fs.readFileSync(path.join(__dirname, "../app.js"), "utf8");
const start = source.indexOf("function assemblyOrderItems(");
const end = source.indexOf("function findClientByName(", start);
assert.ok(start >= 0 && end > start);
const context = vm.createContext({ Intl,
  numeric: (v, fallback) => v == null || v === "" || !Number.isFinite(Number(v)) ? fallback : Number(v),
  escapeHtml: (v) => String(v).replaceAll("&", "&amp;").replaceAll("<", "&lt;")
});
vm.runInContext(source.slice(start, end), context);
const fmt = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", minimumFractionDigits: 2, maximumFractionDigits: 2 });
function check(item, unit, amount, settings = { showPrices: true, showAmounts: true }) {
  const order = { items: [{ name: "Producto", ...item }] };
  const before = JSON.stringify(order);
  const html = context.orderInvoiceRows(order, settings);
  const values = [...html.matchAll(/<td class="money-col">([^<]+)<\/td>/g)].map(m => m[1]);
  assert.deepEqual(values, [settings.showPrices && fmt.format(unit), settings.showAmounts && fmt.format(amount)].filter(Boolean));
  assert.equal(JSON.stringify(order), before);
}
check({ requestedQty: 12, unitPrice: 1508, lineTotal: 14476.8, discountPct: 20 }, 1206.4, 14476.8);
check({ requestedQty: 2, unitPrice: 950, originalUnitPrice: 1000, lineTotal: 1900 }, 950, 1900);
check({ requestedQty: 2, unitPrice: 1000, lineTotal: 2000, requestedDiscountPct: 5 }, 1000, 2000);
check({ requestedQty: 2, unitPrice: 1000, lineTotal: 0, discountPct: 100 }, 0, 0);
check({ requestedQty: 3, unitPrice: 100, lineTotal: 250 }, 250 / 3, 250);
check({ requestedQty: 0, unitPrice: 100, lineTotal: 0 }, 100, 0);
check({ qty: 2, unitPrice: 100 }, 100, 200);
check({ qty: 2, unitPrice: 100, lineTotal: 180 }, 90, 180, { showPrices: false, showAmounts: false });
console.log("PASS invoice net unit: approved discount, changed price, pending unchanged, free items, fractional cents, zero quantity, legacy fallback, hidden prices, no data mutation.");
