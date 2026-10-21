"use strict";
// Isolated regression suite: each HTTP test owns its temporary data and server.
const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const root = path.resolve(__dirname, "..");
const suites = [
  ["P1", "smoke-historical-cost.js"],
  ["P1", "smoke-statistics-period.js"],
  ["P2", "smoke-stock-reconciliation.js"],
  ["P2", "smoke-physical-count-persistence.js"],
  ["P3", "smoke-driver-commission-report.js"],
  ["P4", "smoke-p4-commissions.js"],
  ["P4", "smoke-commission-numeric-export.js"],
  ["P4", "smoke-commission-week.js"],
  ["P5", "smoke-p5-pending-transfer.js"],
  ["P5", "smoke-p5-workflow.js"],
  ["P5", "smoke-p5-http.js"],
  ["P6", "smoke-rejected-stock-return.js", "--p6"],
  ["P6-regression", "smoke-rejected-stock-return.js"],
  ["P7", "smoke-p7-client-edit.js"],
  ["P7", "smoke-client-edit-validation.js"],
  ["P7", "smoke-client-hours-v123.js"],
  ["P2/P7-http", "smoke-order-workflow-v114.js"],
  ["P8-core", "smoke-collection-visits.js"],
  ["P8-http", "smoke-p8-http.js"],
  ["P8-manifests", "smoke-p8-manifests.js"]
];
const results = [];
for (const [scope, file, ...args] of suites) {
  const start = Date.now();
  const run = spawnSync(process.execPath, [path.join(__dirname, file), ...args], {
    cwd: root, env: process.env, encoding: "utf8", maxBuffer: 8 * 1024 * 1024
  });
  const result = { scope, file, args, status: run.status === 0 ? "PASS" : "FAIL", elapsedMs: Date.now() - start,
    output: run.stdout || "", error: run.stderr || String(run.error || "") };
  results.push(result);
  console.log(`${result.status} ${scope}: ${file} ${args.join(" ")} (${result.elapsedMs} ms)`);
  if (result.status === "FAIL") console.log(result.output, result.error);
}
const report = { at: new Date().toISOString(), environment: "local-isolated", productionAccess: false,
  note: "Engine/HTTP/manifest regression; not a production load test.", results };
const output = path.join(root, "docs", "REVISION-P1-P8-20261020-results.json");
fs.writeFileSync(output, JSON.stringify(report, null, 2));
console.log(output);
process.exitCode = results.some(result => result.status === "FAIL") ? 1 : 0;
