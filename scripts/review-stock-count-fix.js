"use strict";
const fs = require("node:fs"), path = require("node:path");
const { spawnSync } = require("node:child_process");
const root = path.resolve(__dirname, "..");
const suites = ["smoke-stock-count-memory.js", "smoke-stock-count-http.js", "smoke-physical-count-persistence.js",
  "smoke-stock-reconciliation.js", "smoke-order-workflow-v114.js", "smoke-rejected-stock-return.js",
  "smoke-state-sync-backpressure.js"];
const results = [];
for (const file of suites) {
  const start = Date.now();
  const result = spawnSync(process.execPath, [path.join(__dirname, file)], {
    cwd: root, env: process.env, encoding: "utf8", timeout: 120000, maxBuffer: 2000000 });
  results.push({ file, status: result.status, elapsedMs: Date.now() - start, output: result.stdout, error: result.stderr });
  console.log(`${result.status === 0 ? "PASS" : "FAIL"} ${file}`);
  if (result.status !== 0) console.log(result.stdout, result.stderr);
}
fs.writeFileSync(path.join(root, "docs/STOCK-MEMORIA-20261021-results.json"), JSON.stringify({
  at: new Date().toISOString(), node: process.version, scope: "local-isolated", productionAccess: false, results
}, null, 2));
process.exitCode = results.some(result => result.status !== 0) ? 1 : 0;
