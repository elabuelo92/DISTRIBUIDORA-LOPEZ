"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { performance } = require("node:perf_hooks");
const source = fs.readFileSync(path.join(__dirname, "../app.js"), "utf8");
function extract(name) {
  const start = source.indexOf(`function ${name}(`);
  assert.ok(start >= 0, name);
  const next = source.slice(start + 1).search(/\n(?:async )?function /);
  return source.slice(start, next < 0 ? undefined : start + 1 + next);
}
let selected = "";
let calls = [];
const context = {
  renderInventoryFinanceWorkspace: () => selected,
  byId: () => ({}), searchTerms: () => [], accountSearchTerm: "",
  state: { priceListAudit: [] }
};
const renderers = ["renderAccounts", "renderStock", "renderPriceLists", "renderPhysicalStockControl"];
const leaves = ["renderStockCharts", "renderStockLedger", "renderStockSupply", "renderBankReconciliationList",
  "populatePriceListSelectors", "renderPriceListCards", "renderPriceListProductsTable", "renderPriceListOperationFields",
  "renderPriceListSimulation", "renderProductPortfolioPanel", "renderAuthorizedOffers", "renderPriceListDirectory", "renderPhysicalStockHistory"];
for (const name of leaves) context[name] = () => calls.push(name);
vm.createContext(context);
for (const name of renderers) vm.runInContext(extract(name), context);
for (const name of renderers) {
  selected = ""; calls = []; context[name]();
  assert.deepEqual(calls, [], `${name}: no hidden calculations on home`);
}
for (const [renderer, tool, expected] of [
  ["renderAccounts", "bank", ["renderBankReconciliationList"]],
  ["renderStock", "overview", ["renderStockCharts"]],
  ["renderStock", "ledger", ["renderStockLedger"]],
  ["renderStock", "supply", ["renderStockSupply"]],
  ["renderPhysicalStockControl", "history", ["renderPhysicalStockHistory"]],
  ["renderPriceLists", "products", ["populatePriceListSelectors", "renderPriceListCards", "renderPriceListProductsTable"]],
  ["renderPriceLists", "edit", ["populatePriceListSelectors", "renderPriceListOperationFields", "renderPriceListSimulation"]],
  ["renderPriceLists", "portfolio", ["renderProductPortfolioPanel"]],
  ["renderPriceLists", "offers", ["renderAuthorizedOffers"]],
  ["renderPriceLists", "history", ["renderPriceListDirectory"]]
]) {
  selected = tool; calls = []; context[renderer](); assert.deepEqual(calls, expected);
}

const stock = {
  state: { orders: [] }, Map, Set,
  numeric: (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback,
  normalizeSearchText: (value) => String(value || "").trim().toLowerCase(),
  formatOrderTime: (value) => String(value || ""),
  PHYSICAL_STOCK_PRE_DISPATCH_STATUSES: new Set(["ready"])
};
vm.createContext(stock);
for (const name of ["productInventoryKey", "orderItemMatchesProduct", "itemReservedForPhysicalStock", "buildPhysicalStockTraceIndex", "physicalStockTraceForProduct"]) {
  vm.runInContext(extract(name), stock);
}
const products = Array.from({ length: 700 }, (_, i) => ({ codigo_producto: `P${i}`, name: `Product ${i}` }));
stock.state.orders = Array.from({ length: 100 }, (_, i) => ({
  code: `O${i}`, inventoryMode: "reservation", status: i % 7 ? "ready" : "closed", createdAt: "2026-09-28",
  items: Array.from({ length: 20 }, (_, j) => ({ productCode: `P${(i * 7 + j) % 700}`, name: `Product ${(i * 7 + j) % 700}`, qty: j + 1, missingQty: j % 3 }))
}));
stock.state.orders.push({ status: "ready", inventoryMode: "reservation", items: [
  { productCode: "P1", name: "Product 2", qty: 3 },
  { name: "Product 1", reservedQty: 2, qty: 8 },
  { code: "P1", name: "Product 1", qty: 0 },
  { codigo_producto: " P1 ", qty: 4 }
] });
const snapshot = JSON.stringify(stock.state);
let start = performance.now();
const before = products.map((product) => stock.physicalStockTraceForProduct(product));
const beforeMs = performance.now() - start;
start = performance.now();
const index = stock.buildPhysicalStockTraceIndex();
const after = products.map((product) => stock.physicalStockTraceForProduct(product, index));
const afterMs = performance.now() - start;
assert.equal(JSON.stringify(after), JSON.stringify(before), "Exact trace equivalence including name/code union and order");
assert.equal(JSON.stringify(stock.state), snapshot, "No state mutation");
stock.state.orders[1].items[0].qty += 10;
const fresh = stock.buildPhysicalStockTraceIndex();
assert.notEqual(JSON.stringify(stock.physicalStockTraceForProduct(products[7], fresh)), JSON.stringify(stock.physicalStockTraceForProduct(products[7], index)), "Fresh index reflects changes");
console.log(JSON.stringify({ result: "OK", lazyBranches: 14, products: 700, orders: 101, traceCalculationBeforeMs: beforeMs, traceCalculationAfterMs: afterMs, identical: true }, null, 2));

const engine = require("../account-engine.js");
const accountState = {
  clients: Array.from({ length: 1300 }, (_, i) => ({ name: `Cliente ${i}`, balance: i * 10, limit: 1000, dias_credito: 10, forma_pago: "Cuenta corriente" })),
  orders: Array.from({ length: 700 }, (_, i) => ({ code: `PED${i}`, client: `Cliente ${i % 1300}`, status: i % 3 ? "Pendiente" : "Entregado", amount: i * 5 })),
  archivedOrders: [{ code: "PED1", client: "Cliente 1", amount: 999999 }, { code: "ARCH1", client: "Cliente 2", amount: 300 }],
  accounts: Array.from({ length: 1800 }, (_, i) => ({ account: `Cliente ${i % 1300}`, credit: i, date: "2026-09-01", method: "Efectivo" }))
};
accountState.clients.push({ name: "CLIENTE 1", balance: 99999 }, { nombre_comercial: "Sin nombre" });
accountState.accounts.push({ account: "Cliente 1", credit: 9999, type: "Saldo a favor del cliente", date: "2026-09-28" });
const accountSnapshot = JSON.stringify(accountState);
start = performance.now();
const oldSummaries = accountState.clients.map((client) => engine.accountSummary(accountState, client.name, 0));
const accountsBeforeMs = performance.now() - start;
start = performance.now();
const newSummaries = engine.accountSummaries(accountState);
const accountsAfterMs = performance.now() - start;
assert.deepEqual(newSummaries, oldSummaries);
assert.equal(JSON.stringify(accountState), accountSnapshot);
accountState.orders[1].amount += 100;
assert.deepEqual(engine.accountSummaries(accountState), accountState.clients.map((client) => engine.accountSummary(accountState, client.name, 0)));
console.log(JSON.stringify({ accounts: "OK", clients: accountState.clients.length, accountsBeforeMs, accountsAfterMs, identical: true }, null, 2));
