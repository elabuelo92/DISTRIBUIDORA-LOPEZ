const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const assert = require("node:assert/strict");
const { performance } = require("node:perf_hooks");
const source = fs.readFileSync(path.join(__dirname, "..", "order-engine.js"), "utf8");
const start = source.indexOf("  function localTraceParts(value) {");
const end = source.indexOf("  function normalizeText(", start);
assert(start >= 0 && end > start);
const originalFunction = `function localTraceParts(value) {
  const date = new Date(validIso(value));
  return { date: date.toLocaleDateString("es-AR", { timeZone: "America/Argentina/Buenos_Aires" }),
    time: date.toLocaleTimeString("es-AR", { timeZone: "America/Argentina/Buenos_Aires", hour: "2-digit", minute: "2-digit", second: "2-digit" }) };
}
`;
const oldSource = source.slice(0, start) + originalFunction + source.slice(end);
function engine(code) {
  class FixedDate extends Date {
    constructor(...args) { super(...(args.length ? args : ["2026-09-29T03:00:00.000Z"])); }
    static now() { return Date.parse("2026-09-29T03:00:00.000Z"); }
  }
  const context = vm.createContext({ module: { exports: {} }, Date: FixedDate });
  vm.runInContext(code, context);
  return context.module.exports;
}
const oldEngine = engine(oldSource), newEngine = engine(source);
const fixture = {
  products: [], clients: [], orders: Array.from({ length: 1020 }, (_, index) => {
    const at = new Date(Date.UTC(2000 + index % 30, index % 12, 1 + index % 27, index % 24, index % 60)).toISOString();
    return { code: `TRACE-${index}`, client: `Client ${index}`, seller: "Seller", status: "Cobrado", createdAt: at,
      items: [], trace: [{ status: "Pendiente", at, user: "Seller", note: "Original", gps: { lat: -31.4, lng: -64.18 } }] };
  })
};
const before = structuredClone(fixture), after = structuredClone(fixture);
let t = performance.now(); oldEngine.migrateState(before); const beforeMs = performance.now() - t;
t = performance.now(); newEngine.migrateState(after); const afterMs = performance.now() - t;
// Canonical JSON compares results from the separate VM realms.
assert.deepEqual(JSON.parse(JSON.stringify(after)), JSON.parse(JSON.stringify(before)));
const again = structuredClone(after);
newEngine.migrateState(again);
assert.deepEqual(JSON.parse(JSON.stringify(again)), JSON.parse(JSON.stringify(after)));
console.log(JSON.stringify({ ok: true, orders: 1020, beforeMs, afterMs, identical: true }));
