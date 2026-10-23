"use strict";
const fs = require("node:fs");
const crypto = require("node:crypto");
function normalize(value) { return String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase(); }
function audit(state) {
  const rules = state.commissionSettings?.rules || [];
  const byId = new Map(rules.map(rule => [rule.id, rule]));
  const mismatches = [], unusualRates = [], twentyPercent = [];
  const seen = new Set();
  for (const order of [...(state.orders || []), ...(state.archivedOrders || [])]) {
    if (seen.has(order.code)) continue;
    seen.add(order.code);
    for (const role of ["seller", "driver"]) {
      for (const [index, line] of (order.commissions?.[role]?.lines || []).entries()) {
        const source = line.ruleSnapshot || byId.get(line.ruleId);
        const item = order.items?.[index] || {};
        const code = line.productCode || item.productCode || item.codigo_producto || "";
        const name = line.productName || item.name || "";
        const record = { orderCode: order.code, at: order.createdAt, role, user: order.commissions[role].user,
          productCode: code, productName: name, percent: line.percent, baseAmount: line.baseAmount,
          commission: line.commission, ruleId: line.ruleId };
        if (Number(line.percent) === 20) twentyPercent.push(record);
        if (Math.abs(Number(line.percent) - 2.88) < 0.0001) unusualRates.push(record);
        if (source?.productCode || source?.productName) {
          const matches = source.productCode ? normalize(source.productCode) === normalize(code)
            : normalize(source.productName) === normalize(name);
          if (!matches) mismatches.push({ ...record, intendedProductCode: source.productCode || "",
            intendedProductName: source.productName || "", snapshotEvidence: Boolean(line.ruleSnapshot) });
        }
      }
    }
  }
  const codes = [...new Set(mismatches.map(row => row.orderCode))];
  return { generatedAt: new Date().toISOString(), readOnly: true,
    sourceOrders: seen.size, rulesAt20: rules.filter(rule => Number(rule.percent) === 20),
    mismatchLines: mismatches.length, mismatchOrders: codes.length,
    mismatchRecordedCommission: mismatches.reduce((sum, row) => sum + (Number(row.commission) || 0), 0),
    stored288Lines: unusualRates.length, twentyPercentLines: twentyPercent.length,
    mismatches, unusualRates, twentyPercent,
    note: "Solo diagnostico. No calcula un importe a descontar ni modifica ventas o liquidaciones. Revisar cada vigencia y liquidacion antes de una correccion auditada." };
}
if (require.main === module) {
  const [file, output] = process.argv.slice(2);
  if (!file || !output) throw new Error("Uso: node audit-commission-product-scope.js estado.json informe.json");
  const raw = fs.readFileSync(file);
  const payload = JSON.parse(raw);
  const report = { sourceSha256: crypto.createHash("sha256").update(raw).digest("hex"), version: payload.version, ...audit(payload.state || payload) };
  fs.writeFileSync(output, JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ ...report, mismatches: report.mismatches.slice(0, 8),
    twentyPercent: report.twentyPercent.slice(0, 4), unusualRates: report.unusualRates.slice(0, 4) }, null, 2));
}
module.exports = { audit };
