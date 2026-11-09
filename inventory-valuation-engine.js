(function initInventoryValuation(root, factory) {
  const engine = factory();
  if (typeof module === "object" && module.exports) module.exports = engine;
  if (root) root.InventoryValuation = engine;
})(typeof globalThis !== "undefined" ? globalThis : this, function buildInventoryValuation() {
  "use strict";

  function amount(value) {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  }

  function calculate(records = []) {
    const rows = records.map((record) => {
      const physical = amount(record.physical);
      const reserved = Math.min(physical, amount(record.reserved));
      const available = Math.max(0, Number.isFinite(Number(record.available))
        ? Number(record.available)
        : physical - reserved);
      const unitCost = amount(record.unitCost);
      const hasCost = unitCost > 0;
      return {
        code: String(record.code || ""),
        name: String(record.name || record.code || "Producto sin nombre"),
        rubric: String(record.rubric || "S/D").trim() || "S/D",
        physical,
        reserved,
        available,
        unitCost: hasCost ? unitCost : null,
        value: hasCost ? physical * unitCost : null,
        hasCost
      };
    });

    const groups = new Map();
    const totals = { products: rows.length, physical: 0, reserved: 0, available: 0, value: 0, missingCostProducts: 0, missingCostUnits: 0 };
    for (const row of rows) {
      totals.physical += row.physical;
      totals.reserved += row.reserved;
      totals.available += row.available;
      if (row.hasCost) totals.value += row.value;
      else if (row.physical > 0) {
        totals.missingCostProducts += 1;
        totals.missingCostUnits += row.physical;
      }

      const group = groups.get(row.rubric) || { rubric: row.rubric, products: 0, physical: 0, reserved: 0, available: 0, value: 0, missingCostProducts: 0 };
      group.products += 1;
      group.physical += row.physical;
      group.reserved += row.reserved;
      group.available += row.available;
      if (row.hasCost) group.value += row.value;
      else if (row.physical > 0) group.missingCostProducts += 1;
      groups.set(row.rubric, group);
    }

    rows.sort((left, right) => left.rubric.localeCompare(right.rubric, "es")
      || left.name.localeCompare(right.name, "es")
      || left.code.localeCompare(right.code, "es"));
    return {
      rows,
      totals,
      groups: [...groups.values()].sort((left, right) => left.rubric.localeCompare(right.rubric, "es"))
    };
  }

  return { calculate };
});
