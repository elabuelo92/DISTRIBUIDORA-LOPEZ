const fs = require("node:fs");
const vm = require("node:vm");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const path = require("node:path");
const source = fs.readFileSync(path.join(__dirname, "..", "server.js"), "utf8");
const start = source.indexOf("function stateSectionsResponse(");
const end = source.indexOf("function sendProjectedStateResponse(", start);
assert(start >= 0 && end > start);
const ctx = vm.createContext({ Buffer, crypto, stateForUser: (state, user) => user.role === "admin" ? state : { orders: state.orders.filter(order => order.seller === user.name) } });
vm.runInContext(source.slice(start, end), ctx);
const admin = { role: "admin" };
const state = { orders: [{ id: 1, seller: "A", qty: 2 }], historical: "x".repeat(1000000), removedLater: [1], unicode: "Cordoba / \u00f1", empty: null };
const send = (state, version, previous, user = admin) => JSON.parse(ctx.stateSectionsResponse({ state, version }, user, previous, version - 1));
const first = send(state, 1, null);
assert.equal(first.partial, false);
assert.deepEqual(first.state, state);
const nextState = { ...state, orders: [{ id: 1, seller: "A", qty: 3 }], added: [4] };
delete nextState.removedLater;
const next = send(nextState, 2, first.sections);
assert.equal(next.partial, true);
assert.equal(Object.hasOwn(next.state, "historical"), false);
assert.deepEqual(next.removed, ["removedLater"]);
const merged = { ...first.state, ...next.state };
next.removed.forEach(key => delete merged[key]);
assert.deepEqual(merged, nextState);
assert(JSON.stringify(next).length < JSON.stringify(first).length / 100);
assert.equal(state.orders[0].qty, 2);
const seller = send(nextState, 2, first.sections, { role: "seller", name: "B" });
assert.deepEqual(seller.state.orders, []);
assert.deepEqual(Object.keys(seller.sections), ["orders"]);
const fallback = send(nextState, 2, null);
assert.deepEqual(fallback.state, nextState);
console.log("PASS: full baseline, changed sections, deletions, role projection, fallback, no mutation");

async function clientChecks() {
  const app = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");
  const begin = app.indexOf("async function pullStateFromServer() {");
  const finish = app.indexOf("async function pushStateToServer()", begin);
  let response;
  let requested;
  const client = vm.createContext({
    currentUser: admin, syncPullRetryAt: 0, syncPullInFlight: false, syncPushInFlight: false,
    syncVersion: 0, sellerCatalogVersion: 0, syncSections: null, syncSectionsVersion: 0,
    syncReady: true, pendingPullAfterPush: false, lastPresenceRenderAt: Date.now(),
    STATE_SYNC_TIMEOUT_MS: 45000, state: {}, activeViewId: () => "stock", apiUrl: value => value,
    fetchWithTimeout: async url => { requested = url; return { status: 200, ok: true, json: async () => structuredClone(response) }; },
    normalizeState: value => value, trackIncomingNotifications() {}, applyPresenceToState() {},
    mergeOwnLocationIntoState() {}, persistLocalMeta() {}, scheduleRenderForCurrentUser() {},
    setSyncStatus() {}, applyPresencePayload() {}, updateConnectionDiagnostics() {}
  });
  vm.runInContext(app.slice(begin, finish), client);
  response = first;
  await client.pullStateFromServer();
  assert.deepEqual(JSON.parse(JSON.stringify(client.state)), state);
  assert.equal(client.syncSectionsVersion, 1);
  response = next;
  await client.pullStateFromServer();
  assert(requested.includes("sections="));
  assert.deepEqual(JSON.parse(JSON.stringify(client.state)), nextState);
  assert.equal(client.syncSectionsVersion, 2);
  response = { ...next, baseVersion: 1, version: 3 };
  await client.pullStateFromServer();
  assert.equal(client.syncVersion, 2, "Reject a patch with stale baseline");
  assert.equal(client.syncSections, null, "Force full recovery after stale baseline");
  response = send({ ...nextState, newer: true }, 4, null);
  await client.pullStateFromServer();
  assert(!requested.includes("&sections="));
  assert.equal(client.state.newer, true);
  client.syncSections = Object.fromEntries(Array.from({ length: 100 }, (_, i) => [`field${i}`, "a".repeat(64)]));
  response = send({ ...nextState, newer: true }, 5, null);
  await client.pullStateFromServer();
  assert(!requested.includes("&sections="), "Oversized manifests use a full response instead of exceeding proxy URL limits");
  assert.equal(client.syncVersion, 5);
  console.log("PASS: frontend full/partial merge, deletions, stale baseline and recovery");
}
clientChecks().catch(error => { console.error(error); process.exitCode = 1; });
