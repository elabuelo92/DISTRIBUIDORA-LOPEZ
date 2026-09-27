"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const OrderEngine = require("../order-engine");

const root = path.resolve(__dirname, "..");
const app = fs.readFileSync(path.join(root, "app.js"), "utf8");
const server = fs.readFileSync(path.join(root, "server.js"), "utf8");
const order = {
  items: [{ productCode: "624", name: "TOA Doncella C/alas x 8", requestedQty: 11, unitPrice: 999 }]
};

function warnings(items) {
  return OrderEngine.unusualOrderEditQuantities(order, { items });
}

assert.deepEqual(warnings([{ productCode: "624", name: "TOA Doncella C/alas x 8", qty: 852 }]), [{
  productCode: "624", name: "TOA Doncella C/alas x 8", beforeQty: 11, afterQty: 852
}]);
assert.equal(warnings([{ productCode: "624", qty: 12 }]).length, 0);
assert.equal(warnings([{ productCode: "624", qty: 11, unitPrice: 908 }]).length, 0);
assert.equal(warnings([{ productCode: "NEW", name: "Producto nuevo", qty: 50 }]).length, 1);
assert.match(app, /window\.confirm\(summary\)/);
assert.match(app, /expectedUpdatedAt: order\.updatedAt/);
assert.match(app, /confirmLargeQuantities: unusualQuantities\.length > 0/);
assert.match(server, /unusualOrderEditQuantities\(previousOrder, input\)/);
assert.match(server, /input\.confirmLargeQuantities !== true \|\| !expectedUpdatedAt/);
assert.match(server, /expectedUpdatedAt !== String\(previousOrder\.updatedAt/);

console.log(JSON.stringify({ ok: true, version: "8790-154", anomalousQuantityBlocked: true, staleEditBlocked: true }));
