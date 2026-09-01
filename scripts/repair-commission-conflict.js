"use strict";

const fs = require("node:fs");
const path = require("node:path");
const engine = require("../order-engine");

function argument(name, fallback = "") {
  const prefix = `--${name}=`;
  const inline = process.argv.find((value) => value.startsWith(prefix));
  if (inline) return inline.slice(prefix.length);
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : fallback;
}

function normalized(value) {
  return String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();
}

function sameOperationalScope(left, right) {
  const leftUsers = [left.username, left.userLabel].map(normalized).filter(Boolean);
  const rightUsers = [right.username, right.userLabel].map(normalized).filter(Boolean);
  const sameUser = leftUsers.some((value) => rightUsers.includes(value));
  const sameRole = normalized(left.role || "seller") === normalized(right.role || "seller");
  const leftProduct = normalized(left.productCode || left.productName);
  const rightProduct = normalized(right.productCode || right.productName);
  const sameProduct = leftProduct || rightProduct ? leftProduct && leftProduct === rightProduct : true;
  const sameRubro = normalized(left.rubro || "*") === normalized(right.rubro || "*");
  return sameUser && sameRole && sameProduct && sameRubro;
}

const stateFile = path.resolve(argument("state", process.env.STATE_FILE || path.join(__dirname, "..", "data", "demo-state.json")));
const winnerId = argument("winner");
const loserIds = argument("losers", argument("loser")).split(",").map((value) => value.trim()).filter(Boolean);
const apply = process.argv.includes("--apply");
const actor = argument("actor", "Administracion");
const motive = argument("motive", "La ultima modificacion reemplaza configuraciones operativas anteriores.");

if (!winnerId || !loserIds.length) throw new Error("Indicar --winner y --losers (separados por coma).");
const payload = JSON.parse(fs.readFileSync(stateFile, "utf8"));
const state = payload && payload.state ? payload.state : payload;
engine.migrateState(state);
const rules = state.commissionSettings.rules;
const winner = rules.find((rule) => rule.id === winnerId);
if (!winner) throw new Error(`No existe la regla ganadora ${winnerId}.`);
const losers = loserIds.map((id) => {
  const rule = rules.find((entry) => entry.id === id);
  if (!rule) throw new Error(`No existe la regla anterior ${id}.`);
  if (!sameOperationalScope(winner, rule)) throw new Error(`${id} no tiene el mismo alcance operativo que ${winnerId}.`);
  return rule;
});

const ordersBefore = JSON.stringify(state.orders || []);
const changedAt = new Date().toISOString();
const winnerStart = Date.parse(winner.startsAt || changedAt);
const previous = losers.map((rule) => JSON.parse(JSON.stringify(rule)));
losers.forEach((rule) => {
  const ruleStart = Date.parse(rule.startsAt || changedAt);
  rule.active = false;
  rule.status = "Historica";
  rule.endsAt = new Date(Math.max(ruleStart, winnerStart - 1)).toISOString();
  rule.updatedAt = changedAt;
  rule.updatedBy = actor;
  rule.note = `${motive} Reemplazada por ${winner.id}.`;
});
winner.active = true;
winner.status = "Activa";
winner.updatedAt = changedAt;
winner.updatedBy = actor;
winner.note = motive;
state.commissionAudit = Array.isArray(state.commissionAudit) ? state.commissionAudit : [];
state.commissionAudit.unshift({
  id: `COMAUD-REPAIR-${Date.now()}`,
  at: changedAt,
  user: actor,
  action: "COMISION_CONFLICTO_REPARADO",
  ruleId: winner.id,
  previous,
  next: JSON.parse(JSON.stringify(winner)),
  superseded: loserIds,
  motive
});

if (JSON.stringify(state.orders || []) !== ordersBefore) throw new Error("La reparacion intento modificar pedidos historicos.");
const diagnosis = engine.analyzeCommissionRules(state);
if (diagnosis.conflicts.length) throw new Error(`Persisten ${diagnosis.conflicts.length} conflictos de comision.`);

let backup = "";
if (apply) {
  const stamp = changedAt.replace(/[-:.TZ]/g, "").slice(0, 14);
  backup = `${stateFile}.backup-comisiones-${stamp}`;
  fs.copyFileSync(stateFile, backup);
  const temporary = `${stateFile}.${process.pid}.${Date.now()}.tmp`;
  fs.writeFileSync(temporary, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  fs.renameSync(temporary, stateFile);
}

console.log(JSON.stringify({
  ok: true,
  mode: apply ? "APLICADO" : "SIMULACION",
  stateFile,
  backup,
  winner: { id: winner.id, percent: winner.percent, startsAt: winner.startsAt, status: winner.status },
  historical: losers.map((rule) => ({ id: rule.id, percent: rule.percent, endsAt: rule.endsAt, status: rule.status })),
  conflicts: diagnosis.conflicts.length,
  ordersPreserved: true
}, null, 2));
