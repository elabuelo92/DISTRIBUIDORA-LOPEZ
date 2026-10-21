"use strict";
const assert = require("node:assert/strict"), fs = require("node:fs"), vm = require("node:vm");
const Delivery = require("../delivery-engine");
const source = fs.readFileSync(require.resolve("../app.js"), "utf8");
const ctx = vm.createContext({ Intl, numeric: (v, d) => v == null ? d : Number(v), escapeHtml: v => String(v) });
vm.runInContext(source.slice(source.indexOf("function assemblyOrderItems("), source.indexOf("function findClientByName(")), ctx);
for (const [qty, price, total, requested, expected] of [[10,100,950,0,"5%"],[10,100,1000,5,"0%"],[10,100,0,0,"100%"],[0,100,0,0,"0%"],[3,100,250,0,"16,67%"],[2,100,220,0,"0%"]]) {
  const order = { items: [{ name: "Producto", requestedQty: qty, unitPrice: price, lineTotal: total, requestedDiscountPct: requested }] };
  const before = JSON.stringify(order);
  const html = ctx.orderInvoiceRows(order, { showPrices: true, showAmounts: true });
  assert.ok(html.includes(`<td class="discount-col">${expected}</td>`), html);
  assert.equal(JSON.stringify(order), before);
  assert.ok(!ctx.orderInvoiceRows(order, { showPrices: false }).includes("discount-col"));
}
const route = { id: "R-HISTORICA", zone: "Centro Chino", name: "LUNES - CENTRO - REPARTO2", day: "2026-10-19", driverUser: "reparto2", stops: [{orderCode:"PED-1"}], closure: {cash:1200} };
const before = JSON.stringify(route);
assert.equal(Delivery.routeDisplayName(route), "Centro Chino");
assert.equal(JSON.stringify(route), before);
assert.equal(Delivery.routeDisplayName({name:"Nombre manual"}), "Nombre manual");
assert.equal(Delivery.routeDisplayName({id:"R-1"}), "R-1");
assert.match(source, /<th>Descuento %<\/th>/);
assert.match(source, /Descuento informado ya incluido/);
assert.match(fs.readFileSync(require.resolve("../index.html"),"utf8"), /Nombre de ruta\s+<input id="deliveryPlannerZone"/);
console.log("PASS P11: applied vs pending discounts, 100%, rounding, unchanged prices/data, hidden prices, manual route name and historical fallback.");
