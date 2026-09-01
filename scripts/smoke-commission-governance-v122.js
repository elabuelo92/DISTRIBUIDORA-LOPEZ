"use strict";

const assert = require("node:assert/strict");
const engine = require("../order-engine");

function baseState() {
  const state = { products: [], orders: [], sellers: [{ name: "Axel", username: "david" }], commissionAudit: [] };
  engine.migrateState(state);
  state.commissionSettings.rules = [];
  return state;
}

const conflictState = baseState();
conflictState.commissionSettings.rules = [
  { id: "AXEL-BY-USER", role: "seller", username: "david", userLabel: "Axel", rubro: "*", percent: 5, startsAt: "2026-08-14T03:00:00.000Z", active: true, status: "Activa" },
  { id: "AXEL-BY-NAME", role: "seller", userLabel: "Axel", rubro: "*", percent: 4, startsAt: "2026-09-01T00:00:00.000Z", active: true, status: "Activa" }
];
const diagnosis = engine.analyzeCommissionRules(conflictState);
assert.equal(diagnosis.conflicts.length, 1, "detecta a Axel aunque una regla use username y otra nombre");

assert.throws(() => engine.saveCommissionRule(conflictState, {
  role: "seller",
  userName: "Axel",
  rubro: "*",
  percent: 6,
  startsAt: "2026-09-01T00:00:00.000Z",
  motive: "Intento duplicado"
}, { name: "Admin" }), /superpuesta/, "impide una tercera regla activa superpuesta");

const repairedConflict = engine.saveCommissionRule(conflictState, {
  id: "AXEL-BY-NAME",
  role: "seller",
  userName: "Axel",
  rubro: "*",
  percent: 4,
  startsAt: "2026-09-01T00:00:00.000Z",
  motive: "La ultima modificacion reemplaza la configuracion anterior"
}, { name: "Admin", username: "admin" });
assert.equal(repairedConflict.rule.percent, 4);
assert.equal(engine.analyzeCommissionRules(conflictState).conflicts.length, 0, "la edicion sanea superposiciones previas");
assert.equal(conflictState.commissionSettings.rules.filter((rule) => rule.status === "Activa").length, 1, "queda una sola regla operativa");
assert.equal(conflictState.commissionSettings.rules.find((rule) => rule.id === "AXEL-BY-USER").status, "Historica", "la regla anterior queda solo en historial");

const versionState = baseState();
versionState.commissionSettings.rules = [
  { id: "AXEL-RESTO", role: "seller", username: "david", userLabel: "Axel", rubro: "*", percent: 4, startsAt: "2026-08-01T00:00:00.000Z", active: true, status: "Activa" }
];
const versioned = engine.saveCommissionRule(versionState, {
  id: "AXEL-RESTO",
  role: "seller",
  username: "david",
  userName: "Axel",
  rubro: "*",
  percent: 5,
  startsAt: "2026-09-01T00:00:00.000Z",
  motive: "Nuevo porcentaje septiembre"
}, { name: "Admin", username: "admin" });
assert.equal(versioned.rule.percent, 5);
assert.notEqual(versioned.rule.id, "AXEL-RESTO", "la nueva vigencia recibe otro ID");
assert.equal(versionState.commissionSettings.rules.filter((rule) => rule.status === "Activa").length, 1, "queda una sola regla activa");
assert.equal(versionState.commissionSettings.rules.find((rule) => rule.id === "AXEL-RESTO").status, "Historica");

versionState.orders = [
  { code: "AGO", seller: "Axel", createdAt: "2026-08-31T20:00:00.000Z", commissions: { seller: { user: "Axel", baseAmount: 1000, cigarettes: 0, merchandise: 40, total: 40 } } },
  { code: "SEP", seller: "Axel", createdAt: "2026-09-01T12:00:00.000Z", commissions: { seller: { user: "Axel", baseAmount: 1000, cigarettes: 0, merchandise: 50, total: 50 } } }
];
const august = engine.summarizeCommissions(versionState, { role: "seller", user: "Axel", dateFrom: "2026-08-01T00:00:00.000Z", dateTo: "2026-08-31T23:59:59.999Z" });
const september = engine.summarizeCommissions(versionState, { role: "seller", user: "Axel", dateFrom: "2026-09-01T00:00:00.000Z", dateTo: "2026-09-30T23:59:59.999Z" });
assert.equal(august[0].total, 40, "agosto conserva su comision historica");
assert.equal(september[0].total, 50, "septiembre comienza con su propio acumulado");
assert.equal(versionState.orders.length, 2, "el cambio de mes no elimina ventas");

console.log(JSON.stringify({
  ok: true,
  version: "8790-122",
  detectedConflicts: diagnosis.conflicts.length,
  duplicateRejected: true,
  contaminatedEditRepaired: true,
  activeRulesAfterEdit: versionState.commissionSettings.rules.filter((rule) => rule.status === "Activa").length,
  historicalRulesAfterEdit: versionState.commissionSettings.rules.filter((rule) => rule.status === "Historica").length,
  augustCommission: august[0].total,
  septemberCommission: september[0].total
}, null, 2));
