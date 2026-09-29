"use strict";
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const assert = require("node:assert/strict");
const source = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");
const start = source.indexOf("async function changeClientGpsReview(");
const end = source.indexOf("function newMobileClientOperationId(", start);
assert(start >= 0 && end > start);
assert(source.includes('data-client-gps-action="cancel"'));
let reason = "Marcado por error", confirm = true, calls = [], notices = [];
const context = vm.createContext({
  currentClientPageRecords: [{ codigo_cliente: "C-TEST", name: "Prueba", updatedAt: "v1", gpsReview: { status: "needs_correction" } }],
  window: { prompt: () => reason, confirm: () => confirm, alert() {} },
  postOperationalAction: async (url, body) => calls.push({ url, body }),
  renderClients() {}, showCompactNotice: message => notices.push(message)
});
vm.runInContext(source.slice(start, end), context);
(async () => {
  await context.changeClientGpsReview("C-TEST", "cancel");
  assert.equal(calls.length, 1);
  assert.deepEqual(JSON.parse(JSON.stringify(calls[0])), { url: "api/clients/C-TEST/gps-review", body: { action: "cancel", reason, expectedUpdatedAt: "v1" } });
  assert.match(notices[0], /correccion cancelada/);
  confirm = false;
  await context.changeClientGpsReview("C-TEST", "cancel");
  confirm = true; reason = " ";
  await context.changeClientGpsReview("C-TEST", "cancel");
  reason = "x".repeat(501);
  await context.changeClientGpsReview("C-TEST", "cancel");
  assert.equal(calls.length, 1, "Cancelled confirmations and invalid reasons must not submit");
  console.log("OK: cancel button, reason, confirmation, version guard and notice");
})().catch(error => { console.error(error); process.exitCode = 1; });
