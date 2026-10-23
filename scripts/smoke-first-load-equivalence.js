"use strict";
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { execFileSync } = require("node:child_process");
const { performance } = require("node:perf_hooks");
const root = path.resolve(__dirname, "..");
const baseline = execFileSync("git", ["show", "aac60d8:order-engine.js"], { cwd: root, encoding: "utf8", maxBuffer: 4 * 1024 * 1024 });
const current = fs.readFileSync(path.join(root, "order-engine.js"), "utf8");
const instant = Date.parse("2026-10-23T03:00:00.000Z");
class FixedDate extends Date {
  constructor(...args) { super(...(args.length ? args : [instant])); }
  static now() { return instant; }
}
function engine(source) {
  const context = { module: { exports: {} }, Date: FixedDate, Math: Object.assign(Object.create(Math), { random: () => .123456789 }) };
  vm.runInNewContext(source, context);
  return context.module.exports;
}
const before = engine(baseline), after = engine(current);
const hash = value => crypto.createHash("sha256").update(value).digest("hex");
function run(implementation, original) {
  const state = JSON.parse(JSON.stringify(original));
  const start = performance.now();
  implementation.migrateState(state);
  return { state, ms: Math.round(performance.now() - start) };
}
let cases = 0;
function compare(fixture) {
  const old = run(before, fixture), next = run(after, fixture);
  assert.deepEqual(JSON.parse(JSON.stringify(next.state)), JSON.parse(JSON.stringify(old.state)));
  cases++;
  return { beforeMs: old.ms, afterMs: next.ms, identical: true, normalizedHash: hash(JSON.stringify(next.state)) };
}
const fixture = {
  products: [{ codigo_producto: "A", name: "Producto A", rubro: "Limpieza", stock_fisico: 2000, price: 100 }],
  sellers: [{ name: "Seller" }], accounts: [{ client: "Client", balance: 55.25 }],
  orders: [{ code: "PED-1", client: "Client", seller: "Seller", sellerUsername: "seller", driverUser: "driver",
    status: before.STATUS.COLLECTED, createdAt: "2026-10-20T12:00:00Z", amount: 200,
    items: [{ productCode: "A", name: "Producto A", qty: 2, unitPrice: 100 }] }]
};
compare(fixture);
const complete = run(before, fixture).state;
for (const status of Object.values(before.STATUS)) {
  const sample = JSON.parse(JSON.stringify(complete));
  sample.orders[0].status = status;
  compare(sample);
}
for (const role of ["seller", "driver"]) {
  for (const field of ["role", "user", "accrual", "baseAmount", "cigarettes", "merchandise", "total", "lines"]) {
    for (const value of [undefined, null, "", 0, "1.5", "invalid"]) {
      const sample = JSON.parse(JSON.stringify(complete));
      sample.orders[0].commissions[role][field] = value;
      compare(sample);
    }
  }
  const sample = JSON.parse(JSON.stringify(complete));
  delete sample.orders[0].commissions[role];
  compare(sample);
}
for (const field of ["basis", "cigarettes", "merchandise", "total", "calculatedAt"]) {
  const sample = JSON.parse(JSON.stringify(complete));
  delete sample.orders[0].commissions[field];
  compare(sample);
}
const settled = JSON.parse(JSON.stringify(complete));
settled.orders[0].commissionLiquidated = true;
settled.orders[0].commissionPaidAmount = 123;
settled.orders[0].commissions.seller.total = 456;
settled.orders[0].commissions.seller.lines[0].percent = 20;
settled.commissionSettings.rules.forEach(rule => { rule.percent = 99; });
compare(settled);
assert.equal(run(after, settled).state.orders[0].commissions.seller.total, 456);
let volume = null;
if (process.argv[2]) {
  const source = fs.readFileSync(process.argv[2]);
  const sourceHash = hash(source);
  volume = compare(JSON.parse(source).state);
  assert.equal(hash(fs.readFileSync(process.argv[2])), sourceHash);
  volume.sourceUnchanged = true;
  volume.sourceHash = sourceHash;
}
const report = { ok: true, cases, volume };
console.log(JSON.stringify(report, null, 2));
if (process.env.DL_TEST_REPORT) fs.writeFileSync(process.env.DL_TEST_REPORT, JSON.stringify(report, null, 2));
