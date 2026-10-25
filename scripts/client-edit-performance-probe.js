"use strict";
// Loaded only by the isolated P143 runner, never by the production service.
const fs = require("node:fs");
const crypto = require("node:crypto");
const accounts = require("../account-engine");
const storage = require("../stock-count-storage");
const file = process.env.P143_PROBE_FILE;
if (!file || process.env.DL_HOST !== "127.0.0.1") throw new Error("Isolated probe only");
for (const [object, key] of [[crypto, "pbkdf2Sync"], [accounts, "migrateState"], [storage, "writeCountState"]]) {
  const original = object[key];
  object[key] = function (...args) {
    const start = performance.now();
    const result = original.apply(this, args);
    fs.appendFileSync(file, JSON.stringify({ phase: key, ms: performance.now() - start,
      ...(key === "writeCountState" ? { diskMs: result.diskMs, serializationMs: result.serializationMs, bytes: result.bytes } : {}) }) + "\n");
    return result;
  };
}
