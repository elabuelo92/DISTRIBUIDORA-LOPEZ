"use strict";

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { performance } = require("node:perf_hooks");
const orderEngine = require("../order-engine");
const deliveryEngine = require("../delivery-engine");
const accountEngine = require("../account-engine");
const eventEngine = require("../event-engine");
const legalEngine = require("../legal-engine");

const root = path.resolve(__dirname, "..");
const source = path.resolve(process.env.DL_BENCH_STATE_FILE || path.join(root, "data", "demo-state.json"));
const targetBytes = Math.max(0, Number(process.env.DL_BENCH_TARGET_BYTES || 0));
const payload = JSON.parse(fs.readFileSync(source, "utf8"));
const initialBytes = Buffer.byteLength(JSON.stringify(payload));
if (targetBytes > initialBytes) {
  payload.state.performanceFixture = "x".repeat(Math.max(0, targetBytes - initialBytes - 32));
}

const phases = {};
const measure = (name, action) => {
  const startedAt = performance.now();
  action();
  phases[name] = Math.round((performance.now() - startedAt) * 10) / 10;
};

measure("orderMigrationMs", () => orderEngine.migrateState(payload.state));
measure("deliveryMigrationMs", () => deliveryEngine.migrateState(payload.state));
measure("accountMigrationMs", () => accountEngine.migrateState(payload.state));
measure("eventMigrationMs", () => eventEngine.migrateState(payload.state));
measure("legalMigrationMs", () => legalEngine.migrateState(payload.state));

let serialized = "";
measure("serializationMs", () => { serialized = JSON.stringify(payload); });
const output = path.join(os.tmpdir(), `dl-state-write-benchmark-${process.pid}.json`);
measure("diskWriteMs", () => fs.writeFileSync(output, serialized, "utf8"));
fs.rmSync(output, { force: true });

console.log(JSON.stringify({
  ok: true,
  source,
  initialBytes,
  benchmarkBytes: Buffer.byteLength(serialized),
  phases
}, null, 2));
