"use strict";
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const Sync = require("../state-record-sync");
let token = 0;
const store = Sync.createStore({ hash: v => crypto.createHash("sha256").update(v).digest("hex"), token: () => String(++token) });
const state = { orders: [{ code: "A", amount: 10 }], products: [] };
const tabs = [0, 1].map(() => {
  const r = store.response(state, 1, "same-admin", "", 0, "admin");
  return { cursor: r.cursor, version: 1, state: JSON.parse(JSON.stringify(r.state)) };
});
for (let version = 2; version < 32; version++) {
  state.orders[0].amount = version;
  for (const tab of tabs) {
    const r = store.response(state, version, "same-admin", tab.cursor, tab.version, "admin");
    assert.equal(r.partial, true, "another tab of the same user must not invalidate this baseline");
    tab.state = Sync.apply(tab.state, JSON.parse(JSON.stringify(r)));
    assert.deepEqual(tab.state, state);
    Object.assign(tab, { cursor: r.cursor, version });
  }
  assert.equal(store.metrics().entries, 2);
}
const other = store.response({ orders: [] }, 33, "other-admin", tabs[0].cursor, 31, "admin");
assert.equal(other.partial, false);
for (let i = 0; i < 70; i++) store.response(state, 34, "same-admin", "", 0, "admin");
assert.ok(store.metrics().entries <= 32);
console.log("PASS two tabs of one administrator: 60 exact incremental updates, isolated cursors and bounded storage");
