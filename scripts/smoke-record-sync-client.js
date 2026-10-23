"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const crypto = require("node:crypto");
const StateRecordSync = require("../state-record-sync");
const source = fs.readFileSync(require.resolve("../app.js"), "utf8");
const start = source.indexOf("async function pullStateFromServer() {");
const end = source.indexOf("async function pushStateToServer()", start);
const clone = value => JSON.parse(JSON.stringify(value));
async function test(role) {
  const store = StateRecordSync.createStore({ hash: value => crypto.createHash("sha256").update(value).digest("hex"), token: () => crypto.randomBytes(24).toString("hex") });
  let next, url, headerCursor = null, scheduled = 0;
  const ctx = vm.createContext({
    currentUser: { role }, state: { products: [], orders: [] }, StateRecordSync,
    syncPullRetryAt: 0, syncPullInFlight: false, syncPushInFlight: false, pendingPullAfterPush: false,
    syncRecordCursor: null, syncRecordVersion: 0, syncSections: null, syncSectionsVersion: 0,
    syncVersion: 7, sellerCatalogVersion: 7, syncReady: true, STATE_SYNC_TIMEOUT_MS: 45000,
    lastPresenceRenderAt: Date.now(), activeViewId: () => "precios", apiUrl: value => value,
    fetchWithTimeout: async value => { url = value; return { status: 200, ok: true, headers: { get: name => name === "X-State-Cursor" ? headerCursor : null }, json: async () => clone(next) }; },
    setSyncStatus() {}, applyPresencePayload() {}, updateConnectionDiagnostics() {}, applyPresenceToState() {},
    normalizeState: value => value, trackIncomingNotifications() {}, mergeOwnLocationIntoState() {},
    persistLocalMeta() {}, scheduleRenderForCurrentUser() {}, renderOperationalRole: () => true,
    window: { setTimeout() { scheduled++; } }
  });
  vm.runInContext(source.slice(start, end), ctx);
  const initial = { products: [{ codigo_producto: "1", stock_fisico: 10 }], orders: [{ code: "PED-1", total: 5 }] };
  next = store.response(initial, 7, role, "", 0);
  if (role === "admin") { headerCursor = next.cursor; next.cursor = null; }
  await ctx.pullStateFromServer();
  assert(url.includes("version=0"));
  assert(url.includes("bootstrap=shared-v1"));
  assert.deepEqual(clone(ctx.state), initial, "accept full baseline even at the current version");
  assert.equal(ctx.syncRecordVersion, 7);
  if (role === "admin") assert.equal(ctx.syncRecordCursor, headerCursor);
  headerCursor = null;
  const changed = clone(initial); changed.products[0].stock_fisico = 9;
  changed.orders.push({ code: "PED-2", total: 8 });
  next = store.response(changed, 8, role, ctx.syncRecordCursor, 7);
  await ctx.pullStateFromServer();
  assert(url.includes("cursor="));
  assert.deepEqual(clone(ctx.state), changed);
  assert.equal(ctx.syncVersion, 8);
  next = { ...next, baseVersion: 1 };
  await ctx.pullStateFromServer();
  assert.equal(ctx.syncRecordCursor, null);
  assert.equal(scheduled, 1);
  assert.deepEqual(clone(ctx.state), changed, "wrong baseline cannot mutate state");
  next = store.response(changed, 8, role, "", 0);
  await ctx.pullStateFromServer();
  assert(url.includes("version=0"));
  assert.equal(ctx.syncRecordVersion, 8);
  ctx.syncVersion = 10;
  ctx.state.orders.push({ code: "PED-NEW", total: 99 });
  next = store.response(changed, 9, role, ctx.syncRecordCursor, 8);
  await ctx.pullStateFromServer();
  assert.equal(ctx.state.orders.length, 3, "late response cannot overwrite a newer mutation");
  assert.equal(ctx.syncVersion, 10);
}
(async () => {
  for (const role of ["admin", "seller", "driver"]) await test(role);
  console.log("PASS real client pull: full bootstrap, incremental changes, invalid baseline recovery and stale response protection for all roles");
})().catch(error => { console.error(error); process.exitCode = 1; });
