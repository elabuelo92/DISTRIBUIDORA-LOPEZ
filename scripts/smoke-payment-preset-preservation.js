"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const AccountEngine = require("../account-engine");
const source = fs.readFileSync(path.join(__dirname, "../app.js"), "utf8");
const nodes = new Map();
const byId = (id) => {
  if (!nodes.has(id)) nodes.set(id, { value: "", dataset: {}, files: [] });
  return nodes.get(id);
};
const state = { orders: [{ code: "TEST-PARTIAL", amount: 250000 }], deliverySettings: {} };
const before = JSON.stringify(state);
const context = vm.createContext({
  state, byId, AccountEngine, numeric: (value, fallback = 0) => Number(value) || fallback,
  deliveryCollectionTotals: (order) => ({ netAmount: order.amount }),
  document: { querySelectorAll: () => [] }, setMoneyPreview() {}, money: { format: String }
});
const start = source.indexOf("function updateDeliveryPaymentPresetSelection()");
const end = source.indexOf("function deliveryTransferAttachmentFile()", start);
assert.ok(start >= 0 && end > start);
vm.runInContext(source.slice(start, end), context);
byId("deliveryCollectionOrderCode").value = "TEST-PARTIAL";
context.applyDeliveryPaymentPreset("cash");
byId("deliveryCashAmount").value = "100000";
context.reconcileDeliveryPaymentInput("cash");
assert.equal(byId("deliveryCreditAmount").value, "150000");
context.applyDeliveryPaymentPreset("mixed");
assert.equal(byId("deliveryCashAmount").value, "100000", "Mixed mode must preserve partial cash");
assert.equal(byId("deliveryCreditAmount").value, "150000");
byId("deliveryTransferAmount").value = "50000";
context.reconcileDeliveryPaymentInput("transfer");
context.applyDeliveryPaymentPreset("mixed");
context.applyDeliveryPaymentPreset("mixed");
assert.equal(byId("deliveryCashAmount").value, "100000");
assert.equal(byId("deliveryTransferAmount").value, "50000");
assert.equal(byId("deliveryCreditAmount").value, "100000");
context.applyDeliveryPaymentPreset("transfer");
assert.equal(byId("deliveryCashAmount").value, "0", "All transfer clears previous cash");
assert.equal(byId("deliveryTransferAmount").value, "250000");
context.applyDeliveryPaymentPreset("cash");
assert.equal(byId("deliveryTransferAmount").value, "0", "All cash clears previous transfer");
context.applyDeliveryPaymentPreset("credit");
assert.equal(byId("deliveryCashAmount").value, "0");
assert.equal(byId("deliveryCreditAmount").value, "250000");
assert.equal(JSON.stringify(state), before, "Editing the form never mutates saved data");
console.log("PASS partial cash preserved, mixed repeat safe, explicit full-payment switches, no data writes");
