"use strict";
const assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "..");
const checks = [
  ["--check", "server.js"], ["--check", "app.js"], ["--check", "client-edit.js"],
  ["scripts/smoke-p7-client-edit.js"], ["scripts/smoke-client-edit-validation.js"],
  ["scripts/smoke-compact-sync-version.js"], ["scripts/smoke-client-hours-v123.js"],
  ["scripts/smoke-client-feedback-20261021.js"], ["scripts/smoke-supply-manual-p142.js"],
  ["scripts/smoke-supply-section-p141.js"], ["scripts/smoke-inventory-finance-workspaces.js"],
  ["scripts/smoke-client-edit-http.js"],
  ["scripts/smoke-client-edit-http.js", "--snapshot", "C:\\DistribuidoraLopez\\.security\\stock-commissions-20261022-232724\\state.json"],
  ["scripts/smoke-stock-count-http.js", "--supply-visual"]
];
const results = [];
for (const args of checks) {
  const start = Date.now();
  console.log(`RUN ${args.join(" ")}`);
  const result = spawnSync(process.execPath, args, { cwd: root, env: process.env, encoding: "utf8", timeout: 300000, maxBuffer: 8 * 1024 * 1024 });
  results.push({ command: args.slice(0, 2).join(" "), ok: result.status === 0, ms: Date.now() - start, output: `${result.stdout || ""}\n${result.stderr || ""}`.trim() });
  fs.writeFileSync(path.join(root, "docs/P143-release-checks.json"), JSON.stringify({ at: new Date().toISOString(), results }, null, 2));
  assert.equal(result.status, 0, results.at(-1).output || String(result.error));
  console.log(`PASS ${Date.now() - start}ms`);
}
console.log(`PASS ${results.length} release checks`);
