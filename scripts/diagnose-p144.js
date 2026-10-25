"use strict";
const fs = require("node:fs");
const crypto = require("node:crypto");
const Engine = require("../collection-correction-engine");
const file = process.argv[2];
if (!file) throw new Error("Provide an isolated state snapshot path.");
const raw = fs.readFileSync(file);
const state = JSON.parse(raw).state;
const counts = {}, examples = {};
let accepted = 0;
for (const route of state.deliveryRoutes || []) {
  if (!route.closure) continue;
  for (const source of Engine.sources(state, route.id).sources) {
    try {
      Engine.inspect(state, { routeId: route.id, sourceId: source.id,
        cashAmount: Math.round(Number(source.original.cashAmount ?? source.original.cash ?? 0) * 100) / 100,
        transferAmount: Math.round(Math.max(Number(source.original.transferAmount ?? source.original.transfer ?? 0), Number(source.original.transferPendingAmount || 0)) * 100) / 100,
        reason: "Diagnostico aislado sin aplicar", bank: "Prueba", reference: "Prueba", proofHash: "diagnostic"
      }, { role: "admin" });
      accepted++;
    } catch (error) {
      counts[error.message] = (counts[error.message] || 0) + 1;
      examples[error.message] ||= { routeId: route.id, sourceId: source.id,
        cash: source.original.cashAmount ?? source.original.cash,
        transfer: source.original.transferAmount ?? source.original.transfer,
        pending: source.original.transferPendingAmount };
    }
  }
}
const hash = bytes => crypto.createHash("sha256").update(bytes).digest("hex");
const result = { at: new Date().toISOString(), accepted, counts, examples,
  snapshotSha256: hash(raw), snapshotUnchanged: hash(raw) === hash(fs.readFileSync(file)),
  scope: "Read-only local preview. No apply, no server request, no historical data rewrite." };
if (process.argv[3]) fs.writeFileSync(process.argv[3], JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
