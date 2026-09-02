"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");

const app = fs.readFileSync("app.js", "utf8");
const index = fs.readFileSync("index.html", "utf8");
const server = fs.readFileSync("server.js", "utf8");
const worker = fs.readFileSync("sw.js", "utf8");

assert.match(server, /"Cache-Control": "no-store, no-cache, must-revalidate, max-age=0"/);
assert.match(index, /app\.js\?v=8790-126-r20260901a/);
assert.match(index, /styles\.css\?v=8790-126-r20260901a/);
assert.match(worker, /distribuidora-lopez-servidor-unico-8790-v126/);
assert.match(worker, /event\.data\.type === "SKIP_WAITING"/);
assert.match(app, /register\(`sw\.js\?v=\$\{encodeURIComponent\(APP_VERSION\)\}`,[\s\S]*updateViaCache: "none"/);
assert.match(app, /navigator\.serviceWorker\.addEventListener\("controllerchange"/);
assert.match(app, /function scheduleAutomaticVersionReload\(serverVersion\)/);
assert.match(app, /nextUrl\.searchParams\.set\("appVersion", targetVersion\)/);
assert.doesNotMatch(app, /Refrescar con Ctrl\+F5 o limpiar cache/);

console.log(JSON.stringify({ ok: true, version: "8790-126", automaticReload: true, noStore: true, workerSkipWaiting: true }, null, 2));
