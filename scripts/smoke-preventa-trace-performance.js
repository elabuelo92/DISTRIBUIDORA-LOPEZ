"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const crypto = require("node:crypto");
const { performance } = require("node:perf_hooks");
const ORDER_STATUS = require("../order-engine").STATUS;
const app = fs.readFileSync(path.join(__dirname, "../app.js"), "utf8");
function source(name) {
  const start = app.indexOf(`function ${name}(`);
  const end = app.indexOf("\nfunction ", start + 1);
  assert.ok(start >= 0 && end > start, `Function exists: ${name}`);
  return app.slice(start, end);
}
const optimized = "const parts = entry.date && entry.time ? entry : localTraceParts(at);";
const trace = source("normalizeOrderTrace");
assert.ok(trace.includes(optimized));
function build(legacy) {
  let calls = 0;
  const context = vm.createContext({
    ORDER_STATUS,
    countFormat: () => { calls++; }
  });
  const code = [source("numeric"), source("validIsoDate"), source("localTraceParts").replace(
    "const date =", "countFormat(); const date ="),
  legacy ? trace.replace(optimized, "const parts = localTraceParts(at);") : trace,
  source("normalizeOrderRecord")].join("\n");
  const normalize = vm.runInContext(`${code}\nnormalizeOrderRecord;`, context);
  return { normalize, calls: () => calls };
}
const before = build(true);
const after = build(false);
const plain = v => JSON.parse(JSON.stringify(v));
const base = { code: "PED-TEST", createdAt: "2026-10-08T01:00:00Z", status: ORDER_STATUS.PENDING, amount: 123.45 };
const cases = [undefined, [], [{ at: base.createdAt, status: ORDER_STATUS.PENDING, date: "7/10/2026", time: "22:00:00" }],
  [{ at: base.createdAt, date: "7/10/2026" }], [{ at: base.createdAt, time: "22:00:00" }],
  [{ at: "bad", date: "", time: "" }], [{ createdAt: "2024-02-29T03:00:00Z" }],
  [{ at: "2026-10-08T02:59:59Z" }, { at: "2026-10-08T03:00:00Z" }],
  [{ at: base.createdAt, date: "custom date", time: "custom time", gps: { lat: -31, lng: -64 } }]];
for (const entries of cases) {
  for (const status of [ORDER_STATUS.PENDING, "Entregado"]) {
    const order = { ...base, status, trace: entries };
    const original = JSON.stringify(order);
    assert.deepStrictEqual(plain(after.normalize(order)), plain(before.normalize(order)));
    assert.equal(JSON.stringify(order), original, "Input remains unchanged");
  }
}
const complete = { ...base, trace: cases[2] };
const startCalls = after.calls();
after.normalize(complete);
assert.equal(after.calls(), startCalls, "Complete trace requires no date formatting");
const input = process.argv[2];
const hash = b => crypto.createHash("sha256").update(b).digest("hex");
let orders;
let inputHash;
if (input) {
  const raw = fs.readFileSync(input);
  inputHash = hash(raw);
  const state = JSON.parse(raw).state;
  orders = [...(state.orders || []), ...(state.archivedOrders || [])];
} else {
  orders = Array.from({ length: 100 }, (_, i) => ({ ...complete, code: `PED-${i}` }));
}
const results = [];
for (let run = 0; run < 3; run++) {
  const start = performance.now();
  const expected = orders.map(before.normalize);
  const beforeMs = performance.now() - start;
  const next = performance.now();
  const actual = orders.map(after.normalize);
  const afterMs = performance.now() - next;
  assert.deepStrictEqual(plain(actual), plain(expected), "All order fields remain identical");
  results.push({ beforeMs: Math.round(beforeMs), afterMs: Math.round(afterMs) });
}
if (input) assert.equal(hash(fs.readFileSync(input)), inputHash);
console.log(JSON.stringify({ passed: true, cases: cases.length * 2,
  orders: orders.length, traceEntries: orders.reduce((n, o) => n + (o.trace || []).length, 0),
  inputUnchanged: true, sourceSha256: inputHash, results,
  scope: "Local order normalization only; not network, rendering or server persistence" }, null, 2));
