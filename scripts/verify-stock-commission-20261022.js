"use strict";
const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const root = path.resolve(__dirname, "..");
const suites = [
  "smoke-commission-product-isolation.js", "smoke-p4-commissions.js", "smoke-commission-governance-v122.js",
  "smoke-preventa-commissions-v111.js", "smoke-commission-account-v134.js", "smoke-sales-commission-report-v139.js",
  "smoke-commission-numeric-export.js", "smoke-commission-week.js", "smoke-driver-commission-report.js",
  "smoke-stock-cut.js", "smoke-stock-reconciliation.js", "smoke-stock-count-memory.js", "smoke-rejected-stock-return.js",
  "smoke-stock-pdf-layout.js", "smoke-inventory-finance-workspaces.js",
  ["smoke-stock-count-http.js", "--multi", "--mixed", "--cut", "--durability", "--output", "docs/STOCK-CUT-HTTP-20261022-results.json"]
];
const results = [];
const outputIndex = process.argv.indexOf("--output");
const output = outputIndex >= 0 ? process.argv[outputIndex + 1] : null;
if (output) {
  suites[suites.length - 1] = ["smoke-stock-count-http.js", "--multi", "--mixed", "--cut", "--durability", "--output", output.replace(/\.json$/, "-http.json")];
  suites.push("smoke-bootstrap-cache.js", "smoke-first-load-equivalence.js", "smoke-first-install-worker.js");
}
if (process.argv.includes("--release185")) suites.push(
  "smoke-state-record-sync.js", "smoke-record-sync-client.js", "smoke-sync-backoff.js",
  "smoke-compact-sync-version.js", "smoke-state-sync-backpressure.js", "smoke-session-stability-v144.js"
);
for (const suite of suites) {
  const [file, ...args] = Array.isArray(suite) ? suite : [suite];
  const started = Date.now();
  const result = spawnSync(process.execPath, [path.join("scripts", file), ...args], {
    cwd: root, encoding: "utf8", timeout: 180000, windowsHide: true, maxBuffer: 4 * 1024 * 1024
  });
  results.push({ file, args, passed: result.status === 0, ms: Date.now() - started,
    stdout: result.stdout || "", stderr: result.stderr || "", error: result.error?.message });
  console.log(`${result.status === 0 ? "PASS" : "FAIL"} ${file}: ${Date.now() - started} ms`);
  if (result.status !== 0) console.log((result.stderr || result.stdout || result.error?.message || "").slice(-4000));
}
const passed = results.every(row => row.passed);
fs.writeFileSync(path.join(root, output || (process.argv.includes("--release185") ? "docs/PERF-185-REGRESSION-results.json" : "docs/STOCK-COMISIONES-20261022-results.json")), JSON.stringify({
  at: new Date().toISOString(), environment: "local-isolated", runtime: process.version, passed, results
}, null, 2));
process.exitCode = passed ? 0 : 1;
