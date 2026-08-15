"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.join(__dirname, "..");
const appSource = fs.readFileSync(path.join(root, "app.js"), "utf8");
const htmlSource = fs.readFileSync(path.join(root, "index.html"), "utf8");
const configSource = fs.readFileSync(path.join(root, "config.js"), "utf8");

for (const id of ["ordersDatePreset", "ordersDateFrom", "ordersDateTo", "ordersDateSummary"]) {
  assert.match(htmlSource, new RegExp(`id=["']${id}["']`));
}

assert.match(appSource, /function orderBusinessDateKey\(order\)/);
assert.match(appSource, /function orderMatchesDateFilter\(order\)/);
assert.match(appSource, /function setOrdersDatePreset\(preset\)/);
assert.match(appSource, /return orderMatchesDateFilter\(order\)/);
assert.doesNotMatch(appSource, /return orderIsFromToday\(order\)/);
assert.match(appSource, /setOrdersDatePreset\("today"\)/);
assert.match(configSource, /VERSION: "8790-96"/);

const businessDateFunction = appSource.match(/function orderBusinessDateKey\(order\) \{[\s\S]*?\n\}/)?.[0] || "";
assert.match(businessDateFunction, /order\.createdAt \|\| order\.receivedAt/);
assert.ok(businessDateFunction.indexOf("createdAt") < businessDateFunction.indexOf("updatedAt"));

const dateBlock = appSource.match(/function localDateKey\(value\) \{[\s\S]*?\n\}\n\nfunction renderOrdersPager/)?.[0]
  .replace(/\n\nfunction renderOrdersPager$/, "") || "";
const sandbox = {
  orderDatePreset: "today",
  orderDateFrom: "",
  orderDateTo: "",
  byId: () => null,
  escapeHtml: (value) => String(value)
};
vm.createContext(sandbox);
vm.runInContext(`${dateBlock}\nthis.dateApi = { orderBusinessDateKey, orderMatchesDateFilter };`, sandbox);
sandbox.orderDatePreset = "custom";
sandbox.orderDateFrom = "2026-08-13";
sandbox.orderDateTo = "2026-08-14";
assert.equal(sandbox.dateApi.orderMatchesDateFilter({ createdAt: "2026-08-13T15:00:00-03:00" }), true);
assert.equal(sandbox.dateApi.orderMatchesDateFilter({ createdAt: "2026-08-14T23:55:00-03:00" }), true);
assert.equal(sandbox.dateApi.orderMatchesDateFilter({ createdAt: "2026-08-12T15:00:00-03:00" }), false);
assert.equal(sandbox.dateApi.orderBusinessDateKey({
  createdAt: "2026-08-13T15:00:00-03:00",
  updatedAt: "2026-08-15T15:00:00-03:00"
}), "2026-08-13");
sandbox.orderDatePreset = "all";
assert.equal(sandbox.dateApi.orderMatchesDateFilter({ createdAt: "2024-01-01T10:00:00-03:00" }), true);

console.log(JSON.stringify({
  ok: true,
  version: "8790-96",
  controls: ["Periodo", "Desde", "Hasta"],
  defaultPeriod: "Hoy",
  historicalDataPreserved: true
}, null, 2));
