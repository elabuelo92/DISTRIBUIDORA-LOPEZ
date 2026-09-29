const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const path = require("node:path");
const source = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");
const start = source.indexOf("async function pullStateFromServer() {");
const end = source.indexOf("async function pushStateToServer()", start);
assert(start >= 0 && end > start);
let calls = 0;
let logins = 0;
let response;
const context = vm.createContext({
  currentUser: { role: "admin" }, syncPullRetryAt: 0,
  syncSections: null, syncSectionsVersion: 0,
  syncPullInFlight: false, syncPushInFlight: false, pendingPullAfterPush: false,
  syncVersion: 7, sellerCatalogVersion: 7, syncReady: true,
  lastPresenceRenderAt: Date.now(), STATE_SYNC_TIMEOUT_MS: 45000,
  activeViewId: () => "precios", apiUrl: value => value,
  fetchWithTimeout: async () => { calls++; return response; },
  setSyncStatus() {}, applyPresencePayload() {}, updateConnectionDiagnostics() {},
  applyPresenceToState() {}, refreshMobilePresence() {}, renderSessionMonitor() {}, renderRoutes() {},
  stopRealtimeChannels() {}, showLogin() { logins++; }
});
vm.runInContext(source.slice(start, end), context);
async function main() {
  response = { status: 503, ok: false, headers: { get: key => key === "Retry-After" ? "30" : "1" } };
  const before = Date.now();
  await context.pullStateFromServer();
  assert.equal(calls, 1);
  assert(context.syncPullRetryAt >= before + 30000);
  assert.equal(context.syncReady, true);
  assert.equal(context.currentUser.role, "admin");
  assert.equal(context.syncPullInFlight, false);
  await context.pullStateFromServer();
  assert.equal(calls, 1, "Cooldown must prevent repeated requests");
  context.syncPullRetryAt = 0;
  response = { status: 200, ok: true, json: async () => ({ unchanged: true, version: 8 }) };
  await context.pullStateFromServer();
  assert.equal(calls, 2);
  assert.equal(context.syncVersion, 8);
  assert.equal(context.syncPullRetryAt, 0);
  response = { status: 401, ok: false };
  await context.pullStateFromServer();
  assert.equal(logins, 1);
  assert.equal(context.currentUser, null);
  await context.pullStateFromServer();
  assert.equal(calls, 3, "Logged-out sessions must not pull state");
  console.log("PASS: busy cooldown, session preservation, recovery and expired session");
}
main().catch(error => { console.error(error); process.exitCode = 1; });
