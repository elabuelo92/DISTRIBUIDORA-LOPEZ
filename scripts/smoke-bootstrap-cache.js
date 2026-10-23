"use strict";
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const zlib = require("node:zlib");
const { createCache } = require("../state-bootstrap-cache");
const { createStore, apply } = require("../state-record-sync");

(async () => {
  let hashes = 0, token = 0, time = 0;
  const store = createStore({ hash: value => { hashes++; return crypto.createHash("sha256").update(value).digest("hex"); }, token: () => String(++token), now: () => time });
  const clients = new Map();
  let source = { orders: [{ code: "A", amount: 25 }], products: [{ codigo_producto: "A", stock: 100 }], other: [1, 2] };
  for (let version = 1; version <= 20; version++) {
    source = JSON.parse(JSON.stringify(source));
    source.orders.unshift({ code: String(version), amount: version });
    if (version % 3 === 0) source.orders.reverse();
    if (version % 5 === 0) delete source.other;
    for (const scope of ["admin1", "admin2", "admin3"]) {
      const previous = clients.get(scope);
      const before = hashes;
      const message = store.response(source, version, scope, previous?.cursor, previous?.version || 0, "admin");
      if (scope !== "admin1") assert.equal(hashes, before, "same version projection is not rehashed");
      const state = apply(previous?.state, JSON.parse(JSON.stringify(message)));
      assert.deepEqual(state, source);
      clients.set(scope, { state, cursor: message.cursor, version });
    }
  }
  const sharedBytes = store.metrics().estimatedBytes;
  assert.equal(store.metrics().entries, 3);
  assert.equal(store.metrics().reusedSnapshots, 40);
  const stolen = store.response({ orders: [] }, 20, "seller", clients.get("admin1").cursor, 20);
  assert.equal(stolen.partial, false);
  assert.deepEqual(stolen.state, { orders: [] });
  assert.ok(store.metrics().estimatedBytes > sharedBytes);
  time += 300001;
  store.response({ orders: [] }, 21, "seller", stolen.cursor, 20);
  assert.equal(store.metrics().entries, 1);
  assert.ok(store.metrics().estimatedBytes < sharedBytes, "shared storage released once after expiry");

  let serializations = 0;
  const cache = createCache({ now: () => time });
  const payload = { version: 1, cursor: null, baseVersion: 0, partial: false, state: source };
  const create = () => { serializations++; return payload; };
  const bodies = await Promise.all([cache.get(1, "admin", create), cache.get(1, "admin", create)]);
  assert.equal(serializations, 1);
  assert.equal(bodies[0], bodies[1]);
  assert.deepEqual(JSON.parse(zlib.gunzipSync(bodies[0])), payload);
  assert.equal(cache.metrics().bytes, bodies[0].length, "only compressed bytes retained");
  await cache.get(1, "depot", () => ({ state: { orders: [] } }));
  await cache.get(2, "admin", create);
  assert.equal(cache.metrics().entries, 1, "invalidated on any state version change");
  time += 60001;
  await cache.get(2, "admin", create);
  assert.equal(serializations, 3);
  const tiny = createCache({ maxBytes: 1 });
  await tiny.get(1, "admin", create);
  assert.equal(tiny.metrics().bytes, 0);
  assert.equal(tiny.metrics().entries, 0);
  const one = createCache({ maxEntries: 1 });
  await one.get(1, "admin", create);
  await one.get(1, "depot", create);
  assert.equal(one.metrics().entries, 1);
  const failure = createCache({ gzip: async () => { throw new Error("compression failed"); } });
  await assert.rejects(failure.get(1, "admin", create), /compression failed/);
  assert.equal(failure.metrics().entries, 0);
  let release;
  const race = createCache({ gzip: raw => new Promise(resolve => { release = () => resolve(zlib.gzipSync(raw)); }) });
  const stale = race.get(1, "admin", create), releaseOld = release;
  const fresh = race.get(2, "admin", () => ({ version: 2 }));
  release();
  const freshBody = await fresh;
  releaseOld();
  await stale;
  assert.equal(await race.get(2, "admin", create), freshBody, "old in-flight compression cannot replace new version");
  console.log("PASS bootstrap: exact projections/deltas, per-user cursors, shared fingerprint accounting, compressed-only bounded cache, expiry, version invalidation, races and failure cleanup");
})().catch(error => { console.error(error); process.exitCode = 1; });
