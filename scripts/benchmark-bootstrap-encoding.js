"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const crypto = require("node:crypto");
const { createStore } = require("../state-record-sync");
const { createCache, createEncoder } = require("../state-bootstrap-cache");
const { performance } = require("node:perf_hooks");
const zlib = require("node:zlib");
const hash = v => crypto.createHash("sha256").update(v).digest("hex");
(async () => {
  const file = process.argv[2];
  const original = hash(fs.readFileSync(file));
  const state = JSON.parse(fs.readFileSync(file)).state;
  const stateHash = hash(JSON.stringify(state));
  const results = [];
  for (const streamed of [false, true, true, false, false, true]) {
    global.gc?.();
    const store = createStore({ hash, token: () => "fixed-test-cursor" });
    const encoder = streamed ? createEncoder() : null;
    const started = performance.now();
    const message = store.response(state, 1, "admin", "", 0, "admin", encoder?.capture);
    const encodedAt = performance.now();
    const compressed = await createCache().get(1, "admin", () => encoder ? encoder.encode(message) : message);
    const completed = performance.now();
    const memory = process.memoryUsage();
    const decoded = JSON.parse(zlib.gunzipSync(compressed));
    assert.equal(hash(JSON.stringify(decoded.state)), stateHash);
    assert.equal(decoded.cursor, "fixed-test-cursor");
    results.push({ streamed, fingerprintsMs: Math.round(encodedAt - started), totalMs: Math.round(completed - started),
      compressedBytes: compressed.length, rssMiB: Math.round(memory.rss / 1048576), heapMiB: Math.round(memory.heapUsed / 1048576) });
  }
  assert.equal(hash(fs.readFileSync(file)), original);
  const report = { results, sourceUnchanged: true, exactState: true };
  if (process.argv[3]) fs.writeFileSync(process.argv[3], JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
})().catch(error => { console.error(error); process.exitCode = 1; });
