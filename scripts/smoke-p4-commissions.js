"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const engine = require("../order-engine");
const source = fs.readFileSync(require.resolve("../app.js"), "utf8");
function extract(name) {
  const start = source.indexOf(`function ${name}(`);
  assert.ok(start >= 0, name);
  const end = source.indexOf("\nfunction ", start + 1);
  return source.slice(start, end);
}
const fields = { role: "seller", userName: "", scopeType: "product", productName: "Trapo", percent: "20", priority: "200", motive: "Prueba" };
const state = {
  sellers: [{ name: "Sofia Benitez" }, { name: "Ruggero", username: "ruggero" }],
  products: [{ codigo_producto: "T", name: "Trapo", rubro: "Limpieza" }],
  orders: [{ code: "LIQ", commissionLiquidated: true, commissions: { seller: { total: 900 } } }],
  commissionSettlements: [{ id: "PAGO", amount: 900 }]
};
const context = vm.createContext({ state, demoUsers: [{ name: "Kevin Guibert", username: "kevin", role: "seller" }],
  normalizeSearchText: (s) => String(s || "").trim().toLowerCase(),
  byId: () => ({}), FormData: class { get(key) { return fields[key]; } } });
for (const name of ["commissionPeople", "commissionRulePayload", "localTraceParts"]) vm.runInContext(extract(name), context);
const payload = vm.runInContext("commissionRulePayload()", context);
assert.equal(payload.userLabel, "");
assert.equal(payload.username, "");
const before = JSON.stringify([state.orders, state.commissionSettlements]);
engine.saveCommissionRule(state, payload, { name: "Test" });
for (const seller of ["Sofia Benitez", "Ruggero", "Kevin Guibert"]) {
  const result = engine.previewCommissionRule(state, { seller, productName: "Trapo", rubro: "Limpieza", baseAmount: 1000 });
  assert.equal(result.percent, 20, seller);
  assert.equal(result.commission, 200, seller);
}
assert.equal(JSON.stringify([state.orders, state.commissionSettlements]), before);
fields.userName = "Kevin Guibert";
assert.equal(vm.runInContext("commissionRulePayload().username", context), "kevin");
fields.userName = "No existe";
assert.throws(() => vm.runInContext("commissionRulePayload()", context), /valido/);
assert.equal(vm.runInContext('localTraceParts("2026-10-18T02:00:00Z").date', context), "17/10/2026");
assert.ok(!source.includes("formatDateTimeParts("));
for (const id of ["commissionRulesSearch", "commissionRoleFilter", "commissionStatusFilter"]) {
  const handler = source.slice(source.indexOf(`byId("${id}").addEventListener`)).split("});")[0];
  assert.ok(handler.includes("renderCommissionRulesTable()"));
  assert.ok(!handler.includes("renderCommissionsModule()"));
}
console.log("PASS P4: regla Todos, Kevin, vendedores, fecha de pagos, filtros y liquidaciones intactas.");
