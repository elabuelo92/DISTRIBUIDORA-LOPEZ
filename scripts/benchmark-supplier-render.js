"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { execFileSync } = require("node:child_process");
const root = path.join(__dirname, "..");
const before = execFileSync("git", ["show", "7b3ecdc:app.js"], { cwd: root, encoding: "utf8", maxBuffer: 8 * 1024 * 1024 });
const after = fs.readFileSync(path.join(root, "app.js"), "utf8");
function load(source, state) {
  const context = vm.createContext({ state });
  for (const [start, end] of [
    ["function numeric(", "function normalizeWorkday("],
    ["function normalizeSearchText(", "function normalizeText("],
    ["function taxIdKey(", "function mixedEntityRecentMovements("]
  ]) vm.runInContext(source.slice(source.indexOf(start), source.indexOf(end, source.indexOf(start))), context);
  return context;
}
const state = {
  clients: Array.from({ length: 1314 }, (_, i) => ({ name: `Cliente ${i}`, cuit: String(20000000000 + i) })),
  suppliers: Array.from({ length: 20 }, (_, i) => ({ name: `Proveedor ${i}`, cuit: String(20000000000 + i), totalPurchased: i * 31.2 })),
  orders: Array.from({ length: 709 }, (_, i) => ({ client: `Cliente ${i % 100}`, amount: i * 1.27 }))
};
const old = load(before, state);
const next = load(after, state);
const normalize = (value) => JSON.parse(JSON.stringify(value));
assert.deepEqual(normalize(next.buildMixedEntities()), normalize(old.buildMixedEntities()));
for (const fixture of [
  { clients: [], suppliers: [], orders: [] },
  { clients: [{ name: "Jose" }, { name: "JOSE", cuit: "20333333333" }], suppliers: [{ name: " jose " }, { name: "Otro", cuit: "20-33333333-3" }], orders: [{ client: " JOSE ", amount: 10 }, { client: "jose", amount: -2 }, { client: "Jose", amount: "3.5" }] }
]) assert.deepEqual(normalize(load(after, fixture).buildMixedEntities()), normalize(load(before, fixture).buildMixedEntities()));
function measure(fn) { const start = performance.now(); const result = fn(); return { ms: Math.round((performance.now() - start) * 100) / 100, result }; }
const baseline = measure(() => ({ count: old.buildMixedEntities().length, rows: state.suppliers.map((s) => old.mixedEntityForSupplier(s)) }));
const optimized = measure(() => {
  const entities = next.buildMixedEntities();
  const index = new Map(entities.map((e) => [e.key, e]));
  return { count: entities.length, rows: state.suppliers.map((s) => index.get(next.mixedEntityKey(s)) || null) };
});
assert.deepEqual(normalize(optimized.result), normalize(baseline.result));
const render = after.slice(after.indexOf("function renderSuppliers()"), after.indexOf("const SUPPLIER_EXPORT_HEADERS"));
assert.equal((render.match(/buildMixedEntities\(\)/g) || []).length, 1);
assert.ok(!render.includes("mixedEntityForSupplier(supplier)"));
console.log(JSON.stringify({ ok: true, scope: "supplier relationship computation only; synthetic data, not full browser render or API", clients: state.clients.length, suppliers: state.suppliers.length, orders: state.orders.length, beforeMs: baseline.ms, afterMs: optimized.ms, beforeBuilds: 21, afterBuilds: 1, unchangedResults: true }, null, 2));
