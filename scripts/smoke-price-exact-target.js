"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const root = path.join(__dirname, "..");
const products = [
  { codigo_producto: "717", name: "Cigarrillo CJ", price: 8400 },
  { codigo_producto: "719", name: "Cigarrillo Pablo Emilio", price: 8600 },
  { codigo_producto: "PRD-1787097170370-286", name: "Pulverizador MAKE", price: 1755 },
  { codigo_producto: "PRD-1787097170368-257", name: "Esponja MAKE", price: 352.72 }
];

function block(source, start, end) {
  const first = source.indexOf(start);
  const last = source.indexOf(end, first);
  assert.ok(first >= 0 && last > first);
  return source.slice(first, last);
}

for (const file of ["server.js", "app.js"]) {
  const source = fs.readFileSync(path.join(root, file), "utf8");
  const context = vm.createContext({
    normalizeSearchText: (value) => String(value || "").trim().toLowerCase(),
    numeric: (value, fallback) => Number.isFinite(Number(value)) ? Number(value) : fallback,
    ensurePriceListsState: () => {},
    currentProductPrice: (product) => product.price,
    roundPriceValue: (value) => value,
    priceListItemFromProduct: (product, values) => ({ productCode: product.codigo_producto, ...values }),
    sameText: (a, b) => a === b
  });
  vm.runInContext(block(source, "function priceProductKey(", "\nfunction "), context);
  vm.runInContext(block(source, "function priceListProductMatches(", "\nfunction "), context);
  const match = (product, key) => file === "server.js"
    ? context.priceListProductMatches({}, product, { operation: "individual", productKey: key })
    : context.priceListProductMatches(product, { operation: "individual", productKey: key });
  assert.deepEqual(products.filter((p) => match(p, "717")).map((p) => p.codigo_producto), ["717"]);
  assert.deepEqual(products.filter((p) => match(p, "PRD-1787097170370-286")).map((p) => p.codigo_producto), ["PRD-1787097170370-286"]);
  for (const key of ["", "71", "MAKE", "Cigarrillo CJ"]) {
    assert.equal(products.filter((p) => match(p, key)).length, 0);
  }
  if (file === "server.js") {
    vm.runInContext(block(source, "function computePriceListSimulation(", "\nfunction activatePriceList("), context);
    const state = { products: structuredClone(products), orders: [{ code: "EXISTING", amount: 123 }] };
    const before = JSON.stringify(state);
    const input = { operation: "individual", productKey: "717", fixedPrice: 8600 };
    const result = context.computePriceListSimulation(state, input);
    assert.equal(result.affected, 1);
    assert.equal(result.items[0].productCode, "717");
    assert.equal(result.items[0].price, 8600);
    assert.equal(JSON.stringify(state), before);
    assert.throws(() => context.computePriceListSimulation(state, { ...input, productKey: "71" }), /unico producto/);
    assert.throws(() => context.computePriceListSimulation({ products: [products[0], { ...products[0] }] }, input), /unico producto/);
    assert.equal(context.computePriceListSimulation(state, { operation: "general", fixedPrice: 8600 }).affected, 4);
  }
  console.log(`${file}: exact target, partial rejection and isolated selection OK`);
}
