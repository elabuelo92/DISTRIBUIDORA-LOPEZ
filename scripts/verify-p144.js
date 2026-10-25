"use strict";
const { spawnSync } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const root = path.resolve(__dirname, "..");
const tests = [
  ["syntax app", ["--check", "app.js"]], ["syntax server", ["--check", "server.js"]],
  ["syntax collections UI", ["--check", "collection-corrections-ui.js"]],
  ["GPS single capture / native Android timestamp", ["scripts/smoke-delivery-gps-correction-ui.js"]],
  ["GPS refresh history", ["scripts/smoke-gps-refresh.js"]],
  ["GPS cancellation UI", ["scripts/smoke-gps-cancel-ui.js"]],
  ["collection accounting", ["scripts/smoke-p9-corrections.js"]],
  ["pending collections", ["scripts/smoke-pending-collection-correction.js"]],
  ["retained bank / credit / token", ["scripts/smoke-p144-corrections.js"]],
  ["collections UI helpers", ["scripts/smoke-p9-ui.js"]],
  ["P10 UI compatibility", ["scripts/smoke-p10-cancellation.js"]],
  ["delivery cash reports", ["scripts/smoke-delivery-cash-overview.js"]],
  ["P143 client validation", ["scripts/smoke-client-edit-validation.js"]],
  ["GPS HTTP and real browser emulation", ["scripts/smoke-client-gps-review-v135.js", "--visual"]],
  ["collections HTTP and real browser emulation", ["scripts/smoke-p9-http.js", "--visual"]],
  ["full local snapshot integrity", ["scripts/p144-volume-check.js", ".tmp-performance-167/production-state.json"]]
];
const results = [];
for (const [name, args] of tests) {
  console.log(`RUN ${name}`);
  const started = Date.now();
  const run = spawnSync(process.execPath, args, { cwd: root, env: process.env, encoding: "utf8", timeout: 240000, maxBuffer: 4 * 1024 * 1024 });
  const result = { name, ok: run.status === 0, ms: Date.now() - started, output: `${run.stdout || ""}${run.stderr || ""}`.trim() };
  results.push(result);
  console.log(`${result.ok ? "PASS" : "FAIL"} ${name} (${result.ms} ms)`);
  fs.writeFileSync(path.join(root, "docs/P144-release-checks.json"), JSON.stringify({ at: new Date().toISOString(), ok: results.every(r => r.ok), complete: results.length === tests.length, results }, null, 2));
  if (!result.ok) { console.error(result.output); process.exitCode = 1; break; }
}
