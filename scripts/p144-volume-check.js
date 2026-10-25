"use strict";
const fs = require("node:fs"), crypto = require("node:crypto"), assert = require("node:assert/strict"), path = require("node:path");
const E = require("../collection-correction-engine");
const file = process.argv[2];
if (!file) throw new Error("Provide an isolated snapshot.");
const bytes = fs.readFileSync(file), state = JSON.parse(bytes).state;
const hash = value => crypto.createHash("sha256").update(value).digest("hex");
const snapshotHash = hash(bytes);
const route = state.deliveryRoutes.find(r => r.closure && r.stops.some(s => s.orderCode === "PED-4266"));
assert.ok(route, "diagnosed credit-case fixture available");
const source = E.sources(state, route.id).sources.find(s => s.id === "pedido:PED-4266");
const client = state.clients.find(c => c.name === source.client);
assert.ok(client.saldo_a_favor > 0, "previously blocked by unrelated customer credit");
const input = { routeId: route.id, sourceId: source.id, requestId: "P144-ISOLATED-VOLUME", cashAmount: 0, transferAmount: 0, reason: "Prueba aislada de correccion, no aplicar en produccion" };
const actor = { role: "admin", username: "isolated-test", user: "Prueba aislada" };
const before = Object.fromEntries(Object.entries(state).filter(([key]) => !["clients", "accounts", "collectionCorrections"].includes(key)).map(([key, value]) => [key, hash(JSON.stringify(value))]));
const clientsBefore = hash(JSON.stringify(state.clients.filter(c => c !== client)));
const started = performance.now();
const preview = E.inspect(state, input, actor);
const result = E.apply(state, { ...input, token: preview.token }, actor);
assert.equal(result.state.clients.find(c => c.name === client.name).saldo_a_favor, client.saldo_a_favor);
assert.equal(result.state.clients.find(c => c.name === client.name).balance, preview.impact.balanceAfter);
assert.equal(hash(JSON.stringify(result.state.clients.filter(c => c.name !== client.name))), clientsBefore);
for (const [key, value] of Object.entries(before)) assert.equal(hash(JSON.stringify(result.state[key])), value, key);
assert.equal(hash(JSON.stringify(result.state.accounts.slice(1))), hash(JSON.stringify(state.accounts)), "historical ledger entries preserved");
assert.equal(E.apply(result.state, input, actor).repeated, true);
assert.equal(hash(fs.readFileSync(file)), snapshotHash);
const report = { ok: true, at: new Date().toISOString(), bytes: bytes.length, sourceId: source.id, snapshotHash,
  snapshotUnchanged: true, historicalCollectionsUnchanged: Object.keys(before), otherClientsUnchanged: true,
  unrelatedCustomerCreditUnchanged: true, exactlyOneCorrection: true, elapsedMs: Math.round(performance.now() - started),
  rssMiB: Math.round(process.memoryUsage().rss / 1024 / 1024), scope: "Engine test on local snapshot; no server requests or production mutation." };
fs.writeFileSync(path.join(__dirname, "../docs/P144-volume-results.json"), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
