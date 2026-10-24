"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");

const app = fs.readFileSync("app.js", "utf8");
const config = fs.readFileSync("config.js", "utf8");
const index = fs.readFileSync("index.html", "utf8");
const server = fs.readFileSync("server.js", "utf8");
const worker = fs.readFileSync("sw.js", "utf8");

assert.match(server, /"Cache-Control": "no-store, no-cache, must-revalidate, max-age=0"/);
const version = config.match(/VERSION: "(8790-\d+)"/)[1];
assert.ok(server.includes(`process.env.DL_VERSION || "${version}"`));
for (const asset of ["app.js", "styles.css", "delivery-engine.js", "account-engine.js", "order-engine.js", "sales-commission-report.js", "state-record-sync.js", "collection-corrections-ui.js"]) {
  assert.ok(index.includes(`${asset}?v=${version}`), `${asset} uses the release version`);
}
assert.ok(worker.includes(`distribuidora-lopez-servidor-unico-8790-v${version.split("-")[1]}`));
assert.match(worker, /event\.data\.type === "SKIP_WAITING"/);
assert.match(app, /register\(`sw\.js\?v=\$\{encodeURIComponent\(APP_VERSION\)\}`,[\s\S]*updateViaCache: "none"/);
assert.match(app, /navigator\.serviceWorker\.addEventListener\("controllerchange"/);
assert.match(app, /function scheduleAutomaticVersionReload\(serverVersion\)/);
assert.match(app, /nextUrl\.searchParams\.set\("appVersion", targetVersion\)/);
assert.doesNotMatch(app, /Refrescar con Ctrl\+F5 o limpiar cache/);

console.log(JSON.stringify({ ok: true, version, automaticReload: true, noStore: true, workerSkipWaiting: true }, null, 2));
