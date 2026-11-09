const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const InventoryValuation = require("../inventory-valuation-engine");

const source = [
  { code: "A", name: "Presto 2", rubric: "Limpieza", physical: 10, reserved: 3, available: 7, unitCost: 100 },
  { code: "B", name: "Trapo", rubric: "Limpieza", physical: 5, reserved: 0, available: 5, unitCost: 0 },
  { code: "C", name: "Pila", rubric: "Accesorios", physical: 2, reserved: 1, available: 1, unitCost: 50 },
  { code: "D", name: "Sin stock", rubric: "Accesorios", physical: 0, reserved: 0, available: 0, unitCost: 0 }
];
const untouched = structuredClone(source);
const report = InventoryValuation.calculate(source);

assert.equal(report.rows.length, 4);
assert.equal(report.totals.physical, 17);
assert.equal(report.totals.reserved, 4);
assert.equal(report.totals.available, 13);
assert.equal(report.totals.value, 1100);
assert.equal(report.totals.missingCostProducts, 1);
assert.equal(report.totals.missingCostUnits, 5);
assert.equal(report.groups.find((group) => group.rubric === "Limpieza").value, 1000);
assert.equal(report.groups.find((group) => group.rubric === "Accesorios").value, 100);
assert.equal(report.rows.find((row) => row.code === "B").value, null);
assert.deepEqual(source, untouched, "the report must not mutate products or stock");

const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
assert.match(html, /inventory-valuation-engine\.js\?v=8790-203/);
for (const id of ["statsInventoryValuationPanel", "inventoryValuationKpis", "inventoryValuationGroups", "inventoryValuationProducts"]) {
  assert.equal((html.match(new RegExp(`id="${id}"`, "g")) || []).length, 1, `expected one ${id} node`);
}

console.log("OK: valuation math, rubric totals, missing-cost handling, immutability, and UI wiring");
