"use strict";
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const { execFileSync } = require("node:child_process");
const { performance } = require("node:perf_hooks");
const root = path.resolve(__dirname, "..");
const source = process.argv[2] || path.join(root, ".tmp-performance-167/production-state.json");
const raw = fs.readFileSync(source, "utf8");
const hash = value => crypto.createHash("sha256").update(value).digest("hex");
const inputHash = hash(raw);
const fixedTime = Date.parse("2026-10-07T01:30:00.000Z");
class FixedDate extends Date {
  constructor(...args) { super(...(args.length ? args : [fixedTime])); }
  static now() { return fixedTime; }
}
function load(code) {
  const context = { module: { exports: {} }, Date: FixedDate, Intl, Math: Object.create(Math) };
  context.Math.random = () => 0.125;
  vm.runInNewContext(code, context);
  return context.module.exports;
}
const before = load(execFileSync("git", ["show", "0e5dfe3:account-engine.js"], { cwd: root, encoding: "utf8" }));
const after = load(fs.readFileSync(path.join(root, "account-engine.js"), "utf8"));
const orderBefore = load(execFileSync("git", ["show", "0e5dfe3:order-engine.js"], { cwd: root, encoding: "utf8" }));
const orderAfter = load(fs.readFileSync(path.join(root, "order-engine.js"), "utf8"));
function compare(input, label, oldEngine = before, newEngine = after) {
  const left = JSON.parse(JSON.stringify(input));
  const right = JSON.parse(JSON.stringify(input));
  let start = performance.now();
  oldEngine.migrateState(left);
  const beforeMs = performance.now() - start;
  start = performance.now();
  newEngine.migrateState(right);
  const afterMs = performance.now() - start;
  assert.deepStrictEqual(JSON.parse(JSON.stringify(right)), JSON.parse(JSON.stringify(left)), `${label}: full migrated state must remain identical`);
  // Repeat after changing records, ensuring no cached index survives a mutation.
  left.orders.push({ code: "QA-NEW", client: left.clients[0]?.name, amount: 13.25, status: "Pendiente" });
  right.orders.push({ code: "QA-NEW", client: right.clients[0]?.name, amount: 13.25, status: "Pendiente" });
  oldEngine.migrateState(left);
  newEngine.migrateState(right);
  assert.deepStrictEqual(JSON.parse(JSON.stringify(right)), JSON.parse(JSON.stringify(left)), `${label}: mutation/repeated migration`);
  return { label, beforeMs: Math.round(beforeMs), afterMs: Math.round(afterMs), improvementPct: Math.round((1 - afterMs / beforeMs) * 100), equal: true, outputHash: hash(JSON.stringify(right)) };
}
const edge = {
  clients: [{ name: "Jose", balance: 100, dias_credito: 5 }, { name: " JOSÉ ", balance: 20 }, { nombre_comercial: "Alternativo", balance: 8 }, { name: "" }],
  accounts: [{ account: "José", credit: 10, date: "2026-09-01" }, { account: "Jose", credit: 99, date: "2026-09-01", type: "Saldo a favor del cliente" }],
  orders: [{ code: "A", client: "jose", amount: 10, status: "Pendiente" }, { code: "B", client: "José", amount: 3, status: "Entregado" }, { client: "", amount: 2 }],
  archivedOrders: [{ code: "A", client: "Jose", amount: 900 }, { code: "C", client: "Alternativo", amount: 15, status: "Pendiente" }],
  bankReconciliation: [
    { id: "T1", at: "bad-date", date: "bad-date", amount: 15 },
    { id: "T2", at: "2026-09-30T01:00:00Z", amount: 10 },
    { id: "T3", amount: 1 }
  ]
};
const orderEdge = { clients: [], products: [
  { code: "170", name: "Duplicado", price: 10 },
  { code: "170", name: "Otro", price: 99 },
  { code: "1700", name: "Duplicado", price: 500 },
  { code: "XX", name: "Con acento", price: 5 }
], orders: [{ code: "QA", createdAt: "2026-10-06T12:00:00Z", items: [
  { productCode: "170", name: "Otro", qty: 2 },
  { productCode: "missing", name: "DUPLICADO", qty: 1 },
  { name: "Cón acénto", qty: 1 },
  { productCode: "1700", name: "Duplicado", qty: 1 }
] }] };
const result = { ok: true, sourceBytes: Buffer.byteLength(raw), sourceHash: inputHash, tests: [
  compare(edge, "account-edge-cases"), compare(JSON.parse(raw).state, "accounts-production-copy"),
  compare(orderEdge, "order-exact-match-and-duplicates", orderBefore, orderAfter),
  compare(JSON.parse(raw).state, "orders-production-copy", orderBefore, orderAfter)
] };
assert.equal(hash(fs.readFileSync(source, "utf8")), inputHash, "source file unchanged");
fs.writeFileSync(path.join(root, "docs/PERFORMANCE-167-EQUIVALENCE.json"), JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
