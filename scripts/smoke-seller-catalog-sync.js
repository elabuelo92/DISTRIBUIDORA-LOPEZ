"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const path = require("node:path");
const source = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");
const pull = source.slice(source.indexOf("async function pullStateFromServer()"), source.indexOf("async function pushStateToServer()"));
const patches = source.slice(source.indexOf("function applyOrderPatches("), source.indexOf("function applyOperationalPatches("));
let response;
let requested;
let renders = 0;
const context = vm.createContext({
  currentUser: { role: "seller" }, syncVersion: 100, sellerCatalogVersion: 100,
  syncPullInFlight: false, syncPushInFlight: false, pendingPullAfterPush: false,
  state: { clients: [{ name: "Cliente", gpsReview: null }], orders: [] },
  STATE_SYNC_TIMEOUT_MS: 45000, lastPresenceRenderAt: 0,
  activeViewId: () => "preventa", apiUrl: (url) => url,
  fetchWithTimeout: async (url) => { requested = url; return { status: 200, ok: true, json: async () => response }; },
  applyPresencePayload() {}, setSyncStatus() {}, updateConnectionDiagnostics() {},
  normalizeState: (state) => state, trackIncomingNotifications() {}, applyPresenceToState() {},
  mergeOwnLocationIntoState() {}, persistLocalMeta() {}, refreshMobilePresence() {},
  scheduleRenderForCurrentUser: () => { renders += 1; },
  OrderEngine: { buildShortageList: () => [] }
});
vm.runInContext(patches + pull, context);
(async () => {
  // Admin marks GPS at 101; the seller receives an unrelated order patch at 102.
  context.applyOrderPatches([{ code: "TEST-1" }], 102);
  response = { version: 102, state: { clients: [{ name: "Cliente", gpsReview: { status: "needs_correction" } }], orders: [{ code: "TEST-1" }] } };
  await context.pullStateFromServer();
  assert.match(requested, /version=100/);
  assert.equal(context.state.clients[0].gpsReview.status, "needs_correction");
  assert.equal(context.sellerCatalogVersion, 102);
  response = { version: 103, state: { clients: [{ name: "Cliente", gpsReview: { status: "approved" } }], orders: [] } };
  await context.pullStateFromServer();
  assert.match(requested, /version=102/);
  assert.equal(context.state.clients[0].gpsReview.status, "approved");
  context.syncVersion = 105;
  response = { version: 104, state: { clients: [{ gpsReview: null }], orders: [] } };
  await context.pullStateFromServer();
  assert.equal(context.sellerCatalogVersion, 103);
  assert.equal(context.state.clients[0].gpsReview.status, "approved");
  assert.equal(context.syncVersion, 105);
  assert.ok(renders >= 3);
  console.log("OK: GPS mark/approval survives interleaved order patches; stale snapshot rejected.");
})().catch((error) => { console.error(error); process.exitCode = 1; });
